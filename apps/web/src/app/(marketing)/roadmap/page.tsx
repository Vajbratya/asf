import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Roadmap | IntegraSaude',
  description: 'Proximos recursos e melhorias da plataforma IntegraSaude.',
};

export default function RoadmapPage() {
  const items = [
    {
      quarter: 'Q1 2025',
      status: 'em_progresso',
      items: ['Integracao com RNDS', 'Dashboard analytics avancado', 'SDK Python'],
    },
    {
      quarter: 'Q2 2025',
      status: 'planejado',
      items: ['Suporte a CDA', 'Marketplace de conectores', 'Mobile app'],
    },
    {
      quarter: 'Q3 2025',
      status: 'planejado',
      items: ['IA para mapeamento automatico', 'Suporte multi-tenant', 'Certificacao ISO 27001'],
    },
  ];

  return (
    <main className="min-h-screen bg-white pt-20">
      <section className="py-16 bg-[#FAFAFA] border-b border-[#E5E5E5]">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <h1 className="text-4xl font-semibold text-[#1A1A1A] mb-4">Roadmap</h1>
          <p className="text-lg text-[#1A1A1A]/60">Veja o que estamos construindo.</p>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="space-y-8">
            {items.map((quarter, i) => (
              <div key={i} className="p-6 rounded-2xl border border-[#E5E5E5]">
                <div className="flex items-center gap-4 mb-4">
                  <h2 className="text-2xl font-semibold text-[#1A1A1A]">{quarter.quarter}</h2>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${quarter.status === 'em_progresso' ? 'bg-[#FF8C00]/10 text-[#FF8C00]' : 'bg-gray-100 text-gray-600'}`}
                  >
                    {quarter.status === 'em_progresso' ? 'Em Progresso' : 'Planejado'}
                  </span>
                </div>
                <ul className="space-y-2">
                  {quarter.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-[#1A1A1A]/70">
                      <svg
                        className="w-4 h-4 text-[#FF8C00]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
