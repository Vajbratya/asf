# Epic 4 - Connectors - Implementation Results

## Overview

This document details the implementation of Epic 4 - Connectors for the IntegraSaúde healthcare integration platform. All seven stories (S18-S24) have been successfully implemented with full TypeScript strict mode compliance.

## Architecture

The connector system is built on a layered architecture:

1. **Base Connector** - Abstract foundation with common functionality
2. **Protocol Connectors** - HL7, REST implementations
3. **Vendor Connectors** - Hospital-specific implementations (Tasy, MV Soul, Pixeon)
4. **Registry** - Singleton factory for connector lifecycle management

## Stories Implemented

### S18 - Base Connector (`apps/api/src/connectors/base.ts`)

Abstract EventEmitter-based class providing core functionality for all connectors.

**Features:**

- Standard interface: `connect()`, `send()`, `disconnect()`, `healthCheck()`
- Automatic metrics collection (messages sent/received, errors, latency, uptime)
- Exponential backoff retry logic with configurable parameters
- Event emission for status changes, messages, and errors
- Type-safe error handling with ConnectorError
- Structured logging with Pino

**Configuration:**

```typescript
interface BaseConnectorConfig {
  type: ConnectorType;
  orgId: string;
  name: string;
  enabled: boolean;
  config: Record<string, any>;
  retry?: {
    maxRetries: number;
    initialDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
  };
}
```

**Key Methods:**

- `connect()` - Establish connection to remote system
- `send(message)` - Send message with metrics tracking
- `disconnect()` - Clean disconnect
- `healthCheck()` - Return health status and metrics
- `retry(operation, context)` - Execute operation with exponential backoff
- `destroy()` - Cleanup all resources

---

### S19 - Generic HL7 Connector (`apps/api/src/connectors/generic-hl7.ts`)

Generic HL7v2 connector implementing MLLP (Minimal Lower Layer Protocol).

**Features:**

- MLLP framing (VT/FS/CR bytes)
- Connection pooling (default 3 connections)
- ACK/NAK handling and validation
- Automatic reconnection on connection loss
- Keep-alive support
- Configurable encoding (default UTF-8)
- Message building from structured data

**Configuration:**

```typescript
interface HL7Config {
  host: string;
  port: number;
  timeout: number;
  keepAlive: boolean;
  encoding: string;
  mllp: {
    startByte: number; // 0x0B
    endByte1: number; // 0x1C
    endByte2: number; // 0x0D
  };
  poolSize?: number; // Default: 3
}
```

**Usage Example:**

```typescript
import { GenericHL7Connector } from "./connectors";

const connector = new GenericHL7Connector({
  type: "generic-hl7",
  orgId: "hospital-123",
  name: "Main HL7 Interface",
  enabled: true,
  config: {
    host: "hl7.hospital.com",
    port: 2575,
    timeout: 30000,
    keepAlive: true,
    encoding: "utf8",
    poolSize: 5,
  },
});

await connector.connect();

await connector.send({
  id: "msg-001",
  timestamp: new Date(),
  source: "IntegraSaude",
  destination: "HIS",
  type: "ADT^A01",
  payload: {
    segments: [
      "PID|1||12345^^^HIS||DOE^JOHN^||19800101|M|||123 MAIN ST^^CITY^ST^12345",
      "PV1|1|I|ICU^101^01||||123^DR^SMITH||||||||||||V12345",
    ],
  },
});
```

---

### S20 - Tasy Connector (`apps/api/src/connectors/tasy.ts`)

Philips Tasy HIS connector with Z-segment support and REST API integration.

**Features:**

- Extends GenericHL7Connector
- Parse and build Tasy-specific Z-segments (ZPD, ZPV, ZIN, ZOR)
- REST API client for Tasy Web Services
- Patient photo retrieval
- Patient demographics queries
- TUSS procedure code mapping
- Automatic Z-segment enrichment

**Z-Segments Supported:**

