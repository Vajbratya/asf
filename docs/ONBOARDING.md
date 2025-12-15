# Hospital Onboarding Flow

Complete implementation of the hospital onboarding experience for IntegraSaúde.

## Overview

The onboarding flow guides new hospitals through setup in 5 clear steps:

1. **Organization Setup** - Company details, CNES, CNPJ, address
2. **Admin User** - First administrator account
3. **Plan Selection** - Choose subscription tier
4. **Payment** - Billing information (optional, can start with trial)
5. **Setup Complete** - Confirmation and next steps

## Features Implemented

### 1. Multi-Step Signup

**Location:** `/apps/web/src/app/(onboarding)/signup/`

- Visual step progress indicator
- Form validation on each step
- Data persistence across steps
- Back navigation support

**Components:**

- `page.tsx` - Main signup orchestrator
- `organization-form.tsx` - Organization details
- `admin-user-form.tsx` - Admin user creation
- `plan-selection-form.tsx` - Plan selection
- `payment-form.tsx` - Payment details
- `setup-complete.tsx` - Completion confirmation

### 2. Connector Setup Wizard

**Location:** `/apps/web/src/app/(dashboard)/setup/connector/`

Supports multiple hospital management systems:

- **Philips Tasy** - Brazilian HMS leader
- **MV Soul** - Comprehensive healthcare platform
- **Pixeon** - Medical imaging specialist
- **Generic HL7** - Any HL7 v2.x compatible system

**Features:**

- Vendor selection with visual cards
- Vendor-specific configuration forms
- HL7 MLLP connection settings
- TLS/STARTTLS support
- Optional REST API configuration
- Real-time connection testing
- Troubleshooting tips on failure

### 3. First Message Flow

**Location:** `/apps/web/src/app/(dashboard)/setup/first-message/`

Guides users to send their first test message:

- Real-time message polling
- Sample HL7 message provided
- Copy-to-clipboard functionality
- Instructions for Tasy and command-line
- Celebration on success
- Message details display

### 4. Onboarding Progress Tracking

**Component:** `/apps/web/src/components/onboarding-checklist.tsx`

Tracks 7 key onboarding steps:

1. Create Account
2. Setup Billing
3. Add Connector
4. Test Connection
5. Receive First Message
6. Configure Webhook
7. Generate API Key

**Features:**

- Visual progress bar
- Percentage completion
- Action buttons for incomplete steps
- Real-time updates
- Displayed on dashboard

### 5. API Endpoints

#### Setup API (`/api/v1/setup`)

**POST /test-connection**

```typescript
{
  "type": "TASY" | "MV_SOUL" | "PIXEON" | "GENERIC_HL7",
  "config": {
    "host": "192.168.1.100",
    "port": 2575,
    "tlsMode": "none" | "tls" | "starttls",
    "companyId": "1",
    "hospitalCode": "1234567"
  }
}
```

Response:

```typescript
{
  "success": true,
  "message": "Connection successful",
  "details": {
    "connected": true,
    "latency": 1234,
    "version": "2.5"
  }
}
```

Error Response:

```typescript
{
  "success": false,
  "message": "Connection failed: ECONNREFUSED",
  "troubleshooting": [
    "Check that the hospital system is running",
    "Verify the IP address and port are correct",
    "Ensure firewall allows connections on this port"
  ]
}
```

#### Onboarding API (`/api/v1/onboarding`)

**GET /progress**

```typescript
{
  "steps": [
    {
      "id": "account",
      "name": "Create Account",
      "completed": true
    },
    {
      "id": "connector",
      "name": "Add Connector",
      "completed": false,
      "action": {
        "label": "Add Connector",
        "href": "/setup/connector"
      }
    }
  ],
  "percentComplete": 28
}
```

**POST /complete**
Marks onboarding as complete.

**GET /status**

```typescript
{
  "complete": false
}
```

## Database Schema

### New Enums

```prisma
enum HospitalVendor {
  TASY
  MV_SOUL
  PIXEON
  GENERIC_HL7
  OTHER
}

enum PlanType {
  STARTER
  PROFESSIONAL
  ENTERPRISE
  CUSTOM
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELED
  TRIALING
  INCOMPLETE
  INCOMPLETE_EXPIRED
  UNPAID
}

enum BillingPeriod {
  MONTHLY
  ANNUAL
}
```

### Updated Models

**Organization**

