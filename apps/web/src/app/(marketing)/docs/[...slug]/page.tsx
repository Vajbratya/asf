'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';

// All documentation content organized by route
const docsContent: Record<
  string,
  { title: string; description: string; content: React.ReactNode }
> = {
  // ============================================
  // PRIMEIROS PASSOS
  // ============================================
  introducao: {
    title: 'Introducao',
    description:
      'Bem-vindo ao IntegraSaude - a plataforma de integracao para sistemas de saude brasileiros',
    content: (
      <div className="prose prose-lg max-w-none">
        <h2>O que e o IntegraSaude?</h2>
        <p>
          IntegraSaude e uma plataforma completa para integracao de sistemas hospitalares
          brasileiros. Conectamos seu LIS, HIS, RIS ou qualquer sistema de saude usando os padroes
          HL7 v2.x e FHIR R4.
        </p>

        <h3>Por que usar IntegraSaude?</h3>
        <ul>
          <li>
            <strong>Conectores prontos:</strong> Tasy, MV Soul, Pixeon, e HL7 generico
          </li>
          <li>
            <strong>Validacao brasileira:</strong> CPF, CNS com validacao real (Modulo 11)
          </li>
          <li>
            <strong>FHIR BR-Core:</strong> Transformacao automatica para recursos FHIR com perfis
            brasileiros
          </li>
          <li>
            <strong>MLLP Server:</strong> Servidor TCP pronto para receber mensagens HL7
          </li>
        </ul>

        <h3>Instalacao</h3>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          {`npm install @integrabrasil/hl7-parser`}
        </pre>

        <h3>Exemplo Rapido</h3>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          {`import { HL7Parser } from '@integrabrasil/hl7-parser';

const hl7 = \`MSH|^~\\\\&|LIS|LAB|HIS|HOSP|20231215||ADT^A01|123|P|2.5
PID|1||12345||SILVA^JOAO||19800115|M\`;

const msg = HL7Parser.parse(hl7);
console.log(msg.messageType); // "ADT^A01"
console.log(msg.messageControlId); // "123"`}
        </pre>

        <div className="mt-8 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="font-medium text-orange-800">Proximo passo:</p>
          <Link href="/docs/criando-conta" className="text-orange-600 hover:underline">
            Criar sua conta no IntegraSaude →
          </Link>
        </div>
      </div>
    ),
  },

  'criando-conta': {
    title: 'Criando sua Conta',
    description: 'Configure sua organizacao no IntegraSaude em poucos minutos',
    content: (
      <div className="prose prose-lg max-w-none">
        <h2>Passo 1: Cadastro</h2>
        <ol>
          <li>
            Acesse{' '}
            <Link href="/signup" className="text-orange-600">
              integrasaude.com.br/signup
            </Link>
          </li>
          <li>Preencha os dados da sua organizacao (CNPJ, Razao Social)</li>
          <li>Confirme o email de verificacao</li>
        </ol>

        <h2>Passo 2: API Key</h2>
        <p>Apos o cadastro, voce recebera sua API Key:</p>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          {`// Guarde sua API Key com seguranca
const API_KEY = 'isk_live_xxxxxxxxxxxxxxxxxxxx';

// Use no header de todas as requisicoes
fetch('https://api.integrasaude.com.br/v1/messages', {
  headers: {
    'Authorization': \`Bearer \${API_KEY}\`,
    'Content-Type': 'application/json'
  }
});`}
        </pre>

        <h2>Passo 3: Ambiente de Teste</h2>
        <p>
          Use o ambiente sandbox para testes. A API Key de sandbox comeca com <code>isk_test_</code>
          .
        </p>

        <div className="mt-8 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="font-medium text-orange-800">Proximo passo:</p>
          <Link href="/docs/conectores" className="text-orange-600 hover:underline">
            Configurar seu primeiro conector →
          </Link>
        </div>
      </div>
    ),
  },

  conectores: {
    title: 'Configurando Conectores',
    description: 'Conecte-se aos sistemas hospitalares mais usados no Brasil',
    content: (
      <div className="prose prose-lg max-w-none">
        <h2>Conectores Disponiveis</h2>
        <div className="grid md:grid-cols-2 gap-4 not-prose">
          {[
            {
              name: 'Tasy (Philips)',
              href: '/docs/conectores/tasy',
              desc: 'Z-segments, foto de paciente',
            },
            {
              name: 'MV Soul',
              href: '/docs/conectores/mv-soul',
              desc: 'Integracao XML, resultados',
            },
            { name: 'Pixeon', href: '/docs/conectores/pixeon', desc: 'DICOM, laudos de imagem' },
            {
              name: 'HL7 Generico',
              href: '/docs/conectores/hl7-generico',
              desc: 'Qualquer sistema HL7 v2.x',
            },
          ].map((c) => (
            <Link
              key={c.name}
              href={c.href}
              className="block p-4 border rounded-lg hover:border-orange-500 transition"
            >
              <p className="font-medium text-gray-900">{c.name}</p>
              <p className="text-sm text-gray-600">{c.desc}</p>
            </Link>
          ))}
        </div>

        <h2 className="mt-8">Configuracao Basica</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          {`import { GenericHL7Connector } from '@integrasaude/api/connectors';

const connector = new GenericHL7Connector({
  type: 'generic-hl7',
  orgId: 'meu-hospital',
  name: 'Sistema HL7',
  enabled: true,
  config: {
    host: '192.168.1.100',
    port: 2575,
    timeout: 30000,
    keepAlive: true,
    encoding: 'utf8',
    mllp: {
      startByte: 0x0B,  // VT
      endByte1: 0x1C,   // FS
      endByte2: 0x0D    // CR
    },
    poolSize: 5
  }
});

await connector.connect();
console.log(connector.getStatus()); // "connected"`}
        </pre>
      </div>
    ),
  },

  'primeira-mensagem': {
    title: 'Enviando sua Primeira Mensagem',
    description: 'Envie e receba mensagens HL7 em menos de 5 minutos',
    content: (
      <div className="prose prose-lg max-w-none">
        <h2>Enviando ADT^A01 (Admissao)</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          {`import { HL7Parser, ADTParser, FHIRTransformer } from '@integrabrasil/hl7-parser';

// 1. Parse da mensagem HL7
const hl7 = \`MSH|^~\\\\&|LIS|LAB|HIS|HOSP|20231215||ADT^A01|123|P|2.5
PID|1||12345^^^HOSP^MR~98765432100^^^CPF||SILVA^JOAO||19800115|M
PV1|1|I|UTI^201^A\`;

const msg = HL7Parser.parse(hl7);
const adt = ADTParser.parse(msg);

// 2. Extrair dados
console.log(adt.patient.name.family);  // "SILVA"
console.log(adt.patient.cpf);          // "98765432100"
console.log(adt.visit.patientClass);   // "I" (Internado)

// 3. Converter para FHIR R4
const fhirBundle = FHIRTransformer.transformADT(adt);
console.log(JSON.stringify(fhirBundle, null, 2));`}
        </pre>

        <h2>Recebendo Mensagens (MLLP Server)</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          {`import { MLLPServer, HL7Parser } from '@integrabrasil/hl7-parser';

const server = new MLLPServer({ port: 2575, autoAck: true });

server.on('message', (message, connectionId, respond) => {
  console.log(\`Recebido \${message.messageType} de \${connectionId}\`);
  // ACK e enviado automaticamente
});

await server.start();
console.log('Servidor MLLP rodando na porta 2575');`}
        </pre>

        <h2>Gerando ACK/NAK</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          {`// Aceitar mensagem
const ack = HL7Parser.generateACK('MSG123', 'AA', 'Mensagem processada');

// Rejeitar mensagem
const nak = HL7Parser.generateNAK('MSG123', 'Paciente nao encontrado');`}
        </pre>
      </div>
    ),
  },

  // ============================================
  // CONECTORES
  // ============================================
  'conectores/tasy': {
    title: 'Conector Tasy (Philips)',
    description: 'Integracao completa com o sistema Tasy usando Z-segments',
    content: (
      <div className="prose prose-lg max-w-none">
        <h2>Configuracao do Tasy</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          {`import { TasyConnector } from '@integrasaude/api/connectors';

const tasy = new TasyConnector({
  type: 'tasy',
  orgId: 'meu-hospital',
  name: 'Tasy Prod',
  enabled: true,
  config: {
    host: '192.168.1.100',
    port: 2575,
    timeout: 30000,
    keepAlive: true,
    encoding: 'utf8',
    mllp: { startByte: 0x0B, endByte1: 0x1C, endByte2: 0x0D },

    // Configuracoes especificas do Tasy
    enableZSegments: true,
    apiUrl: 'https://tasy.hospital.com/api',
    apiKey: 'sua-api-key',
    segments: {
      ZPD: true,  // Dados estendidos do paciente
      ZPV: true,  // Dados da visita
      ZIN: true,  // Informacoes do convenio
      ZOR: true   // Dados do pedido
    }
  }
});

await tasy.connect();`}
        </pre>

        <h2>Z-Segments Suportados</h2>
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="text-left">Segmento</th>
              <th className="text-left">Descricao</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>ZPD</code>
              </td>
              <td>Dados estendidos do paciente (nome da mae, naturalidade)</td>
            </tr>
            <tr>
              <td>
                <code>ZPV</code>
              </td>
              <td>Dados da visita (numero do leito, medico responsavel)</td>
            </tr>
            <tr>
              <td>
                <code>ZIN</code>
              </td>
              <td>Informacoes do convenio (plano, carteirinha)</td>
            </tr>
            <tr>
              <td>
                <code>ZOR</code>
              </td>
              <td>Dados do pedido (prioridade, instrucoes)</td>
            </tr>
          </tbody>
        </table>

        <h2>Buscar Foto do Paciente</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          {`const photo = await tasy.getPatientPhoto('12345');
console.log(photo.mimeType);      // "image/jpeg"
console.log(photo.photoBase64);   // "data:image/jpeg;base64,..."`}
        </pre>

        <h2>Enviar ADT</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          {`await tasy.send({
  id: 'MSG001',
  type: 'ADT^A01',
  timestamp: new Date(),
  source: 'LIS',
  destination: 'HIS',
  payload: {
    patient: {
      cpf: '12345678901',
      motherName: 'Maria Silva'
    },
    visit: {
      visitNumber: 'V123',
      bedNumber: 'UTI-01'
    }
  }
});`}
        </pre>
      </div>
    ),
  },

  'conectores/mv-soul': {
    title: 'Conector MV Soul',
    description: 'Integracao com MV Soul via HL7 e XML',
    content: (
      <div className="prose prose-lg max-w-none">
        <h2>Configuracao do MV Soul</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          {`import { MVSoulConnector } from '@integrasaude/api/connectors';

const mv = new MVSoulConnector({
  type: 'mv-soul',
  orgId: 'meu-hospital',
  name: 'MV Prod',
  enabled: true,
  config: {
    host: '192.168.1.101',
    port: 2575,
    timeout: 30000,
    keepAlive: true,
    encoding: 'utf8',
    mllp: { startByte: 0x0B, endByte1: 0x1C, endByte2: 0x0D },

    // Integracao de resultados via XML
    enableResultsIntegration: true,
    xmlEndpoint: 'https://mv.hospital.com/integracao',
    xmlFormat: 'standard'
  }
});

await mv.connect();`}
        </pre>

        <h2>Enviar Resultados via XML</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          {`await mv.sendResults({
  visitId: 'ATD123456',
  patientId: 'PAC789',
  results: [{
    examCode: 'GLICEMIA',
    examName: 'Glicose em Jejum',
    resultDate: new Date().toISOString(),
    status: 'F',
    items: [{
      code: 'GLU',
      name: 'Glicose',
      value: '99',
      unit: 'mg/dL',
      referenceRange: '70-110',
      abnormalFlag: 'N'
    }]
  }]
});`}
        </pre>

        <h2>Formato XML Gerado</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          {`<?xml version="1.0" encoding="UTF-8"?>
<mv_integracao>
  <cd_atendimento>ATD123456</cd_atendimento>
  <cd_paciente>PAC789</cd_paciente>
  <exame>
    <cd_exame>GLICEMIA</cd_exame>
    <ds_exame>Glicose em Jejum</ds_exame>
    <resultado>
      <cd_item>GLU</cd_item>
      <vl_resultado>99</vl_resultado>
      <ds_unidade>mg/dL</ds_unidade>
    </resultado>
  </exame>
</mv_integracao>`}
        </pre>
      </div>
    ),
  },

  'conectores/pixeon': {
    title: 'Conector Pixeon',
    description: 'Integracao com Pixeon para DICOM e laudos de imagem',
    content: (
      <div className="prose prose-lg max-w-none">
        <h2>Configuracao do Pixeon</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          {`import { PixeonConnector } from '@integrasaude/api/connectors';

const pixeon = new PixeonConnector({
  type: 'pixeon',
  orgId: 'meu-hospital',
  name: 'Pixeon Prod',
  enabled: true,
  config: {
    host: '192.168.1.102',
    port: 2575,
    timeout: 30000,
    keepAlive: true,
    encoding: 'utf8',
    mllp: { startByte: 0x0B, endByte1: 0x1C, endByte2: 0x0D },

    // Configuracoes Pixeon
    enableDicom: true,
    pacsUrl: 'https://pacs.hospital.com',
    worklist: true
  }
});

await pixeon.connect();`}
        </pre>

        <h2>Mensagens Suportadas</h2>
        <ul>
          <li>
            <code>ORM^O01</code> - Pedido de exame de imagem
          </li>
          <li>
            <code>ORU^R01</code> - Laudo de imagem
          </li>
          <li>
            <code>ADT^A01/A04</code> - Admissao para worklist
          </li>
        </ul>
      </div>
    ),
  },

  'conectores/hl7-generico': {
    title: 'Conector HL7 Generico',
    description: 'Conecte qualquer sistema que suporte HL7 v2.x via MLLP',
    content: (
      <div className="prose prose-lg max-w-none">
        <h2>Quando Usar?</h2>
        <p>
          Use o conector generico quando seu sistema nao e Tasy, MV ou Pixeon, mas suporta o
          protocolo HL7 v2.x padrao.
        </p>

        <h2>Configuracao</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          {`import { GenericHL7Connector } from '@integrasaude/api/connectors';

const connector = new GenericHL7Connector({
  type: 'generic-hl7',
  orgId: 'meu-hospital',
  name: 'Sistema Legado',
  enabled: true,
  config: {
    host: '192.168.1.100',
    port: 2575,
    timeout: 30000,
    keepAlive: true,
    encoding: 'utf8',  // ou 'latin1' para sistemas antigos
    mllp: {
      startByte: 0x0B,
      endByte1: 0x1C,
      endByte2: 0x0D
    },
    poolSize: 5
  }
});

await connector.connect();

// Enviar mensagem
await connector.send({
  id: 'MSG001',
  type: 'ADT^A01',
  timestamp: new Date(),
  source: 'LIS',
  destination: 'HIS',
  payload: {
    segments: [
      'PID|||12345||DOE^JOHN||19800101|M'
    ]
  }
});

// Health check
const health = await connector.healthCheck();
console.log(health.healthy);  // true
console.log(health.metrics);  // { messagesSent: 1, ... }`}
        </pre>
      </div>
    ),
  },

  // ============================================
  // API REFERENCE
  // ============================================
  'api/autenticacao': {
    title: 'Autenticacao',
    description: 'Como autenticar suas requisicoes na API IntegraSaude',
    content: (
      <div className="prose prose-lg max-w-none">
        <h2>API Keys</h2>
        <p>Todas as requisicoes devem incluir sua API Key no header:</p>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          {`Authorization: Bearer isk_live_xxxxxxxxxxxxxxxxxxxx`}
        </pre>

        <h2>Ambientes</h2>
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="text-left">Ambiente</th>
              <th className="text-left">URL Base</th>
              <th className="text-left">Prefixo da Key</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Producao</td>
              <td>
                <code>https://api.integrasaude.com.br</code>
              </td>
              <td>
                <code>isk_live_</code>
              </td>
            </tr>
            <tr>
              <td>Sandbox</td>
              <td>
                <code>https://sandbox.integrasaude.com.br</code>
              </td>
              <td>
                <code>isk_test_</code>
              </td>
            </tr>
          </tbody>
        </table>

        <h2>Exemplo de Requisicao</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          {`curl -X POST https://api.integrasaude.com.br/v1/messages \\
  -H "Authorization: Bearer isk_live_xxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"type": "ADT^A01", "payload": {...}}'`}
        </pre>
      </div>
    ),
  },

  'api/mensagens': {
    title: 'API de Mensagens',
    description: 'Enviar e receber mensagens HL7 via REST API',
    content: (
      <div className="prose prose-lg max-w-none">
        <h2>POST /v1/messages</h2>
        <p>Envia uma mensagem HL7 para o sistema destino.</p>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          {`{
  "connectorId": "conn_tasy_001",
  "type": "ADT^A01",
  "payload": {
    "patient": {
      "id": "12345",
      "cpf": "98765432100",
      "name": { "family": "SILVA", "given": ["JOAO"] },
      "birthDate": "1980-01-15",
      "gender": "M"
    },
    "visit": {
      "class": "I",
      "location": "UTI^201^A"
    }
  }
}`}
        </pre>

        <h2>GET /v1/messages/:id</h2>
        <p>Recupera o status de uma mensagem enviada.</p>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          {`{
  "id": "msg_abc123",
  "status": "delivered",
  "ack": "AA",
  "sentAt": "2023-12-15T12:00:00Z",
  "deliveredAt": "2023-12-15T12:00:01Z"
}`}
        </pre>

        <h2>GET /v1/messages</h2>
        <p>Lista mensagens com paginacao.</p>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          {`GET /v1/messages?limit=50&offset=0&status=delivered`}
        </pre>
      </div>
    ),
  },

  'api/conectores': {
    title: 'API de Conectores',
    description: 'Gerenciar conectores via REST API',
    content: (
      <div className="prose prose-lg max-w-none">
        <h2>GET /v1/connectors</h2>
        <p>Lista todos os conectores da organizacao.</p>

        <h2>POST /v1/connectors</h2>
        <p>Cria um novo conector.</p>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          {`{
  "type": "tasy",
  "name": "Tasy Producao",
  "config": {
    "host": "192.168.1.100",
    "port": 2575,
    "timeout": 30000
  }
}`}
        </pre>

        <h2>GET /v1/connectors/:id/health</h2>
        <p>Verifica a saude do conector.</p>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          {`{
  "healthy": true,
  "status": "connected",
  "lastCheck": "2023-12-15T12:00:00Z",
  "metrics": {
    "messagesSent": 1234,
    "messagesReceived": 1234,
    "errors": 2,
    "avgLatency": 45
  }
}`}
        </pre>
      </div>
    ),
  },

  'api/webhooks': {
    title: 'Webhooks',
    description: 'Receba notificacoes em tempo real sobre eventos',
    content: (
      <div className="prose prose-lg max-w-none">
        <h2>Configurando Webhooks</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          {`POST /v1/webhooks
{
  "url": "https://seu-sistema.com/webhook",
  "events": ["message.received", "message.delivered", "connector.error"],
  "secret": "seu-secret-para-validacao"
}`}
        </pre>

        <h2>Payload do Webhook</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          {`{
  "event": "message.received",
  "timestamp": "2023-12-15T12:00:00Z",
  "data": {
    "messageId": "msg_abc123",
    "type": "ORU^R01",
    "connectorId": "conn_tasy_001",
    "payload": {...}
  }
}`}
        </pre>

        <h2>Validando a Assinatura</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          {`import crypto from 'crypto';

function validateWebhook(payload: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}`}
        </pre>
      </div>
    ),
  },

  // ============================================
  // HL7 PADROES
  // ============================================
  'hl7/overview': {
    title: 'HL7 v2 Overview',
    description: 'Introducao ao padrao HL7 v2.x',
    content: (
      <div className="prose prose-lg max-w-none">
        <h2>O que e HL7 v2?</h2>
        <p>
          HL7 (Health Level 7) v2.x e o padrao mais usado para troca de informacoes entre sistemas
          de saude. Usa mensagens de texto estruturadas com delimitadores.
        </p>

        <h2>Estrutura da Mensagem</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          {`MSH|^~\\&|LIS|LAB|HIS|HOSP|20231215120000||ADT^A01|MSG001|P|2.5
      |   |   |   |   |     |             |       |      | |
      |   |   |   |   |     |             |       |      | Versao
      |   |   |   |   |     |             |       |      Modo (P=Producao)
      |   |   |   |   |     |             |       Control ID
      |   |   |   |   |     |             Tipo da Mensagem
      |   |   |   |   |     Timestamp
      |   |   |   |   Receiving Facility
      |   |   |   Receiving Application
      |   |   Sending Facility
      |   Sending Application
      Delimitadores (^~\\&)`}
        </pre>

        <h2>Tipos de Mensagens Suportadas</h2>
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="text-left">Tipo</th>
              <th className="text-left">Descricao</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>ADT</code>
              </td>
              <td>Admission, Discharge, Transfer (eventos de paciente)</td>
            </tr>
            <tr>
              <td>
                <code>ORM</code>
              </td>
              <td>Order Message (pedidos de exame)</td>
            </tr>
            <tr>
              <td>
                <code>ORU</code>
              </td>
              <td>Observation Result (resultados)</td>
            </tr>
            <tr>
              <td>
                <code>ACK</code>
              </td>
              <td>Acknowledgment (confirmacao)</td>
            </tr>
          </tbody>
        </table>

        <h2>Parse com IntegraSaude</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          {`import { HL7Parser } from '@integrabrasil/hl7-parser';

const msg = HL7Parser.parse(hl7String);

console.log(msg.messageType);       // "ADT^A01"
console.log(msg.messageControlId);  // "MSG001"
console.log(msg.version);           // "2.5"
console.log(msg.getSegment('PID')); // Segmento PID`}
        </pre>
      </div>
    ),
  },

  'hl7/adt': {
    title: 'Mensagens ADT',
    description: 'Admission, Discharge, Transfer - eventos de paciente',
    content: (
      <div className="prose prose-lg max-w-none">
        <h2>Eventos ADT</h2>
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="text-left">Evento</th>
              <th className="text-left">Descricao</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>A01</code>
              </td>
              <td>Admissao de paciente</td>
            </tr>
            <tr>
              <td>
                <code>A02</code>
              </td>
              <td>Transferencia de paciente</td>
            </tr>
            <tr>
              <td>
                <code>A03</code>
              </td>
              <td>Alta de paciente</td>
            </tr>
            <tr>
              <td>
                <code>A04</code>
              </td>
              <td>Registro de paciente (ambulatorio)</td>
            </tr>
            <tr>
              <td>
                <code>A08</code>
              </td>
              <td>Atualizacao de dados do paciente</td>
            </tr>
            <tr>
              <td>
                <code>A11</code>
              </td>
              <td>Cancelamento de admissao</td>
            </tr>
          </tbody>
        </table>

        <h2>Exemplo ADT^A01</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          {`MSH|^~\\&|LIS|LAB|HIS|HOSP|20231215120000||ADT^A01|123|P|2.5
PID|1||12345^^^HOSP^MR~98765432100^^^CPF||SILVA^JOAO^PEDRO||19800115|M|||RUA A 123^^SAO PAULO^SP^01310100
PV1|1|I|UTI^201^A|||||||||||||||V12345`}
        </pre>

        <h2>Parse com ADTParser</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          {`import { HL7Parser, ADTParser } from '@integrabrasil/hl7-parser';

const msg = HL7Parser.parse(hl7);
const adt = ADTParser.parse(msg);

// Dados do paciente
console.log(adt.patient.name.family);   // "SILVA"
console.log(adt.patient.name.given);    // ["JOAO", "PEDRO"]
console.log(adt.patient.birthDate);     // "1980-01-15"
console.log(adt.patient.cpf);           // "98765432100"

// Dados da visita
console.log(adt.visit.patientClass);    // "I" (Internado)
console.log(adt.visit.location);        // "UTI^201^A"`}
        </pre>
      </div>
    ),
  },

  'hl7/orm': {
    title: 'Mensagens ORM',
    description: 'Order Message - pedidos de exame',
    content: (
      <div className="prose prose-lg max-w-none">
        <h2>Estrutura ORM^O01</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          {`MSH|^~\\&|HIS|HOSP|LIS|LAB|20231215||ORM^O01|789|P|2.5
PID|1||12345||SILVA^JOAO
ORC|NW|ORD001||||||20231215
OBR|1|ORD001||40301117^Glicemia|||20231215`}
        </pre>

        <h2>Controles de Pedido (ORC)</h2>
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="text-left">Codigo</th>
              <th className="text-left">Descricao</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>NW</code>
              </td>
              <td>Novo pedido</td>
            </tr>
            <tr>
              <td>
                <code>CA</code>
              </td>
              <td>Cancelar pedido</td>
            </tr>
            <tr>
              <td>
                <code>XO</code>
              </td>
              <td>Alterar pedido</td>
            </tr>
            <tr>
              <td>
                <code>SC</code>
              </td>
              <td>Mudanca de status</td>
            </tr>
          </tbody>
        </table>

        <h2>Parse com ORMParser</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          {`import { HL7Parser, ORMParser } from '@integrabrasil/hl7-parser';

const msg = HL7Parser.parse(orm);
const order = ORMParser.parse(msg);

console.log(order.orders[0].placerOrderNumber);  // "ORD001"
console.log(order.orders[0].procedureCode);      // "40301117"
console.log(order.orders[0].procedureName);      // "Glicemia"`}
        </pre>
      </div>
    ),
  },

  'hl7/oru': {
    title: 'Mensagens ORU',
    description: 'Observation Result - resultados de exames',
    content: (
      <div className="prose prose-lg max-w-none">
        <h2>Estrutura ORU^R01</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          {`MSH|^~\\&|LIS|LAB|HIS|HOSP|20231215||ORU^R01|456|P|2.5
PID|1||12345||SILVA^JOAO
OBR|1||ORD001|GLICEMIA^Glicose||20231215
OBX|1|NM|GLU^Glicose||99|mg/dL|70-110|N|||F`}
        </pre>

        <h2>Tipos de Valor (OBX-2)</h2>
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="text-left">Tipo</th>
              <th className="text-left">Descricao</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>NM</code>
              </td>
              <td>Numerico</td>
            </tr>
            <tr>
              <td>
                <code>TX</code>
              </td>
              <td>Texto</td>
            </tr>
            <tr>
              <td>
                <code>ST</code>
              </td>
              <td>String</td>
            </tr>
            <tr>
              <td>
                <code>CE</code>
              </td>
              <td>Codigo</td>
            </tr>
          </tbody>
        </table>

        <h2>Flags de Anormalidade (OBX-8)</h2>
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="text-left">Flag</th>
              <th className="text-left">Significado</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>N</code>
              </td>
              <td>Normal</td>
            </tr>
            <tr>
              <td>
                <code>H</code>
              </td>
              <td>Alto</td>
            </tr>
            <tr>
              <td>
                <code>L</code>
              </td>
              <td>Baixo</td>
            </tr>
            <tr>
              <td>
                <code>HH</code>
              </td>
              <td>Critico alto</td>
            </tr>
            <tr>
              <td>
                <code>LL</code>
              </td>
              <td>Critico baixo</td>
            </tr>
          </tbody>
        </table>

        <h2>Parse com ORUParser</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          {`import { HL7Parser, ORUParser } from '@integrabrasil/hl7-parser';

const msg = HL7Parser.parse(oru);
const result = ORUParser.parse(msg);

const obs = result.report.observations[0];
console.log(obs.value);           // 99
console.log(obs.units);           // "mg/dL"
console.log(obs.referenceRange);  // "70-110"
console.log(obs.abnormalFlags);   // ["N"]
console.log(obs.status);          // "F" (Final)`}
        </pre>
      </div>
    ),
  },

  // ============================================
  // FHIR R4
  // ============================================
  'fhir/overview': {
    title: 'FHIR R4 Overview',
    description: 'Transforme mensagens HL7 para FHIR R4',
    content: (
      <div className="prose prose-lg max-w-none">
        <h2>O que e FHIR?</h2>
        <p>
          FHIR (Fast Healthcare Interoperability Resources) e o padrao moderno para troca de dados
          de saude. Usa JSON/XML e REST APIs.
        </p>

        <h2>Por que FHIR?</h2>
        <ul>
          <li>
            <strong>RNDS:</strong> A Rede Nacional de Dados em Saude usa FHIR
          </li>
          <li>
            <strong>Moderno:</strong> APIs REST, JSON, facil de integrar
          </li>
          <li>
            <strong>Padronizado:</strong> Recursos bem definidos (Patient, Observation, etc)
          </li>
        </ul>

        <h2>Transformacao HL7 → FHIR</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          {`import { HL7Parser, ADTParser, FHIRTransformer } from '@integrabrasil/hl7-parser';

const hl7 = \`MSH|^~\\\\&|LIS|LAB|HIS|HOSP|20231215||ADT^A01|123|P|2.5
PID|1||12345^^^HOSP^MR~98765432100^^^CPF||SILVA^JOAO||19800115|M
PV1|1|I|UTI^201^A\`;

const msg = HL7Parser.parse(hl7);
const adt = ADTParser.parse(msg);
const bundle = FHIRTransformer.transformADT(adt);

console.log(bundle.resourceType);  // "Bundle"
console.log(bundle.type);          // "transaction"`}
        </pre>
      </div>
    ),
  },

  'fhir/patient': {
    title: 'Patient Resource',
    description: 'Recurso FHIR Patient com perfis BR-Core',
    content: (
      <div className="prose prose-lg max-w-none">
        <h2>Estrutura do Patient</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          {`{
  "resourceType": "Patient",
  "id": "12345",
  "meta": {
    "profile": ["http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient"]
  },
  "identifier": [
    {
      "system": "http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf",
      "value": "98765432100"
    },
    {
      "system": "http://rnds.saude.gov.br/fhir/r4/NamingSystem/cns",
      "value": "123456789012345"
    }
  ],
  "name": [{
    "family": "SILVA",
    "given": ["JOAO", "PEDRO"]
  }],
  "gender": "male",
  "birthDate": "1980-01-15"
}`}
        </pre>

        <h2>Mapeamento de Genero</h2>
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="text-left">HL7</th>
              <th className="text-left">FHIR</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>M</code>
              </td>
              <td>
                <code>male</code>
              </td>
            </tr>
            <tr>
              <td>
                <code>F</code>
              </td>
              <td>
                <code>female</code>
              </td>
            </tr>
            <tr>
              <td>
                <code>O</code>
              </td>
              <td>
                <code>other</code>
              </td>
            </tr>
            <tr>
              <td>
                <code>U</code>
              </td>
              <td>
                <code>unknown</code>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    ),
  },

  'fhir/encounter': {
    title: 'Encounter Resource',
    description: 'Recurso FHIR Encounter para visitas',
    content: (
      <div className="prose prose-lg max-w-none">
        <h2>Estrutura do Encounter</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          {`{
  "resourceType": "Encounter",
  "id": "V12345",
  "status": "in-progress",
  "class": {
    "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
    "code": "IMP",
    "display": "inpatient encounter"
  },
  "subject": {
    "reference": "Patient/12345"
  },
  "location": [{
    "location": {
      "display": "UTI 201 A"
    }
  }]
}`}
        </pre>

        <h2>Mapeamento de Classe</h2>
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="text-left">HL7</th>
              <th className="text-left">FHIR</th>
              <th className="text-left">Descricao</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>I</code>
              </td>
              <td>
                <code>IMP</code>
              </td>
              <td>Internado</td>
            </tr>
            <tr>
              <td>
                <code>O</code>
              </td>
              <td>
                <code>AMB</code>
              </td>
              <td>Ambulatorio</td>
            </tr>
            <tr>
              <td>
                <code>E</code>
              </td>
              <td>
                <code>EMER</code>
              </td>
              <td>Emergencia</td>
            </tr>
            <tr>
              <td>
                <code>P</code>
              </td>
              <td>
                <code>PRENC</code>
              </td>
              <td>Pre-admissao</td>
            </tr>
          </tbody>
        </table>
      </div>
    ),
  },

  'fhir/br-core': {
    title: 'BR-Core Profiles',
    description: 'Perfis FHIR especificos para o Brasil',
    content: (
      <div className="prose prose-lg max-w-none">
        <h2>O que sao BR-Core Profiles?</h2>
        <p>
          BR-Core e o conjunto de perfis FHIR adaptados para o contexto brasileiro, incluindo
          identificadores como CPF e CNS.
        </p>

        <h2>Identificadores Brasileiros</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          {`// CPF
{
  "system": "http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf",
  "value": "98765432100"
}

// CNS
{
  "system": "http://rnds.saude.gov.br/fhir/r4/NamingSystem/cns",
  "value": "123456789012345"
}`}
        </pre>

        <h2>Validacao com IntegraSaude</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          {`import { validateCPF, validateCNS, formatCPF, formatCNS } from '@integrabrasil/hl7-parser';

// Validar CPF (Modulo 11)
const cpf = validateCPF('123.456.789-09');
console.log(cpf.valid);  // true ou false
console.log(cpf.error);  // "Invalid CPF check digit" se invalido

// Validar CNS
const cns = validateCNS('123456789012345');
console.log(cns.valid);  // true ou false

// Formatar para exibicao
console.log(formatCPF('12345678909'));      // "123.456.789-09"
console.log(formatCNS('123456789012345'));  // "123 4567 8901 2345"`}
        </pre>
      </div>
    ),
  },

  // ============================================
  // SEGURANCA
  // ============================================
  'seguranca/lgpd': {
    title: 'LGPD',
    description: 'Conformidade com a Lei Geral de Protecao de Dados',
    content: (
      <div className="prose prose-lg max-w-none">
        <h2>Dados Sensiveis</h2>
        <p>
          Dados de saude sao considerados dados sensiveis pela LGPD e requerem protecao adicional.
        </p>

        <h2>Como o IntegraSaude Ajuda</h2>
        <ul>
          <li>
            <strong>Criptografia:</strong> Dados em transito (TLS 1.3) e em repouso (AES-256)
          </li>
          <li>
            <strong>Auditoria:</strong> Logs completos de todas as operacoes
          </li>
          <li>
            <strong>Anonimizacao:</strong> Ferramentas para anonimizar dados de teste
          </li>
          <li>
            <strong>Retencao:</strong> Politicas configuraveis de retencao de dados
          </li>
        </ul>

        <h2>Responsabilidades</h2>
        <p>
          O IntegraSaude e um operador de dados. Sua organizacao e a controladora e deve garantir as
          bases legais para tratamento dos dados.
        </p>
      </div>
    ),
  },

  'seguranca/criptografia': {
    title: 'Criptografia',
    description: 'Como protegemos seus dados',
    content: (
      <div className="prose prose-lg max-w-none">
        <h2>Em Transito</h2>
        <ul>
          <li>TLS 1.3 para todas as conexoes HTTPS</li>
          <li>Certificados gerenciados automaticamente</li>
          <li>HSTS habilitado</li>
        </ul>

        <h2>Em Repouso</h2>
        <ul>
          <li>AES-256-GCM para dados armazenados</li>
          <li>Chaves rotacionadas automaticamente</li>
          <li>Backups criptografados</li>
        </ul>

        <h2>MLLP/HL7</h2>
        <p>
          Conexoes MLLP podem ser configuradas com TLS para ambientes que suportam HL7 over TLS
          (MLLPs).
        </p>
      </div>
    ),
  },

  'seguranca/auditoria': {
    title: 'Auditoria',
    description: 'Logs e rastreabilidade de operacoes',
    content: (
      <div className="prose prose-lg max-w-none">
        <h2>O que e Logado</h2>
        <ul>
          <li>Todas as mensagens enviadas e recebidas</li>
          <li>Acessos a API (quem, quando, o que)</li>
          <li>Alteracoes de configuracao</li>
          <li>Erros e falhas</li>
        </ul>

        <h2>Retencao</h2>
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="text-left">Tipo</th>
              <th className="text-left">Retencao</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Logs de acesso</td>
              <td>90 dias</td>
            </tr>
            <tr>
              <td>Mensagens</td>
              <td>Configuravel (30-365 dias)</td>
            </tr>
            <tr>
              <td>Auditoria de seguranca</td>
              <td>1 ano</td>
            </tr>
          </tbody>
        </table>

        <h2>Acessando Logs</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          {`GET /v1/audit-logs?from=2023-12-01&to=2023-12-15&action=message.send`}
        </pre>
      </div>
    ),
  },

  'seguranca/acesso': {
    title: 'Controle de Acesso',
    description: 'Gerenciamento de usuarios e permissoes',
    content: (
      <div className="prose prose-lg max-w-none">
        <h2>Papeis</h2>
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="text-left">Papel</th>
              <th className="text-left">Permissoes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>admin</code>
              </td>
              <td>Acesso total</td>
            </tr>
            <tr>
              <td>
                <code>developer</code>
              </td>
              <td>API Keys, conectores, mensagens</td>
            </tr>
            <tr>
              <td>
                <code>viewer</code>
              </td>
              <td>Apenas leitura</td>
            </tr>
          </tbody>
        </table>

        <h2>API Keys</h2>
        <ul>
          <li>Cada API Key tem escopo definido</li>
          <li>Keys podem ser revogadas individualmente</li>
          <li>Rotacao automatica disponivel</li>
        </ul>

        <h2>MFA</h2>
        <p>
          Autenticacao multi-fator (TOTP) disponivel para todos os usuarios. Recomendado para contas
          admin.
        </p>
      </div>
    ),
  },
};

