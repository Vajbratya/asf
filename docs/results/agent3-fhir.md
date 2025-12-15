# IntegraSaúde - Epic 3: FHIR Store Implementation Results

## Overview

This document describes the implementation of Epic 3 - FHIR Store, which provides a complete FHIR R4 storage and API system for the IntegraSaúde healthcare integration platform.

## What Was Built

### 1. Story S14 - FHIR Store Service

**File:** `/apps/api/src/services/fhir-store.ts`

A comprehensive FHIR resource storage service that:

- Stores FHIR resources in PostgreSQL using JSONB
- Provides CRUD operations for any FHIR resource type
- Implements version tracking (meta.versionId)
- Processes transaction Bundles
- Integrates BR-Core validation for Patient resources
- Uses soft deletes (resources marked as deleted, not removed)

**Key Features:**

- `create(resource)` - Create new FHIR resources with validation
- `read(type, id)` - Retrieve the latest version of a resource
- `update(type, id, resource)` - Update resources with versioning
- `delete(type, id)` - Soft delete resources
- `processBundle(bundle)` - Process transaction/batch Bundles with multiple operations

### 2. Story S15 - FHIR Search Service

**File:** `/apps/api/src/services/fhir-search.ts`

A powerful search service using PostgreSQL JSONB queries:

**Patient Search Parameters:**

- `identifier` - Search by any identifier
- `cpf` - Search by CPF specifically
- `cns` - Search by CNS specifically
- `name` - Search by name (family or given)
- `family` - Search by family name
- `given` - Search by given name
- `birthdate` - Search by birth date
- `gender` - Search by gender

**Encounter Search Parameters:**

- `patient` - Search by patient reference
- `status` - Search by encounter status
- `date` - Search by date (supports ge/le prefixes)
- `class` - Search by encounter class

**DiagnosticReport Search Parameters:**

- `patient` - Search by patient reference
- `status` - Search by report status
- `category` - Search by report category
- `code` - Search by diagnostic code
- `date` - Search by date (supports ge/le prefixes)

**Advanced Features:**

- Pagination with `_count` and `_offset` parameters
- `_include` parameter for including referenced resources
- Returns results as FHIR Bundle (searchset type)

### 3. Story S16 - FHIR REST API

**File:** `/apps/api/src/routes/fhir.ts`

Complete RESTful API implementing FHIR R4 HTTP specification:

**Endpoints:**

- `GET /fhir/:type/:id` - Read a specific resource
- `POST /fhir/:type` - Create a new resource
- `PUT /fhir/:type/:id` - Update an existing resource
- `DELETE /fhir/:type/:id` - Delete a resource
- `POST /fhir` - Process a transaction Bundle
- `GET /fhir/:type` - Search resources

**HTTP Status Codes:**

- `200 OK` - Successful read/update/search
- `201 Created` - Successful create
- `204 No Content` - Successful delete
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation error
- `500 Internal Server Error` - Server error

### 4. Story S17 - BR-Core Validator

**File:** `/apps/api/src/services/br-core-validator.ts`

Brazilian FHIR profile validator:

**Validation Rules:**

1. Patient must have at least one identifier
2. Patient must have either CPF or CNS identifier
3. CPF validation:
   - Must be 11 digits
   - Cannot have all same digits
   - Valid check digits using Brazilian algorithm
4. CNS validation:
   - Must be 15 digits
   - Must start with 1, 2, 7, 8, or 9
   - Valid check digits for definitive (1,2) and provisional (7,8,9) CNS

**Returns:** Structured `OperationOutcome` with detailed error messages

## Project Structure

```
integrabrasil-agent3/
├── apps/
│   └── api/
│       ├── prisma/
│       │   └── schema.prisma          # Database schema
│       ├── src/
│       │   ├── routes/
│       │   │   └── fhir.ts            # S16: FHIR REST API
│       │   ├── services/
│       │   │   ├── fhir-store.ts      # S14: FHIR Store Service
│       │   │   ├── fhir-search.ts     # S15: FHIR Search Service
│       │   │   ├── br-core-validator.ts  # S17: BR-Core Validator
│       │   │   └── br-core-validator.test.ts  # Tests
│       │   ├── types/
│       │   │   └── fhir.ts            # FHIR type definitions
│       │   ├── utils/
│       │   │   └── fhir-helpers.ts    # Helper functions
│       │   └── index.ts               # Express app entry point
│       ├── package.json
│       ├── tsconfig.json
│       └── vitest.config.ts
├── package.json
├── .gitignore
└── RESULTS.md
```

