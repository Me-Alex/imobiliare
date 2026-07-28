# HQS IMOBILIARE - IMPLEMENTATION GUIDE
## Vizionare & Document System Refactor

**Project:** HQS Imobiliare  
**Version:** 2.0  
**Date:** 2026-07-25  
**Status:** READY FOR IMPLEMENTATION

---

## ✅ DECISIONS MADE

| # | Feature | Decision | Justification |
|---|---------|----------|---------------|
| 1 | Signature Method | **BOTH** (Typed + Drawn) | Flexibility for clients |
| 2 | Document Verification | **Agent Manual Review** | Legal AML requirement |
| 3 | Calendar Sync | **Google Calendar** | Most popular platform |
| 4 | Reminders | **Email + SMS** | Already have Resend + Twilio |
| 5 | Offline/PWA | **Basic PWA** | Installable app, offline viewing |

---

## 📋 IMPLEMENTATION CHECKLIST

### PHASE 1: Foundation (Backend + Schema)
- [ ] New database migrations
- [ ] API endpoints for appointments
- [ ] Document upload API
- [ ] Signature API
- [ ] Notification system

### PHASE 2: Frontend (Core UX)
- [ ] AppointmentWorkspace component
- [ ] Step-by-step flow
- [ ] Document upload with progress
- [ ] Signature pad component
- [ ] PDF preview component

### PHASE 3: Integrations
- [ ] Google Calendar API
- [ ] Email notifications (Resend)
- [ ] SMS notifications (Twilio)
- [ ] Calendar ICS generation

### PHASE 4: Agent Dashboard
- [ ] Document review queue
- [ ] One-click verify/reject
- [ ] Appointment management

---

## 🔧 QUICK START

### Install Dependencies
```bash
bun add react-pdf react-dropzone @react-pdf/renderer signature-canvas
```

### Add Environment Variables
```bash
# Google Calendar
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Notifications (already configured)
RESEND_API_KEY=  # already in .env
TWILIO_ACCOUNT_SID=  # already in .env
TWILIO_AUTH_TOKEN=  # already in .env
```

---

## 📁 FILE STRUCTURE TO CREATE

```
src/
├── features/
│   └── appointment-workspace/
│       ├── components/
│       │   ├── appointment-header.tsx
│       │   ├── step-progress.tsx
│       │   ├── steps/
│       │   │   ├── schedule-step.tsx
│       │   │   ├── prepare-step.tsx
│       │   │   ├── sign-step.tsx
│       │   │   └── confirm-step.tsx
│       │   ├── documents/
│       │   │   ├── document-checklist.tsx
│       │   │   ├── document-upload.tsx
│       │   │   ├── document-preview.tsx
│       │   │   ├── signature-input.tsx
│       │   │   └── signature-pad.tsx
│       │   └── shared/
│       │       ├── availability-picker.tsx
│       │       ├── google-calendar-btn.tsx
│       │       └── notification-settings.tsx
│       ├── hooks/
│       │   ├── use-appointment.ts
│       │   ├── use-document-upload.ts
│       │   ├── use-signature.ts
│       │   └── use-google-calendar.ts
│       ├── lib/
│       │   ├── appointment-api.ts
│       │   ├── document-api.ts
│       │   ├── calendar-api.ts
│       │   ├── notification-api.ts
│       │   └── types.ts
│       └── pages/
│           └── appointment-workspace-page.tsx
│
├── components/
│   └── shared/
│       ├── pdf-viewer.tsx
│       └── file-upload-area.tsx
│
└── app/
    └── api/
        ├── appointments/
        │   ├── route.ts
        │   └── [id]/
        │       ├── route.ts
        │       ├── documents/
        │       │   ├── route.ts
        │       │   └── [docId]/
        │       │       └── route.ts
        │       └── sign/
        │           └── route.ts
        └── notifications/
            └── schedule/
                └── route.ts
```

---

## 🗄️ DATABASE MIGRATIONS

