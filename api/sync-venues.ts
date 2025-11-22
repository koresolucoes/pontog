
// api/sync-venues.ts
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Configuração de tags do OSM para buscar
// https://wiki.openstreetmap.org/wiki/Key:gay
const OSM_QUERY = (lat: number, lng: number, radius: number) => `
  [out:json][timeout:25];
  (
    node["gay"="yes"](around:${radius},${lat},${lng});
    way["gay"="yes"](around:${radius},${lat},${lng});
    node["lgbtq"="primary"](around:${radius},${lat},${lng});
    way["lgbtq"="primary"](around:${radius},${lat},${lng});
    node["leisure"="sauna"]["nudism"="yes"](around:${radius},${lat},${lng});
    node["amenity"="nightclub"]["lgbtq"="welcome"](around:${radius},${lat},${lng});
    node["amenity"="bar"]["lgbtq"="welcome"](around:${radius},${lat},${lng});
  );
  out center;
`;

// Função auxiliar para mapear tipos do OSM para nossos tipos
const mapOsmType = (tags: any): string => {
    if (tags.leisure === 'sauna' || tags.sauna === 'yes') return 'sauna';
    if (tags.amenity === 'nightclub') return 'club';
    if (tags.amenity === 'cinema') return 'cinema';
    if (tags.shop === 'sex' || tags.shop === 'adult') return 'shop';
    if (tags.amenity === 'cruising_spot' || tags.leisure === 'park') return 'cruising';
    return 'bar'; // Default fallback
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { lat, lng, radius = 3000 } = req.body; // Raio padrão 3km

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and Longitude are required.' });
    }

    // Inicializa Supabase Admin (Service Role) para poder escrever na tabela de venues
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    // 1. Verificar se já escaneamos essa área recentemente
    // Usamos a função RPC que criamos no banco de dados
    const { data: needsScan, error: rpcError } = await supabaseAdmin.rpc('needs_osm_scan', {
        p_lat: lat,
        p_lng: lng
    });

    if (rpcError) {
        console.error("Error checking scan status:", rpcError);
        // Em caso de erro no RPC, prosseguimos com o scan por segurança ou abortamos?
        // Vamos logar e continuar, assumindo que precisa escanear.
    }

    if (needsScan === false) {
        console.log(`Area around ${lat}, ${lng} already scanned recently. Skipping OSM fetch.`);
        return res.status(200).json({ message: 'Area already scanned', venues: [] });
    }

    console.log(`Scanning area around ${lat}, ${lng} via OpenStreetMap...`);

    // 2. Buscar dados no Overpass API (OSM)
    const overpassUrl = 'https://overpass-api.de/api/interpreter';
    const query = OSM_QUERY(lat, lng, radius);
    
    const osmResponse = await fetch(overpassUrl, {
        method: 'POST',
        body: query
    });

    if (!osmResponse.ok) {
        throw new Error(`Overpass API Error: ${osmResponse.statusText}`);
    }

    const osmData = await osmResponse.json();
    const elements = osmData.elements || [];

    if (elements.length === 0) {
        // Registra que escaneamos, mesmo sem resultados, para não ficar tentando
        await supabaseAdmin.rpc('log_osm_scan', { p_lat: lat, p_lng: lng });
        return res.status(200).json({ message: 'No venues found', venues: [] });
    }

    // 3. Transformar dados do OSM para nosso formato
    const venuesToUpsert = elements.map((el: any) => {
        const tags = el.tags || {};
        // Prioriza o centro se for um 'way' (caminho/polígono), senão usa lat/lon do node
        const venueLat = el.lat || el.center?.lat;
        const venueLng = el.lon || el.center?.lon;
        
        if (!venueLat || !venueLng) return null;

        // Se não tem nome, tenta criar um genérico baseado no tipo
        const name = tags.name || tags.alt_name || `${mapOsmType(tags).charAt(0).toUpperCase() + mapOsmType(tags).slice(1)} Local`;

        // Constrói endereço básico se disponível
        const addressParts = [
            tags['addr:street'], 
            tags['addr:housenumber'],
            tags['addr:suburb']
        ].filter(Boolean);
        const address = addressParts.length > 0 ? addressParts.join(', ') : 'Endereço via Mapa';

        return {
            osm_id: String(el.id),
            source_type: 'osm',
            name: name,
            type: mapOsmType(tags),
            description: tags.description || 'Local encontrado via OpenStreetMap.',
            address: address,
            lat: venueLat,
            lng: venueLng,
            image_url: null, // OSM raramente tem imagens diretas, o front usará placeholders
            website: tags.website || tags['contact:website'],
            opening_hours: tags.opening_hours,
            is_verified: true, // Consideramos dados do OSM como verificados automaticamente
            is_partner: false,
            tags: [tags.gay === 'yes' ? 'LGBTQ+' : null, tags.nudism === 'yes' ? 'Nudismo' : null].filter(Boolean)
        };
    }).filter(Boolean); // Remove nulos

    if (venuesToUpsert.length > 0) {
        // 4. Salvar no Banco de Dados (Upsert para evitar duplicatas)
        const { error: upsertError } = await supabaseAdmin
            .from('venues')
            .upsert(venuesToUpsert, { 
                onConflict: 'osm_id',
                ignoreDuplicates: false // Atualiza se existir mudanças
            });

        if (upsertError) {
            console.error("Error upserting venues:", upsertError);
            throw upsertError;
        }
    }

    // 5. Registrar o escaneamento com sucesso
    await supabaseAdmin.rpc('log_osm_scan', { p_lat: lat, p_lng: lng });

    return res.status(200).json({ 
        success: true, 
        scanned: true, 
        count: venuesToUpsert.length,
        venues: venuesToUpsert 
    });

  } catch (error: any) {
    console.error('Error in sync-venues:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
