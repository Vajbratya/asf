# IntegraSaúde - Quick Start

> Copie e cole. Funciona.

## Instalação

```bash
npm install @integrabrasil/hl7-parser
```

---

## 1. Parse de Mensagem HL7 (5 linhas)

```typescript
import { HL7Parser } from '@integrabrasil/hl7-parser';

const hl7 = `MSH|^~\\&|LIS|LAB|HIS|HOSP|20231215||ADT^A01|123|P|2.5
PID|1||12345||SILVA^JOAO||19800115|M`;

const msg = HL7Parser.parse(hl7);
console.log(msg.messageType); // "ADT^A01"
console.log(msg.messageControlId); // "123"
```

---

## 2. Extrair Dados do Paciente (10 linhas)

```typescript
import { HL7Parser, ADTParser } from '@integrabrasil/hl7-parser';

const hl7 = `MSH|^~\\&|LIS|LAB|HIS|HOSP|20231215||ADT^A01|123|P|2.5
PID|1||12345^^^HOSP^MR~98765432100^^^CPF||SILVA^JOAO^PEDRO||19800115|M|||RUA A 123^^SAO PAULO^SP^01310100||(11)99999-9999`;

const msg = HL7Parser.parse(hl7);
const adt = ADTParser.parse(msg);

console.log(adt.patient.name.family); // "SILVA"
console.log(adt.patient.name.given); // ["JOAO", "PEDRO"]
console.log(adt.patient.birthDate); // "1980-01-15"
console.log(adt.patient.cpf); // "98765432100"
```

---

## 3. Validar CPF e CNS (3 linhas cada)

```typescript
import { validateCPF, validateCNS, formatCPF, formatCNS } from '@integrabrasil/hl7-parser';

// CPF
const cpf = validateCPF('123.456.789-09');
console.log(cpf.valid); // true ou false
console.log(cpf.error); // "Invalid CPF check digit" se inválido

// CNS
const cns = validateCNS('123456789012345');
console.log(cns.valid); // true ou false

// Formatar para exibição
console.log(formatCPF('12345678909')); // "123.456.789-09"
console.log(formatCNS('123456789012345')); // "123 4567 8901 2345"
```

---

## 4. Converter HL7 → FHIR R4 (8 linhas)

```typescript
import { HL7Parser, ADTParser, FHIRTransformer } from '@integrabrasil/hl7-parser';

const hl7 = `MSH|^~\\&|LIS|LAB|HIS|HOSP|20231215||ADT^A01|123|P|2.5
PID|1||12345^^^HOSP^MR~98765432100^^^CPF~123456789012345^^^CNS||SILVA^JOAO||19800115|M
PV1|1|I|UTI^201^A`;

const msg = HL7Parser.parse(hl7);
const adt = ADTParser.parse(msg);
const fhirBundle = FHIRTransformer.transformADT(adt);

console.log(JSON.stringify(fhirBundle, null, 2));
```

**Saída:**

```json
{
  "resourceType": "Bundle",
  "type": "transaction",
  "entry": [
    {
      "resource": {
        "resourceType": "Patient",
        "id": "12345",
        "name": [{ "family": "SILVA", "given": ["JOAO"] }],
        "birthDate": "1980-01-15",
        "gender": "male",
        "identifier": [
          { "system": "http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf", "value": "98765432100" },
          {
            "system": "http://rnds.saude.gov.br/fhir/r4/NamingSystem/cns",
            "value": "123456789012345"
          }
        ]
      },
      "request": { "method": "PUT", "url": "Patient/12345" }
    },
    {
      "resource": {
        "resourceType": "Encounter",
        "id": "",
        "status": "in-progress",
        "class": { "code": "IMP", "display": "inpatient encounter" },
        "subject": { "reference": "Patient/12345" }
      },
      "request": { "method": "PUT", "url": "Encounter/" }
    }
  ]
}
```

---

## 5. Servidor MLLP (Receber HL7 via TCP)

```typescript
import { MLLPServer, HL7Parser } from '@integrabrasil/hl7-parser';

const server = new MLLPServer({ port: 2575, autoAck: true });

server.on('message', (message, connectionId, respond) => {
  console.log(`Recebido ${message.messageType} de ${connectionId}`);

  // Processar mensagem aqui...
  // ACK é enviado automaticamente (autoAck: true)
});

server.on('error', (error) => console.error(error));

await server.start();
console.log('Servidor MLLP rodando na porta 2575');
```

---

## 6. Gerar ACK/NAK

```typescript
import { HL7Parser } from '@integrabrasil/hl7-parser';

// Aceitar mensagem
const ack = HL7Parser.generateACK('MSG123', 'AA', 'Mensagem processada');
console.log(ack.raw);
// MSH|^~\&|INTEGRABRASIL||||20231215..||ACK|...|P|2.5\rMSA|AA|MSG123|Mensagem processada\r

// Rejeitar mensagem
const nak = HL7Parser.generateNAK('MSG123', 'Paciente não encontrado');
console.log(nak.raw);
// MSH|^~\&|INTEGRABRASIL||||20231215..||ACK|...|P|2.5\rMSA|AE|MSG123|Paciente não encontrado\r
```

