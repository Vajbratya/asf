'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// ============================================================================
// NAVIGATION
// ============================================================================
function Navigation() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-xl shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-semibold text-lg md:text-xl text-[#1A1A1A]">
              Integra<span className="text-[#FF8C00]">Saude</span>
            </span>
          </Link>

          {/* Nav Links - Desktop */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#recursos"
              className="text-sm text-[#1A1A1A]/70 hover:text-[#1A1A1A] font-medium transition-colors"
            >
              Recursos
            </a>
            <a
              href="#precos"
              className="text-sm text-[#1A1A1A]/70 hover:text-[#1A1A1A] font-medium transition-colors"
            >
              Precos
            </a>
            <Link
              href="/sobre"
              className="text-sm text-[#1A1A1A]/70 hover:text-[#1A1A1A] font-medium transition-colors"
            >
              Sobre
            </Link>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-[#1A1A1A]/70 hover:text-[#1A1A1A] font-medium transition-colors hidden sm:block"
            >
              Entrar
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2.5 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white font-medium text-sm rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              Comecar Gratis
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
    <section className="relative min-h-screen flex items-center justify-center bg-[#FAFAFA] pt-20">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-16 md:py-24 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF8C00]/10 text-[#FF8C00] font-medium text-sm mb-8">
          <span className="w-2 h-2 rounded-full bg-[#FF8C00] animate-pulse" />
          Integracao HL7 e FHIR para hospitais
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold text-[#1A1A1A] leading-[1.1] tracking-tight mb-6">
          Conecte seus sistemas
          <br />
          <span className="text-[#1A1A1A]/40">hospitalares em minutos</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-[#1A1A1A]/60 max-w-2xl mx-auto mb-10 leading-relaxed">
          Plataforma que conecta Tasy, MV Soul, Pixeon e outros sistemas usando padroes HL7 e FHIR
          R4. Seguro, conforme LGPD e pronto para RNDS.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-4 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white font-medium text-lg rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-105 active:scale-95"
          >
            Comecar Gratuitamente
          </Link>
          <a
            href="#demo"
            className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-50 text-[#1A1A1A] font-medium text-lg rounded-full border border-[#E5E5E5] hover:border-[#D5D5D5] transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Ver Demo
          </a>
        </div>

        {/* Trust indicator */}
        <div className="pt-8 border-t border-[#E5E5E5]">
          <p className="text-sm text-[#1A1A1A]/40 mb-4">Uma solucao</p>
          <div className="flex items-center justify-center gap-1">
            <span className="text-2xl font-semibold text-[#1A1A1A]">Laudos</span>
            <span className="text-2xl font-semibold text-[#FF8C00]">.AI</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// STATS SECTION
// ============================================================================
function StatsSection() {
  const stats = [
    { value: '99.9%', label: 'Uptime garantido' },
    { value: '< 50ms', label: 'Latencia media' },
    { value: '10M+', label: 'Mensagens/mes' },
    { value: '24/7', label: 'Suporte tecnico' },
  ];

  return (
    <section className="py-16 bg-white border-y border-[#E5E5E5]">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl md:text-4xl font-semibold text-[#1A1A1A] mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-[#1A1A1A]/50">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// FEATURES SECTION
// ============================================================================
function FeaturesSection() {
  const features = [
    {
      title: 'Integracao HL7 v2',
      description:
        'Suporte nativo a mensagens ADT, ORM, ORU, MDM e SIU. Parser automatico com validacao de campos.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      title: 'FHIR R4 Nativo',
      description:
        'Transformacao automatica para FHIR R4. Compativel com BR-Core e perfis brasileiros para RNDS.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
          />
        </svg>
      ),
    },
    {
      title: 'Conformidade LGPD',
      description:
        'Criptografia em transito e repouso. Logs de auditoria completos. Anonimizacao de dados sensiveis.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
    },
    {
      title: 'API REST Completa',
      description:
        'Endpoints documentados com OpenAPI. Autenticacao por API Key. Rate limiting configuravel.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          />
        </svg>
      ),
    },
    {
      title: 'Webhooks em Tempo Real',
      description:
        'Receba notificacoes instantaneas de novas mensagens. Retry automatico com backoff exponencial.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
    },
    {
      title: 'Dashboard Analitico',
      description:
        'Visualize metricas em tempo real. Historico de mensagens. Alertas configuravels por canal.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
  ];

  return (
    <section id="recursos" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        {/* Section header */}
        <div className="max-w-2xl mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold text-[#1A1A1A] mb-4">
            Tudo para integrar sistemas de saude
          </h2>
          <p className="text-lg text-[#1A1A1A]/60">
            Uma plataforma completa que elimina a complexidade das integracoes hospitalares.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div
              key={i}
              className="group p-6 rounded-2xl border border-[#E5E5E5] hover:border-[#FF8C00]/30 hover:shadow-lg transition-all duration-200"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-[#F5F5F5] group-hover:bg-[#FF8C00]/10 flex items-center justify-center mb-4 transition-colors">
                <div className="text-[#1A1A1A] group-hover:text-[#FF8C00] transition-colors">
                  {feature.icon}
                </div>
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">{feature.title}</h3>
              <p className="text-[#1A1A1A]/60 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// INTEGRATIONS SECTION
// ============================================================================
function IntegrationsSection() {
  const integrations = [
    { name: 'Tasy', status: 'Disponivel' },
    { name: 'MV Soul', status: 'Disponivel' },
    { name: 'Pixeon', status: 'Disponivel' },
    { name: 'Wareline', status: 'Em breve' },
    { name: 'Philips Tasy', status: 'Disponivel' },
    { name: 'HL7 Generico', status: 'Disponivel' },
  ];

  return (
    <section className="py-24 bg-[#FAFAFA]">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div>
            <h2 className="text-3xl md:text-4xl font-semibold text-[#1A1A1A] mb-4">
              Conecte-se aos principais sistemas do mercado
            </h2>
            <p className="text-lg text-[#1A1A1A]/60 mb-8">
              Nossa plataforma reconhece automaticamente os formatos de mensagem e configura os
              conectores para voce.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {integrations.map((integration, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-4 rounded-xl bg-white border border-[#E5E5E5]"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {integration.name.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-[#1A1A1A]">{integration.name}</div>
                    <div
                      className={`text-xs ${integration.status === 'Disponivel' ? 'text-green-600' : 'text-[#FF8C00]'}`}
                    >
                      {integration.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-[#1A1A1A] to-[#333333] p-8 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl font-bold text-white mb-4">HL7</div>
                <div className="flex items-center justify-center gap-2 text-white/60">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                    />
                  </svg>
                  <span>FHIR R4</span>
                </div>
                <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF8C00] text-white text-sm font-medium">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  Conversao automatica
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// PRICING SECTION
// ============================================================================
function PricingSection() {
  const [annual, setAnnual] = useState(true);

  const plans = [
    {
      name: 'Starter',
      description: 'Para hospitais iniciando',
      price: annual ? 'R$ 4.990' : 'R$ 499',
      period: annual ? '/ano' : '/mes',
      features: [
        '10.000 mensagens/mes',
        '2 conectores',
        '5 usuarios',
        'Suporte por email',
        'SLA 99.5%',
      ],
      cta: 'Comecar',
      highlight: false,
    },
    {
      name: 'Professional',
      description: 'Para hospitais em crescimento',
      price: annual ? 'R$ 14.990' : 'R$ 1.499',
      period: annual ? '/ano' : '/mes',
      features: [
        '50.000 mensagens/mes',
        '5 conectores',
        '20 usuarios',
        'Suporte prioritario',
        'SLA 99.9%',
        'Webhooks customizados',
        'API completa',
      ],
      cta: 'Comecar',
      highlight: true,
    },
    {
      name: 'Enterprise',
      description: 'Para grandes redes',
      price: 'Personalizado',
      period: '',
      features: [
        'Mensagens ilimitadas',
        'Conectores ilimitados',
        'Usuarios ilimitados',
        'Suporte 24/7',
        'SLA 99.99%',
        'On-premise disponivel',
        'Gerente dedicado',
      ],
      cta: 'Falar com Vendas',
      highlight: false,
    },
  ];

  return (
    <section id="precos" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold text-[#1A1A1A] mb-4">
            Precos transparentes
          </h2>
          <p className="text-lg text-[#1A1A1A]/60 mb-8">Escolha o plano ideal para seu hospital</p>

          {/* Toggle */}
          <div className="inline-flex items-center p-1 rounded-full bg-[#F5F5F5]">
            <button
              onClick={() => setAnnual(false)}
              className={`px-6 py-2 rounded-full font-medium text-sm transition-all ${
                !annual ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#1A1A1A]/60'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-6 py-2 rounded-full font-medium text-sm transition-all flex items-center gap-2 ${
                annual ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#1A1A1A]/60'
              }`}
            >
              Anual
              <span className="px-2 py-0.5 text-xs bg-[#FF8C00] text-white rounded-full">-17%</span>
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`relative rounded-2xl p-8 transition-all ${
                plan.highlight
                  ? 'bg-[#1A1A1A] text-white ring-2 ring-[#FF8C00] scale-105'
                  : 'bg-white border border-[#E5E5E5]'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#FF8C00] text-white text-xs font-medium rounded-full">
                  Mais Popular
                </div>
              )}

              <div className="mb-6">
                <h3
                  className={`text-xl font-semibold mb-1 ${plan.highlight ? 'text-white' : 'text-[#1A1A1A]'}`}
                >
                  {plan.name}
                </h3>
                <p className={plan.highlight ? 'text-white/60' : 'text-[#1A1A1A]/60'}>
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <span
                  className={`text-4xl font-semibold ${plan.highlight ? 'text-white' : 'text-[#1A1A1A]'}`}
                >
                  {plan.price}
                </span>
                <span className={plan.highlight ? 'text-white/60' : 'text-[#1A1A1A]/60'}>
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <svg
                      className={`w-5 h-5 mt-0.5 flex-shrink-0 ${plan.highlight ? 'text-[#FF8C00]' : 'text-green-500'}`}
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
                    <span className={plan.highlight ? 'text-white/80' : 'text-[#1A1A1A]/70'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className={`block w-full py-3 text-center font-medium rounded-full transition-all hover:scale-105 active:scale-95 ${
                  plan.highlight
                    ? 'bg-white text-[#1A1A1A] hover:bg-gray-100'
                    : 'bg-[#1A1A1A] text-white hover:bg-[#2A2A2A]'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// CTA SECTION
// ============================================================================
function CTASection() {
  return (
    <section className="py-24 bg-[#1A1A1A]">
      <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white mb-6">
          Pronto para simplificar suas integracoes?
        </h2>
        <p className="text-lg text-white/60 mb-10 max-w-2xl mx-auto">
          Junte-se a hospitais que ja economizam tempo e recursos com IntegraSaude.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-4 bg-white text-[#1A1A1A] font-medium text-lg rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-105 active:scale-95"
          >
            Comecar Gratuitamente
          </Link>
          <a
            href="mailto:contato@integrasaude.com.br"
            className="w-full sm:w-auto px-8 py-4 bg-transparent text-white font-medium text-lg rounded-full border border-white/30 hover:border-white/50 hover:bg-white/10 transition-all"
          >
            Falar com Especialista
          </a>
        </div>

        <p className="mt-8 text-white/40 text-sm">
          Sem cartao de credito necessario | 14 dias gratis | Cancele quando quiser
        </p>
      </div>
    </section>
  );
}

// ============================================================================
// FOOTER
// ============================================================================
function Footer() {
  return (
    <footer className="bg-[#0A0A0A] text-white/60 py-16">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <span className="text-xl font-semibold text-white">
                Integra<span className="text-[#FF8C00]">Saude</span>
              </span>
            </Link>
            <p className="text-white/50 max-w-sm mb-6">
              Plataforma de integracao HL7 e FHIR para hospitais brasileiros. Conecte seus sistemas
              de saude com seguranca e conformidade.
            </p>
            <div className="flex gap-3">
              <a
                href="https://linkedin.com/company/integrasaude"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="LinkedIn"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a
                href="https://twitter.com/integrasaude"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Twitter"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://github.com/integrasaude"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="GitHub"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Produto</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/recursos" className="hover:text-white transition-colors">
                  Recursos
                </Link>
              </li>
              <li>
                <Link href="/precos" className="hover:text-white transition-colors">
                  Precos
                </Link>
              </li>
              <li>
                <Link href="/integracoes" className="hover:text-white transition-colors">
                  Integracoes
                </Link>
              </li>
              <li>
                <Link href="/roadmap" className="hover:text-white transition-colors">
                  Roadmap
                </Link>
              </li>
              <li>
                <Link href="/changelog" className="hover:text-white transition-colors">
                  Changelog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Recursos</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/docs" className="hover:text-white transition-colors">
                  Documentacao
                </Link>
              </li>
              <li>
                <Link href="/docs/api" className="hover:text-white transition-colors">
                  API Reference
                </Link>
              </li>
              <li>
                <Link href="/guias" className="hover:text-white transition-colors">
                  Guias
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/status" className="hover:text-white transition-colors">
                  Status
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Empresa</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/sobre" className="hover:text-white transition-colors">
                  Sobre
                </Link>
              </li>
              <li>
                <Link href="/carreiras" className="hover:text-white transition-colors">
                  Carreiras
                </Link>
              </li>
              <li>
                <Link href="/contato" className="hover:text-white transition-colors">
                  Contato
                </Link>
              </li>
              <li>
                <Link href="/parceiros" className="hover:text-white transition-colors">
                  Parceiros
                </Link>
              </li>
              <li>
                <Link href="/imprensa" className="hover:text-white transition-colors">
                  Imprensa
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-white/40">
            &copy; {new Date().getFullYear()} IntegraSaude. Todos os direitos reservados.
          </p>
          <div className="flex gap-6 text-sm">
            <Link href="/privacidade" className="hover:text-white transition-colors">
              Privacidade
            </Link>
            <Link href="/termos" className="hover:text-white transition-colors">
              Termos
            </Link>
          </div>
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
      <StatsSection />
      <FeaturesSection />
      <IntegrationsSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </main>
  );
}
