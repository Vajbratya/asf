import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Integracoes | IntegraSaude',
  description: 'Sistemas suportados pela plataforma IntegraSaude.',
};

export default function IntegracoesPage() {
  const integrations = [
    {
      name: 'Tasy',
      vendor: 'Philips',
      status: 'Disponivel',
      description: 'Sistema de gestao hospitalar completo.',
    },
    {
      name: 'MV Soul',
      vendor: 'MV',
      status: 'Disponivel',
      description: 'Plataforma de gestao para saude.',
    },
    {
      name: 'Pixeon',
      vendor: 'Pixeon',
      status: 'Disponivel',
      description: 'Solucoes de imagem e gestao.',
    },
    {
      name: 'Wareline',
      vendor: 'Wareline',
      status: 'Em breve',
      description: 'Sistema de gestao laboratorial.',
    },
    {
      name: 'HL7 Generico',
      vendor: 'Qualquer',
      status: 'Disponivel',
      description: 'Qualquer sistema compativel com HL7 v2.',
    },
    {
      name: 'FHIR R4',
      vendor: 'Qualquer',
      status: 'Disponivel',
      description: 'Sistemas compatíveis com FHIR R4.',
    },
  ];

  return (
    <main className="min-h-screen bg-white pt-20">
      <section className="py-16 bg-[#FAFAFA] border-b border-[#E5E5E5]">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <h1 className="text-4xl font-semibold text-[#1A1A1A] mb-4">Integracoes</h1>
          <p className="text-lg text-[#1A1A1A]/60">Sistemas suportados pela nossa plataforma.</p>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((item, i) => (
              <div key={i} className="p-6 rounded-2xl border border-[#E5E5E5]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-[#1A1A1A]">{item.name}</h3>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${item.status === 'Disponivel' ? 'bg-green-100 text-green-700' : 'bg-[#FF8C00]/10 text-[#FF8C00]'}`}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="text-sm text-[#1A1A1A]/50 mb-2">Por {item.vendor}</p>
                <p className="text-[#1A1A1A]/60">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