## API Examples

### 1. Create a Patient

**Request:**

```http
POST /fhir/Patient
Content-Type: application/json

{
  "resourceType": "Patient",
  "identifier": [
    {
      "system": "http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf",
      "value": "12345678909"
    }
  ],
  "name": [
    {
      "use": "official",
      "family": "Silva",
      "given": ["João", "Pedro"]
    }
  ],
  "gender": "male",
  "birthDate": "1990-05-15",
  "telecom": [
    {
      "system": "phone",
      "value": "+55 11 98765-4321",
      "use": "mobile"
    }
  ],
  "address": [
    {
      "use": "home",
      "line": ["Rua das Flores, 123"],
      "city": "São Paulo",
      "state": "SP",
      "postalCode": "01234-567",
      "country": "BR"
    }
  ]
}
```

**Response (201 Created):**

```json
{
  "resourceType": "Patient",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "meta": {
    "versionId": "1",
    "lastUpdated": "2025-12-15T10:30:00.000Z"
  },
  "identifier": [
    {
      "system": "http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf",
      "value": "12345678909"
    }
  ],
  "name": [
    {
      "use": "official",
      "family": "Silva",
      "given": ["João", "Pedro"]
    }
  ],
  "gender": "male",
  "birthDate": "1990-05-15",
  "telecom": [
    {
      "system": "phone",
      "value": "+55 11 98765-4321",
      "use": "mobile"
    }
  ],
  "address": [
    {
      "use": "home",
      "line": ["Rua das Flores, 123"],
      "city": "São Paulo",
      "state": "SP",
      "postalCode": "01234-567",
      "country": "BR"
    }
  ]
}
```

### 2. Search Patients by CPF

**Request:**

```http
GET /fhir/Patient?cpf=12345678909
```

**Response (200 OK):**

```json
{
  "resourceType": "Bundle",
  "type": "searchset",
  "total": 1,
  "entry": [
    {
      "fullUrl": "Patient/550e8400-e29b-41d4-a716-446655440000",
      "resource": {
        "resourceType": "Patient",
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "meta": {
          "versionId": "1",
          "lastUpdated": "2025-12-15T10:30:00.000Z"
        },
        "identifier": [
          {
            "system": "http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf",
            "value": "12345678909"
          }
        ],
        "name": [
          {
            "use": "official",
            "family": "Silva",
            "given": ["João", "Pedro"]
          }
        ],
        "gender": "male",
        "birthDate": "1990-05-15"
      },
      "search": {
        "mode": "match"
      }
    }
  ]
}
```

### 3. Create an Encounter

**Request:**

```http
POST /fhir/Encounter
Content-Type: application/json

{
  "resourceType": "Encounter",
  "status": "finished",
  "class": {
    "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
    "code": "AMB",
    "display": "ambulatory"
  },
  "subject": {
    "reference": "Patient/550e8400-e29b-41d4-a716-446655440000",
    "display": "João Pedro Silva"
  },
  "period": {
    "start": "2025-12-15T09:00:00Z",
    "end": "2025-12-15T09:30:00Z"
  },
  "type": [
    {
      "coding": [
        {
          "system": "http://www.saude.gov.br/fhir/r4/CodeSystem/BRTipoAtendimento",
          "code": "01",
          "display": "Consulta"
        }
      ]
    }
  ]
}
```

**Response (201 Created):**

