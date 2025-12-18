'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// ============================================================================
// ANIMATED DATA FLOW VISUALIZATION
// ============================================================================
function DataFlowVisual() {
  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200" fill="none">
        <path
          d="M50 100 L175 100"
          stroke="url(#pulse-gradient)"
          strokeWidth="2"
          strokeDasharray="8 4"
          className="animate-dash"
        />
        <path
          d="M225 100 L350 100"
          stroke="url(#pulse-gradient)"
          strokeWidth="2"
          strokeDasharray="8 4"
          className="animate-dash"
          style={{ animationDelay: '0.5s' }}
        />
        <defs>
          <linearGradient id="pulse-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0D9488" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#14B8A6" stopOpacity="1" />
            <stop offset="100%" stopColor="#0D9488" stopOpacity="0.2" />
          </linearGradient>
        </defs>
      </svg>

      <div className="flex items-center justify-between relative z-10">
        {/* HL7 Source */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center shadow-xl shadow-slate-900/50">
            <span className="font-mono text-lg font-bold text-teal-400">HL7</span>
          </div>
          <span className="mt-2 text-xs text-slate-500 font-medium">LEGACY</span>
        </div>

        {/* IntegraSaúde Core */}
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-teal-500/30 ring-4 ring-teal-400/20 animate-pulse-slow">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477m0 17.726l-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205L12 12m6.894 5.785l-1.149-.964M6.256 7.178l-1.15-.964m15.352 8.864l-1.41-.513M4.954 9.435l-1.41-.514M12.002 12l-3.75 6.495"
              />
            </svg>
          </div>
          <span className="mt-2 text-xs text-teal-400 font-semibold tracking-wider">
            INTEGRASAÚDE
          </span>
        </div>

        {/* FHIR Output */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 border border-cyan-400/30 flex items-center justify-center shadow-xl shadow-cyan-500/30">
            <span className="font-mono text-lg font-bold text-white">FHIR</span>
          </div>
          <span className="mt-2 text-xs text-slate-500 font-medium">MODERN</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CODE EXAMPLE COMPONENT
// ============================================================================
function CodeBlock({ code, language, title }: { code: string; language: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden bg-slate-900 border border-slate-700/50 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-xs font-mono text-slate-400">{title}</span>
        </div>
        <button
          onClick={handleCopy}
          className="text-xs font-mono text-slate-400 hover:text-teal-400 transition-colors flex items-center gap-1"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Copiado
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copiar
            </>
          )}
        </button>
      </div>
      {/* Code */}
      <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed">
        <code dangerouslySetInnerHTML={{ __html: code }} />
      </pre>
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/50'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
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
            <span className="font-semibold text-xl text-white">
              Integra<span className="text-teal-400">Saúde</span>
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#como-funciona"
              className="text-sm text-slate-400 hover:text-white transition-colors font-medium"
            >
              Como Funciona
            </a>
            <a
              href="#recursos"
              className="text-sm text-slate-400 hover:text-white transition-colors font-medium"
            >
              Recursos
            </a>
            <a
              href="#precos"
              className="text-sm text-slate-400 hover:text-white transition-colors font-medium"
            >
              Preços
            </a>
            <Link
              href="/docs"
              className="text-sm text-slate-400 hover:text-white transition-colors font-medium"
            >
              Documentação
            </Link>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-slate-400 hover:text-white font-medium transition-colors hidden sm:block"
            >
              Entrar
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-sm rounded-lg shadow-lg shadow-teal-500/25 hover:shadow-teal-400/30 transition-all hover:-translate-y-0.5"
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
  const codeExample = `<span class="text-slate-500">// Conecte seu sistema em 3 linhas</span>
<span class="text-purple-400">import</span> <span class="text-white">{ IntegraSaude }</span> <span class="text-purple-400">from</span> <span class="text-teal-300">'@integrasaude/sdk'</span>

<span class="text-purple-400">const</span> <span class="text-white">client</span> <span class="text-slate-400">=</span> <span class="text-purple-400">new</span> <span class="text-cyan-300">IntegraSaude</span><span class="text-slate-400">({</span>
  <span class="text-white">apiKey</span><span class="text-slate-400">:</span> <span class="text-teal-300">'sk_live_...'</span><span class="text-slate-400">,</span>
  <span class="text-white">hospital</span><span class="text-slate-400">:</span> <span class="text-teal-300">'tasy'</span>  <span class="text-slate-500">// ou 'mv-soul', 'pixeon'</span>
<span class="text-slate-400">})</span>

<span class="text-slate-500">// Envie HL7, receba FHIR</span>
<span class="text-purple-400">const</span> <span class="text-white">patient</span> <span class="text-slate-400">=</span> <span class="text-purple-400">await</span> <span class="text-white">client</span><span class="text-slate-400">.</span><span class="text-cyan-300">transform</span><span class="text-slate-400">(</span><span class="text-white">hl7Message</span><span class="text-slate-400">)</span>
<span class="text-slate-500">// → Patient { resourceType: 'Patient', ... }</span>`;

  return (
    <section className="relative min-h-screen flex items-center bg-slate-950 pt-20 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/20 via-slate-950 to-slate-950" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjMGY0ZDRhIiBzdHJva2Utd2lkdGg9IjAuNSIvPjwvZz48L3N2Zz4=')] opacity-30" />

      <div className="max-w-7xl mx-auto px-6 py-24 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 font-medium text-sm mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              Pronto para RNDS e BR-Core
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight mb-6">
              Integração hospitalar
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">
                sem dor de cabeça
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg text-slate-400 max-w-xl mb-10 leading-relaxed">
              Conecte Tasy, MV Soul e outros sistemas com{' '}
              <span className="text-white font-medium">uma única API</span>. Transformação
              automática de HL7 v2 para FHIR R4, validação de CPF/CNS, e conformidade total com
              LGPD.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 mb-12">
              <Link
                href="/signup"
                className="px-8 py-4 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-slate-950 font-semibold text-lg rounded-xl shadow-xl shadow-teal-500/25 hover:shadow-teal-400/30 transition-all hover:-translate-y-0.5 flex items-center gap-2"
              >
                Teste Grátis por 14 Dias
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
              <Link
                href="/docs"
                className="px-8 py-4 bg-slate-800/50 hover:bg-slate-800 text-white font-semibold text-lg rounded-xl border border-slate-700 hover:border-slate-600 transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Ver Documentação
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <span>LGPD Compliant</span>
              </div>
            </div>
          </div>

          {/* Right content - Code example */}
          <div className="lg:pl-8">
            <CodeBlock code={codeExample} language="typescript" title="integrar.ts" />
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
    { value: '99.9%', label: 'Uptime SLA', icon: '🟢' },
    { value: '<50ms', label: 'Latência P95', icon: '⚡' },
    { value: '10M+', label: 'Mensagens/mês', icon: '📊' },
    { value: '50+', label: 'Hospitais Ativos', icon: '🏥' },
  ];

  return (
    <section className="py-16 bg-slate-900 border-y border-slate-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2 font-mono">
                {stat.value}
              </div>
              <div className="text-sm text-slate-500 flex items-center justify-center gap-2">
                <span>{stat.icon}</span>
                {stat.label}
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
  return (
    <section id="como-funciona" className="py-24 bg-slate-950">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Sem <span className="text-slate-500 line-through">meses</span> de desenvolvimento
          </h2>
          <p className="text-lg text-slate-400">
            Normalmente integrar um HIS leva 2-4 meses. Com IntegraSaúde, você conecta em horas.
          </p>
        </div>

        {/* Visual flow */}
        <div className="mb-16">
          <DataFlowVisual />
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Configure o Conector',
              description:
                'Escolha seu HIS (Tasy, MV Soul, etc.) e insira as credenciais. Detectamos automaticamente a versão do protocolo.',
              code: `client.connect({
  type: 'tasy',
  host: 'his.hospital.com',
  port: 2575
})`,
            },
            {
              step: '02',
              title: 'Envie Mensagens HL7',
              description:
                'Receba mensagens HL7 v2 do seu sistema. Suportamos ADT, ORM, ORU, MDM, SIU e Z-segments customizados.',
              code: `// Webhook recebe HL7
POST /webhook/hl7
MSH|^~\\&|TASY|HOSP|...
PID|1||12345^^^MR||...`,
            },
            {
              step: '03',
              title: 'Receba FHIR R4',
              description:
                'Transformamos automaticamente para FHIR R4 com perfis BR-Core. Pronto para RNDS.',
              code: `{
  "resourceType": "Patient",
  "identifier": [{
    "system": "cpf",
    "value": "123.456.789-09"
  }]
}`,
            },
          ].map((item, i) => (
            <div key={i} className="group">
              <div className="mb-4 flex items-center gap-3">
                <span className="text-5xl font-bold text-slate-800 group-hover:text-teal-900 transition-colors font-mono">
                  {item.step}
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
              <p className="text-slate-400 mb-4 leading-relaxed">{item.description}</p>
              <div className="rounded-lg bg-slate-900 border border-slate-800 p-3 font-mono text-xs text-slate-400 overflow-x-auto">
                <pre className="whitespace-pre-wrap">{item.code}</pre>
              </div>
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
      title: 'Parser HL7 v2 Completo',
      description:
        'ADT, ORM, ORU, MDM, SIU com Z-segments brasileiros (ZPD, ZPV, ZIN, ZOR). Validação automática de campos.',
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
      title: 'Transformação FHIR R4',
      description:
        'Conversão automática para recursos FHIR. Perfis BR-Core incluídos. Validação contra esquemas oficiais.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
          />
        </svg>
      ),
    },
    {
      title: 'Validação CPF/CNS',
      description:
        'Algoritmo módulo-11 para CPF e CNS. Detecta números inválidos antes de enviar ao HIS.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      title: 'Conectores Nativos',
      description:
        'Tasy, MV Soul, Pixeon, Wareline pré-configurados. Inclui mapeamento de campos e Z-segments.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      ),
    },
    {
      title: 'MLLP Connection Pool',
      description:
        'Gerenciamento automático de conexões TCP. Reconexão inteligente. Suporte a múltiplos hosts.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
          />
        </svg>
      ),
    },
    {
      title: 'Webhooks & API REST',
      description:
        'Receba notificações em tempo real. API documentada com OpenAPI. Rate limiting configurável.',
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
  ];

  return (
    <section id="recursos" className="py-24 bg-slate-900">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            O que você <span className="text-teal-400">não</span> precisa construir
          </h2>
          <p className="text-lg text-slate-400">
            Tudo isso já está pronto, testado e funcionando em produção.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className="group p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-teal-500/30 hover:bg-slate-800 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-700/50 group-hover:bg-teal-500/10 flex items-center justify-center mb-4 transition-colors">
                <div className="text-slate-400 group-hover:text-teal-400 transition-colors">
                  {feature.icon}
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed text-sm">{feature.description}</p>
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
    {
      name: 'Tasy',
      vendor: 'Philips',
      status: 'live',
      features: ['HL7 MLLP', 'Z-segments', 'REST API'],
    },
    {
      name: 'MV Soul',
      vendor: 'MV',
      status: 'live',
      features: ['HL7 MLLP', 'XML Integration', 'Results'],
    },
    {
      name: 'Pixeon',
      vendor: 'Pixeon',
      status: 'live',
      features: ['HL7 MLLP', 'DICOM', 'Worklist'],
    },
    {
      name: 'Wareline',
      vendor: 'Wareline',
      status: 'beta',
      features: ['HL7 MLLP', 'Orders', 'Results'],
    },
    {
      name: 'Smart',
      vendor: 'InterSystems',
      status: 'planned',
      features: ['HL7 MLLP', 'FHIR Native'],
    },
    {
      name: 'Genérico',
      vendor: 'Qualquer HIS',
      status: 'live',
      features: ['HL7 v2.x', 'MLLP', 'Custom Z'],
    },
  ];

  return (
    <section className="py-24 bg-slate-950 border-y border-slate-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Conectores para os principais HIS brasileiros
            </h2>
            <p className="text-lg text-slate-400 mb-8">
              Cada conector inclui mapeamento de campos, Z-segments customizados e tratamento de
              erros específico para o sistema.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {integrations.map((integration, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-white">{integration.name}</h3>
                      <p className="text-xs text-slate-500">{integration.vendor}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        integration.status === 'live'
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : integration.status === 'beta'
                            ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}
                    >
                      {integration.status === 'live'
                        ? 'Disponível'
                        : integration.status === 'beta'
                          ? 'Beta'
                          : 'Em breve'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {integration.features.map((feature, j) => (
                      <span
                        key={j}
                        className="px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-400"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Architecture diagram */}
          <div className="relative p-8 rounded-3xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50">
            <div className="absolute top-4 right-4 flex items-center gap-2 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Sistema em produção
            </div>

            <div className="space-y-6">
              {/* Your Systems */}
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                <div className="text-xs text-slate-500 mb-3 uppercase tracking-wider">
                  Seus Sistemas
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 bg-slate-700 rounded-lg text-sm text-white font-mono">
                    LIS
                  </span>
                  <span className="px-3 py-1.5 bg-slate-700 rounded-lg text-sm text-white font-mono">
                    RIS
                  </span>
                  <span className="px-3 py-1.5 bg-slate-700 rounded-lg text-sm text-white font-mono">
                    ERP
                  </span>
                  <span className="px-3 py-1.5 bg-slate-700 rounded-lg text-sm text-white font-mono">
                    App
                  </span>
                </div>
              </div>

              {/* Arrow down */}
              <div className="flex justify-center">
                <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-teal-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </div>
              </div>

              {/* IntegraSaúde */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border border-teal-500/30">
                <div className="text-xs text-teal-400 mb-3 uppercase tracking-wider font-semibold">
                  IntegraSaúde
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-slate-900/50 rounded-lg text-slate-300">HL7 Parser</div>
                  <div className="p-2 bg-slate-900/50 rounded-lg text-slate-300">Transform</div>
                  <div className="p-2 bg-slate-900/50 rounded-lg text-slate-300">Validate</div>
                </div>
              </div>

              {/* Arrow down */}
              <div className="flex justify-center">
                <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-teal-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </div>
              </div>

              {/* HIS Systems */}
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                <div className="text-xs text-slate-500 mb-3 uppercase tracking-wider">
                  Hospital Information Systems
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-lg text-sm text-blue-300 font-mono">
                    Tasy
                  </span>
                  <span className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-lg text-sm text-purple-300 font-mono">
                    MV Soul
                  </span>
                  <span className="px-3 py-1.5 bg-orange-500/20 border border-orange-500/30 rounded-lg text-sm text-orange-300 font-mono">
                    Pixeon
                  </span>
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
      description: 'Para laboratórios e clínicas',
      price: annual ? 'R$ 497' : 'R$ 597',
      period: '/mês',
      features: [
        '10.000 mensagens/mês',
        '2 conectores HIS',
        'Suporte por email',
        'Dashboard básico',
        'SLA 99.5%',
      ],
      cta: 'Começar',
      highlight: false,
    },
    {
      name: 'Professional',
      description: 'Para hospitais de médio porte',
      price: annual ? 'R$ 1.497' : 'R$ 1.797',
      period: '/mês',
      features: [
        '100.000 mensagens/mês',
        '5 conectores HIS',
        'Suporte prioritário',
        'Webhooks customizados',
        'API completa',
        'SLA 99.9%',
        'Logs de auditoria',
      ],
      cta: 'Começar',
      highlight: true,
    },
    {
      name: 'Enterprise',
      description: 'Para redes hospitalares',
      price: 'Sob consulta',
      period: '',
      features: [
        'Mensagens ilimitadas',
        'Conectores ilimitados',
        'Suporte 24/7 dedicado',
        'On-premise disponível',
        'SLA 99.99%',
        'Gerente de conta',
        'Treinamento incluído',
      ],
      cta: 'Falar com Vendas',
      highlight: false,
    },
  ];

  return (
    <section id="precos" className="py-24 bg-slate-900">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Preços transparentes, sem surpresas
          </h2>
          <p className="text-lg text-slate-400 mb-8">Escale conforme sua demanda</p>

          {/* Toggle */}
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-800 border border-slate-700">
            <button
              onClick={() => setAnnual(false)}
              className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${
                !annual ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                annual ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Anual
              <span className="px-2 py-0.5 text-xs bg-teal-500 text-slate-950 rounded-full font-semibold">
                -17%
              </span>
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`relative rounded-2xl p-8 transition-all ${
                plan.highlight
                  ? 'bg-gradient-to-b from-teal-500/10 to-slate-800 border-2 border-teal-500/50 scale-105'
                  : 'bg-slate-800/50 border border-slate-700'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-teal-500 text-slate-950 text-xs font-bold rounded-full uppercase tracking-wider">
                  Mais Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-slate-400 text-sm">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                <span className="text-slate-400">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0"
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
                    <span className="text-slate-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className={`block w-full py-3.5 text-center font-semibold rounded-xl transition-all ${
                  plan.highlight
                    ? 'bg-teal-500 hover:bg-teal-400 text-slate-950'
                    : 'bg-slate-700 hover:bg-slate-600 text-white'
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
    <section className="py-24 bg-slate-950 relative overflow-hidden">
      {/* Background effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-900/30 via-slate-950 to-slate-950" />

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
          Pare de escrever parsers HL7.
          <br />
          <span className="text-teal-400">Comece a entregar valor.</span>
        </h2>
        <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto">
          Sua equipe deveria estar construindo features para pacientes, não lutando com protocolos
          de 1987.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-lg rounded-xl shadow-xl shadow-teal-500/25 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            Começar em 5 Minutos
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
          <a
            href="mailto:contato@integrasaude.com.br"
            className="w-full sm:w-auto px-8 py-4 bg-transparent text-white font-semibold text-lg rounded-xl border border-slate-700 hover:border-slate-600 hover:bg-slate-800/50 transition-all"
          >
            Agendar Demo
          </a>
        </div>

        <p className="mt-8 text-slate-500 text-sm">
          Sem cartão de crédito • 14 dias grátis • Setup em minutos
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
    <footer className="bg-slate-950 border-t border-slate-800 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
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
              <span className="text-xl font-semibold text-white">
                Integra<span className="text-teal-400">Saúde</span>
              </span>
            </Link>
            <p className="text-slate-500 max-w-sm mb-6 text-sm leading-relaxed">
              Plataforma de integração HL7 e FHIR para hospitais brasileiros. Conecte seus sistemas
              de saúde com segurança e conformidade LGPD.
            </p>
            <p className="text-xs text-slate-600">
              Uma solução{' '}
              <span className="text-slate-400 font-semibold">
                Laudos<span className="text-teal-400">.AI</span>
              </span>
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              Produto
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/recursos"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Recursos
                </Link>
              </li>
              <li>
                <Link
                  href="/integracoes"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Integrações
                </Link>
              </li>
              <li>
                <Link
                  href="/changelog"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Changelog
                </Link>
              </li>
              <li>
                <Link href="/roadmap" className="text-slate-400 hover:text-white transition-colors">
                  Roadmap
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              Desenvolvedores
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/docs" className="text-slate-400 hover:text-white transition-colors">
                  Documentação
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/api"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  API Reference
                </Link>
              </li>
              <li>
                <Link href="/status" className="text-slate-400 hover:text-white transition-colors">
                  Status
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/integrasaude"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              Empresa
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/sobre" className="text-slate-400 hover:text-white transition-colors">
                  Sobre
                </Link>
              </li>
              <li>
                <Link href="/contato" className="text-slate-400 hover:text-white transition-colors">
                  Contato
                </Link>
              </li>
              <li>
                <Link
                  href="/privacidade"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Privacidade
                </Link>
              </li>
              <li>
                <Link href="/termos" className="text-slate-400 hover:text-white transition-colors">
                  Termos
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-600">
            © {new Date().getFullYear()} IntegraSaúde. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://linkedin.com/company/integrasaude"
              className="text-slate-600 hover:text-slate-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
            <a
              href="https://github.com/integrasaude"
              className="text-slate-600 hover:text-slate-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
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
    <main className="min-h-screen bg-slate-950">
      {/* Custom styles */}
      <style jsx global>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -24;
          }
        }
        .animate-dash {
          animation: dash 1s linear infinite;
        }
        .animate-pulse-slow {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      <Navigation />
      <HeroSection />
      <StatsSection />
      <HowItWorksSection />
      <FeaturesSection />
      <IntegrationsSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </main>
  );
}
