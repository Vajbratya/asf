'use client';

import Link from 'next/link';
import { useState } from 'react';

// Navigation structure for sidebar
const navSections = [
  {
    title: 'Primeiros Passos',
    items: [
      { slug: 'introducao', title: 'Introdução' },
      { slug: 'criando-conta', title: 'Criando sua Conta' },
      { slug: 'conectores', title: 'Configurando Conectores' },
      { slug: 'primeira-mensagem', title: 'Primeira Mensagem' },
    ],
  },
  {
    title: 'Conectores',
    items: [
      { slug: 'conectores/tasy', title: 'Tasy' },
      { slug: 'conectores/mv-soul', title: 'MV Soul' },
      { slug: 'conectores/pixeon', title: 'Pixeon' },
      { slug: 'conectores/hl7-generico', title: 'HL7 Genérico' },
    ],
  },
  {
    title: 'Referência da API',
    items: [
      { slug: 'api/autenticacao', title: 'Autenticação' },
      { slug: 'api/mensagens', title: 'Mensagens' },
      { slug: 'api/conectores', title: 'Conectores' },
      { slug: 'api/webhooks', title: 'Webhooks' },
    ],
  },
  {
    title: 'HL7 v2',
    items: [
      { slug: 'hl7/overview', title: 'Visão Geral' },
      { slug: 'hl7/adt', title: 'Mensagens ADT' },
      { slug: 'hl7/orm', title: 'Mensagens ORM' },
      { slug: 'hl7/oru', title: 'Mensagens ORU' },
    ],
  },
  {
    title: 'FHIR R4',
    items: [
      { slug: 'fhir/overview', title: 'Visão Geral' },
      { slug: 'fhir/patient', title: 'Patient' },
      { slug: 'fhir/encounter', title: 'Encounter' },
      { slug: 'fhir/br-core', title: 'BR-Core Profiles' },
    ],
  },
  {
    title: 'Segurança',
    items: [
      { slug: 'seguranca/lgpd', title: 'LGPD' },
      { slug: 'seguranca/criptografia', title: 'Criptografia' },
      { slug: 'seguranca/auditoria', title: 'Auditoria' },
      { slug: 'seguranca/acesso', title: 'Controle de Acesso' },
    ],
  },
];

interface DocsClientProps {
  slug: string;
  doc: {
    title: string;
    description: string;
    content: React.ReactNode;
  } | null;
}

export default function DocsClient({ slug, doc }: DocsClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!doc) {
    return (
      <main className="min-h-screen bg-white pt-20">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Página não encontrada</h1>
          <p className="text-gray-600 mb-8">A documentação que você procura não existe.</p>
          <Link href="/docs" className="text-gray-600 hover:underline">
            ← Voltar para Documentação
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white pt-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <nav className="sticky top-24 space-y-6">
              {navSections.map((section) => (
                <div key={section.title}>
                  <h3 className="font-semibold text-gray-900 mb-2">{section.title}</h3>
                  <ul className="space-y-1">
                    {section.items.map((item) => (
                      <li key={item.slug}>
                        <Link
                          href={`/docs/${item.slug}`}
                          className={`block px-3 py-1.5 rounded-lg text-sm transition ${
                            slug === item.slug
                              ? 'bg-gray-200 text-gray-900 font-medium'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {item.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </aside>

          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden fixed bottom-4 right-4 z-50 bg-gray-900 text-white p-3 rounded-full shadow-lg"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Mobile sidebar */}
          {sidebarOpen && (
            <div
              className="lg:hidden fixed inset-0 z-40 bg-black/50"
              onClick={() => setSidebarOpen(false)}
            >
              <aside
                className="absolute left-0 top-0 h-full w-64 bg-white p-4 overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <nav className="space-y-6">
                  {navSections.map((section) => (
                    <div key={section.title}>
                      <h3 className="font-semibold text-gray-900 mb-2">{section.title}</h3>
                      <ul className="space-y-1">
                        {section.items.map((item) => (
                          <li key={item.slug}>
                            <Link
                              href={`/docs/${item.slug}`}
                              onClick={() => setSidebarOpen(false)}
                              className={`block px-3 py-1.5 rounded-lg text-sm transition ${
                                slug === item.slug
                                  ? 'bg-gray-200 text-gray-900 font-medium'
                                  : 'text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              {item.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </nav>
              </aside>
            </div>
          )}

          {/* Content */}
          <article className="flex-1 min-w-0">
            <div className="mb-8">
              <Link href="/docs" className="text-sm text-gray-500 hover:text-gray-700">
                ← Documentação
              </Link>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">{doc.title}</h1>
            <p className="text-lg text-gray-600 mb-8">{doc.description}</p>

            <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-a:text-gray-700 prose-code:text-gray-700 prose-pre:bg-gray-900">
              {doc.content}
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}