```json
{
  "resourceType": "Encounter",
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "meta": {
    "versionId": "1",
    "lastUpdated": "2025-12-15T10:31:00.000Z"
  },
  "status": "finished",
  "class": {
    "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
    "code": "AMB",
    "display": "ambulatory"
  },
  "subject": {
    "reference": "Patient/550e8400-e29b-41d4-a716-446655440000",
    "display": "João Pedro Silva"
  },
  "period": {
    "start": "2025-12-15T09:00:00Z",
    "end": "2025-12-15T09:30:00Z"
  },
  "type": [
    {
      "coding": [
        {
          "system": "http://www.saude.gov.br/fhir/r4/CodeSystem/BRTipoAtendimento",
          "code": "01",
          "display": "Consulta"
        }
      ]
    }
  ]
}
```

### 4. Search Encounters with Include

**Request:**

```http
GET /fhir/Encounter?patient=Patient/550e8400-e29b-41d4-a716-446655440000&_include=Encounter:subject
```

**Response (200 OK):**

```json
{
  "resourceType": "Bundle",
  "type": "searchset",
  "total": 1,
  "entry": [
    {
      "fullUrl": "Encounter/660e8400-e29b-41d4-a716-446655440001",
      "resource": {
        "resourceType": "Encounter",
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "status": "finished",
        "subject": {
          "reference": "Patient/550e8400-e29b-41d4-a716-446655440000"
        }
      },
      "search": {
        "mode": "match"
      }
    },
    {
      "fullUrl": "Patient/550e8400-e29b-41d4-a716-446655440000",
      "resource": {
        "resourceType": "Patient",
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": [
          {
            "family": "Silva",
            "given": ["João", "Pedro"]
          }
        ]
      },
      "search": {
        "mode": "include"
      }
    }
  ]
}
```

### 5. Process Transaction Bundle

**Request:**

```http
POST /fhir
Content-Type: application/json

{
  "resourceType": "Bundle",
  "type": "transaction",
  "entry": [
    {
      "request": {
        "method": "POST",
        "url": "Patient"
      },
      "resource": {
        "resourceType": "Patient",
        "identifier": [
          {
            "system": "http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf",
            "value": "98765432100"
          }
        ],
        "name": [
          {
            "family": "Santos",
            "given": ["Maria"]
          }
        ],
        "gender": "female",
        "birthDate": "1985-03-20"
      }
    },
    {
      "request": {
        "method": "POST",
        "url": "Encounter"
      },
      "resource": {
        "resourceType": "Encounter",
        "status": "in-progress",
        "class": {
          "code": "AMB"
        },
        "subject": {
          "reference": "Patient/550e8400-e29b-41d4-a716-446655440000"
        }
      }
    }
  ]
}
```

**Response (200 OK):**

```json
{
  "resourceType": "Bundle",
  "type": "transaction-response",
  "entry": [
    {
      "response": {
        "status": "201 Created",
        "location": "Patient/770e8400-e29b-41d4-a716-446655440002",
        "etag": "W/\"1\"",
        "lastModified": "2025-12-15T10:32:00.000Z"
      },
      "resource": {
        "resourceType": "Patient",
        "id": "770e8400-e29b-41d4-a716-446655440002",
        "meta": {
          "versionId": "1",
          "lastUpdated": "2025-12-15T10:32:00.000Z"
        }
      }
    },
    {
      "response": {
        "status": "201 Created",
        "location": "Encounter/880e8400-e29b-41d4-a716-446655440003",
        "etag": "W/\"1\"",
        "lastModified": "2025-12-15T10:32:00.000Z"
      },
      "resource": {
        "resourceType": "Encounter",
        "id": "880e8400-e29b-41d4-a716-446655440003",
        "meta": {
          "versionId": "1",
          "lastUpdated": "2025-12-15T10:32:00.000Z"
        }
      }
    }
  ]
}
```

### 6. Validation Error Example

**Request:**

```http
POST /fhir/Patient
Content-Type: application/json

{
  "resourceType": "Patient",
  "identifier": [
    {
      "system": "http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf",
      "value": "11111111111"
    }
  ],
  "name": [
    {
      "family": "Test"
    }
  ]
}
```

**Response (422 Unprocessable Entity):**

```json
{
  "resourceType": "OperationOutcome",
  "issue": [
    {
      "severity": "error",
      "code": "invalid",
      "diagnostics": "BR-Core validation failed: CPF cannot have all digits the same",
      "expression": [
        "Patient.identifier.where(system=\"http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf\").value"
      ]
    }
  ]
}
```

