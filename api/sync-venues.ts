
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Configuração de tags do OSM para buscar
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
    node["amenity"="cruising_spot"](around:${radius},${lat},${lng});
  );
  out center;
`;

// Coleção de Imagens Temáticas (Pexels)
// URLs otimizadas para performance
const PLACEHOLDER_IMAGES: { [key: string]: string[] } = {
    sauna: [
        'https://images.pexels.com/photos/3214958/pexels-photo-3214958.jpeg?auto=compress&cs=tinysrgb&w=600', // Pool
        'https://images.pexels.com/photos/6667429/pexels-photo-6667429.jpeg?auto=compress&cs=tinysrgb&w=600', // Steam
        'https://images.pexels.com/photos/8092430/pexels-photo-8092430.jpeg?auto=compress&cs=tinysrgb&w=600', // Spa mood
        'https://images.pexels.com/photos/261429/pexels-photo-261429.jpeg?auto=compress&cs=tinysrgb&w=600', // Towels
    ],
    club: [
        'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=600', // Party Crowd
        'https://images.pexels.com/photos/164693/pexels-photo-164693.jpeg?auto=compress&cs=tinysrgb&w=600',   // DJ
        'https://images.pexels.com/photos/2114365/pexels-photo-2114365.jpeg?auto=compress&cs=tinysrgb&w=600',  // Lights
        'https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg?auto=compress&cs=tinysrgb&w=600',  // Silhouette
    ],
    bar: [
        'https://images.pexels.com/photos/1267325/pexels-photo-1267325.jpeg?auto=compress&cs=tinysrgb&w=600',  // Cocktails
        'https://images.pexels.com/photos/1267696/pexels-photo-1267696.jpeg?auto=compress&cs=tinysrgb&w=600',  // Counter
        'https://images.pexels.com/photos/3394223/pexels-photo-3394223.jpeg?auto=compress&cs=tinysrgb&w=600',  // Pride Flag
        'https://images.pexels.com/photos/941864/pexels-photo-941864.jpeg?auto=compress&cs=tinysrgb&w=600',    // Night
    ],
    cruising: [
        'https://images.pexels.com/photos/615226/pexels-photo-615226.jpeg?auto=compress&cs=tinysrgb&w=600',   // Night Park
        'https://images.pexels.com/photos/355863/pexels-photo-355863.jpeg?auto=compress&cs=tinysrgb&w=600',   // Dark Alley
        'https://images.pexels.com/photos/1535673/pexels-photo-1535673.jpeg?auto=compress&cs=tinysrgb&w=600',  // Neon Tunnel
    ],
    shop: [
        'https://images.pexels.com/photos/3965545/pexels-photo-3965545.jpeg?auto=compress&cs=tinysrgb&w=600', // Neon
        'https://images.pexels.com/photos/2529174/pexels-photo-2529174.jpeg?auto=compress&cs=tinysrgb&w=600', // Storefront
    ],
    cinema: [
        'https://images.pexels.com/photos/375885/pexels-photo-375885.jpeg?auto=compress&cs=tinysrgb&w=600',   // Cinema Seats
        'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=600', // Abstract Screen
    ]
};

const mapOsmType = (tags: any): string => {
    if (tags.leisure === 'sauna' || tags.sauna === 'yes') return 'sauna';
    if (tags.amenity === 'nightclub') return 'club';
    if (tags.amenity === 'cinema') return 'cinema';
    if (tags.shop === 'sex' || tags.shop === 'adult') return 'shop';
    if (tags.amenity === 'cruising_spot' || tags.leisure === 'park' || tags.leisure === 'nature_reserve') return 'cruising';
    return 'bar';
};

// Seleciona uma imagem "aleatória" mas consistente baseada no ID do local
const getStableImage = (type: string, id: string): string => {
    const images = PLACEHOLDER_IMAGES[type] || PLACEHOLDER_IMAGES.bar;
    
    // Cria um hash numérico simples a partir da string do ID
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = ((hash << 5) - hash) + id.charCodeAt(i);
        hash |= 0; // Converte para 32bit integer
    }
    
    const index = Math.abs(hash) % images.length;
    return images[index];
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
    const { lat, lng, radius = 3000 } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and Longitude are required.' });
    }

    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    // 1. Check if scanned recently (Cache logic)
    const { data: needsScan, error: rpcError } = await supabaseAdmin.rpc('needs_osm_scan', {
        p_lat: lat,
        p_lng: lng
    });

    if (needsScan === false) {
        return res.status(200).json({ message: 'Area already scanned', venues: [] });
    }

    console.log(`Scanning area around ${lat}, ${lng} via OpenStreetMap...`);

    // 2. Fetch from OSM
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
        await supabaseAdmin.rpc('log_osm_scan', { p_lat: lat, p_lng: lng });
        return res.status(200).json({ message: 'No venues found', venues: [] });
    }

    // 3. Process and Map Data
    const venuesToUpsert = elements.map((el: any) => {
        const tags = el.tags || {};
        const venueLat = el.lat || el.center?.lat;
        const venueLng = el.lon || el.center?.lon;
        
        if (!venueLat || !venueLng) return null;

        const type = mapOsmType(tags);
        // Nome fallback inteligente
        const name = tags.name || tags.alt_name || `${type.charAt(0).toUpperCase() + type.slice(1)} Local`;
        
        const addressParts = [
            tags['addr:street'], 
            tags['addr:housenumber'],
            tags['addr:suburb']
        ].filter(Boolean);
        const address = addressParts.length > 0 ? addressParts.join(', ') : 'Endereço no Mapa';

        // Usa a função de imagem estável
        const imageUrl = getStableImage(type, String(el.id));

        return {
            osm_id: String(el.id),
            source_type: 'osm',
            name: name,
            type: type,
            description: tags.description || 'Local encontrado no Ponto G.',
            address: address,
            lat: venueLat,
            lng: venueLng,
            image_url: imageUrl, 
            website: tags.website || tags['contact:website'],
            opening_hours: tags.opening_hours,
            is_verified: true, // OSM data is trusted
            is_partner: false,
            tags: [tags.gay === 'yes' ? 'LGBTQ+' : null, tags.nudism === 'yes' ? 'Nudismo' : null].filter(Boolean)
        };
    }).filter(Boolean);

    // 4. Upsert to Supabase
    if (venuesToUpsert.length > 0) {
        const { error: upsertError } = await supabaseAdmin
            .from('venues')
            .upsert(venuesToUpsert, { 
                onConflict: 'osm_id',
                ignoreDuplicates: false 
            });

        if (upsertError) throw upsertError;
    }

    // 5. Log scan
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
