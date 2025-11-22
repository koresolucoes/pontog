
import React from 'react';

export type LegalDocType = 'terms' | 'privacy' | 'guidelines';

interface LegalModalProps {
  type: LegalDocType;
  onClose: () => void;
}

const TermosDeUso = () => (
  <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
    <p><strong>Última atualização: Novembro de 2024</strong></p>
    
    <h3 className="text-white font-bold text-lg mt-4">1. Aceitação dos Termos</h3>
    <p>Ao criar uma conta ou utilizar o aplicativo Ponto G ("Serviço"), você concorda em vincular-se a estes Termos de Uso. Se você não aceitar todos os termos, não utilize o Serviço.</p>

    <h3 className="text-white font-bold text-lg mt-4">2. Elegibilidade</h3>
    <p>Você deve ter pelo menos 18 anos de idade para criar uma conta no Ponto G. Ao utilizar o Serviço, você declara e garante que possui capacidade civil plena.</p>

    <h3 className="text-white font-bold text-lg mt-4">3. Sua Conta</h3>
    <p>Você é responsável por manter a confidencialidade de suas credenciais de login. Você é o único responsável por todas as atividades que ocorram em sua conta.</p>

    <h3 className="text-white font-bold text-lg mt-4">4. Regras de Conduta</h3>
    <p>Você concorda em não:</p>
    <ul className="list-disc pl-5 space-y-1">
      <li>Utilizar o serviço para fins ilegais ou não autorizados.</li>
      <li>Assediar, intimidar ou difamar outros usuários.</li>
      <li>Publicar conteúdo que contenha discurso de ódio, racismo, homofobia ou transfobia.</li>
      <li>Fazer-se passar por outra pessoa ou entidade.</li>
      <li>Utilizar o serviço para spam ou publicidade não solicitada.</li>
    </ul>

    <h3 className="text-white font-bold text-lg mt-4">5. Conteúdo do Usuário</h3>
    <p>Você mantém os direitos sobre o conteúdo que publica, mas concede ao Ponto G uma licença mundial, não exclusiva e gratuita para usar, exibir e distribuir tal conteúdo no contexto do Serviço.</p>

    <h3 className="text-white font-bold text-lg mt-4">6. Geolocalização</h3>
    <p>O Ponto G é um serviço baseado em localização. Ao utilizar o app, você consente com a coleta e uso de sua geolocalização para conectar você a outros usuários e locais.</p>

    <h3 className="text-white font-bold text-lg mt-4">7. Isenção de Responsabilidade</h3>
    <p>O Ponto G não se responsabiliza pela conduta de qualquer usuário dentro ou fora do Serviço. Recomendamos cautela e bom senso em todos os encontros presenciais.</p>

    <h3 className="text-white font-bold text-lg mt-4">8. Legislação Aplicável</h3>
    <p>Estes termos são regidos pelas leis da República Federativa do Brasil, elegendo-se o foro da comarca de São Paulo/SP para dirimir quaisquer litígios.</p>
  </div>
);

const PoliticaPrivacidade = () => (
  <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
    <p><strong>Em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)</strong></p>

    <h3 className="text-white font-bold text-lg mt-4">1. Dados que Coletamos</h3>
    <p>Para prestar nossos serviços, coletamos:</p>
    <ul className="list-disc pl-5 space-y-1">
      <li><strong>Dados de Cadastro:</strong> Email, data de nascimento, fotos e preferências.</li>
      <li><strong>Dados de Localização:</strong> Coordenadas GPS precisas (quando autorizado) para funcionalidade de mapa e radar.</li>
      <li><strong>Dados de Uso:</strong> Interações, mensagens (criptografadas), winks e visualizações de perfil.</li>
      <li><strong>Dados do Dispositivo:</strong> Modelo, sistema operacional e identificadores únicos para notificações push.</li>
    </ul>

    <h3 className="text-white font-bold text-lg mt-4">2. Finalidade do Tratamento</h3>
    <p>Utilizamos seus dados para:</p>
    <ul className="list-disc pl-5 space-y-1">
      <li>Conectar você a usuários próximos (base legal: execução de contrato).</li>
      <li>Garantir a segurança da plataforma e prevenir fraudes (base legal: legítimo interesse).</li>
      <li>Enviar notificações sobre interações relevantes (base legal: consentimento).</li>
    </ul>

    <h3 className="text-white font-bold text-lg mt-4">3. Compartilhamento de Dados</h3>
    <p>Não vendemos seus dados pessoais. Compartilhamos dados apenas com:</p>
    <ul className="list-disc pl-5 space-y-1">
      <li>Provedores de serviço essenciais (ex: hospedagem em nuvem, processamento de pagamentos).</li>
      <li>Autoridades legais, mediante ordem judicial válida.</li>
    </ul>

    <h3 className="text-white font-bold text-lg mt-4">4. Seus Direitos (LGPD)</h3>
    <p>Você tem direito a:</p>
    <ul className="list-disc pl-5 space-y-1">
      <li>Confirmar a existência de tratamento de dados.</li>
      <li>Acessar seus dados.</li>
      <li>Corrigir dados incompletos ou desatualizados.</li>
      <li>Solicitar a exclusão de seus dados (respeitando prazos legais de retenção como o Marco Civil da Internet).</li>
    </ul>

    <h3 className="text-white font-bold text-lg mt-4">5. Segurança</h3>
    <p>Adotamos medidas técnicas e administrativas aptas a proteger os dados pessoais de acessos não autorizados e de situações acidentais ou ilícitas.</p>

    <h3 className="text-white font-bold text-lg mt-4">6. Contato do Encarregado (DPO)</h3>
    <p>Para exercer seus direitos, entre em contato através do email: privacidade@pontog.app</p>
  </div>
);

