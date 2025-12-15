import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Changelog | IntegraSaúde',
  description: 'Histórico de atualizações da plataforma IntegraSaúde.',
};

export default function ChangelogPage() {
  const releases = [
    {
      version: '1.2.0',
      date: '15 Dez 2025',
      changes: ['Novo design system', 'Páginas de documentação', 'Melhorias de performance'],
    },
    {
      version: '1.1.0',
      date: '1 Dez 2025',
      changes: ['Suporte a Pixeon', 'Dashboard em tempo real', 'Webhooks customizados'],
    },
    {
      version: '1.0.0',
      date: '15 Nov 2025',
      changes: ['Lançamento inicial', 'Suporte a Tasy e MV Soul', 'Parser HL7 v2'],
    },
  ];

  return (
    <main className="min-h-screen bg-white pt-20">
      <section className="py-16 bg-[#FAFAFA] border-b border-[#E5E5E5]">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <h1 className="text-4xl font-semibold text-[#1A1A1A] mb-4">Changelog</h1>
          <p className="text-lg text-[#1A1A1A]/60">Histórico de atualizações e novidades.</p>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="space-y-8">
            {releases.map((release, i) => (
              <div key={i} className="p-6 rounded-2xl border border-[#E5E5E5]">
                <div className="flex items-center gap-4 mb-4">
                  <span className="px-3 py-1 text-sm font-semibold bg-[#1A1A1A] text-white rounded-full">
                    v{release.version}
                  </span>
                  <span className="text-sm text-[#1A1A1A]/50">{release.date}</span>
                </div>
                <ul className="space-y-2">
                  {release.changes.map((change, j) => (
                    <li key={j} className="flex items-center gap-2 text-[#1A1A1A]/70">
                      <svg
                        className="w-4 h-4 text-green-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {change}
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
