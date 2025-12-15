import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Guias | IntegraSaude',
  description: 'Guias e tutoriais para usar a plataforma IntegraSaude.',
};

export default function GuiasPage() {
  const guides = [
    {
      title: 'Primeiros Passos',
      description: 'Configure sua primeira integracao em 15 minutos.',
      time: '15 min',
    },
    {
      title: 'Integrando com Tasy',
      description: 'Passo a passo para conectar ao sistema Tasy.',
      time: '20 min',
    },
    { title: 'Usando Webhooks', description: 'Receba notificacoes em tempo real.', time: '10 min' },
    {
      title: 'FHIR para Iniciantes',
      description: 'Entenda os conceitos basicos do padrao FHIR.',
      time: '25 min',
    },
    {
      title: 'Configurando RNDS',
      description: 'Integre com a Rede Nacional de Dados em Saude.',
      time: '30 min',
    },
    {
      title: 'Melhores Praticas',
      description: 'Dicas para integracoes robustas e seguras.',
      time: '15 min',
    },
  ];

  return (
    <main className="min-h-screen bg-white pt-20">
      <section className="py-16 bg-[#FAFAFA] border-b border-[#E5E5E5]">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <h1 className="text-4xl font-semibold text-[#1A1A1A] mb-4">Guias</h1>
          <p className="text-lg text-[#1A1A1A]/60">Tutoriais praticos para dominar a plataforma.</p>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guides.map((guide, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl border border-[#E5E5E5] hover:border-[#FF8C00]/30 hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-1 text-xs font-medium bg-[#FF8C00]/10 text-[#FF8C00] rounded">
                    {guide.time}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">{guide.title}</h3>
                <p className="text-[#1A1A1A]/60">{guide.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