const DiretrizesComunidade = () => (
  <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
    <p>O Ponto G é um espaço de liberdade, mas também de respeito. Para manter a comunidade segura, siga estas regras:</p>

    <h3 className="text-white font-bold text-lg mt-4">1. Tolerância Zero com Preconceito</h3>
    <p>Não toleramos racismo, transfobia, gordofobia, sorofobia ou qualquer forma de discriminação. O Ponto G celebra a diversidade.</p>

    <h3 className="text-white font-bold text-lg mt-4">2. Consentimento é Tudo</h3>
    <p>Não é não. Insistência indesejada, envio de fotos íntimas sem solicitação ou assédio resultarão em banimento permanente.</p>

    <h3 className="text-white font-bold text-lg mt-4">3. Fotos de Perfil (Avatar)</h3>
    <p>Sua foto de perfil pública (avatar) <strong>não pode</strong> conter:</p>
    <ul className="list-disc pl-5 space-y-1">
      <li>Nudez explícita ou genitais.</li>
      <li>Atos sexuais.</li>
      <li>Crianças ou menores de idade.</li>
      <li>Drogas ilegais ou violência.</li>
    </ul>
    <p className="text-xs text-slate-500 mt-1">Conteúdo explícito é permitido apenas em Álbuns Privados ou chats privados, desde que consensual.</p>

    <h3 className="text-white font-bold text-lg mt-4">4. Perfis Falsos</h3>
    <p>Não finja ser quem você não é. Perfis "fake" utilizados para enganar (catfishing) ou espionar outros usuários serão removidos.</p>

    <h3 className="text-white font-bold text-lg mt-4">5. Vendas e Promoção</h3>
    <p>É proibido usar o Ponto G para venda de drogas, armas ou serviços sexuais (escort/GP é permitido apenas se identificado corretamente no perfil e conforme a legislação local, mas spam comercial é proibido).</p>

    <h3 className="text-white font-bold text-lg mt-4">6. Denúncias</h3>
    <p>Se você vir algo que viole estas regras, utilize a ferramenta de denúncia no perfil do usuário. Nossa equipe analisa todas as denúncias.</p>
  </div>
);

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  const getTitle = () => {
    switch (type) {
      case 'terms': return 'Termos de Uso';
      case 'privacy': return 'Política de Privacidade';
      case 'guidelines': return 'Diretrizes de Comunidade';
    }
  };

  const getContent = () => {
    switch (type) {
      case 'terms': return <TermosDeUso />;
      case 'privacy': return <PoliticaPrivacidade />;
      case 'guidelines': return <DiretrizesComunidade />;
    }
  };

  return (
    <div className="fixed inset-0 bg-dark-900/90 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in p-4" onClick={onClose}>
      <div 
        className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-white/10 relative overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-5 border-b border-white/10 flex justify-between items-center bg-slate-800/50">
          <h2 className="text-xl font-bold text-white font-outfit">{getTitle()}</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <span className="material-symbols-rounded">close</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {getContent()}
        </div>

        <footer className="p-4 border-t border-white/10 bg-slate-800/30 text-center">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-white text-dark-950 font-bold rounded-xl hover:bg-slate-200 transition-colors text-sm"
          >
            Entendi
          </button>
        </footer>
      </div>
    </div>
  );
};
