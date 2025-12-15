import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Parceiros | IntegraSaude',
  description: 'Programa de parceiros da IntegraSaude.',
};

export default function ParceirosPage() {
  return (
    <main className="min-h-screen bg-white pt-20">
      <section className="py-24 bg-[#FAFAFA]">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-semibold text-[#1A1A1A] mb-6">
            Programa de Parceiros
          </h1>
          <p className="text-lg text-[#1A1A1A]/60 max-w-2xl mx-auto">
            Junte-se ao nosso ecossistema e ajude hospitais a se conectarem.
          </p>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl border border-[#E5E5E5]">
              <h3 className="text-xl font-semibold text-[#1A1A1A] mb-4">Revendedores</h3>
              <p className="text-[#1A1A1A]/60 mb-6">
                Venda nossas solucoes e ganhe comissoes recorrentes.
              </p>
              <Link href="/contato" className="text-[#FF8C00] font-medium hover:underline">
                Saiba mais →
              </Link>
            </div>
            <div className="p-8 rounded-2xl border border-[#E5E5E5]">
              <h3 className="text-xl font-semibold text-[#1A1A1A] mb-4">Integradores</h3>
              <p className="text-[#1A1A1A]/60 mb-6">
                Implemente nossas solucoes em hospitais e clinicas.
              </p>
              <Link href="/contato" className="text-[#FF8C00] font-medium hover:underline">
                Saiba mais →
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 bg-[#1A1A1A]">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-2xl font-semibold text-white mb-4">Interessado em ser parceiro?</h2>
          <p className="text-white/60 mb-8">Entre em contato para conhecer nosso programa.</p>
          <Link
            href="/contato"
            className="inline-block px-8 py-4 bg-white text-[#1A1A1A] font-medium rounded-full hover:scale-105 transition-transform"
          >
            Falar com o Time
          </Link>
        </div>
      </section>
    </main>
  );
}