### Migration 1: Clean Appointment Schema
```sql
-- appointments table (simplified, clean)
CREATE TABLE appointments_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Client info
  client_id UUID REFERENCES auth.users(id),
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  
  -- Property
  property_id UUID REFERENCES properties(id),
  property_title TEXT NOT NULL,
  
  -- Agent
  agent_id UUID REFERENCES staff_members(id),
  agent_name TEXT NOT NULL,
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'SCHEDULED',
  -- SCHEDULED | CONFIRMED | IN_PROGRESS | COMPLETED | CANCELLED | NO_SHOW
  
  -- GDPR & Terms
  terms_accepted_at TIMESTAMPTZ,
  privacy_accepted_at TIMESTAMPTZ,
  privacy_notice_version TEXT,
  
  -- Google Calendar
  google_event_id TEXT,
  google_calendar_synced BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  checked_in_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Constraints
  CHECK (scheduled_end > scheduled_at),
  UNIQUE (agent_id, scheduled_at) EXCLUDE USING gist
);

-- Document checklist
CREATE TABLE document_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments_v2(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  required BOOLEAN DEFAULT TRUE,
  uploaded_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES staff_members(id),
  rejection_reason TEXT,
  status TEXT DEFAULT 'PENDING',
  -- PENDING | UPLOADED | VERIFIED | REJECTED
  
  UNIQUE (appointment_id, document_type)
);

-- Digital signatures
CREATE TABLE signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments_v2(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  
  signer_id UUID REFERENCES auth.users(id),
  signer_name TEXT NOT NULL,
  signer_role TEXT NOT NULL, -- CLIENT | AGENT
  
  -- Signature method
  method TEXT NOT NULL, -- TYPED | DRAWN
  signature_text TEXT, -- For TYPED method
  signature_image_url TEXT, -- For DRAWN method (stored image)
  
  -- Consent
  consent_accepted_at TIMESTAMPTZ NOT NULL,
  
  -- Audit
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  
  UNIQUE (appointment_id, document_type, signer_id)
);

-- Document uploads (files)
CREATE TABLE document_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments_v2(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  
  -- File info
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  storage_bucket TEXT DEFAULT 'client-documents',
  
  -- Metadata
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Verification
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES staff_members(id),
  rejection_reason TEXT,
  status TEXT DEFAULT 'PENDING',
  -- PENDING | VERIFIED | REJECTED
  
  -- Checksum for integrity
  checksum TEXT
);

-- Notification preferences
CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  email_reminders BOOLEAN DEFAULT TRUE,
  sms_reminders BOOLEAN DEFAULT TRUE,
  reminder_hours_before INTEGER DEFAULT 24,
  whatsapp_notifications BOOLEAN DEFAULT FALSE,
  
  -- Scheduling
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log for document access
CREATE TABLE document_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES document_uploads(id),
  action TEXT NOT NULL, -- VIEW | DOWNLOAD | VERIFY | REJECT | DELETE
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB
);

-- Indexes
CREATE INDEX idx_appointments_client ON appointments_v2(client_id);
CREATE INDEX idx_appointments_agent ON appointments_v2(agent_id);
CREATE INDEX idx_appointments_status ON appointments_v2(status);
CREATE INDEX idx_appointments_scheduled ON appointments_v2(scheduled_at);
CREATE INDEX idx_documents_appointment ON document_uploads(appointment_id);
CREATE INDEX idx_documents_status ON document_uploads(status);
CREATE INDEX idx_signatures_appointment ON signatures(appointment_id);
CREATE INDEX idx_audit_document ON document_audit_log(document_id);
```

---

## 🔐 SECURITY & GDPR COMPLIANCE

### Required Implementation

1. **Privacy Notice Display** (before upload)
```typescript
// Show this BEFORE client uploads any documents
const GDPRConsent = () => (
  <div className="p-4 border rounded-lg">
    <h3>Informare Prelucrare Date Personale</h3>
    <p>
      <strong>Scopul:</strong> Conform Legii 129/2019 AML, 
      suntem obligați să verificăm identitatea clienților.
    </p>
    <p>
      <strong>Temei:</strong> Art. 6(1)(c) GDPR - Obligație legală
    </p>
    <p>
      <strong>Păstrare:</strong> 5 ani conform legislației AML
    </p>
    <Checkbox label="Am citit și accept informarea" />
  </div>
)
```

