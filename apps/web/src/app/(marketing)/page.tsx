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
            <a href="#problema" className="text-sm text-gray-600 hover:text-gray-900">
              O Problema
            </a>
            <a href="#como-funciona" className="text-sm text-gray-600 hover:text-gray-900">
              Como Funciona
            </a>
            <a href="#roi" className="text-sm text-gray-600 hover:text-gray-900">
              ROI
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
        <p className="text-sm font-medium text-[#F47A36] mb-4">
          Para laboratórios e clínicas que precisam integrar com hospitais
        </p>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
          Pare de gastar 6 meses
          <br />
          <span className="text-[#F47A36]">em cada integração</span>
        </h1>

        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
          Uma API que já fala com Tasy, MV Soul e Pixeon. Parsers HL7 prontos, transformação FHIR
          automática, validação CPF/CNS incluída.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-4 bg-[#F47A36] hover:bg-[#e06a28] text-white font-semibold rounded-xl transition-colors"
          >
            Começar em 5 minutos
          </Link>
          <Link
            href="/docs"
            className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-[#F0F0F1] text-gray-900 font-semibold rounded-xl border border-[#D9C3B8] transition-colors"
          >
            Ver Documentação
          </Link>
        </div>

        <p className="text-sm text-gray-500">Conformidade LGPD • Trial 14 dias • Sem cartão</p>
      </div>
    </section>
  );
}