- **ZPD** - Patient Data (mother name, birth place, nationality, RG, CPF, CNS)
- **ZPV** - Visit Data (admission type, bed, ward, attending physician)
- **ZIN** - Insurance Data (plan code, card number, validity)
- **ZOR** - Order Data (order type, priority, clinical indication, TUSS code)

**Configuration:**

```typescript
interface TasyConfig extends HL7Config {
  apiUrl?: string;
  apiKey?: string;
  enableZSegments: boolean;
  segments: {
    ZPD?: boolean;
    ZPV?: boolean;
    ZIN?: boolean;
    ZOR?: boolean;
  };
  tussMapping?: Record<string, string>;
}
```

**Usage Example:**

```typescript
import { TasyConnector } from "./connectors";

const connector = new TasyConnector({
  type: "tasy",
  orgId: "hospital-123",
  name: "Tasy Production",
  enabled: true,
  config: {
    host: "tasy.hospital.com",
    port: 2575,
    timeout: 30000,
    keepAlive: true,
    encoding: "utf8",
    apiUrl: "https://tasy-api.hospital.com",
    apiKey: "your-api-key",
    enableZSegments: true,
    segments: {
      ZPD: true,
      ZPV: true,
      ZIN: true,
      ZOR: true,
    },
    tussMapping: {
      "40101010": "CONSULTA",
      "40201015": "RAIO-X",
    },
  },
});

// Get patient photo
const photo = await connector.getPatientPhoto("12345");
if (photo) {
  console.log(`Photo: ${photo.mimeType}, ${photo.photoBase64.length} bytes`);
}

// Query procedure codes
const procedures = await connector.queryProcedureCodes("consulta");
```

---

### S21 - MV Soul Connector (`apps/api/src/connectors/mv-soul.ts`)

MV Soul HIS connector with XML integration for lab/imaging results.

**Features:**

- HL7 MLLP for ADT/ORM messages
- XML integration for results delivery
- Build MV-specific XML format
- Parse MV Soul XML responses
- Patient visit queries
- ADT and ORM message validation
- Result transformation utilities

**MV XML Format:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<mv_integracao tipo="RESULTADO" versao="1.0">
  <atendimento>
    <cd_atendimento>123456</cd_atendimento>
    <cd_paciente>789</cd_paciente>
    <resultados>
      <resultado>
        <cd_exame>HEMOGRAMA</cd_exame>
        <nm_exame>Hemograma Completo</nm_exame>
        <dt_resultado>2024-01-15T10:30:00</dt_resultado>
        <st_resultado>F</st_resultado>
        <itens>
          <item>
            <cd_item>HB</cd_item>
            <nm_item>Hemoglobina</nm_item>
            <vl_resultado>14.5</vl_resultado>
            <un_medida>g/dL</un_medida>
            <vl_referencia>12-16</vl_referencia>
            <sn_anormal>N</sn_anormal>
          </item>
        </itens>
      </resultado>
    </resultados>
  </atendimento>
</mv_integracao>
```

**Configuration:**

```typescript
interface MVSoulConfig extends HL7Config {
  xmlEndpoint?: string;
  xmlFormat: "standard" | "custom";
  enableResultsIntegration: boolean;
}
```

**Usage Example:**

```typescript
import { MVSoulConnector } from "./connectors";

const connector = new MVSoulConnector({
  type: "mv-soul",
  orgId: "hospital-123",
  name: "MV Soul Production",
  enabled: true,
  config: {
    host: "mv.hospital.com",
    port: 2575,
    timeout: 30000,
    keepAlive: true,
    encoding: "utf8",
    xmlEndpoint: "https://mv.hospital.com/webservices/results",
    xmlFormat: "standard",
    enableResultsIntegration: true,
  },
});

