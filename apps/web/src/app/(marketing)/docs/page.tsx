import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentação | INTEGRA by Laudos.AI',
  description: 'Documentação completa da plataforma INTEGRA by Laudos.AI.',
};

export default function DocsPage() {
  const sections = [
    {
      title: 'Primeiros Passos',
      description: 'Comece a integrar seus sistemas em minutos',
      links: [
        { title: 'Introdução', href: '/docs/introducao' },
        { title: 'Criando sua conta', href: '/docs/criando-conta' },
        { title: 'Configurando conectores', href: '/docs/conectores' },
        { title: 'Enviando sua primeira mensagem', href: '/docs/primeira-mensagem' },
      ],
    },
    {
      title: 'Conectores',
      description: 'Configure conexões com sistemas hospitalares',
      links: [
        { title: 'Tasy', href: '/docs/conectores/tasy' },
        { title: 'MV Soul', href: '/docs/conectores/mv-soul' },
        { title: 'Pixeon', href: '/docs/conectores/pixeon' },
        { title: 'HL7 Genérico', href: '/docs/conectores/hl7-generico' },
      ],
    },
    {
      title: 'Referência da API',
      description: 'Documentação completa da API REST',
      links: [
        { title: 'Autenticação', href: '/docs/api/autenticacao' },
        { title: 'Mensagens', href: '/docs/api/mensagens' },
        { title: 'Conectores', href: '/docs/api/conectores' },
        { title: 'Webhooks', href: '/docs/api/webhooks' },
      ],
    },
    {
      title: 'Padrões HL7',
      description: 'Referência dos padrões HL7 suportados',
      links: [
        { title: 'Visão Geral HL7 v2', href: '/docs/hl7/overview' },
        { title: 'Mensagens ADT', href: '/docs/hl7/adt' },
        { title: 'Mensagens ORM', href: '/docs/hl7/orm' },
        { title: 'Mensagens ORU', href: '/docs/hl7/oru' },
      ],
    },
    {
      title: 'FHIR R4',
      description: 'Transformação e recursos FHIR',
      links: [
        { title: 'Visão Geral FHIR', href: '/docs/fhir/overview' },
        { title: 'Patient Resource', href: '/docs/fhir/patient' },
        { title: 'Encounter Resource', href: '/docs/fhir/encounter' },
        { title: 'BR-Core Profiles', href: '/docs/fhir/br-core' },
      ],
    },
    {
      title: 'Segurança',
      description: 'Conformidade e proteção de dados',
      links: [
        { title: 'LGPD', href: '/docs/seguranca/lgpd' },
        { title: 'Criptografia', href: '/docs/seguranca/criptografia' },
        { title: 'Auditoria', href: '/docs/seguranca/auditoria' },
        { title: 'Controle de Acesso', href: '/docs/seguranca/acesso' },
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-white pt-20">
      {/* Hero */}
      <section className="py-16 bg-[#FAFAFA] border-b border-[#E5E5E5]">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <h1 className="text-4xl font-semibold text-[#1A1A1A] mb-4">Documentação</h1>
          <p className="text-lg text-[#1A1A1A]/60 max-w-2xl">
            Tudo que você precisa para integrar seus sistemas de saúde com a plataforma INTEGRA by
            Laudos.AI.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sections.map((section, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl border border-[#E5E5E5] hover:border-[#FF8C00]/30 hover:shadow-lg transition-all"
              >
                <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">{section.title}</h2>
                <p className="text-[#1A1A1A]/60 mb-6">{section.description}</p>
                <ul className="space-y-2">
                  {section.links.map((link, j) => (
                    <li key={j}>
                      <Link
                        href={link.href}
                        className="text-[#FF8C00] hover:underline flex items-center gap-2"
                      >
                        <svg
                          className="w-4 h-4"
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
                        {link.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#1A1A1A]">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-2xl font-semibold text-white mb-4">Não encontrou o que procurava?</h2>
          <p className="text-white/60 mb-8">
            Nossa equipe de suporte está pronta para ajudar com qualquer dúvida.
          </p>
          <Link
            href="/contato"
            className="inline-block px-8 py-4 bg-white text-[#1A1A1A] font-medium rounded-full hover:scale-105 transition-transform"
          >
            Falar com Suporte
          </Link>
        </div>
      </section>
    </main>
  );
}
