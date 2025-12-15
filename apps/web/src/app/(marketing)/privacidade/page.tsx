import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politica de Privacidade | IntegraSaude',
  description: 'Politica de privacidade da IntegraSaude - como tratamos seus dados.',
};

export default function PrivacidadePage() {
  return (
    <main className="min-h-screen bg-white pt-20">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-24">
        <h1 className="text-4xl font-semibold text-[#1A1A1A] mb-8">Politica de Privacidade</h1>
        <p className="text-[#1A1A1A]/60 mb-8">
          Ultima atualizacao: {new Date().toLocaleDateString('pt-BR')}
        </p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-4">1. Introducao</h2>
            <p className="text-[#1A1A1A]/70 mb-4">
              A IntegraSaude (&quot;nos&quot;, &quot;nosso&quot; ou &quot;Empresa&quot;) esta
              comprometida em proteger a privacidade dos dados de nossos usuarios. Esta Politica de
              Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informacoes
              pessoais.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-4">2. Dados que Coletamos</h2>
            <p className="text-[#1A1A1A]/70 mb-4">Coletamos os seguintes tipos de dados:</p>
            <ul className="list-disc pl-6 text-[#1A1A1A]/70 space-y-2">
              <li>Informacoes de cadastro (nome, email, telefone)</li>
              <li>Dados da organizacao (nome do hospital, CNPJ)</li>
              <li>Dados de uso da plataforma (logs, metricas)</li>
              <li>Dados de integracao (mensagens HL7/FHIR processadas)</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-4">
              3. Como Usamos seus Dados
            </h2>
            <p className="text-[#1A1A1A]/70 mb-4">Utilizamos seus dados para:</p>
            <ul className="list-disc pl-6 text-[#1A1A1A]/70 space-y-2">
              <li>Fornecer e melhorar nossos servicos</li>
              <li>Processar integracoes de sistemas de saude</li>
              <li>Enviar comunicacoes relevantes sobre o servico</li>
              <li>Cumprir obrigacoes legais e regulatorias</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-4">4. Seguranca dos Dados</h2>
            <p className="text-[#1A1A1A]/70 mb-4">
              Implementamos medidas de seguranca tecnicas e organizacionais para proteger seus
              dados, incluindo:
            </p>
            <ul className="list-disc pl-6 text-[#1A1A1A]/70 space-y-2">
              <li>Criptografia em transito (TLS 1.3) e em repouso (AES-256)</li>
              <li>Controle de acesso baseado em funcoes (RBAC)</li>
              <li>Logs de auditoria completos</li>
              <li>Backups regulares e redundancia de dados</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-4">5. Conformidade LGPD</h2>
            <p className="text-[#1A1A1A]/70 mb-4">
              Estamos em conformidade com a Lei Geral de Protecao de Dados (LGPD). Voce tem direito
              a:
            </p>
            <ul className="list-disc pl-6 text-[#1A1A1A]/70 space-y-2">
              <li>Acessar seus dados pessoais</li>
              <li>Solicitar correcao de dados incorretos</li>
              <li>Solicitar exclusao de dados</li>
              <li>Revogar consentimento</li>
              <li>Solicitar portabilidade dos dados</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-4">6. Contato</h2>
            <p className="text-[#1A1A1A]/70">
              Para exercer seus direitos ou esclarecer duvidas sobre esta politica, entre em contato
              com nosso Encarregado de Protecao de Dados (DPO) atraves do email:{' '}
              <a
                href="mailto:privacidade@integrasaude.com.br"
                className="text-[#FF8C00] hover:underline"
              >
                privacidade@integrasaude.com.br
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
