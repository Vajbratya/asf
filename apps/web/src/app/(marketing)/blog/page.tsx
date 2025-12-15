import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | IntegraSaude',
  description: 'Artigos sobre integracao de sistemas de saude, HL7, FHIR e tecnologia hospitalar.',
};

export default function BlogPage() {
  const posts = [
    {
      title: 'Introducao ao HL7 v2: O que todo profissional de TI hospitalar precisa saber',
      excerpt:
        'Entenda os fundamentos do protocolo HL7 v2, sua estrutura de mensagens e como ele revolucionou a comunicacao entre sistemas de saude.',
      date: '10 Dez 2024',
      category: 'HL7',
      readTime: '8 min',
    },
    {
      title: 'FHIR R4: O futuro da interoperabilidade em saude',
      excerpt:
        'Descubra como o padrao FHIR esta transformando a forma como sistemas de saude trocam informacoes e por que voce deveria adota-lo.',
      date: '5 Dez 2024',
      category: 'FHIR',
      readTime: '6 min',
    },
    {
      title: 'LGPD na saude: Como proteger dados de pacientes',
      excerpt:
        'Um guia pratico sobre como implementar controles de privacidade e seguranca em sistemas hospitalares conforme a LGPD.',
      date: '28 Nov 2024',
      category: 'Seguranca',
      readTime: '10 min',
    },
    {
      title: 'Integrando Tasy com sistemas externos: Um guia completo',
      excerpt:
        'Passo a passo para configurar integracoes com o sistema Tasy usando HL7 v2 e nossa plataforma.',
      date: '20 Nov 2024',
      category: 'Tutorial',
      readTime: '12 min',
    },
    {
      title: 'BR-Core: Perfis FHIR para o Brasil',
      excerpt:
        'Conheca os perfis BR-Core e como eles padronizam a representacao de dados de saude brasileiros em FHIR.',
      date: '15 Nov 2024',
      category: 'FHIR',
      readTime: '7 min',
    },
    {
      title: 'Webhooks vs Polling: Qual abordagem usar para integracoes',
      excerpt:
        'Analise das vantagens e desvantagens de cada abordagem para receber notificacoes de novos dados.',
      date: '10 Nov 2024',
      category: 'Arquitetura',
      readTime: '5 min',
    },
  ];

  return (
    <main className="min-h-screen bg-white pt-20">
      {/* Hero */}
      <section className="py-16 bg-[#FAFAFA] border-b border-[#E5E5E5]">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <h1 className="text-4xl font-semibold text-[#1A1A1A] mb-4">Blog</h1>
          <p className="text-lg text-[#1A1A1A]/60 max-w-2xl">
            Artigos, tutoriais e novidades sobre integracao de sistemas de saude.
          </p>
        </div>
      </section>

      {/* Posts */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, i) => (
              <article
                key={i}
                className="group p-6 rounded-2xl border border-[#E5E5E5] hover:border-[#FF8C00]/30 hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 text-xs font-medium bg-[#FF8C00]/10 text-[#FF8C00] rounded-full">
                    {post.category}
                  </span>
                  <span className="text-sm text-[#1A1A1A]/50">{post.readTime}</span>
                </div>
                <h2 className="text-lg font-semibold text-[#1A1A1A] mb-3 group-hover:text-[#FF8C00] transition-colors">
                  {post.title}
                </h2>
                <p className="text-[#1A1A1A]/60 mb-4 line-clamp-3">{post.excerpt}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#1A1A1A]/50">{post.date}</span>
                  <span className="text-[#FF8C00] font-medium text-sm">Ler mais →</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-[#1A1A1A]">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-2xl font-semibold text-white mb-4">Receba novos artigos por email</h2>
          <p className="text-white/60 mb-8">
            Assine nossa newsletter e fique por dentro das novidades em integracao de saude.
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
              Assinar
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