// Send lab results
await connector.sendResults({
  visitId: "123456",
  patientId: "789",
  results: [
    {
      examCode: "HEMOGRAMA",
      examName: "Hemograma Completo",
      resultDate: "2024-01-15T10:30:00",
      status: "F",
      items: [
        {
          code: "HB",
          name: "Hemoglobina",
          value: "14.5",
          unit: "g/dL",
          referenceRange: "12-16",
          abnormalFlag: "N",
        },
      ],
    },
  ],
});

// Query patient visits
const visits = await connector.queryPatientVisits("789");
```

---

### S22 - Pixeon Connector (`apps/api/src/connectors/pixeon.ts`)

Pixeon PACS/RIS connector with HL7 and DICOMweb support.

**Features:**

- HL7 for RIS order integration
- DICOMweb QIDO-RS for study search
- DICOMweb WADO-RS for image retrieval
- Authentication support (Basic, Bearer, API Key)
- DICOM JSON parsing
- Thumbnail generation
- Study archive (ZIP) download
- Worklist query support

**DICOMweb Endpoints:**

- **QIDO-RS** - Query studies, series, instances
- **WADO-RS** - Retrieve DICOM images
- **STOW-RS** - Store DICOM images (prepared for future)

**Configuration:**

```typescript
interface PixeonConfig extends HL7Config {
  dicomWeb: {
    baseUrl: string;
    qidoPath: string; // Default: '/studies'
    wadoPath: string; // Default: '/studies'
    stowPath: string; // Default: '/studies'
  };
  auth?: {
    type: "basic" | "bearer" | "apikey";
    credentials: Record<string, string>;
  };
}
```

**Usage Example:**

```typescript
import { PixeonConnector } from "./connectors";

const connector = new PixeonConnector({
  type: "pixeon",
  orgId: "hospital-123",
  name: "Pixeon PACS",
  enabled: true,
  config: {
    host: "ris.hospital.com",
    port: 2575,
    timeout: 60000,
    keepAlive: true,
    encoding: "utf8",
    dicomWeb: {
      baseUrl: "https://pacs.hospital.com/dicomweb",
      qidoPath: "/studies",
      wadoPath: "/studies",
      stowPath: "/studies",
    },
    auth: {
      type: "basic",
      credentials: {
        username: "integrasaude",
        password: "secure-password",
      },
    },
  },
});

// Search for patient studies
const studies = await connector.searchStudies({
  patientID: "12345",
  studyDate: "20240101-20240131",
  modality: "CR",
});

// Get study details with series
const study = await connector.getStudyDetails(studies[0].studyInstanceUID);

// Retrieve DICOM instance
const dicomData = await connector.retrieveInstance(
  studyInstanceUID,
  seriesInstanceUID,
  sopInstanceUID,
);

// Get thumbnail
const thumbnail = await connector.getImageThumbnail(
  studyInstanceUID,
  seriesInstanceUID,
  sopInstanceUID,
);