2. **Audit Logging** (automatic)
```typescript
// Every document view/download must be logged
async function logDocumentAccess(
  documentId: string,
  action: 'VIEW' | 'DOWNLOAD' | 'VERIFY',
  userId: string
) {
  await supabase.from('document_audit_log').insert({
    document_id: documentId,
    action,
    performed_by: userId,
    performed_at: new Date().toISOString(),
    ip_address: request.headers.get('x-forwarded-for'),
    user_agent: request.headers.get('user-agent')
  })
}
```

3. **Retention Policy** (automated)
```sql
-- PostgreSQL event trigger for auto-deletion after 5 years
CREATE OR REPLACE FUNCTION delete_expired_documents()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.created_at < NOW() - INTERVAL '5 years' THEN
    -- Delete from storage first
    PERFORM supabase.storage.from('client-documents').remove([OLD.storage_path]);
    -- Then delete record
    DELETE FROM document_uploads WHERE id = OLD.id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER document_retention_trigger
BEFORE DELETE ON document_uploads
FOR EACH ROW EXECUTE FUNCTION delete_expired_documents();
```

---

## 📅 GOOGLE CALENDAR INTEGRATION

### Setup

1. Create OAuth credentials at https://console.cloud.google.com
2. Add scopes: `calendar.events`
3. Store in environment variables

### Implementation

```typescript
// src/features/appointment-workspace/lib/calendar-api.ts

interface CalendarEvent {
  summary: string;
  description: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  attendees?: { email: string }[];
  reminders?: { useDefault: boolean; overrides: { method: string; minutes: number }[] };
}

export async function createGoogleCalendarEvent(
  accessToken: string,
  appointment: Appointment
): Promise<string> {
  const event: CalendarEvent = {
    summary: `🏠 Vizionare: ${appointment.propertyTitle}`,
    description: `
      Agent: ${appointment.agentName}
      Proprietate: ${appointment.propertyTitle}
      
      Confirmați prezența: ${getAppUrl()}/vizionari/${appointment.id}
    `.trim(),
    start: {
      dateTime: appointment.scheduledAt,
      timeZone: 'Europe/Bucharest',
    },
    end: {
      dateTime: appointment.scheduledEnd,
      timeZone: 'Europe/Bucharest',
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 60 * 24 }, // 24 hours
        { method: 'popup', minutes: 60 * 2 }, // 2 hours
      ],
    },
  };

  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  );

  const data = await response.json();
  return data.id; // Google Event ID
}

// Generate ICS file (fallback + email attachment)
export function generateICS(appointment: Appointment): string {
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HQS Imobiliare//RO',
    'BEGIN:VEVENT',
    `UID:${appointment.id}@hqsimobiliare.ro`,
    `DTSTAMP:${formatICS(new Date())}`,
    `DTSTART:${formatICS(new Date(appointment.scheduledAt))}`,
    `DTEND:${formatICS(new Date(appointment.scheduledEnd))}`,
    `SUMMARY:Vizionare: ${appointment.propertyTitle}`,
    `DESCRIPTION:Agent: ${appointment.agentName}`,
    `LOCATION:${appointment.propertyTitle}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  
  return ics;
}
```

---

## 📱 NOTIFICATION SYSTEM

### Email Templates (Resend)

```typescript
// src/lib/notifications/email-templates.ts