- Added `slug` (unique URL identifier)
- Added `cnes` (Brazilian hospital ID)
- Added billing fields (`planType`, `stripeCustomerId`, `billingEmail`)
- Added address fields
- Added technical contact fields
- Added `onboardingCompletedAt` timestamp

**Connector**

- Added `vendor` field
- Added `lastHealthCheck` timestamp

### New Models

**ApiKey**

- Secure API key management
- Tracks usage and expiration
- Prefix for display

**Webhook**

- URL for event notifications
- Event filtering
- Signature verification secret
- Active/inactive toggle

**Subscription**

- Stripe subscription tracking
- Plan type and billing period
- Trial period support
- Cancellation handling

## UI Components

### New Components

1. **Progress** (`/components/ui/progress.tsx`)
   - Visual progress bar
   - Animated transitions

2. **Select** (`/components/ui/select.tsx`)
   - Dropdown select component
   - Radix UI based
   - Keyboard navigation

3. **Steps** (`/components/ui/steps.tsx`)
   - Multi-step progress indicator
   - Visual step completion
   - Current step highlighting

4. **Alert** (`/components/ui/alert.tsx`)
   - Success/error messaging
   - Variant support
   - Icon integration

5. **OnboardingChecklist** (`/components/onboarding-checklist.tsx`)
   - Progress tracking
   - Action buttons
   - Real-time updates

## User Flow

### New Hospital Registration

1. User visits `/signup`
2. Completes 5-step form:
   - Organization details (CNES, CNPJ, address)
   - Admin user creation
   - Plan selection (with trial option)
   - Payment (optional)
   - Confirmation

3. Redirected to `/setup/connector`
4. Selects hospital vendor
5. Configures connection details
6. Tests connection
7. Saves connector

8. Redirected to `/setup/first-message`
9. Waits for first message
10. Sends test message
11. Celebrates success

12. Redirected to `/dashboard`
13. Sees onboarding checklist
14. Completes remaining steps:
    - Configure webhook
    - Generate API key

### Onboarding Progress

The onboarding checklist is displayed on the dashboard until all steps are complete. Users can:

- See overall progress percentage
- View completed vs. pending steps
- Click action buttons to complete steps
- Track their setup journey

## Testing

### Manual Testing

1. **Signup Flow**

   ```
   Navigate to: http://localhost:3000/signup
   Complete all 5 steps
   Verify data persistence across steps
   Test back navigation
   ```

2. **Connector Setup**

   ```
   Navigate to: http://localhost:3000/setup/connector
   Select each vendor
   Fill in configuration
   Test connection (will simulate success/failure)
   Save connector
   ```

3. **First Message**

   ```
   Navigate to: http://localhost:3000/setup/first-message
   Copy sample message
   Send via your hospital system or command line
   Verify celebration on receipt
   ```

4. **Onboarding Checklist**
   ```
   Navigate to: http://localhost:3000/dashboard
   Verify checklist appears
   Complete remaining steps
   Verify progress updates
   ```

### API Testing

```bash
# Test connection
curl -X POST http://localhost:3001/api/v1/setup/test-connection \
  -H "Content-Type: application/json" \
  -d '{
    "type": "TASY",
    "config": {
      "host": "192.168.1.100",
      "port": 2575,
      "tlsMode": "none"
    }
  }'

# Get onboarding progress
curl http://localhost:3001/api/v1/onboarding/progress \
  -H "x-organization-id: your-org-id"
```

## Future Enhancements

1. **Email Verification** - Verify admin user email
2. **Phone Verification** - SMS verification for security
3. **Video Tutorials** - Embedded walkthrough videos
4. **Live Chat Support** - Help during onboarding
5. **Automated Testing** - Test connections automatically
6. **Import Wizard** - Bulk import of existing data
7. **Custom Branding** - White-label for partners
8. **Multi-language** - Portuguese and English support
9. **Mobile Onboarding** - Responsive mobile experience
10. **Analytics** - Track onboarding completion rates

## Troubleshooting

### Common Issues

**Connection Test Fails**

- Verify network connectivity
- Check firewall rules
- Ensure hospital system is running
- Verify IP and port are correct

**Form Data Not Persisting**

- Check browser local storage
- Verify React state management
- Check for console errors

**API Errors**

- Check API server is running
- Verify authentication headers
- Check database connection

## Support

For implementation questions or issues:

- Check the codebase documentation
- Review the API documentation
- Contact the development team

## License

Proprietary - IntegraSaúde