// Download entire study as ZIP
const archive = await connector.retrieveStudyArchive(studyInstanceUID);
```

---

### S23 - Generic REST Connector (`apps/api/src/connectors/generic-rest.ts`)

Flexible REST API connector with multiple authentication methods.

**Features:**

- Configurable endpoints per message type
- Authentication types: API Key, OAuth2, Basic Auth, Bearer Token
- Automatic OAuth2 token refresh
- Request/response transformations
- Field mapping
- Template-based transformations
- Custom request method per endpoint
- Retry logic with exponential backoff

**Authentication Types:**

- **API Key** - Custom header with key value
- **Basic Auth** - Username/password
- **Bearer Token** - Token-based authentication
- **OAuth2** - Client credentials flow with automatic refresh

**Configuration:**

```typescript
interface GenericRestConfig {
  baseUrl: string;
  auth: {
    type: "apikey" | "oauth2" | "basic" | "bearer";
    apiKey?: {
      header: string;
      value: string;
    };
    basic?: {
      username: string;
      password: string;
    };
    bearer?: {
      token: string;
    };
    oauth2?: {
      tokenUrl: string;
      clientId: string;
      clientSecret: string;
      scope?: string;
    };
  };
  endpoints: {
    [key: string]: {
      url: string;
      method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
      headers?: Record<string, string>;
      timeout?: number;
      retries?: number;
    };
  };
  transform?: {
    request?: {
      template?: string;
      mapping?: Record<string, string>;
    };
    response?: {
      mapping?: Record<string, string>;
      extract?: string;
    };
  };
  defaultTimeout: number;
  defaultRetries: number;
}
```

**Usage Examples:**

**API Key Authentication:**

```typescript
const connector = new GenericRestConnector({
  type: "generic-rest",
  orgId: "hospital-123",
  name: "External Lab API",
  enabled: true,
  config: {
    baseUrl: "https://api.lab.com",
    auth: {
      type: "apikey",
      apiKey: {
        header: "X-API-Key",
        value: "your-api-key-here",
      },
    },
    endpoints: {
      "lab-result": {
        url: "/results",
        method: "POST",
        timeout: 30000,
      },
      "get-patient": {
        url: "/patients/{id}",
        method: "GET",
      },
    },
    defaultTimeout: 30000,
    defaultRetries: 3,
  },
});
```

**OAuth2 Authentication:**

```typescript
const connector = new GenericRestConnector({
  type: "generic-rest",
  orgId: "hospital-123",
  name: "FHIR Server",
  enabled: true,
  config: {
    baseUrl: "https://fhir.hospital.com",
    auth: {
      type: "oauth2",
      oauth2: {
        tokenUrl: "https://auth.hospital.com/oauth/token",
        clientId: "integrasaude",
        clientSecret: "client-secret",
        scope: "read write",
      },
    },
    endpoints: {
      patient: {
        url: "/Patient",
        method: "POST",
      },
      observation: {
        url: "/Observation",
        method: "POST",
      },
    },
    transform: {
      response: {
        extract: "entry.resource",
      },
    },
    defaultTimeout: 30000,
    defaultRetries: 3,
  },
});
```

**Field Mapping:**

```typescript
const connector = new GenericRestConnector({
  type: "generic-rest",
  orgId: "hospital-123",
  name: "Legacy System",
  enabled: true,
  config: {
    baseUrl: "https://legacy.hospital.com",
    auth: {
      type: "basic",
      basic: {
        username: "integrasaude",
        password: "password",
      },
    },
    endpoints: {
      "patient-create": {
        url: "/api/patients",
        method: "POST",
      },
    },
    transform: {
      request: {
        mapping: {
          patient_id: "id",
          first_name: "name.given.0",
          last_name: "name.family",
          birth_date: "birthDate",
        },
      },
      response: {
        mapping: {
          id: "patient_id",
          created: "timestamp",
        },
      },
    },
    defaultTimeout: 30000,
    defaultRetries: 3,
  },
});
```

---

### S24 - Connector Registry (`apps/api/src/connectors/registry.ts`)

Singleton factory for managing all connector instances.

**Features:**

- Factory pattern for connector creation
- Singleton instances per organization/type/name
- Automatic connection on creation
- Aggregated health checks
- Connector lifecycle management
- Statistics and monitoring
- Bulk operations (reconnect all, disconnect all)
- Organization-level operations

**Key Methods:**

- `getConnector(config)` - Get or create connector instance
- `removeConnector(config)` - Remove and destroy connector
- `removeOrgConnectors(orgId)` - Remove all connectors for an org
- `healthCheckAll()` - Health check all connectors
- `healthCheckOrg(orgId)` - Health check org connectors
- `getStats()` - Get registry statistics
- `reconnectAll()` - Reconnect disconnected connectors
- `disconnectAll()` - Disconnect all connectors

**Usage Example:**

```typescript
import { getConnectorRegistry } from "./connectors";

const registry = getConnectorRegistry();