// Navigation structure for sidebar
const navSections = [
  {
    title: 'Primeiros Passos',
    items: [
      { slug: 'introducao', title: 'Introducao' },
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
      { slug: 'conectores/hl7-generico', title: 'HL7 Generico' },
    ],
  },
  {
    title: 'API Reference',
    items: [
      { slug: 'api/autenticacao', title: 'Autenticacao' },
      { slug: 'api/mensagens', title: 'Mensagens' },
      { slug: 'api/conectores', title: 'Conectores' },
      { slug: 'api/webhooks', title: 'Webhooks' },
    ],
  },
  {
    title: 'HL7 v2',
    items: [
      { slug: 'hl7/overview', title: 'Overview' },
      { slug: 'hl7/adt', title: 'Mensagens ADT' },
      { slug: 'hl7/orm', title: 'Mensagens ORM' },
      { slug: 'hl7/oru', title: 'Mensagens ORU' },
    ],
  },
  {
    title: 'FHIR R4',
    items: [
      { slug: 'fhir/overview', title: 'Overview' },
      { slug: 'fhir/patient', title: 'Patient' },
      { slug: 'fhir/encounter', title: 'Encounter' },
      { slug: 'fhir/br-core', title: 'BR-Core Profiles' },
    ],
  },
  {
    title: 'Seguranca',
    items: [
      { slug: 'seguranca/lgpd', title: 'LGPD' },
      { slug: 'seguranca/criptografia', title: 'Criptografia' },
      { slug: 'seguranca/auditoria', title: 'Auditoria' },
      { slug: 'seguranca/acesso', title: 'Controle de Acesso' },
    ],
  },
];

export default function DocPage() {
  const params = useParams();
  const slugArray = params.slug as string[];
  const currentSlug = slugArray?.join('/') || 'introducao';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const doc = docsContent[currentSlug];

  if (!doc) {
    return (
      <main className="min-h-screen bg-white pt-20">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Pagina nao encontrada</h1>
          <p className="text-gray-600 mb-8">A documentacao que voce procura nao existe.</p>
          <Link href="/docs" className="text-orange-600 hover:underline">
            ← Voltar para Documentacao
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
                            currentSlug === item.slug
                              ? 'bg-orange-100 text-orange-700 font-medium'
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
            className="lg:hidden fixed bottom-4 right-4 z-50 bg-orange-500 text-white p-3 rounded-full shadow-lg"
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
                                currentSlug === item.slug
                                  ? 'bg-orange-100 text-orange-700 font-medium'
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
                ← Documentacao
              </Link>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">{doc.title}</h1>
            <p className="text-lg text-gray-600 mb-8">{doc.description}</p>

            <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-a:text-orange-600 prose-code:text-orange-700 prose-pre:bg-gray-900">
              {doc.content}
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}
