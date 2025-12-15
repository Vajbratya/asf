import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Recursos | IntegraSaude',
  description: 'Recursos e funcionalidades da plataforma IntegraSaude.',
};

export default function RecursosPage() {
  return (
    <main className="min-h-screen bg-white pt-20">
      <section className="py-24 bg-[#FAFAFA]">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-semibold text-[#1A1A1A] mb-6">Recursos</h1>
          <p className="text-lg text-[#1A1A1A]/60">
            Tudo que voce precisa para integrar sistemas de saude.
          </p>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <p className="text-[#1A1A1A]/60 mb-8">Veja todos os recursos na pagina inicial.</p>
          <Link
            href="/#recursos"
            className="px-8 py-4 bg-[#1A1A1A] text-white rounded-full hover:bg-[#2A2A2A] transition-colors"
          >
            Ver Recursos
          </Link>
        </div>
      </section>
    </main>
  );
}
