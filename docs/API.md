# IntegraSaúde API Documentation

> Documentação técnica completa baseada no código fonte real.
> **279 testes passando** | **4 pacotes** | **Produção-ready**

---

## Sumário

1. [HL7 Parser](#1-hl7-parser)
   - [Parsing de Mensagens](#11-parsing-de-mensagens)
   - [Escape de Caracteres](#12-escape-de-caracteres)
   - [Acesso a Campos](#13-acesso-a-campos)
   - [Geração de ACK/NAK](#14-geração-de-acknak)
   - [Serialização](#15-serialização)
2. [Tipos de Mensagens](#2-tipos-de-mensagens)
   - [ADT - Admissão/Alta/Transferência](#21-adt---admissãoaltatransferência)
   - [ORM - Requisições](#22-orm---requisições)
   - [ORU - Resultados](#23-oru---resultados)
3. [Transformação FHIR R4](#3-transformação-fhir-r4)
   - [ADT → Patient + Encounter](#31-adt--patient--encounter)
   - [ORM → ServiceRequest](#32-orm--servicerequest)
   - [ORU → DiagnosticReport](#33-oru--diagnosticreport)
4. [Validadores Brasileiros](#4-validadores-brasileiros)
   - [CPF - Cadastro de Pessoa Física](#41-cpf---cadastro-de-pessoa-física)
   - [CNS - Cartão Nacional de Saúde](#42-cns---cartão-nacional-de-saúde)
5. [Servidor MLLP](#5-servidor-mllp)
6. [Conectores HIS](#6-conectores-his)
   - [Tasy (Philips)](#61-tasy-philips)
   - [MV Soul](#62-mv-soul)

---

## 1. HL7 Parser

O parser HL7 v2 completo está em `packages/hl7-parser/src/parser.ts`.

### 1.1 Parsing de Mensagens

```typescript
import { HL7Parser } from '@integrabrasil/hl7-parser';

// Parse qualquer mensagem HL7 v2
const message = HL7Parser.parse(`
MSH|^~\\&|LIS|HOSPITAL|HIS|HOSPITAL|20231215120000||ADT^A01|MSG001|P|2.5
PID|1||12345^^^HOSPITAL^MR||DOE^JOHN^A||19800101|M
PV1|1|I|ICU^201^A
`);

console.log(message.messageType); // "ADT^A01"
console.log(message.messageControlId); // "MSG001"
console.log(message.segments.length); // 3
```

**Estrutura retornada:**

```typescript
interface HL7Message {
  messageType: string; // Ex: "ADT^A01", "ORM^O01", "ORU^R01"
  messageControlId: string; // ID único da mensagem (MSH-10)
  delimiters: HL7Delimiters; // Delimitadores extraídos do MSH
  segments: HL7Segment[]; // Array de segmentos parseados
  raw: string; // Mensagem original
}

interface HL7Delimiters {
  field: string; // '|' - separador de campos
  component: string; // '^' - separador de componentes
  repetition: string; // '~' - separador de repetições
  escape: string; // '\' - caractere de escape
  subcomponent: string; // '&' - separador de subcomponentes
}

interface HL7Segment {
  name: string; // "MSH", "PID", "PV1", "OBX", etc.
  fields: string[][]; // Campos com repetições
}
```

**Tratamento de erros:**

```typescript
import { HL7Parser, HL7ParseError } from '@integrabrasil/hl7-parser';

try {
  const message = HL7Parser.parse('INVALID');
} catch (error) {
  if (error instanceof HL7ParseError) {
    console.log(error.code); // "INVALID_MSH"
    console.log(error.segment); // "MSH"
    console.log(error.message); // "Message must start with MSH segment"
  }
}
```

**Códigos de erro:**

- `INVALID_INPUT` - Entrada não é string ou é null
- `EMPTY_MESSAGE` - Mensagem vazia
- `NO_SEGMENTS` - Nenhum segmento encontrado
- `INVALID_MSH` - MSH ausente ou inválido
- `MSH_TOO_SHORT` - MSH muito curto para extrair delimitadores

---

### 1.2 Escape de Caracteres

O parser trata automaticamente as sequências de escape HL7:

| Sequência | Significado                    |
| --------- | ------------------------------ |
| `\F\`     | Field separator (`\|`)         |
| `\S\`     | Component separator (`^`)      |
| `\T\`     | Subcomponent separator (`&`)   |
| `\R\`     | Repetition separator (`~`)     |
| `\E\`     | Escape character (`\`)         |
| `\Xnn\`   | Hexadecimal (ex: `\X0D\` = CR) |

```typescript
// Escape para transmissão
const escaped = HL7Parser.escape('Nome | com ^ especial', message.delimiters);
// Retorna: "Nome \\F\\ com \\S\\ especial"

// Unescape é automático no parse()
```

---

### 1.3 Acesso a Campos

```typescript
// Buscar segmento por nome
const pid = HL7Parser.getSegment(message, 'PID'); // Primeiro PID
const obx2 = HL7Parser.getSegment(message, 'OBX', 1); // Segundo OBX

// Todos os segmentos de um tipo
const allOBX = HL7Parser.getSegments(message, 'OBX');

// Acessar campo (índice 1-based conforme especificação HL7)
const patientId = HL7Parser.getField(pid, 3); // PID-3
const birthDate = HL7Parser.getField(pid, 7); // PID-7

// Acessar componente dentro de um campo
const familyName = HL7Parser.getComponent(
  HL7Parser.getField(pid, 5), // PID-5 (nome completo)
  1, // Primeiro componente (sobrenome)
  message.delimiters
);

// Acessar repetição específica
const altId = HL7Parser.getField(pid, 3, 1); // Segunda repetição de PID-3
```

---

### 1.4 Geração de ACK/NAK

```typescript
// ACK positivo (mensagem aceita)
const ack = HL7Parser.generateACK('MSG001', 'AA', 'Mensagem processada');
console.log(ack.raw);
// MSH|^~\&|INTEGRABRASIL||||20231215120000||ACK|1702...|P|2.5\r
// MSA|AA|MSG001|Mensagem processada\r

// ACK negativo (erro de aplicação)
const nak = HL7Parser.generateACK('MSG001', 'AE', 'Paciente não encontrado');

// Rejeição (erro de formato)
const reject = HL7Parser.generateACK('MSG001', 'AR', 'Formato inválido');

// Atalho para NAK
const nak2 = HL7Parser.generateNAK('MSG001', 'Erro de validação');
```

**Códigos de ACK:**

- `AA` - Application Accept (sucesso)
- `AE` - Application Error (erro de negócio)
- `AR` - Application Reject (erro de formato)

---

### 1.5 Serialização

```typescript
// Converter mensagem parseada de volta para string HL7
const hl7String = HL7Parser.serialize(message);
// MSH|^~\&|LIS|HOSPITAL|...\rPID|1||12345...\rPV1|1|I|ICU^201^A\r
```

---

### 1.6 Utilitários de Data

```typescript
// Formatar Date para HL7 (YYYYMMDDHHMMSS)
const hl7Date = HL7Parser.formatHL7DateTime(new Date());
// "20231215143052"

// Parse HL7 para JavaScript Date
const jsDate = HL7Parser.parseHL7DateTime('20231215143052');
// Date object

// Gerar ID único para mensagem
const controlId = HL7Parser.generateMessageControlId();
// "1702654252123-abc123x"
```

---

## 2. Tipos de Mensagens

### 2.1 ADT - Admissão/Alta/Transferência

Arquivo: `packages/hl7-parser/src/messages/adt.ts`

```typescript
import { ADTParser, ADTMessage } from '@integrabrasil/hl7-parser';

const message = HL7Parser.parse(adtString);
const adt: ADTMessage = ADTParser.parse(message);

console.log(adt.eventType); // "A01", "A02", "A03", "A08", "A40"
console.log(adt.patient); // Dados do paciente
console.log(adt.visit); // Dados da internação (opcional)
console.log(adt.insurance); // Dados do convênio (opcional)
```

**Eventos ADT suportados:**

| Código | Descrição                  |
| ------ | -------------------------- |
| A01    | Admit/Visit Notification   |
| A02    | Transfer a Patient         |
| A03    | Discharge/End Visit        |
| A04    | Register a Patient         |
| A05    | Pre-Admit a Patient        |
| A08    | Update Patient Information |
| A11    | Cancel Admit               |
| A12    | Cancel Transfer            |
| A13    | Cancel Discharge           |
| A28    | Add Person Information     |
| A31    | Update Person Information  |
| A40    | Merge Patient              |

**Estrutura do Patient:**

```typescript
interface Patient {
  id: string; // MRN do hospital
  name: {
    family: string; // Sobrenome
    given: string[]; // Nome(s)
  };
  birthDate?: string; // YYYY-MM-DD
  gender?: 'M' | 'F' | 'O' | 'U';
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  phone?: string[];
  cpf?: string; // CPF brasileiro
  cns?: string; // CNS brasileiro
  cpfValidation?: ValidationInfo;
  cnsValidation?: ValidationInfo;
}
```

**Extração de CPF/CNS do HL7:**

O parser extrai automaticamente CPF e CNS de:

1. PID-3 com identificador tipo `^^^CPF` ou `^^^CNS`
2. PID-19 (SSN/número de identificação)

```
PID|1||12345^^^HOSPITAL^MR~98765432100^^^CPF~123456789012345^^^CNS||DOE^JOHN
```

---

### 2.2 ORM - Requisições

```typescript
import { ORMParser, ORMMessage } from '@integrabrasil/hl7-parser';

const message = HL7Parser.parse(ormString);
const orm: ORMMessage = ORMParser.parse(message);

console.log(orm.orders); // Array de pedidos
```

**Estrutura do Order:**

```typescript
interface Order {
  id: string;
  placerOrderNumber?: string; // Número do solicitante
  fillerOrderNumber?: string; // Número do executante
  procedureCode?: string; // Código TUSS
  procedureText?: string; // Descrição
  orderDateTime?: string; // ISO datetime
  orderingProvider?: string; // Médico solicitante
  controlCode?: string; // NW, CA, DC, OK, HD, RP, OC, CR
}
```

---

### 2.3 ORU - Resultados

```typescript
import { ORUParser, ORUMessage } from '@integrabrasil/hl7-parser';

const message = HL7Parser.parse(oruString);
const oru: ORUMessage = ORUParser.parse(message);

console.log(oru.report); // DiagnosticReport
console.log(oru.report.observations); // Array de Observation
```

**Estrutura do Observation:**

```typescript
interface Observation {
  id: string;
  identifier: string; // Código do exame
  type: 'NM' | 'ST' | 'TX' | 'ED' | 'CE'; // Tipo de valor
  value: number | string | object;
  units?: string; // mg/dL, mmol/L, etc.
  referenceRange?: string; // "70-110"
  abnormalFlags?: string[]; // H, L, HH, LL, N
  status?: string; // P, F, C, X
  observationDateTime?: string;
}
```

---

## 3. Transformação FHIR R4

Arquivo: `packages/hl7-parser/src/transformers/to-fhir.ts`

### 3.1 ADT → Patient + Encounter

```typescript
import { FHIRTransformer, FHIRBundle } from '@integrabrasil/hl7-parser';

const adtMessage = ADTParser.parse(hl7Message);
const bundle: FHIRBundle = FHIRTransformer.transformADT(adtMessage);

// Resultado: FHIR Bundle tipo transaction
// - Patient resource com CPF/CNS como identifiers
// - Encounter resource com location e participant
// - Coverage resource (se IN1 presente)
```

**Patient com identificadores brasileiros:**

```json
{
  "resourceType": "Patient",
  "id": "12345",
  "name": [{ "family": "Silva", "given": ["João"] }],
  "birthDate": "1980-01-15",
  "gender": "male",
  "identifier": [
    {
      "system": "http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf",
      "value": "12345678901"
    },
    {
      "system": "http://rnds.saude.gov.br/fhir/r4/NamingSystem/cns",
      "value": "123456789012345"
    }
  ]
}
```

**Encounter com mapeamento de classe:**

| HL7 Patient Class | FHIR Encounter Class | Descrição     |
| ----------------- | -------------------- | ------------- |
| I                 | IMP                  | Inpatient     |
| O                 | AMB                  | Ambulatory    |
| E                 | EMER                 | Emergency     |
| P                 | PRENC                | Pre-admission |
| R                 | AMB                  | Recurring     |
| B                 | OBSENC               | Obstetrics    |

---

### 3.2 ORM → ServiceRequest

```typescript
const ormMessage = ORMParser.parse(hl7Message);
const bundle: FHIRBundle = FHIRTransformer.transformORM(ormMessage);

// Resultado: Bundle com ServiceRequest para cada pedido
```

**ServiceRequest com código TUSS:**

```json
{
  "resourceType": "ServiceRequest",
  "id": "order-123",
  "status": "active",
  "intent": "order",
  "code": {
    "coding": [
      {
        "system": "http://www.ans.gov.br/tuss",
        "code": "40301117",
        "display": "Glicemia"
      }
    ]
  },
  "subject": { "reference": "Patient/12345" },
  "authoredOn": "2023-12-15T14:30:00Z"
}
```

**Mapeamento de status (Order Control → ServiceRequest Status):**

| HL7 Order Control   | FHIR Status |
| ------------------- | ----------- |
| NW (New)            | active      |
| CA (Cancel)         | revoked     |
| DC (Discontinue)    | revoked     |
| OK (Order Accepted) | active      |
| HD (Hold)           | on-hold     |
| RP (Replace)        | replaced    |

---

### 3.3 ORU → DiagnosticReport

```typescript
const oruMessage = ORUParser.parse(hl7Message);
const bundle: FHIRBundle = FHIRTransformer.transformORU(oruMessage);

// Resultado:
// - DiagnosticReport com referências aos Observations
// - Observation para cada OBX
```

**Observation com valor numérico:**

```json
{
  "resourceType": "Observation",
  "status": "final",
  "code": { "text": "GLICEMIA" },
  "subject": { "reference": "Patient/12345" },
  "valueQuantity": {
    "value": 99,
    "unit": "mg/dL"
  },
  "referenceRange": [{ "text": "70-110" }],
  "interpretation": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
          "code": "N"
        }
      ]
    }
  ]
}
```

**Mapeamento de status de resultado:**

| HL7 Result Status | FHIR Status |
| ----------------- | ----------- |
| P (Preliminary)   | preliminary |
| F (Final)         | final       |
| C (Corrected)     | amended     |
| X (Cancelled)     | cancelled   |
| I (In Progress)   | registered  |
| S (Partial)       | partial     |

---

## 4. Validadores Brasileiros

Arquivo: `packages/hl7-parser/src/utils/validators.ts`

### 4.1 CPF - Cadastro de Pessoa Física

```typescript
import { validateCPF, formatCPF, cleanDocument } from '@integrabrasil/hl7-parser';

// Validação completa com algoritmo Módulo 11
const result = validateCPF('123.456.789-09');
console.log(result.valid); // true ou false
console.log(result.error); // mensagem de erro se inválido

// Formatação para exibição
const formatted = formatCPF('12345678909');
// "123.456.789-09"

// Limpeza (remove pontuação)
const clean = cleanDocument('123.456.789-09');
// "12345678909"
```

**Algoritmo de validação:**

1. Remove caracteres não numéricos
2. Verifica se tem 11 dígitos
3. Rejeita CPFs com todos os dígitos iguais (111.111.111-11)
4. Calcula primeiro dígito verificador (Módulo 11, multiplicadores 10→2)
5. Calcula segundo dígito verificador (Módulo 11, multiplicadores 11→2)
6. Compara com os dígitos informados

---

### 4.2 CNS - Cartão Nacional de Saúde

```typescript
import { validateCNS, formatCNS } from '@integrabrasil/hl7-parser';

// Validação
const result = validateCNS('123 4567 8901 2345');
console.log(result.valid); // true ou false

// Formatação
const formatted = formatCNS('123456789012345');
// "123 4567 8901 2345"
```

**Regras de validação:**

1. Deve ter 15 dígitos
2. Primeiro dígito deve ser 1, 2, 7, 8 ou 9:
   - **1 ou 2**: CNS definitivo
   - **7, 8 ou 9**: CNS provisório
3. Validação por Módulo 11 (soma ponderada divisível por 11)

---

## 5. Servidor MLLP

Arquivo: `packages/hl7-parser/src/mllp/server.ts`

O MLLP (Minimum Lower Layer Protocol) é o protocolo de transporte padrão para HL7 v2.

**Framing MLLP:**

```
<VT>mensagem HL7<FS><CR>
```

- VT = 0x0B (Vertical Tab) - início
- FS = 0x1C (File Separator) - fim do bloco
- CR = 0x0D (Carriage Return) - terminador

```typescript
import { MLLPServer } from '@integrabrasil/hl7-parser';

const server = new MLLPServer({
  host: '0.0.0.0',
  port: 2575,
  timeout: 30000, // timeout de conexão (ms)
  autoAck: true, // enviar ACK automaticamente
  validateMessage: true,
});

// Evento: nova conexão
server.on('connection', (connectionId) => {
  console.log(`Nova conexão: ${connectionId}`);
});

// Evento: mensagem recebida
server.on('message', (message, connectionId, respond) => {
  console.log(`Mensagem ${message.messageType} de ${connectionId}`);

  // Processar mensagem...

  // Se autoAck=false, enviar resposta manualmente:
  // respond(HL7Parser.generateACK(message.messageControlId, 'AA'));
});

// Evento: erro
server.on('error', (error, connectionId) => {
  console.error(`Erro${connectionId ? ` em ${connectionId}` : ''}: ${error.message}`);
});

// Evento: conexão fechada
server.on('close', (connectionId) => {
  console.log(`Conexão fechada: ${connectionId}`);
});

// Iniciar servidor
await server.start();
console.log(`MLLP Server rodando na porta 2575`);

// Parar servidor
await server.stop();
```

**Informações do servidor:**

```typescript
const info = server.getInfo();
console.log(info.running); // true/false
console.log(info.host); // "0.0.0.0"
console.log(info.port); // 2575
console.log(info.connections); // número de conexões ativas
```

---

## 6. Conectores HIS

### 6.1 Tasy (Philips)

Arquivo: `apps/api/src/connectors/tasy.ts`

Conector especializado para Philips Tasy com:

- Z-segments brasileiros (ZPD, ZPV, ZIN, ZOR)
- Mapeamento TUSS
- API REST para fotos e dados demográficos

```typescript
import { TasyConnector } from '@integrasaude/api/connectors';

const tasy = new TasyConnector({
  type: 'tasy',
  orgId: 'hospital-001',
  name: 'Tasy HCPA',
  enabled: true,
  config: {
    host: '192.168.1.100',
    port: 2575,
    timeout: 30000,
    keepAlive: true,
    encoding: 'utf8',
    mllp: { startByte: 0x0b, endByte1: 0x1c, endByte2: 0x0d },
    enableZSegments: true,
    apiUrl: 'https://tasy.hospital.com/api',
    apiKey: 'xxx-yyy-zzz',
    segments: {
      ZPD: true,  // Patient Data (CPF, CNS, nome da mãe)
      ZPV: true,  // Visit Data
      ZIN: true,  // Insurance Data
      ZOR: true,  // Order Data
    },
    tussMapping: {
      '40301117': 'GLI',  // Glicemia
      '40302016': 'HMG',  // Hemograma
    }
  }
});

// Conectar
await tasy.connect();

// Enviar mensagem com Z-segments automaticamente adicionados
await tasy.send({
  id: 'MSG001',
  type: 'ADT^A01',
  payload: {
    patient: {
      motherName: 'Maria Silva',
      cpf: '12345678901',
      cns: '123456789012345',
    },
    visit: {
      visitNumber: 'V123',
      bedNumber: 'ICU-201',
    }
  }
});

// API REST: buscar foto do paciente
const photo = await tasy.getPatientPhoto('12345');
// { patientId, photoBase64, mimeType }

// API REST: buscar dados demográficos
const demographics = await tasy.getPatientDemographics('12345');

// API REST: buscar paciente por CPF
const patient = await tasy.getPatient('12345678901');

// API REST: buscar visita
const visit = await tasy.getVisit('V123');

// API REST: buscar pedidos de uma visita
const orders = await tasy.getOrders('V123');

// API REST: postar resultado
await tasy.postResult({ id: 'RES001', ... });

// Parse de Z-segments recebidos
const zSegments = tasy.parseZSegments(hl7Message);
console.log(zSegments.ZPD.fields.cpf);
console.log(zSegments.ZPV.fields.bedNumber);
```

**Z-Segments Tasy:**

| Segmento | Campos                                                                                                                     |
| -------- | -------------------------------------------------------------------------------------------------------------------------- |
| ZPD      | motherName, birthPlace, nationality, rg, cpf, cns, occupation, educationLevel                                              |
| ZPV      | visitNumber, admissionType, serviceType, bedNumber, wardCode, attendingPhysician, admissionDate, dischargeDate             |
| ZIN      | planCode, planName, cardNumber, validityStart, validityEnd, holderName, relationship                                       |
| ZOR      | orderNumber, orderType, priority, requestingPhysician, orderDate, clinicalIndication, tussCode                             |
| ZOB      | observationId, observationType, observationValue, units, referenceRange, abnormalFlags, observationStatus, observationDate |

---

### 6.2 MV Soul

Arquivo: `apps/api/src/connectors/mv-soul.ts`

Conector para MV Soul com integração XML para resultados.

```typescript
import { MVSoulConnector } from '@integrasaude/api/connectors';

const mv = new MVSoulConnector({
  type: 'mv-soul',
  orgId: 'hospital-002',
  name: 'MV Soul',
  enabled: true,
  config: {
    host: '192.168.1.101',
    port: 2575,
    timeout: 30000,
    keepAlive: true,
    encoding: 'utf8',
    mllp: { startByte: 0x0b, endByte1: 0x1c, endByte2: 0x0d },
    enableResultsIntegration: true,
    xmlEndpoint: 'https://mv.hospital.com/integracao',
    xmlFormat: 'standard',
  },
});

// Enviar mensagem ADT via HL7
await mv.sendAdtMessage({
  id: 'MSG001',
  type: 'ADT^A01',
  payload: '...',
});

// Enviar mensagem ORM via HL7
await mv.sendOrderMessage({
  id: 'MSG002',
  type: 'ORM^O01',
  payload: '...',
});

// Enviar resultados via XML
await mv.sendResults({
  visitId: 'V123',
  patientId: 'P456',
  results: [
    {
      examCode: 'GLU',
      examName: 'Glicose',
      resultDate: '2023-12-15T12:00:00Z',
      status: 'F',
      items: [
        {
          code: 'GLU',
          name: 'Glicose',
          value: '99',
          unit: 'mg/dL',
          referenceRange: '70-110',
          abnormalFlag: 'N',
        },
      ],
    },
  ],
});

// Consultar atendimentos do paciente
const visits = await mv.queryPatientVisits('P456');

// Transformar dados para formato MV
const mvData = mv.transformToMVFormat(sourceData);

// Parse de resposta XML
const response = mv.parseXmlResponse(xmlString);
```

**XML gerado para MV Soul:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<mv_integracao tipo="RESULTADO" versao="1.0">
  <atendimento>
    <cd_atendimento>V123</cd_atendimento>
    <cd_paciente>P456</cd_paciente>
    <resultados>
      <resultado>
        <cd_exame>GLU</cd_exame>
        <nm_exame>Glicose</nm_exame>
        <dt_resultado>2023-12-15T12:00:00Z</dt_resultado>
        <st_resultado>F</st_resultado>
        <itens>
          <item>
            <cd_item>GLU</cd_item>
            <nm_item>Glicose</nm_item>
            <vl_resultado>99</vl_resultado>
            <un_medida>mg/dL</un_medida>
            <vl_referencia>70-110</vl_referencia>
            <sn_anormal>N</sn_anormal>
          </item>
        </itens>
      </resultado>
    </resultados>
  </atendimento>
</mv_integracao>
```

---

## Instalação

```bash
# Pacote HL7 Parser (npm público)
npm install @integrabrasil/hl7-parser

# Ou com pnpm
pnpm add @integrabrasil/hl7-parser
```

---

## Testes

```bash
# Rodar todos os testes
pnpm test

# Resultado esperado:
# HL7 Parser: 124 passed, 7 test suites
# API: 146 passed, 10 test files
# Web: 9 passed, 2 test suites
# Total: 279 tests
```

---

## Licença

Proprietário - IntegraSaúde 2024
