'use client';

import { useState } from 'react';
import Link from 'next/link';

// ============================================================================
// NAVIGATION - Clean, professional
// ============================================================================
function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#FF6B00] to-[#FF9500] flex items-center justify-center">
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
              <span className="font-bold text-lg text-gray-900">INTEGRA</span>
            </div>
            <span className="text-xs text-gray-400 hidden sm:block">by Laudos.AI</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#problema" className="text-sm text-gray-500 hover:text-gray-900">
              Problema
            </a>
            <a href="#solucao" className="text-sm text-gray-500 hover:text-gray-900">
              Solução
            </a>
            <a href="#resultados" className="text-sm text-gray-500 hover:text-gray-900">
              Resultados
            </a>
            <a href="#precos" className="text-sm text-gray-500 hover:text-gray-900">
              Preços
            </a>
            <Link href="/docs" className="text-sm text-gray-500 hover:text-gray-900">
              Documentação
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-[#FF6B00] hidden sm:block"
            >
              Entrar
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-gradient-to-r from-[#FF6B00] to-[#FF9500] hover:from-[#E55E00] hover:to-[#E58500] text-white text-sm font-medium rounded-lg transition-all"
            >
              Agendar Demo
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

// ============================================================================
// HERO - Direct, for decision makers
// ============================================================================
function HeroSection() {
  return (
    <section className="pt-28 pb-20 bg-white">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-gradient-to-r from-[#FF6B00]/10 to-[#FF9500]/10 text-[#FF6B00] text-sm">
          <span className="w-2 h-2 rounded-full bg-gradient-to-r from-[#FF6B00] to-[#FF9500]"></span>
          Operacional • 280+ testes passando • 99.9% uptime
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
          Reduza o tempo de integração
          <br />
          <span className="bg-gradient-to-r from-[#FF6B00] to-[#FF9500] bg-clip-text text-transparent">
            de meses para dias
          </span>
        </h1>

        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          Plataforma de integração que conecta seu laboratório ou clínica aos sistemas hospitalares
          brasileiros. Tasy, MV Soul, Pixeon — uma API única.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-4 bg-[#FF6B00] hover:bg-[#E55E00] text-white font-semibold rounded-lg transition-colors"
          >
            Agendar Demonstração
          </Link>
          <Link
            href="/docs"
            className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-lg border border-gray-200 transition-colors"
          >
            Ver Documentação Técnica
          </Link>
        </div>

        <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#FF6B00]" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            LGPD Compliant
          </span>
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#FF6B00]" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Trial 14 dias
          </span>
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#FF6B00]" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Suporte BR
          </span>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// LOGOS - Social proof
// ============================================================================
function LogosSection() {
  return (
    <section className="py-12 bg-gray-50 border-y border-gray-100">
      <div className="max-w-5xl mx-auto px-6">
        <p className="text-center text-sm text-gray-500 mb-8">
          Integração nativa com os principais sistemas hospitalares do Brasil
        </p>
        <div className="flex flex-wrap items-center justify-center gap-12 opacity-60">
          <div className="text-2xl font-bold text-gray-400">Philips Tasy</div>
          <div className="text-2xl font-bold text-gray-400">MV Soul</div>
          <div className="text-2xl font-bold text-gray-400">Pixeon</div>
          <div className="text-2xl font-bold text-gray-400">RNDS</div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// PROBLEM - What managers face
// ============================================================================
function ProblemSection() {
  return (
    <section id="problema" className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Você conhece esse cenário</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Cada novo contrato com hospital significa um novo projeto de integração. Tempo, dinheiro
            e risco operacional.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-xl bg-gray-50">
            <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">3-6 meses por integração</h3>
            <p className="text-gray-600">
              Cada hospital usa um sistema diferente. Tasy tem Z-segments próprios. MV usa XML.
              Pixeon tem outro protocolo. Tempo perdido.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-gray-50">
            <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">R$ 80k+ por projeto</h3>
            <p className="text-gray-600">
              Desenvolvedor HL7 especializado: R$ 15-25k/mês. 4 meses de projeto. Sem contar
              manutenção.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-gray-50">
            <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Risco operacional</h3>
            <p className="text-gray-600">
              Desenvolvedores saem. Código sem documentação. Integração quebra. Contrato hospitalar
              em risco.
            </p>
          </div>
        </div>

        <div className="mt-16 p-8 rounded-2xl bg-gray-900 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-gray-400 text-sm mb-1">
                Custo médio de integração com 3 sistemas hospitalares
              </p>
              <p className="text-4xl font-bold">R$ 240.000+</p>
              <p className="text-gray-400 text-sm mt-1">
                3 HIS × 4 meses × R$ 20k/mês + manutenção
              </p>
            </div>
            <div className="h-16 w-px bg-gray-700 hidden md:block"></div>
            <div className="text-center md:text-right">
              <p className="text-gray-400 text-sm mb-1">Tempo até primeira integração funcional</p>
              <p className="text-4xl font-bold">4-6 meses</p>
              <p className="text-gray-400 text-sm mt-1">Por sistema hospitalar</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// SOLUTION - What we offer
// ============================================================================
function SolutionSection() {
  return (
    <section id="solucao" className="py-24 bg-gray-50">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Uma plataforma. Todos os HIS.</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Desenvolvemos os conectores uma vez. Você só usa.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="p-8 rounded-2xl bg-white border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Para sua equipe técnica</h3>
            <ul className="space-y-4">
              {[
                'Parser HL7 v2 completo (ADT, ORM, ORU, SIU, MDM)',
                'Transformação automática HL7 → FHIR R4',
                'Validação CPF/CNS com algoritmo módulo 11',
                'Conectores Tasy (Z-segments), MV (XML), Pixeon',
                'Servidor MLLP pronto para produção',
                'SDK TypeScript com tipos completos',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-600">
                  <svg
                    className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0"
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
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-8 rounded-2xl bg-white border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Para a gestão</h3>
            <ul className="space-y-4">
              {[
                'Redução de 80% no tempo de integração',
                'Custo previsível: mensalidade fixa',
                'SLA 99.9% com suporte prioritário',
                'Documentação completa em português',
                'Conformidade LGPD incluída',
                'Sem lock-in: exporte seus dados a qualquer momento',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-600">
                  <svg
                    className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0"
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
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="p-8 rounded-2xl bg-white border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Exemplo real: Parse de ADT em 3 linhas
          </h3>
          <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm">
            <code>{`import { HL7Parser, ADTParser } from '@integra/hl7-parser';

const adt = ADTParser.parse(HL7Parser.parse(mensagemHL7));
console.log(adt.patient.cpf, adt.patient.cns, adt.visit.location);`}</code>
          </pre>
          <p className="text-sm text-gray-500 mt-4">
            Documentação completa com 24 páginas de exemplos copy-paste em{' '}
            <Link href="/docs" className="text-[#FF6B00] underline">
              integra.laudos.ai/docs
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// RESULTS - Metrics that matter to managers
// ============================================================================
function ResultsSection() {
  return (
    <section id="resultados" className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Resultados mensuráveis</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            O que você pode apresentar na próxima reunião de diretoria.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-16">
          {[
            { metric: '80%', label: 'Redução no tempo de integração' },
            { metric: '92%', label: 'Economia vs desenvolvimento interno' },
            { metric: '99.9%', label: 'Uptime garantido em contrato' },
            { metric: '< 24h', label: 'Tempo de resposta do suporte' },
          ].map((item, i) => (
            <div key={i} className="p-6 text-center rounded-xl bg-gray-50">
              <p className="text-4xl font-bold text-gray-900 mb-2">{item.metric}</p>
              <p className="text-sm text-gray-600">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="p-8 rounded-2xl bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Comparativo de custos (3 anos)
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Desenvolvimento interno</span>
                  <span className="font-semibold text-gray-900">R$ 480.000</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full">
                  <div className="h-3 bg-gray-400 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">INTEGRA Professional</span>
                  <span className="font-semibold text-gray-900">R$ 53.892</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full">
                  <div className="h-3 bg-[#FF6B00] rounded-full" style={{ width: '11%' }}></div>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              * Desenvolvimento: 3 HIS × 4 meses × R$ 20k + 2 anos manutenção
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">O que está incluso</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                '280+ testes automatizados',
                'Atualizações contínuas',
                'Suporte em português',
                'Documentação completa',
                'Conectores Tasy/MV/Pixeon',
                'Transformação FHIR R4',
                'Validação CPF/CNS/TUSS',
                'Webhooks em tempo real',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// PRICING - Clear, enterprise-focused
// ============================================================================
function PricingSection() {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="precos" className="py-24 bg-gray-50">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Preços transparentes</h2>
          <p className="text-lg text-gray-600">Sem surpresas. Sem custos ocultos.</p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center p-1 rounded-lg bg-gray-200">
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
              Anual (2 meses grátis)
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {[
            {
              name: 'Starter',
              desc: 'Para laboratórios menores',
              price: annual ? 'R$ 497' : 'R$ 597',
              features: [
                '10.000 mensagens/mês',
                '2 conectores',
                'Suporte por email',
                'Documentação completa',
              ],
              cta: 'Iniciar Trial',
              highlight: false,
            },
            {
              name: 'Professional',
              desc: 'Para operações em crescimento',
              price: annual ? 'R$ 1.497' : 'R$ 1.797',
              features: [
                '100.000 mensagens/mês',
                '5 conectores',
                'Suporte prioritário',
                'Webhooks ilimitados',
                'SLA 99.9%',
                'Onboarding dedicado',
              ],
              cta: 'Agendar Demo',
              highlight: true,
            },
            {
              name: 'Enterprise',
              desc: 'Para grandes operações',
              price: 'Sob consulta',
              features: [
                'Mensagens ilimitadas',
                'Conectores ilimitados',
                'Suporte 24/7',
                'SLA 99.99%',
                'Deploy on-premise',
                'Contrato customizado',
              ],
              cta: 'Falar com Vendas',
              highlight: false,
            },
          ].map((plan, i) => (
            <div
              key={i}
              className={`p-8 rounded-2xl ${
                plan.highlight
                  ? 'bg-gray-900 text-white ring-2 ring-gray-900'
                  : 'bg-white border border-gray-200'
              }`}
            >
              <h3
                className={`text-xl font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}
              >
                {plan.name}
              </h3>
              <p className={`text-sm mb-4 ${plan.highlight ? 'text-gray-400' : 'text-gray-500'}`}>
                {plan.desc}
              </p>
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
                    className={`flex items-center gap-2 text-sm ${plan.highlight ? 'text-gray-300' : 'text-gray-600'}`}
                  >
                    <svg
                      className={`w-4 h-4 ${plan.highlight ? 'text-white' : 'text-gray-400'}`}
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
                className={`block w-full py-3 text-center font-semibold rounded-lg transition-colors ${
                  plan.highlight
                    ? 'bg-white text-gray-900 hover:bg-gray-100'
                    : 'bg-[#FF6B00] text-white hover:bg-[#E55E00]'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          Todos os planos incluem trial de 14 dias. Sem cartão de crédito necessário.
        </p>
      </div>
    </section>
  );
}

// ============================================================================
// FAQ - Common objections
// ============================================================================
function FAQSection() {
  const faqs = [
    {
      q: 'Quanto tempo leva para começar a usar?',
      a: 'A maioria dos clientes está integrada em menos de 1 semana. Fornecemos documentação completa, exemplos de código e suporte direto durante o onboarding.',
    },
    {
      q: 'Vocês são compatíveis com LGPD?',
      a: 'Sim. Todos os dados são criptografados em trânsito (TLS 1.3) e em repouso (AES-256). Oferecemos logs de auditoria, controle de acesso granular e ferramentas de anonimização.',
    },
    {
      q: 'O que acontece se eu cancelar?',
      a: 'Você pode exportar todos os seus dados a qualquer momento. Não há lock-in. Mantemos seus dados por 30 dias após o cancelamento para facilitar a migração.',
    },
    {
      q: 'Vocês suportam hospitais que não usam Tasy/MV/Pixeon?',
      a: 'Sim. Nosso conector HL7 genérico funciona com qualquer sistema que use o protocolo HL7 v2 sobre MLLP. Cobrimos mais de 90% do mercado brasileiro.',
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Perguntas frequentes</h2>
        <div className="space-y-6">
          {faqs.map((faq, i) => (
            <div key={i} className="p-6 rounded-xl bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.q}</h3>
              <p className="text-gray-600">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// CTA - Final push
// ============================================================================
function CTASection() {
  return (
    <section className="py-24 bg-gradient-to-br from-[#FF6B00] to-[#FF9500]">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
          Pronto para eliminar a dor de cabeça?
        </h2>
        <p className="text-lg text-white/80 mb-10">
          Agende uma demonstração de 30 minutos. Mostramos como funciona com seus sistemas.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-100 text-[#FF6B00] font-semibold rounded-lg transition-colors"
          >
            Agendar Demonstração
          </Link>
          <Link
            href="/docs"
            className="w-full sm:w-auto px-8 py-4 bg-transparent hover:bg-white/10 text-white font-semibold rounded-lg border border-white/30 transition-colors"
          >
            Ver Documentação
          </Link>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// FOOTER
// ============================================================================
function Footer() {
  return (
    <footer className="py-12 bg-white border-t border-gray-100">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-col gap-8">
          {/* Main footer content */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#FF6B00] flex items-center justify-center">
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
              <span className="font-bold text-gray-900">INTEGRA</span>
              <span className="text-xs text-gray-400">by Laudos.AI</span>
            </Link>

            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/docs" className="hover:text-[#FF6B00]">
                Documentação
              </Link>
              <Link href="/privacidade" className="hover:text-[#FF6B00]">
                Privacidade
              </Link>
              <Link href="/termos" className="hover:text-[#FF6B00]">
                Termos
              </Link>
              <Link href="/contato" className="hover:text-[#FF6B00]">
                Contato
              </Link>
            </div>
          </div>

          {/* Grupo Laudos.AI section */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <span>Produtos do Grupo Laudos.AI:</span>
              <a href="https://laudos.ai" className="hover:text-[#FF6B00] font-medium">
                Editor
              </a>
              <a href="https://crit.laudos.ai" className="hover:text-[#FF6B00] font-medium">
                CRIT
              </a>
              <span className="text-[#FF6B00] font-medium">INTEGRA</span>
            </div>
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} INTEGRA por Grupo Laudos.AI
            </p>
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
      <LogosSection />
      <ProblemSection />
      <SolutionSection />
      <ResultsSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </main>
  );
}