// Create connector
const connector = await registry.getConnector({
  type: "tasy",
  orgId: "hospital-123",
  name: "Tasy Production",
  enabled: true,
  config: {
    host: "tasy.hospital.com",
    port: 2575,
    timeout: 30000,
    keepAlive: true,
    encoding: "utf8",
    enableZSegments: true,
    segments: {
      ZPD: true,
      ZPV: true,
    },
  },
});

// Health check all connectors
const health = await registry.healthCheckAll();
console.log(`Health: ${health.healthy}`);
console.log(`Total: ${health.totalConnectors}`);
console.log(`Healthy: ${health.healthyConnectors}`);
console.log(`Unhealthy: ${health.unhealthyConnectors}`);

// Health check organization connectors
const orgHealth = await registry.healthCheckOrg("hospital-123");

// Get statistics
const stats = registry.getStats();
console.log("Connectors by type:", stats.connectorsByType);
console.log("Connectors by org:", stats.connectorsByOrg);

// Reconnect all disconnected
await registry.reconnectAll();

// Remove organization connectors
await registry.removeOrgConnectors("hospital-123");
```

**Health Check Response:**

```typescript
{
  healthy: true,
  totalConnectors: 5,
  healthyConnectors: 4,
  unhealthyConnectors: 1,
  connectors: {
    'hospital-123:tasy:Production': {
      healthy: true,
      status: 'connected',
      message: 'Connected to Tasy Production',
      metrics: {
        messagesSent: 1542,
        messagesReceived: 1542,
        errors: 3,
        lastMessageAt: '2024-01-15T14:32:10Z',
        connectionUptime: 3600000,
        averageLatency: 245
      },
      timestamp: '2024-01-15T14:35:00Z'
    }
  },
  timestamp: '2024-01-15T14:35:00Z'
}
```

---

## Health Check Endpoints

All connectors implement a standard health check interface. Here are example HTTP endpoints you could expose:

### Global Health Check

```
GET /api/connectors/health
```

Response:

```json
{
  "healthy": true,
  "totalConnectors": 5,
  "healthyConnectors": 4,
  "unhealthyConnectors": 1,
  "timestamp": "2024-01-15T14:35:00Z"
}
```

### Organization Health Check

```
GET /api/connectors/health/:orgId
```

Response:

```json
{
  "healthy": true,
  "totalConnectors": 2,
  "healthyConnectors": 2,
  "unhealthyConnectors": 0,
  "connectors": {
    "hospital-123:tasy:Production": {
      "healthy": true,
      "status": "connected",
      "metrics": {
        "messagesSent": 1542,
        "messagesReceived": 1542,
        "errors": 3,
        "averageLatency": 245
      }
    }
  },
  "timestamp": "2024-01-15T14:35:00Z"
}
```

### Individual Connector Health

```
GET /api/connectors/:orgId/:type/:name/health
```

Response:

```json
{
  "healthy": true,
  "status": "connected",
  "message": "Connected to Tasy Production",
  "metrics": {
    "messagesSent": 1542,
    "messagesReceived": 1542,
    "errors": 3,
    "lastMessageAt": "2024-01-15T14:32:10Z",
    "connectionUptime": 3600000,
    "averageLatency": 245
  },
  "timestamp": "2024-01-15T14:35:00Z"
}
```

---

## Error Handling

All connectors use a standard `ConnectorError` type:

```typescript
interface ConnectorError extends Error {
  code: string; // ERROR_CODE
  connector: string; // Connector type
  retryable: boolean; // Can be retried?
  details?: any; // Additional context
}
```

**Common Error Codes:**

- `INVALID_CONFIG` - Configuration validation failed
- `CONNECTION_FAILED` - Cannot establish connection
- `NO_CONNECTION` - No available connections in pool
- `ACK_TIMEOUT` - HL7 ACK not received in time
- `MESSAGE_ERROR` - HL7 message rejected (AE)
- `MESSAGE_REJECTED` - HL7 message rejected (AR)
- `INVALID_ACK` - ACK format invalid
- `AUTH_ERROR` - Authentication failed
- `ENDPOINT_NOT_FOUND` - REST endpoint not configured
- `API_ERROR` - External API error
- `XML_ERROR` - XML processing error
- `QIDO_ERROR` - DICOMweb query error
- `WADO_ERROR` - DICOMweb retrieval error

---

## Testing

All connectors are designed to be testable with mocks:

```typescript
import { BaseConnector } from "./connectors";

