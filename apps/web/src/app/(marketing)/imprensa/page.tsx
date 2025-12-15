import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Imprensa | IntegraSaude',
  description: 'Kit de imprensa e noticias sobre a IntegraSaude.',
};

export default function ImprensaPage() {
  return (
    <main className="min-h-screen bg-white pt-20">
      <section className="py-24 bg-[#FAFAFA]">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-semibold text-[#1A1A1A] mb-6">Imprensa</h1>
          <p className="text-lg text-[#1A1A1A]/60">
            Recursos e informacoes para jornalistas e midia.
          </p>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="p-8 rounded-2xl border border-[#E5E5E5]">
              <h3 className="text-xl font-semibold text-[#1A1A1A] mb-4">Kit de Imprensa</h3>
              <p className="text-[#1A1A1A]/60 mb-6">
                Logos, screenshots e materiais para publicacao.
              </p>
              <button className="px-6 py-3 bg-[#1A1A1A] text-white rounded-full hover:bg-[#2A2A2A] transition-colors">
                Baixar Kit
              </button>
            </div>
            <div className="p-8 rounded-2xl border border-[#E5E5E5]">
              <h3 className="text-xl font-semibold text-[#1A1A1A] mb-4">Contato para Imprensa</h3>
              <p className="text-[#1A1A1A]/60 mb-6">Para entrevistas e informacoes.</p>
              <a
                href="mailto:imprensa@integrasaude.com.br"
                className="text-[#FF8C00] font-medium hover:underline"
              >
                imprensa@integrasaude.com.br
              </a>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-8">Na Midia</h2>
            <p className="text-[#1A1A1A]/60">Nenhuma mencao na midia ainda. Em breve!</p>
          </div>
        </div>
      </section>
    </main>
  );
}