// ============================================================================
// PROBLEM SECTION - Why this exists
// ============================================================================
function ProblemSection() {
  return (
    <section id="problema" className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
          O problema que você conhece bem
        </h2>
        <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          Cada hospital usa um sistema diferente. Cada integração é um projeto de meses.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Without IntegraSaúde */}
          <div className="p-6 bg-[#FCF9F6] rounded-xl border border-[#F0F0F1]">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-red-500 text-xl">✗</span>
              <h3 className="text-lg font-semibold text-gray-900">Sem IntegraSaúde</h3>
            </div>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>
                  <strong>3-6 meses</strong> para cada HIS (Tasy, MV, Pixeon)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>Contratar desenvolvedor HL7 (R$ 15-25k/mês)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>Aprender Z-segments Tasy, formato MV XML, etc</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>Implementar validação CPF/CNS, códigos TUSS</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>Transformar para FHIR R4 com BR-Core</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>Manter N integrações diferentes</span>
              </li>
            </ul>
            <div className="mt-6 pt-4 border-t border-[#D9C3B8]">
              <p className="text-sm text-gray-500">Custo típico: 3 HIS × 4 meses × R$ 20k</p>
              <p className="text-2xl font-bold text-gray-900">R$ 240.000+</p>
            </div>
          </div>

          {/* With IntegraSaúde */}
          <div className="p-6 bg-white rounded-xl border-2 border-[#F47A36]">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[#F47A36] text-xl">✓</span>
              <h3 className="text-lg font-semibold text-gray-900">Com IntegraSaúde</h3>
            </div>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-[#F47A36] mt-1">•</span>
                <span>
                  <strong>1 API</strong> para todos os HIS
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#F47A36] mt-1">•</span>
                <span>Parsers ADT, ORM, ORU, SIU, MDM prontos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#F47A36] mt-1">•</span>
                <span>Z-segments Tasy, XML MV Soul incluídos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#F47A36] mt-1">•</span>
                <span>Validação CPF/CNS, TUSS automática</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#F47A36] mt-1">•</span>
                <span>HL7 v2 → FHIR R4 em 1 linha de código</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#F47A36] mt-1">•</span>
                <span>Nós mantemos, você só usa</span>
              </li>
            </ul>
            <div className="mt-6 pt-4 border-t border-[#F0F0F1]">
              <p className="text-sm text-gray-500">Plano Professional anual</p>
              <p className="text-2xl font-bold text-[#F47A36]">R$ 17.964/ano</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// HOW IT WORKS - With actual code
// ============================================================================
function HowItWorksSection() {
  return (
    <section id="como-funciona" className="py-20 bg-[#FCF9F6]">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Como funciona</h2>
        <p className="text-gray-600 text-center mb-12">
          Código real. Sem simplificações de marketing.
        </p>

        <div className="space-y-8">
          {/* Step 1 - Parse HL7 */}
          <div className="bg-white rounded-xl border border-[#F0F0F1] overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#F0F0F1] bg-[#FCF9F6]">
              <span className="w-6 h-6 rounded-full bg-[#F47A36] text-white text-sm font-bold flex items-center justify-center">
                1
              </span>
              <span className="font-medium text-gray-900">Parse mensagem HL7</span>
            </div>
            <pre className="p-4 text-sm overflow-x-auto text-gray-800">
              <code>{`import { HL7Parser, ADTParser } from '@integrasaude/hl7-parser';

// Parse qualquer mensagem HL7 v2
const message = HL7Parser.parse(hl7String);
const adt = ADTParser.parse(message);

// Dados já estruturados
console.log(adt.patient.cpf);      // "123.456.789-09"
console.log(adt.patient.cns);      // "123 4567 8901 2345"
console.log(adt.visit.location);   // "CTI-101"`}</code>
            </pre>
          </div>

          {/* Step 2 - Transform to FHIR */}
          <div className="bg-white rounded-xl border border-[#F0F0F1] overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#F0F0F1] bg-[#FCF9F6]">
              <span className="w-6 h-6 rounded-full bg-[#F47A36] text-white text-sm font-bold flex items-center justify-center">
                2
              </span>
              <span className="font-medium text-gray-900">Transforme para FHIR R4</span>
            </div>
            <pre className="p-4 text-sm overflow-x-auto text-gray-800">
              <code>{`import { FHIRTransformer } from '@integrasaude/hl7-parser';

// 1 linha: HL7 → FHIR Bundle com BR-Core
const fhirBundle = FHIRTransformer.transformADT(adt);

// Bundle contém: Patient, Encounter, Coverage
// Já com namespaces RNDS e perfis BR-Core`}</code>
            </pre>
          </div>

          {/* Step 3 - Connect to HIS */}
          <div className="bg-white rounded-xl border border-[#F0F0F1] overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#F0F0F1] bg-[#FCF9F6]">
              <span className="w-6 h-6 rounded-full bg-[#F47A36] text-white text-sm font-bold flex items-center justify-center">
                3
              </span>
              <span className="font-medium text-gray-900">Conecte ao HIS</span>
            </div>
            <pre className="p-4 text-sm overflow-x-auto text-gray-800">
              <code>{`// Conector Tasy com Z-segments brasileiros
const tasy = new TasyConnector({
  host: '192.168.1.100',
  port: 2575,
  enableZSegments: true  // ZPD, ZPV, ZIN, ZOR
});

// Ou MV Soul com integração XML
const mv = new MVSoulConnector({
  host: 'mv.hospital.com.br',
  xmlEndpoint: '/integracao'
});`}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// ROI SECTION - Clear value proposition
// ============================================================================
function ROISection() {
  return (
    <section id="roi" className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Por que o ROI é real</h2>
        <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          Não é mágica. É trabalho que já fizemos para você não precisar fazer.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 bg-[#FCF9F6] rounded-xl border border-[#F0F0F1]">
            <p className="text-4xl font-bold text-[#F47A36] mb-2">280+</p>
            <p className="text-gray-600">Testes automatizados cobrindo edge cases</p>
          </div>
          <div className="p-6 bg-[#FCF9F6] rounded-xl border border-[#F0F0F1]">
            <p className="text-4xl font-bold text-[#F47A36] mb-2">5</p>
            <p className="text-gray-600">Tipos de mensagem (ADT, ORM, ORU, SIU, MDM)</p>
          </div>
          <div className="p-6 bg-[#FCF9F6] rounded-xl border border-[#F0F0F1]">
            <p className="text-4xl font-bold text-[#F47A36] mb-2">4</p>
            <p className="text-gray-600">Z-segments Tasy (ZPD, ZPV, ZIN, ZOR)</p>
          </div>
        </div>

        <div className="bg-[#FCF9F6] rounded-xl p-6 border border-[#F0F0F1]">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            O que você NÃO precisa fazer:
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              'Implementar parser HL7 v2 do zero',
              'Escrever validação CPF (módulo 11)',
              'Escrever validação CNS (definitivo/provisório)',
              'Mapear códigos TUSS para FHIR',
              'Implementar protocolo MLLP (TCP com framing)',
              'Estudar Z-segments do Tasy',
              'Estudar formato XML do MV Soul',
              'Implementar transformação FHIR R4',
              'Criar perfis BR-Core manualmente',
              'Testar com cada versão de HIS',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-gray-600">
                <span className="text-[#F47A36]">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// FEATURES - What's actually included
// ============================================================================
function FeaturesSection() {
  const features = [
    {
      title: 'Parser HL7 v2 Completo',
      items: [
        'ADT (Admissão/Alta/Transferência)',
        'ORM (Pedidos)',
        'ORU (Resultados)',
        'SIU (Agendamento)',
        'MDM (Documentos)',
      ],
    },
    {
      title: 'Transformação FHIR',
      items: [
        'FHIR R4 nativo',
        'Perfis BR-Core',
        'Namespaces RNDS',
        'Transaction Bundles',
        'Patient, Encounter, DiagnosticReport',
      ],
    },
    {
      title: 'Validação Brasileira',
      items: [
        'CPF (módulo 11)',
        'CNS definitivo e provisório',
        'Códigos TUSS',
        'Códigos IBGE',
        'Formatação automática',
      ],
    },
    {
      title: 'Conectores HIS',
      items: [
        'Philips Tasy (Z-segments)',
        'MV Soul (XML)',
        'Pixeon',
        'MLLP genérico',
        'REST/Webhook',
      ],
    },
  ];

  return (
    <section className="py-20 bg-[#FCF9F6]">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">O que está incluso</h2>
        <p className="text-gray-600 text-center mb-12">
          Tudo testado. Tudo documentado. Pronto para produção.
        </p>

        <div className="grid sm:grid-cols-2 gap-6">
          {features.map((feature, i) => (
            <div key={i} className="p-6 bg-white rounded-xl border border-[#F0F0F1]">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{feature.title}</h3>
              <ul className="space-y-2">
                {feature.items.map((item, j) => (
                  <li key={j} className="flex items-center gap-2 text-gray-600 text-sm">
                    <span className="text-[#F47A36]">•</span>
                    {item}
                  </li>
                ))}
              </ul>
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
      <ProblemSection />
      <HowItWorksSection />
      <ROISection />
      <FeaturesSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </main>
  );
}