---

## 7. Conectar ao Tasy (Philips)

```typescript
import { TasyConnector } from '@integrasaude/api/connectors';

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
    mllp: { startByte: 0x0b, endByte1: 0x1c, endByte2: 0x0d },
    enableZSegments: true,
    apiUrl: 'https://tasy.hospital.com/api',
    apiKey: 'sua-api-key',
    segments: { ZPD: true, ZPV: true, ZIN: true, ZOR: true },
  },
});

await tasy.connect();
console.log(tasy.getStatus()); // "connected"

// Enviar ADT
await tasy.send({
  id: 'MSG001',
  type: 'ADT^A01',
  timestamp: new Date(),
  source: 'LIS',
  destination: 'HIS',
  payload: {
    patient: { cpf: '12345678901', motherName: 'Maria Silva' },
    visit: { visitNumber: 'V123', bedNumber: 'UTI-01' },
  },
});

// Buscar foto do paciente
const photo = await tasy.getPatientPhoto('12345');
console.log(photo.mimeType); // "image/jpeg"
console.log(photo.photoBase64); // "data:image/jpeg;base64,..."
```

---

## 8. Conectar ao MV Soul

```typescript
import { MVSoulConnector } from '@integrasaude/api/connectors';

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
    mllp: { startByte: 0x0b, endByte1: 0x1c, endByte2: 0x0d },
    enableResultsIntegration: true,
    xmlEndpoint: 'https://mv.hospital.com/integracao',
    xmlFormat: 'standard',
  },
});

await mv.connect();

// Enviar resultado de exame via XML
await mv.sendResults({
  visitId: 'ATD123456',
  patientId: 'PAC789',
  results: [
    {
      examCode: 'GLICEMIA',
      examName: 'Glicose em Jejum',
      resultDate: new Date().toISOString(),
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
```

---

## 9. Parse de Resultado (ORU)

```typescript
import { HL7Parser, ORUParser, FHIRTransformer } from '@integrabrasil/hl7-parser';

const oru = `MSH|^~\\&|LIS|LAB|HIS|HOSP|20231215||ORU^R01|456|P|2.5
PID|1||12345||SILVA^JOAO
OBR|1||ORD001|GLICEMIA^Glicose||20231215
OBX|1|NM|GLU^Glicose||99|mg/dL|70-110|N|||F`;

const msg = HL7Parser.parse(oru);
const result = ORUParser.parse(msg);

console.log(result.report.observations[0].value); // 99
console.log(result.report.observations[0].units); // "mg/dL"
console.log(result.report.observations[0].referenceRange); // "70-110"
console.log(result.report.observations[0].abnormalFlags); // ["N"]

// Converter para FHIR
const fhir = FHIRTransformer.transformORU(result);
// Bundle com DiagnosticReport + Observation
```

---

## 10. Parse de Pedido (ORM)

```typescript
import { HL7Parser, ORMParser, FHIRTransformer } from '@integrabrasil/hl7-parser';

const orm = `MSH|^~\\&|HIS|HOSP|LIS|LAB|20231215||ORM^O01|789|P|2.5
PID|1||12345||SILVA^JOAO
ORC|NW|ORD001||||||20231215
OBR|1|ORD001||40301117^Glicemia|||20231215`;

const msg = HL7Parser.parse(orm);
const order = ORMParser.parse(msg);

console.log(order.orders[0].placerOrderNumber); // "ORD001"
console.log(order.orders[0].procedureCode); // "40301117"

// Converter para FHIR ServiceRequest
const fhir = FHIRTransformer.transformORM(order);
```

---

## Mapeamentos Prontos

### Gênero (HL7 → FHIR)

| HL7 | FHIR    |
| --- | ------- |
| M   | male    |
| F   | female  |
| O   | other   |
| U   | unknown |

### Classe de Paciente (HL7 → FHIR Encounter)

| HL7 | FHIR  | Descrição    |
| --- | ----- | ------------ |
| I   | IMP   | Internado    |
| O   | AMB   | Ambulatório  |
| E   | EMER  | Emergência   |
| P   | PRENC | Pré-admissão |

### Status de Resultado (HL7 → FHIR)

| HL7 | FHIR        |
| --- | ----------- |
| P   | preliminary |
| F   | final       |
| C   | amended     |
| X   | cancelled   |

### Flags de Anormalidade

| Flag | Significado   |
| ---- | ------------- |
| N    | Normal        |
| H    | Alto          |
| L    | Baixo         |
| HH   | Crítico alto  |
| LL   | Crítico baixo |

---

## Pronto para Produção

```bash
# Rodar testes
pnpm test

# Resultado esperado:
# 279 tests passing
```
