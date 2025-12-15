import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sobre | IntegraSaude',
  description:
    'Conheca a IntegraSaude - plataforma de integracao HL7 e FHIR para hospitais brasileiros.',
};

export default function SobrePage() {
  return (
    <main className="min-h-screen bg-white pt-20">
      {/* Hero */}
      <section className="py-24 bg-[#FAFAFA]">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-[#1A1A1A] mb-6">
            Simplificando integracoes
            <br />
            <span className="text-[#1A1A1A]/40">na saude brasileira</span>
          </h1>
          <p className="text-lg md:text-xl text-[#1A1A1A]/60 max-w-2xl mx-auto">
            Nascemos da frustracao de engenheiros de software que passaram meses integrando sistemas
            hospitalares. Decidimos criar uma solucao melhor.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-semibold text-[#1A1A1A] mb-6">Nossa Missao</h2>
              <p className="text-lg text-[#1A1A1A]/60 mb-6">
                Democratizar o acesso a integracoes de sistemas de saude no Brasil. Acreditamos que
                hospitais de todos os tamanhos devem ter acesso a tecnologia de ponta para conectar
                seus sistemas.
              </p>
              <p className="text-lg text-[#1A1A1A]/60">
                Nosso objetivo e reduzir o tempo de integracao de meses para minutos, permitindo que
                equipes de TI foquem no que realmente importa: melhorar o atendimento ao paciente.
              </p>
            </div>
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-[#1A1A1A] to-[#333333] flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-6xl font-bold mb-4">2024</div>
                <div className="text-white/60">Fundada em Sao Paulo</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-[#FAFAFA]">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <h2 className="text-3xl font-semibold text-[#1A1A1A] mb-12 text-center">
            Nossos Valores
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Simplicidade',
                description:
                  'Integracao complexa nao precisa ser complicada. Buscamos sempre a solucao mais simples e elegante.',
              },
              {
                title: 'Seguranca',
                description:
                  'Dados de saude sao sensiveis. Tratamos cada byte com o maximo cuidado e conformidade.',
              },
              {
                title: 'Transparencia',
                description:
                  'Precos claros, documentacao completa, codigo aberto quando possivel. Sem surpresas.',
              },
            ].map((value, i) => (
              <div key={i} className="p-8 rounded-2xl bg-white border border-[#E5E5E5]">
                <h3 className="text-xl font-semibold text-[#1A1A1A] mb-4">{value.title}</h3>
                <p className="text-[#1A1A1A]/60">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-[#1A1A1A]">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-6">
            Quer fazer parte da nossa historia?
          </h2>
          <p className="text-lg text-white/60 mb-8">
            Estamos sempre procurando pessoas talentosas para se juntar ao time.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/carreiras"
              className="px-8 py-4 bg-white text-[#1A1A1A] font-medium rounded-full hover:scale-105 transition-transform"
            >
              Ver Vagas
            </Link>
            <Link
              href="/contato"
              className="px-8 py-4 bg-transparent text-white font-medium rounded-full border border-white/30 hover:border-white/50 transition-colors"
            >
              Entre em Contato
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
