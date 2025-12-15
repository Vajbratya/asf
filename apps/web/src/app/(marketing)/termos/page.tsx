import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termos de Servico | IntegraSaude',
  description: 'Termos de servico da IntegraSaude.',
};

export default function TermosPage() {
  return (
    <main className="min-h-screen bg-white pt-20">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-24">
        <h1 className="text-4xl font-semibold text-[#1A1A1A] mb-8">Termos de Servico</h1>
        <p className="text-[#1A1A1A]/60 mb-8">
          Ultima atualizacao: {new Date().toLocaleDateString('pt-BR')}
        </p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-4">1. Aceitacao dos Termos</h2>
            <p className="text-[#1A1A1A]/70 mb-4">
              Ao acessar ou usar a plataforma IntegraSaude, voce concorda em cumprir estes Termos de
              Servico. Se voce nao concordar com algum termo, nao utilize nossos servicos.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-4">2. Descricao do Servico</h2>
            <p className="text-[#1A1A1A]/70 mb-4">
              A IntegraSaude oferece uma plataforma de integracao de sistemas de saude que:
            </p>
            <ul className="list-disc pl-6 text-[#1A1A1A]/70 space-y-2">
              <li>Recebe e processa mensagens HL7 v2</li>
              <li>Converte dados para o padrao FHIR R4</li>
              <li>Fornece APIs para acesso aos dados</li>
              <li>Oferece webhooks para notificacoes em tempo real</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-4">3. Obrigacoes do Usuario</h2>
            <p className="text-[#1A1A1A]/70 mb-4">Ao usar nossos servicos, voce concorda em:</p>
            <ul className="list-disc pl-6 text-[#1A1A1A]/70 space-y-2">
              <li>Fornecer informacoes precisas e atualizadas</li>
              <li>Manter a confidencialidade de suas credenciais</li>
              <li>Nao usar o servico para fins ilegais</li>
              <li>Cumprir todas as leis aplicaveis, incluindo LGPD</li>
              <li>Nao tentar acessar sistemas ou dados nao autorizados</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-4">
              4. Niveis de Servico (SLA)
            </h2>
            <p className="text-[#1A1A1A]/70 mb-4">
              Nos comprometemos com os seguintes niveis de servico conforme seu plano:
            </p>
            <ul className="list-disc pl-6 text-[#1A1A1A]/70 space-y-2">
              <li>Starter: 99.5% de disponibilidade</li>
              <li>Professional: 99.9% de disponibilidade</li>
              <li>Enterprise: 99.99% de disponibilidade</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-4">5. Pagamentos e Cobranca</h2>
            <p className="text-[#1A1A1A]/70 mb-4">
              Os pagamentos sao processados mensalmente ou anualmente, conforme o plano escolhido.
              Aceitamos cartao de credito, boleto bancario e PIX. Em caso de atraso, o servico pode
              ser suspenso apos 15 dias.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-4">
              6. Limitacao de Responsabilidade
            </h2>
            <p className="text-[#1A1A1A]/70 mb-4">
              A IntegraSaude nao sera responsavel por danos indiretos, incidentais ou
              consequenciais. Nossa responsabilidade total esta limitada ao valor pago pelo servico
              nos ultimos 12 meses.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-4">7. Rescisao</h2>
            <p className="text-[#1A1A1A]/70 mb-4">
              Voce pode cancelar sua assinatura a qualquer momento. Nos reservamos o direito de
              encerrar contas que violem estes termos. Apos o cancelamento, seus dados serao
              mantidos por 30 dias antes da exclusao definitiva.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-4">8. Contato</h2>
            <p className="text-[#1A1A1A]/70">
              Para duvidas sobre estes termos, entre em contato:{' '}
              <a
                href="mailto:juridico@integrasaude.com.br"
                className="text-[#FF8C00] hover:underline"
              >
                juridico@integrasaude.com.br
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
