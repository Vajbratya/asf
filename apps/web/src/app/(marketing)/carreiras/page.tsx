import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Carreiras | IntegraSaude',
  description: 'Junte-se ao time da IntegraSaude e ajude a transformar a saude no Brasil.',
};

export default function CarreirasPage() {
  const jobs = [
    {
      title: 'Senior Backend Engineer',
      department: 'Engenharia',
      location: 'Remoto (Brasil)',
      type: 'Tempo Integral',
    },
    {
      title: 'Frontend Engineer',
      department: 'Engenharia',
      location: 'Remoto (Brasil)',
      type: 'Tempo Integral',
    },
    {
      title: 'DevOps Engineer',
      department: 'Infraestrutura',
      location: 'Remoto (Brasil)',
      type: 'Tempo Integral',
    },
    {
      title: 'Product Designer',
      department: 'Produto',
      location: 'Sao Paulo ou Remoto',
      type: 'Tempo Integral',
    },
    {
      title: 'Customer Success Manager',
      department: 'Comercial',
      location: 'Sao Paulo',
      type: 'Tempo Integral',
    },
  ];

  const benefits = [
    'Trabalho 100% remoto',
    'Salario competitivo',
    'Plano de saude e dental',
    'Vale refeicao',
    'Equipamento de trabalho',
    'Budget para educacao',
    'Ferias flexiveis',
    'Stock options',
  ];

  return (
    <main className="min-h-screen bg-white pt-20">
      {/* Hero */}
      <section className="py-24 bg-[#FAFAFA]">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-semibold text-[#1A1A1A] mb-6">
            Construa o futuro da
            <br />
            <span className="text-[#1A1A1A]/40">saude no Brasil</span>
          </h1>
          <p className="text-lg text-[#1A1A1A]/60 max-w-2xl mx-auto">
            Estamos procurando pessoas apaixonadas por tecnologia e saude para se juntar ao nosso
            time em rapido crescimento.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-8 text-center">
            Por que trabalhar na IntegraSaude?
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {benefits.map((benefit, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-4 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5]"
              >
                <svg
                  className="w-5 h-5 text-[#FF8C00] flex-shrink-0"
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
                <span className="text-[#1A1A1A]/80">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-16 bg-[#FAFAFA]">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-8">Vagas Abertas</h2>
          <div className="space-y-4">
            {jobs.map((job, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-6 rounded-2xl bg-white border border-[#E5E5E5] hover:border-[#FF8C00]/30 hover:shadow-lg transition-all"
              >
                <div>
                  <h3 className="font-semibold text-[#1A1A1A] mb-1">{job.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-[#1A1A1A]/50">
                    <span>{job.department}</span>
                    <span>•</span>
                    <span>{job.location}</span>
                    <span>•</span>
                    <span>{job.type}</span>
                  </div>
                </div>
                <button className="px-6 py-2 bg-[#1A1A1A] text-white font-medium rounded-full hover:bg-[#2A2A2A] transition-colors">
                  Ver Vaga
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#1A1A1A]">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Nao encontrou uma vaga para voce?
          </h2>
          <p className="text-white/60 mb-8">
            Envie seu curriculo e entraremos em contato quando houver uma oportunidade.
          </p>
          <Link
            href="mailto:carreiras@integrasaude.com.br"
            className="inline-block px-8 py-4 bg-white text-[#1A1A1A] font-medium rounded-full hover:scale-105 transition-transform"
          >
            Enviar Curriculo
          </Link>
        </div>
      </section>
    </main>
  );
}