## Validation Rules Summary

### Patient Resource (BR-Core Profile)

1. **Required Identifiers:**
   - Must have at least one identifier
   - Must have either CPF or CNS identifier

2. **CPF Validation:**
   - Format: 11 digits (accepts formatting like 123.456.789-09)
   - Cannot have all same digits (e.g., 111.111.111-11)
   - Must have valid check digits according to Brazilian algorithm

3. **CNS Validation:**
   - Format: 15 digits
   - Must start with 1, 2, 7, 8, or 9
   - Must have valid check digits (different algorithms for definitive and provisional)

### Identifier Systems

- **CPF:** `http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf`
- **CNS:** `http://rnds.saude.gov.br/fhir/r4/NamingSystem/cns`

## Database Schema

The Prisma schema defines a single table for storing all FHIR resources:

```prisma
model FhirResource {
  id            String   @id @default(uuid())
  resourceType  String   // e.g., "Patient", "Encounter"
  resourceId    String   // FHIR resource.id
  versionId     Int      @default(1)
  content       Json     // Full FHIR resource as JSONB
  deleted       Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([resourceType, resourceId, versionId])
  @@index([resourceType, resourceId])
  @@index([resourceType, deleted])
  @@index([createdAt])
}
```

**Key Features:**

- JSONB storage for flexible resource structure
- Version tracking for resource history
- Soft delete flag
- Indexes for efficient querying
- Support for JSONB-based search (can be enhanced with GIN indexes)

## Setup Instructions

### 1. Install Dependencies

```bash
cd apps/api
npm install
```

### 2. Configure Database

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env`:

```
DATABASE_URL="postgresql://user:password@localhost:5432/integrasaude?schema=public"
PORT=3000
NODE_ENV=development
```

### 3. Run Migrations

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4. Start Development Server

```bash
npm run dev
```

The API will be available at:

- Health check: `http://localhost:3000/health`
- FHIR API: `http://localhost:3000/fhir`

### 5. Run Tests

```bash
npm test
```

## Technical Highlights

### TypeScript Strict Mode

All code is written with TypeScript strict mode enabled, ensuring type safety and reducing runtime errors.

### Prisma ORM

- Type-safe database access
- Automatic migrations
- JSONB support for flexible FHIR resource storage

### FHIR R4 Compliance

- Proper resource structure
- OperationOutcome for errors
- Bundle support for transactions
- Search parameter support
- Version tracking

### Brazilian Healthcare Standards

- BR-Core profile validation
- CPF and CNS validation with proper algorithms
- RNDS identifier systems

### Error Handling

- Structured error responses using OperationOutcome
- Appropriate HTTP status codes
- Validation errors with detailed diagnostics

## Future Enhancements

1. **Database Indexes:**
   - Add GIN indexes for common JSONB search paths
   - Optimize search performance

2. **Additional Search Parameters:**
   - Support more FHIR search parameter types
   - Implement \_revinclude
   - Support chained parameters

3. **Authentication & Authorization:**
   - OAuth 2.0 / OpenID Connect
   - SMART on FHIR
   - Role-based access control

4. **Auditing:**
   - Track all resource changes
   - Audit log for compliance

5. **Bulk Operations:**
   - Bulk data export
   - Asynchronous operations

6. **Additional Resource Types:**
   - Observation
   - Medication
   - Immunization
   - etc.

## Testing

The implementation includes unit tests for the BR-Core validator. Additional tests should be added for:

- FHIR Store operations
- Search functionality
- API endpoints
- Bundle processing
- Error handling

Run tests with:

```bash
npm test
```

## Conclusion

Epic 3 - FHIR Store has been successfully implemented with all required stories:

- **S14** - FHIR Store Service with CRUD and Bundle support
- **S15** - FHIR Search with JSONB queries and pagination
- **S16** - FHIR REST API with proper HTTP semantics
- **S17** - BR-Core Validator for Brazilian profiles

The implementation provides a solid foundation for the IntegraSaúde healthcare integration platform, with type safety, proper validation, and FHIR R4 compliance.