class MockConnector extends BaseConnector {
  async connect(): Promise<void> {
    this.setStatus("connected");
  }

  async send(message: ConnectorMessage): Promise<void> {
    this.recordMessageSent();
  }

  async disconnect(): Promise<void> {
    this.setStatus("disconnected");
  }
}

// Test with mock
const connector = new MockConnector({
  type: "generic-hl7",
  orgId: "test",
  name: "Test",
  enabled: true,
  config: {},
});

connector.on("message-sent", (data) => {
  console.log("Message sent:", data.count);
});

await connector.connect();
await connector.send(testMessage);
```

---

## Metrics Collection

All connectors automatically collect metrics:

```typescript
interface ConnectorMetrics {
  messagesSent: number;
  messagesReceived: number;
  errors: number;
  lastMessageAt?: Date;
  lastErrorAt?: Date;
  connectionUptime: number; // milliseconds
  averageLatency: number; // milliseconds (EMA)
}
```

Metrics can be exported to monitoring systems:

```typescript
const metrics = connector.getMetrics();

// Export to Prometheus, CloudWatch, etc.
prometheus.gauge("connector_messages_sent", metrics.messagesSent);
prometheus.gauge("connector_messages_received", metrics.messagesReceived);
prometheus.gauge("connector_errors", metrics.errors);
prometheus.gauge("connector_latency", metrics.averageLatency);
prometheus.gauge("connector_uptime", metrics.connectionUptime);
```

---

## Type Safety

All connectors are fully typed with TypeScript strict mode:

```typescript
// Type-safe configuration
const config: TasyConfig = {
  host: "tasy.hospital.com",
  port: 2575,
  timeout: 30000,
  keepAlive: true,
  encoding: "utf8",
  enableZSegments: true,
  segments: {
    ZPD: true,
    ZPV: true,
  },
};

// Type-safe messages
const message: ConnectorMessage = {
  id: "msg-001",
  timestamp: new Date(),
  source: "IntegraSaude",
  destination: "HIS",
  type: "ADT^A01",
  payload: {
    patient: {
      id: "12345",
      name: "John Doe",
    },
  },
};
```

---

## Dependencies

The following packages are used:

- **pino** - Structured logging
- **pino-pretty** - Pretty logging for development
- **axios** - HTTP client for REST and DICOMweb
- **fast-xml-parser** - XML parsing and building
- **ioredis** - Redis client (for future caching)

---

## Future Enhancements

Potential future additions:

1. **FHIR Connector** - Native FHIR R4/R5 support
2. **Caching Layer** - Redis caching for queries
3. **Message Queue** - RabbitMQ/Kafka integration
4. **Circuit Breaker** - Protection against cascading failures
5. **Rate Limiting** - Prevent API overload
6. **Compression** - GZIP support for large payloads
7. **Encryption** - TLS/SSL certificate management
8. **Audit Trail** - Message audit logging
9. **DICOM SCP** - Direct DICOM C-STORE/C-FIND support
10. **HL7 FHIR Conversion** - Automatic HL7v2 to FHIR mapping

---

## Summary

Epic 4 - Connectors has been successfully implemented with:

- 7 Stories (S18-S24) completed
- 6 Connector types (Base, HL7, Tasy, MV Soul, Pixeon, REST)
- 1 Registry for lifecycle management
- Full TypeScript strict mode compliance
- Comprehensive error handling and retry logic
- Automatic metrics collection
- Health check aggregation
- Connection pooling and automatic reconnection
- Support for major Brazilian HIS vendors

All code is production-ready, well-documented, and follows best practices for healthcare integration.
