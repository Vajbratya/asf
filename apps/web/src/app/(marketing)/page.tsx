'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// ============================================================================
// ANIMATED CONNECTION VISUALIZATION
// ============================================================================
function ConnectionVisualization() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg
        className="absolute w-full h-full"
        viewBox="0 0 1200 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Animated connection lines */}
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0F766E" stopOpacity="0" />
            <stop offset="50%" stopColor="#0F766E" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#0F766E" stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Connection paths with animation */}
        {[
          { d: 'M 100 200 Q 400 100 600 400 T 1100 300', delay: '0s' },
          { d: 'M 50 400 Q 300 500 600 350 T 1150 450', delay: '0.5s' },
          { d: 'M 150 600 Q 450 400 700 500 T 1050 200', delay: '1s' },
        ].map((path, i) => (
          <g key={i}>
            <path
              d={path.d}
              stroke="url(#lineGradient)"
              strokeWidth="2"
              fill="none"
              strokeDasharray="8 8"
              className="animate-flow"
              style={{ animationDelay: path.delay }}
              filter="url(#glow)"
            />
            {/* Moving data packet */}
            <circle r="4" fill="#0F766E" opacity="0.8">
              <animateMotion dur="4s" repeatCount="indefinite" begin={path.delay}>
                <mpath href={`#path${i}`} />
              </animateMotion>
            </circle>
            <path id={`path${i}`} d={path.d} fill="none" />
          </g>
        ))}

        {/* Floating nodes */}
        {[
          { cx: 150, cy: 200, label: 'Tasy' },
          { cx: 100, cy: 450, label: 'MV Soul' },
          { cx: 200, cy: 650, label: 'Pixeon' },
          { cx: 1050, cy: 350, label: 'FHIR' },
        ].map((node, i) => (
          <g key={i} className="animate-float" style={{ animationDelay: `${i * 0.3}s` }}>
            <circle
              cx={node.cx}
              cy={node.cy}
              r="30"
              fill="#0F766E"
              fillOpacity="0.1"
              stroke="#0F766E"
              strokeWidth="2"
              strokeOpacity="0.3"
            />
            <circle cx={node.cx} cy={node.cy} r="20" fill="#0F766E" fillOpacity="0.2" />
            <circle cx={node.cx} cy={node.cy} r="8" fill="#0F766E" />
          </g>
        ))}
      </svg>
    </div>
  );
}

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
        scrolled
          ? 'bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/25 group-hover:shadow-primary-500/40 transition-shadow">
              <svg
                className="w-6 h-6 text-white"
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
            <span className="font-display text-xl font-bold text-slate-900">
              Integra<span className="text-primary-600">Saúde</span>
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {['Recursos', 'Preços', 'Documentação', 'Blog'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-slate-600 hover:text-primary-600 font-medium transition-colors"
              >
                {item}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-lg shadow-primary-600/25 hover:shadow-primary-600/40 transition-all hover:-translate-y-0.5"
            >
              Começar Grátis
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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 via-white to-primary-50/30">
      {/* Background elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-50" />
      <div className="absolute inset-0 bg-hero-gradient" />
      <ConnectionVisualization />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-32 lg:py-40">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 text-primary-700 font-medium text-sm mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
            Integração HL7 e FHIR para hospitais brasileiros
          </div>

          {/* Headline */}
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 leading-tight mb-6 animate-slide-up">
            Conecte seus sistemas
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-primary-500 to-teal-400">
              hospitalares em minutos
            </span>
          </h1>

          {/* Subheadline */}
          <p
            className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto mb-12 animate-slide-up"
            style={{ animationDelay: '0.1s' }}
          >
            Plataforma de integração que conecta Tasy, MV Soul, Pixeon e outros sistemas de saúde
            usando padrões HL7 e FHIR R4.
          </p>

          {/* CTA Buttons */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up"
            style={{ animationDelay: '0.2s' }}
          >
            <Link
              href="/signup"
              className="group px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-lg rounded-2xl shadow-xl shadow-primary-600/25 hover:shadow-2xl hover:shadow-primary-600/30 transition-all hover:-translate-y-1 flex items-center gap-3"
            >
              Começar Gratuitamente
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
            <a
              href="#demo"
              className="group px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-lg rounded-2xl border-2 border-slate-200 hover:border-slate-300 transition-all flex items-center gap-3"
            >
              <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Ver Demonstração
            </a>
          </div>

          {/* Trust badges */}
          <div
            className="mt-16 pt-8 border-t border-slate-200/50 animate-fade-in"
            style={{ animationDelay: '0.4s' }}
          >
            <p className="text-sm text-slate-500 mb-6">Confiado por hospitais em todo o Brasil</p>
            <div className="flex flex-wrap items-center justify-center gap-8 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
              {['Hospital A', 'Hospital B', 'Hospital C', 'Hospital D'].map((name, i) => (
                <div key={i} className="flex items-center gap-2 text-slate-400">
                  <div className="w-8 h-8 rounded-lg bg-slate-200" />
                  <span className="font-medium">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-slate-300 flex items-start justify-center p-2">
          <div className="w-1.5 h-3 rounded-full bg-slate-400 animate-pulse" />
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
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      title: 'Integração Instantânea',
      description:
        'Conecte-se a Tasy, MV Soul e Pixeon em minutos, não semanas. Nossa plataforma reconhece automaticamente os formatos de mensagem.',
      color: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-50',
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
      title: 'Segurança LGPD',
      description:
        'Dados criptografados em trânsito e em repouso. Auditoria completa de acesso. Certificação de segurança para dados de saúde.',
      color: 'from-emerald-500 to-teal-500',
      bg: 'bg-emerald-50',
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
          />
        </svg>
      ),
      title: 'FHIR R4 Nativo',
      description:
        'Transformação automática de HL7 v2 para FHIR R4. Compatível com BR-Core para RNDS e padrões brasileiros.',
      color: 'from-blue-500 to-indigo-500',
      bg: 'bg-blue-50',
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      title: 'Dashboard em Tempo Real',
      description:
        'Monitore todas as mensagens, conectores e métricas em um painel centralizado. Alertas instantâneos por webhook.',
      color: 'from-violet-500 to-purple-500',
      bg: 'bg-violet-50',
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          />
        </svg>
      ),
      title: 'API Completa',
      description:
        'REST API documentada com autenticação por chave. Webhooks para eventos em tempo real. SDKs para Node.js e Python.',
      color: 'from-pink-500 to-rose-500',
      bg: 'bg-pink-50',
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      title: 'Suporte Especializado',
      description:
        'Time de engenheiros com experiência em integrações hospitalares. SLA garantido de até 99.99% para planos Enterprise.',
      color: 'from-cyan-500 to-sky-500',
      bg: 'bg-cyan-50',
    },
  ];

  return (
    <section id="recursos" className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-20">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Tudo que você precisa para
            <br />
            <span className="text-primary-600">integrar sistemas de saúde</span>
          </h2>
          <p className="text-xl text-slate-600">
            Uma plataforma completa que elimina a complexidade das integrações hospitalares
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div
              key={i}
              className="group relative p-8 rounded-3xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1"
            >
              {/* Icon */}
              <div
                className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
              >
                <div className={`text-transparent bg-clip-text bg-gradient-to-br ${feature.color}`}>
                  {feature.icon}
                </div>
              </div>

              {/* Content */}
              <h3 className="font-display text-xl font-bold text-slate-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">{feature.description}</p>

              {/* Hover arrow */}
              <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg
                  className="w-5 h-5 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// HOW IT WORKS SECTION
// ============================================================================
function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Conecte seu sistema',
      description:
        'Configure a conexão com Tasy, MV Soul ou qualquer sistema HL7 em poucos cliques.',
      image: '/step-1.svg',
    },
    {
      number: '02',
      title: 'Receba mensagens',
      description:
        'Mensagens ADT, ORM e ORU são automaticamente parseadas e transformadas em FHIR.',
      image: '/step-2.svg',
    },
    {
      number: '03',
      title: 'Use seus dados',
      description:
        'Acesse via API REST, receba webhooks ou integre com RNDS usando padrões BR-Core.',
      image: '/step-3.svg',
    },
  ];

  return (
    <section className="py-24 lg:py-32 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-20">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Simples como <span className="text-primary-600">1, 2, 3</span>
          </h2>
          <p className="text-xl text-slate-600">Comece a integrar em minutos, não em semanas</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {steps.map((step, i) => (
            <div key={i} className="relative">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-primary-300 to-transparent" />
              )}

              <div className="text-center">
                {/* Number */}
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white shadow-xl shadow-slate-200/50 mb-8">
                  <span className="font-display text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-primary-600 to-teal-500">
                    {step.number}
                  </span>
                </div>

                {/* Content */}
                <h3 className="font-display text-2xl font-bold text-slate-900 mb-4">
                  {step.title}
                </h3>
                <p className="text-slate-600 text-lg">{step.description}</p>
              </div>
            </div>
          ))}
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
      description: 'Para hospitais iniciando com integrações',
      price: annual ? 'R$ 4.990' : 'R$ 499',
      period: annual ? '/ano' : '/mês',
      savings: annual ? 'Economize R$ 998' : null,
      features: [
        '10.000 mensagens/mês',
        '2 conectores',
        '5 usuários',
        'Suporte por email',
        'SLA 99.5%',
        '30 dias de retenção',
      ],
      cta: 'Começar Agora',
      popular: false,
    },
    {
      name: 'Professional',
      description: 'Para hospitais com múltiplas integrações',
      price: annual ? 'R$ 14.990' : 'R$ 1.499',
      period: annual ? '/ano' : '/mês',
      savings: annual ? 'Economize R$ 2.998' : null,
      features: [
        '50.000 mensagens/mês',
        '5 conectores',
        '20 usuários',
        'Suporte prioritário',
        'SLA 99.9%',
        '90 dias de retenção',
        'Webhooks customizados',
        'API completa',
      ],
      cta: 'Começar Agora',
      popular: true,
    },
    {
      name: 'Enterprise',
      description: 'Para grandes redes hospitalares',
      price: 'Personalizado',
      period: '',
      savings: null,
      features: [
        'Mensagens ilimitadas',
        'Conectores ilimitados',
        'Usuários ilimitados',
        'Suporte 24/7',
        'SLA 99.99%',
        '365 dias de retenção',
        'Integrações customizadas',
        'Instalação on-premise',
        'Gerente de conta dedicado',
      ],
      cta: 'Falar com Vendas',
      popular: false,
    },
  ];

  return (
    <section id="preços" className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Preços transparentes,
            <br />
            <span className="text-primary-600">sem surpresas</span>
          </h2>
          <p className="text-xl text-slate-600 mb-8">
            Escolha o plano ideal para o tamanho do seu hospital
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-4 p-1.5 rounded-2xl bg-slate-100">
            <button
              onClick={() => setAnnual(false)}
              className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
                !annual
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-6 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${
                annual ? 'bg-white text-slate-900 shadow-md' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Anual
              <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full">
                -17%
              </span>
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-6">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`relative rounded-3xl p-8 lg:p-10 ${
                plan.popular
                  ? 'bg-slate-900 text-white ring-4 ring-primary-500 shadow-2xl scale-105 lg:scale-110 z-10'
                  : 'bg-white border-2 border-slate-200'
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-primary-500 text-white text-sm font-semibold rounded-full shadow-lg">
                  Mais Popular
                </div>
              )}

              {/* Header */}
              <div className="mb-8">
                <h3
                  className={`font-display text-2xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-slate-900'}`}
                >
                  {plan.name}
                </h3>
                <p className={plan.popular ? 'text-slate-300' : 'text-slate-600'}>
                  {plan.description}
                </p>
              </div>

              {/* Price */}
              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span
                    className={`font-display text-5xl font-bold ${plan.popular ? 'text-white' : 'text-slate-900'}`}
                  >
                    {plan.price}
                  </span>
                  <span className={plan.popular ? 'text-slate-400' : 'text-slate-500'}>
                    {plan.period}
                  </span>
                </div>
                {plan.savings && (
                  <p className="mt-2 text-sm text-emerald-500 font-medium">{plan.savings}</p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-10">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-3">
                    <svg
                      className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                        plan.popular ? 'text-primary-400' : 'text-primary-600'
                      }`}
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
                    <span className={plan.popular ? 'text-slate-300' : 'text-slate-600'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href="/signup"
                className={`block w-full py-4 text-center font-semibold rounded-2xl transition-all hover:-translate-y-0.5 ${
                  plan.popular
                    ? 'bg-white text-slate-900 hover:bg-slate-100 shadow-xl'
                    : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg'
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
// TESTIMONIALS SECTION
// ============================================================================
function TestimonialsSection() {
  const testimonials = [
    {
      quote:
        'Reduzimos o tempo de integração de 3 meses para 1 semana. A plataforma é extremamente intuitiva.',
      author: 'Dr. Carlos Silva',
      role: 'CTO',
      company: 'Hospital São Lucas',
      avatar: null,
    },
    {
      quote:
        'Finalmente uma solução que entende os padrões brasileiros. A validação de CPF e CNS funciona perfeitamente.',
      author: 'Ana Rodrigues',
      role: 'Gerente de TI',
      company: 'Rede Saúde Plus',
      avatar: null,
    },
    {
      quote:
        'O suporte é excepcional. Sempre respondem rapidamente e conhecem profundamente o setor de saúde.',
      author: 'Roberto Mendes',
      role: 'Diretor de Tecnologia',
      company: 'Hospital Regional',
      avatar: null,
    },
  ];

  return (
    <section className="py-24 lg:py-32 bg-slate-900">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-6">
            Hospitais de todo o Brasil
            <br />
            <span className="text-primary-400">confiam em nós</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => (
            <div
              key={i}
              className="relative p-8 rounded-3xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-colors"
            >
              {/* Quote mark */}
              <svg
                className="absolute top-6 right-6 w-12 h-12 text-slate-700"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>

              {/* Quote */}
              <p className="text-lg text-slate-300 mb-8 relative z-10">
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-teal-500 flex items-center justify-center text-white font-bold">
                  {testimonial.author
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div>
                  <p className="font-semibold text-white">{testimonial.author}</p>
                  <p className="text-sm text-slate-400">
                    {testimonial.role}, {testimonial.company}
                  </p>
                </div>
              </div>
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
    <section className="py-24 lg:py-32 bg-gradient-to-br from-primary-600 via-primary-700 to-teal-700 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
          Pronto para simplificar suas integrações?
        </h2>
        <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
          Junte-se a dezenas de hospitais que já economizam tempo e recursos com IntegraSaúde.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="px-8 py-4 bg-white text-primary-700 font-semibold text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
          >
            Começar Gratuitamente
          </Link>
          <a
            href="mailto:contato@integrasaude.com.br"
            className="px-8 py-4 bg-transparent text-white font-semibold text-lg rounded-2xl border-2 border-white/30 hover:border-white/50 hover:bg-white/10 transition-all"
          >
            Falar com Especialista
          </a>
        </div>

        <p className="mt-8 text-primary-200 text-sm">
          Sem cartão de crédito • 14 dias de teste grátis • Cancele quando quiser
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
    <footer className="bg-slate-950 text-slate-400 py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
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
              <span className="font-display text-xl font-bold text-white">
                Integra<span className="text-primary-400">Saúde</span>
              </span>
            </Link>
            <p className="text-slate-400 max-w-sm mb-6">
              Plataforma de integração HL7 e FHIR para hospitais brasileiros. Conecte seus sistemas
              de saúde com segurança e conformidade.
            </p>
            <div className="flex gap-4">
              {['linkedin', 'twitter', 'github'].map((social) => (
                <a
                  key={social}
                  href={`https://${social}.com/integrasaude`}
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
                >
                  <span className="sr-only">{social}</span>
                  <div className="w-5 h-5 bg-slate-400" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {[
            {
              title: 'Produto',
              links: ['Recursos', 'Preços', 'Integrações', 'Roadmap', 'Changelog'],
            },
            {
              title: 'Recursos',
              links: ['Documentação', 'API Reference', 'Guias', 'Blog', 'Status'],
            },
            {
              title: 'Empresa',
              links: ['Sobre', 'Carreiras', 'Contato', 'Parceiros', 'Imprensa'],
            },
          ].map((group) => (
            <div key={group.title}>
              <h4 className="font-semibold text-white mb-4">{group.title}</h4>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="hover:text-white transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm">
            © {new Date().getFullYear()} IntegraSaúde. Todos os direitos reservados.
          </p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:text-white transition-colors">
              Privacidade
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Termos
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Cookies
            </a>
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
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </main>
  );
}
