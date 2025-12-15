import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Status | IntegraSaude',
  description: 'Status dos servicos da IntegraSaude em tempo real.',
};

export default function StatusPage() {
  const services = [
    { name: 'API Principal', status: 'operational', uptime: '99.99%' },
    { name: 'Dashboard', status: 'operational', uptime: '99.98%' },
    { name: 'Conectores HL7', status: 'operational', uptime: '99.97%' },
    { name: 'Webhooks', status: 'operational', uptime: '99.95%' },
    { name: 'Banco de Dados', status: 'operational', uptime: '99.99%' },
    { name: 'CDN', status: 'operational', uptime: '100%' },
  ];

  const incidents: { date: string; title: string; status: string; description: string }[] = [];

  return (
    <main className="min-h-screen bg-white pt-20">
      {/* Hero */}
      <section className="py-16 bg-[#FAFAFA] border-b border-[#E5E5E5]">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 font-medium text-sm mb-6">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Todos os sistemas operacionais
          </div>
          <h1 className="text-4xl font-semibold text-[#1A1A1A] mb-4">Status dos Servicos</h1>
          <p className="text-lg text-[#1A1A1A]/60">
            Monitoramento em tempo real de todos os componentes da plataforma.
          </p>
        </div>
      </section>

      {/* Services */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <h2 className="text-xl font-semibold text-[#1A1A1A] mb-8">Componentes</h2>
          <div className="space-y-4">
            {services.map((service, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 rounded-xl border border-[#E5E5E5]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="font-medium text-[#1A1A1A]">{service.name}</span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-sm text-[#1A1A1A]/50">Uptime: {service.uptime}</span>
                  <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                    Operacional
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Uptime Chart */}
      <section className="py-16 bg-[#FAFAFA]">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <h2 className="text-xl font-semibold text-[#1A1A1A] mb-8">Ultimos 90 dias</h2>
          <div className="flex gap-0.5">
            {Array.from({ length: 90 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 h-8 bg-green-500 rounded-sm first:rounded-l-lg last:rounded-r-lg"
                title={`${90 - i} dias atras: 100% uptime`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-4 text-sm text-[#1A1A1A]/50">
            <span>90 dias atras</span>
            <span>Hoje</span>
          </div>
        </div>
      </section>

      {/* Incidents */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <h2 className="text-xl font-semibold text-[#1A1A1A] mb-8">Incidentes Recentes</h2>
          {incidents.length === 0 ? (
            <div className="text-center py-12 text-[#1A1A1A]/50">
              <svg
                className="w-12 h-12 mx-auto mb-4 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p>Nenhum incidente nos ultimos 90 dias</p>
            </div>
          ) : (
            <div className="space-y-6">
              {incidents.map((incident, i) => (
                <div key={i} className="p-6 rounded-xl border border-[#E5E5E5]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-[#1A1A1A]">{incident.title}</h3>
                    <span className="text-sm text-[#1A1A1A]/50">{incident.date}</span>
                  </div>
                  <p className="text-[#1A1A1A]/60">{incident.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Subscribe */}
      <section className="py-16 bg-[#1A1A1A]">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-2xl font-semibold text-white mb-4">Receba alertas de status</h2>
          <p className="text-white/60 mb-8">
            Seja notificado imediatamente quando houver problemas nos servicos.
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="seu@email.com"
              className="flex-1 px-4 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00] outline-none"
            />
            <button
              type="submit"
              className="px-8 py-3 bg-white text-[#1A1A1A] font-medium rounded-full hover:scale-105 transition-transform"
            >
              Inscrever
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