export const emailTemplates = {
  bookingConfirmation: {
    subject: '✅ Vizionare confirmată: {{propertyTitle}}',
    template: `
      <h1>Vizionare programată!</h1>
      <p>Bună {{clientName}},</p>
      <p>Vizionarea ta a fost confirmată:</p>
      <ul>
        <li><strong>Data:</strong> {{date}}</li>
        <li><strong>Ora:</strong> {{time}}</li>
        <li><strong>Agent:</strong> {{agentName}}</li>
        <li><strong>Proprietate:</strong> {{propertyTitle}}</li>
      </ul>
      
      <h2>Ce trebuie să pregătești:</h2>
      <ul>
        <li>CI/Pașaport</li>
        <li>Dovadă adresă (factură utilități)</li>
      </ul>
      
      <p>
        <a href="{{calendarLink}}">📅 Adaugă în Google Calendar</a>
      </p>
    `
  },
  
  reminder24h: {
    subject: '⏰ Vizionare mâine: {{propertyTitle}}',
    template: `
      <h1>Vizionare mâine!</h1>
      <p>Îți amintim că ai programată vizionarea pentru mâine.</p>
      <ul>
        <li><strong>Data:</strong> {{date}}</li>
        <li><strong>Ora:</strong> {{time}}</li>
        <li><strong>Agent:</strong> {{agentName}} - {{agentPhone}}</li>
      </ul>
      
      <p>Nu uita să aduci:</p>
      <ul>
        <li>CI/Pașaport</li>
        <li>Dovadă adresă</li>
      </ul>
    `
  },
  
  reminder2h: {
    subject: '🏠 Vizionare în 2 ore!',
    template: `
      <h1>În 2 ore ne vedem!</h1>
      <p>{{agentName}} te așteaptă la {{propertyTitle}}.</p>
      <p>Adresa: {{propertyAddress}}</p>
    `
  },
  
  documentUploaded: {
    subject: '📄 Document încărcat: {{documentType}}',
    template: `
      <h1>Document nou</h1>
      <p>{{clientName}} a încărcat: {{documentType}}</p>
      <p>
        <a href="{{adminLink}}">Verifică documentul</a>
      </p>
    `
  }
}
```

### SMS Templates (Twilio)

```typescript
// src/lib/notifications/sms-templates.ts

export const smsTemplates = {
  bookingConfirmation: 
    '✅ Vizionare confirmata pentru {{date}} la {{time}}. Agent: {{agentName}}. Detalii: {{link}}',
  
  reminder24h: 
    '⏰ Marti, {{date}}, {{time}} - vizionare {{propertyTitle}}. Agent: {{agentName}} - {{agentPhone}}',
  
  reminder2h: 
    '🏠 Vizionare in 2 ore! Te asteptam la {{propertyAddress}}. Suna inainte: {{agentPhone}}',
  
  agentNewBooking:
    '🆕 Programare noua: {{clientName}} - {{propertyTitle}} - {{date}} {{time}}. Verifica: {{link}}',
  
  documentUploaded:
    '📄 {{clientName}} a incarcat documente. Verifica: {{link}}'
}
```

### Notification Scheduling

```typescript
// src/lib/notifications/scheduler.ts

interface ScheduledNotification {
  appointmentId: string;
  type: 'confirmation' | 'reminder_24h' | 'reminder_2h' | 'feedback';
  scheduledFor: Date;
  channel: 'email' | 'sms';
  status: 'pending' | 'sent' | 'failed';
}

export async function scheduleAppointmentNotifications(
  appointment: Appointment
): Promise<void> {
  const notifications: ScheduledNotification[] = [
    // Immediate confirmation
    {
      appointmentId: appointment.id,
      type: 'confirmation',
      scheduledFor: new Date(),
      channel: 'email',
      status: 'pending'
    },
    {
      appointmentId: appointment.id,
      type: 'confirmation', 
      scheduledFor: new Date(),
      channel: 'sms',
      status: 'pending'
    },
    // 24h reminder
    {
      appointmentId: appointment.id,
      type: 'reminder_24h',
      scheduledFor: subHours(new Date(appointment.scheduledAt), 24),
      channel: 'email',
      status: 'pending'
    },
    // 2h reminder
    {
      appointmentId: appointment.id,
      type: 'reminder_2h',
      scheduledFor: subHours(new Date(appointment.scheduledAt), 2),
      channel: 'sms',
      status: 'pending'
    }
  ];

  await supabase.from('scheduled_notifications').insert(notifications);
}

