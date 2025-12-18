'use client';

import { useState } from 'react';
import Link from 'next/link';

// ============================================================================
// NAVIGATION
// ============================================================================
function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-[#F0F0F1]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F47A36] flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <span className="font-semibold text-lg text-gray-900">
              Integra<span className="text-[#F47A36]">Saúde</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#como-funciona" className="text-sm text-gray-600 hover:text-gray-900">
              Como Funciona
            </a>
            <a href="#precos" className="text-sm text-gray-600 hover:text-gray-900">
              Preços
            </a>
            <Link href="/docs" className="text-sm text-gray-600 hover:text-gray-900">
              Docs
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-gray-900 hidden sm:block"
            >
              Entrar
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-[#F47A36] hover:bg-[#e06a28] text-white text-sm font-medium rounded-lg transition-colors"
            >
              Começar
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

// ============================================================================
// HERO SECTION
// ============================================================================
function HeroSection() {
  return (
    <section className="pt-32 pb-20 bg-[#FCF9F6]">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
          Integração hospitalar
          <br />
          <span className="text-[#F47A36]">simplificada</span>
        </h1>

        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
          Conecte Tasy, MV Soul e outros HIS com uma única API. HL7 v2 para FHIR R4 em segundos.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-4 bg-[#F47A36] hover:bg-[#e06a28] text-white font-semibold rounded-xl transition-colors"
          >
            Teste Grátis por 14 Dias
          </Link>
          <Link
            href="/docs"
            className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-[#F0F0F1] text-gray-900 font-semibold rounded-xl border border-[#D9C3B8] transition-colors"
          >
            Ver Documentação
          </Link>
        </div>

        <p className="text-sm text-gray-500">Conformidade LGPD • Sem cartão de crédito</p>
      </div>
    </section>
  );
}

// ============================================================================
// HOW IT WORKS
// ============================================================================
function HowItWorksSection() {
  return (
    <section id="como-funciona" className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-16">Como funciona</h2>

        <div className="grid md:grid-cols-3 gap-12">
          {[
            {
              step: '1',
              title: 'Configure',
              description: 'Escolha seu HIS e insira as credenciais de conexão.',
            },
            {
              step: '2',
              title: 'Envie HL7',
              description: 'Mensagens HL7 v2 são recebidas via webhook ou MLLP.',
            },
            {
              step: '3',
              title: 'Receba FHIR',
              description: 'Transformamos automaticamente para FHIR R4 com BR-Core.',
            },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#F47A36] text-white text-xl font-bold flex items-center justify-center mx-auto mb-4">
                {item.step}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// FEATURES
// ============================================================================
function FeaturesSection() {
  const features = [
    { title: 'Parser HL7 v2', description: 'ADT, ORM, ORU, MDM com Z-segments brasileiros' },
    { title: 'FHIR R4', description: 'Transformação automática com perfis BR-Core' },
    { title: 'Validação CPF/CNS', description: 'Algoritmo módulo-11 integrado' },
    { title: 'Conectores', description: 'Tasy, MV Soul, Pixeon pré-configurados' },
  ];

  return (
    <section className="py-20 bg-[#FCF9F6]">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-16">O que está incluso</h2>

        <div className="grid sm:grid-cols-2 gap-6">
          {features.map((feature, i) => (
            <div key={i} className="p-6 bg-white rounded-xl border border-[#F0F0F1]">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// PRICING
// ============================================================================
function PricingSection() {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="precos" className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Preços</h2>
        <p className="text-gray-600 text-center mb-8">Escale conforme sua demanda</p>

        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center p-1 rounded-lg bg-[#F0F0F1]">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                !annual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                annual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Anual (-17%)
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {[
            {
              name: 'Starter',
              price: annual ? 'R$ 497' : 'R$ 597',
              features: ['10.000 msgs/mês', '2 conectores', 'Suporte email'],
              highlight: false,
            },
            {
              name: 'Professional',
              price: annual ? 'R$ 1.497' : 'R$ 1.797',
              features: [
                '100.000 msgs/mês',
                '5 conectores',
                'Suporte prioritário',
                'Webhooks',
                'SLA 99.9%',
              ],
              highlight: true,
            },
            {
              name: 'Enterprise',
              price: 'Sob consulta',
              features: ['Ilimitado', 'On-premise', 'Suporte 24/7', 'SLA 99.99%'],
              highlight: false,
            },
          ].map((plan, i) => (
            <div
              key={i}
              className={`p-8 rounded-2xl ${
                plan.highlight ? 'bg-[#F47A36] text-white' : 'bg-white border border-[#F0F0F1]'
              }`}
            >
              <h3
                className={`text-xl font-bold mb-2 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}
              >
                {plan.name}
              </h3>
              <div
                className={`text-3xl font-bold mb-6 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}
              >
                {plan.price}
                {plan.price !== 'Sob consulta' && (
                  <span className="text-base font-normal">/mês</span>
                )}
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, j) => (
                  <li
                    key={j}
                    className={`flex items-center gap-2 ${plan.highlight ? 'text-white/90' : 'text-gray-600'}`}
                  >
                    <svg
                      className={`w-4 h-4 ${plan.highlight ? 'text-white' : 'text-[#F47A36]'}`}
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
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`block w-full py-3 text-center font-semibold rounded-xl transition-colors ${
                  plan.highlight
                    ? 'bg-white text-[#F47A36] hover:bg-gray-100'
                    : 'bg-[#F47A36] text-white hover:bg-[#e06a28]'
                }`}
              >
                {plan.name === 'Enterprise' ? 'Falar com Vendas' : 'Começar'}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// CTA
// ============================================================================
function CTASection() {
  return (
    <section className="py-20 bg-[#FCF9F6]">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
          Pronto para simplificar?
        </h2>
        <p className="text-lg text-gray-600 mb-10">Comece em minutos. Sem cartão de crédito.</p>
        <Link
          href="/signup"
          className="inline-block px-8 py-4 bg-[#F47A36] hover:bg-[#e06a28] text-white font-semibold rounded-xl transition-colors"
        >
          Começar Gratuitamente
        </Link>
      </div>
    </section>
  );
}

// ============================================================================
// FOOTER
// ============================================================================
function Footer() {
  return (
    <footer className="py-12 bg-white border-t border-[#F0F0F1]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#F47A36] flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <span className="font-semibold text-gray-900">
              Integra<span className="text-[#F47A36]">Saúde</span>
            </span>
          </Link>

          <div className="flex items-center gap-6 text-sm text-gray-600">
            <Link href="/docs" className="hover:text-gray-900">
              Docs
            </Link>
            <Link href="/privacidade" className="hover:text-gray-900">
              Privacidade
            </Link>
            <Link href="/termos" className="hover:text-gray-900">
              Termos
            </Link>
          </div>

          <p className="text-sm text-gray-500">© {new Date().getFullYear()} IntegraSaúde</p>
        </div>
      </div>
    </footer>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================
export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </main>
  );
}