// Cron job or Supabase Edge Function to process notifications
export async function processNotifications() {
  const due = await supabase
    .from('scheduled_notifications')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString());

  for (const notification of due.data ?? []) {
    try {
      if (notification.channel === 'email') {
        await sendEmailNotification(notification);
      } else {
        await sendSMSNotification(notification);
      }
      
      await supabase
        .from('scheduled_notifications')
        .update({ status: 'sent' })
        .eq('id', notification.id);
    } catch (error) {
      await supabase
        .from('scheduled_notifications')
        .update({ status: 'failed', error: String(error) })
        .eq('id', notification.id);
    }
  }
}
```

---

## ✍️ SIGNATURE COMPONENTS

### Typed Signature

```typescript
// src/features/appointment-workspace/components/documents/signature-input.tsx

export function TypedSignatureInput({
  onSign,
  prefillName = ''
}: {
  onSign: (signature: string) => void;
  prefillName?: string;
}) {
  const [name, setName] = useState(prefillName);
  
  return (
    <div className="space-y-4">
      <div>
        <Label>Nume complet pentru semnătură</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Popescu Ion"
          className="text-lg font-serif"
        />
      </div>
      
      {/* Preview of signature */}
      <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
        <p className="font-serif text-2xl text-gray-800 italic">
          {name || 'Semnătura ta'}
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Semnătură electronică simplă
        </p>
      </div>
      
      <Checkbox id="consent">
        <Label htmlFor="consent" className="text-sm">
          Confirm că am citit documentul și sunt de acord cu termenii 
          și condițiile prezentate.
        </Label>
      </Checkbox>
      
      <Button 
        onClick={() => onSign(name)}
        disabled={!name.trim()}
        className="w-full"
      >
        Semnează Documentul
      </Button>
    </div>
  );
}
```

### Drawn Signature Pad

```typescript
// src/features/appointment-workspace/components/documents/signature-pad.tsx

import SignatureCanvas from 'signature-canvas';

export function DrawnSignaturePad({
  onSign,
  onClear
}: {
  onSign: (signatureDataUrl: string) => void;
  onClear: () => void;
}) {
  const canvasRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  
  const handleSign = () => {
    if (!isEmpty && canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      onSign(dataUrl);
    }
  };
  
  const handleClear = () => {
    canvasRef.current?.clear();
    setIsEmpty(true);
    onClear();
  };
  
  return (
    <div className="space-y-4">
      <div className="border-2 border-gray-300 rounded-lg p-2 bg-white">
        <SignatureCanvas
          ref={canvasRef}
          penColor="black"
          canvasProps={{
            width: 500,
            height: 200,
            className: 'w-full h-48'
          }}
          whenEnd={() => setIsEmpty(false)}
        />
      </div>
      
      <div className="flex gap-2">
        <Button 
          variant="outline"
          onClick={handleClear}
          disabled={isEmpty}
        >
          Șterge
        </Button>
        <span className="flex-1 text-sm text-gray-500 text-right">
          Semnează cu mouse-ul sau degetul
        </span>
      </div>
      
      <Checkbox id="consent-drawn">
        <Label htmlFor="consent-drawn" className="text-sm">
          Confirm că am citit documentul și sunt de acord
        </Label>
      </Checkbox>
      
      <Button 
        onClick={handleSign}
        disabled={isEmpty}
        className="w-full"
      >
        Semnează Documentul
      </Button>
    </div>
  );
}
```

---

## 👨‍💼 AGENT DASHBOARD

### Document Review Queue

```typescript
// src/features/agent-dashboard/components/document-review-queue.tsx

export function DocumentReviewQueue() {
  const [documents, setDocuments] = useState<PendingDocument[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadPendingDocuments();
  }, []);
  
  const handleVerify = async (docId: string) => {
    await supabase
      .from('document_uploads')
      .update({ 
        verified_at: new Date().toISOString(),
        verified_by: currentUser.id,
        status: 'VERIFIED'
      })
      .eq('id', docId);
    
    // Log for audit
    await logDocumentAccess(docId, 'VERIFY', currentUser.id);
    
    // Refresh list
    await loadPendingDocuments();
    
    toast.success('Document verificat cu succes!');
  };
  
  const handleReject = async (docId: string, reason: string) => {
    await supabase
      .from('document_uploads')
      .update({
        rejection_reason: reason,
        status: 'REJECTED'
      })
      .eq('id', docId);
    
    await logDocumentAccess(docId, 'REJECT', currentUser.id);
    
    toast.info('Document respins. Clientul va fi notificat.');
    await loadPendingDocuments();
  };
  
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">
        Documente de verificat ({documents.length})
      </h2>
      
      {documents.map((doc) => (
        <Card key={doc.id}>
          <CardHeader>
            <CardTitle>{doc.clientName}</CardTitle>
            <CardDescription>
              {doc.documentType} • {formatDistance(doc.uploadedAt, new Date())}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="aspect-video bg-gray-100 rounded-lg mb-4">
              <DocumentPreview 
                fileUrl={doc.storageUrl}
                fileType={doc.mimeType}
              />
            </div>
            
            {doc.rejectionReason && (
              <Alert variant="destructive">
                <AlertTitle>Motivul respingerii:</AlertTitle>
                <AlertDescription>{doc.rejectionReason}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          
          <CardFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => window.open(doc.storageUrl)}
            >
              Descarcă
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                const reason = prompt('Motivul respingerii:');
                if (reason) handleReject(doc.id, reason);
              }}
            >
              Respinge
            </Button>
            <Button 
              onClick={() => handleVerify(doc.id)}
              className="bg-green-600 hover:bg-green-700"
            >
              ✓ Verifică
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
```

---

## 📲 PWA CONFIGURATION

### next.config.ts additions

```typescript
// next.config.ts

const nextConfig: NextConfig = {
  // Existing config...
  
  // PWA headers for service worker
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};
```

### manifest.json

```json
{
  "name": "HQS Imobiliare",
  "short_name": "HQS",
  "description": "Platformă imobiliară pentru vizionări și documente",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0d9488",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Service Worker (src/app/sw.js)

```javascript
// Cache strategies for offline support
const CACHE_NAME = 'hqs-imobiliare-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

// Fetch - network first, fall back to cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline - return from cache
        return caches.match(event.request);
      })
  );
});

// Background sync for offline uploads
self.addEventListener('sync', (event) => {
  if (event.tag === 'document-upload') {
    event.waitUntil(syncOfflineDocuments());
  }
});

async function syncOfflineDocuments() {
  const pending = await getPendingUploads();
  for (const upload of pending) {
    try {
      await uploadToServer(upload);
      await removePendingUpload(upload.id);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }
}
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] All environment variables configured
- [ ] Google OAuth credentials created
- [ ] Supabase storage buckets created
- [ ] Supabase Row Level Security policies updated
- [ ] Database migrations run
- [ ] Retention policy triggers created

### Post-Deployment
- [ ] Test complete booking flow
- [ ] Test document upload
- [ ] Test signature (typed + drawn)
- [ ] Test Google Calendar sync
- [ ] Test email notifications
- [ ] Test SMS notifications
- [ ] Test agent document review
- [ ] Audit log entries verified
- [ ] PWA installable on mobile

### Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Set up analytics (Plausible/Cloudflare Web Analytics)
- [ ] Monitor notification delivery rates
- [ ] Monitor document upload success rates

---

## 📞 SUPPORT

For implementation questions:
- Check Supabase docs: https://supabase.com/docs
- Google Calendar API: https://developers.google.com/calendar
- Resend (email): https://resend.com/docs
- Twilio (SMS): https://www.twilio.com/docs

---

*Implementation Guide v1.0 | HQS Imobiliare*
