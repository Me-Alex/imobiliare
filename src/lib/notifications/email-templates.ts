/**
 * Email templates for HQS Imobiliare notifications.
 * All templates use {{variable}} placeholder syntax for dynamic data replacement.
 */

export interface EmailTemplate {
  subject: string
  htmlBody: string
  textBody: string
}

export interface EmailTemplateData {
  [key: string]: string | number | boolean | null | undefined
}

// Template: Booking Confirmation
export const bookingConfirmationTemplate: EmailTemplate = {
  subject: 'Confirmare programare vizionare - {{propertyTitle}}',
  htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmare Programare</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">HQS Imobiliare</h1>
    <p style="color: #a8c8e8; margin: 10px 0 0;">Confirmare Programare</p>
  </div>

  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
    <p>Bună {{clientName}},</p>

    <p>Programarea dumneavoastră a fost confirmată cu succes!</p>

    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #1e3a5f;">Detalii Programare</h3>
      <p style="margin: 8px 0;"><strong>Proprietate:</strong> {{propertyTitle}}</p>
      <p style="margin: 8px 0;"><strong>Adresă:</strong> {{propertyAddress}}</p>
      <p style="margin: 8px 0;"><strong>Dată:</strong> {{appointmentDate}}</p>
      <p style="margin: 8px 0;"><strong>Oră:</strong> {{appointmentTime}}</p>
      <p style="margin: 8px 0;"><strong>Agent:</strong> {{agentName}}</p>
    </div>

    <p>Vă așteptăm la proprietate la data și ora indicate. Asigurați-vă că aveți la dumneavoastră un act de identitate.</p>

    <p>Dacă aveți întrebări sau trebuie să reprogramați, vă rugăm să ne contactați:</p>
    <ul>
      <li>Telefon: <a href="tel:+40740123456">+40 740 123 456</a></li>
      <li>Email: <a href="mailto:contact@hqsimobiliare.ro">contact@hqsimobiliare.ro</a></li>
    </ul>

    <p>Vă mulțumim pentru încredere!</p>
    <p>Cordial,<br>Echipa HQS Imobiliare</p>
  </div>

  <div style="background: #f0f4f8; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
    <p style="margin: 0; font-size: 12px; color: #666;">
      HQS Imobiliare | Bd. Unirii 120, București | <a href="https://hqsimobiliare.ro">hqsimobiliare.ro</a>
    </p>
  </div>
</body>
</html>`,
  textBody: `Bună {{clientName}},

Programarea dumneavoastră a fost confirmată cu succes!

Detalii Programare:
- Proprietate: {{propertyTitle}}
- Adresă: {{propertyAddress}}
- Dată: {{appointmentDate}}
- Oră: {{appointmentTime}}
- Agent: {{agentName}}

Vă așteptăm la proprietate la data și ora indicată. Asigurați-vă că aveți la dumneavoastră un act de identitate.

Dacă aveți întrebări sau trebuie să reprogramați, vă rugăm să ne contactați:
- Telefon: +40 740 123 456
- Email: contact@hqsimobiliare.ro

Vă mulțumim pentru încredere!
Echipa HQS Imobiliare`,
}

// Template: 24-Hour Reminder
export const reminder24hTemplate: EmailTemplate = {
  subject: 'Amintire: Vizionare mâine la {{appointmentTime}} - {{propertyTitle}}',
  htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Amintire Vizionare</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">⏰ Amintire Vizionare</h1>
    <p style="color: #fef3c7; margin: 10px 0 0;">Programare mâine!</p>
  </div>

  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
    <p>Bună {{clientName}},</p>

    <p>Aceasta este o amintire că aveți o vizionare programată <strong>mâine</strong>.</p>

    <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <h3 style="margin-top: 0; color: #92400e;">Detalii Programare</h3>
      <p style="margin: 8px 0;"><strong>Proprietate:</strong> {{propertyTitle}}</p>
      <p style="margin: 8px 0;"><strong>Adresă:</strong> {{propertyAddress}}</p>
      <p style="margin: 8px 0;"><strong>Dată:</strong> {{appointmentDate}}</p>
      <p style="margin: 8px 0;"><strong>Oră:</strong> {{appointmentTime}}</p>
      <p style="margin: 8px 0;"><strong>Agent:</strong> {{agentName}}</p>
    </div>

    <p><strong>Nu uitați să aduceți:</strong></p>
    <ul>
      <li>Act de identitate (CI/Pașaport)</li>
      <li>Dacă sunteți interesat de achiziție: dovadă finanțare sau extras de cont</li>
    </ul>

    <p>Pentru a reprograma sau anula, vă rugăm să ne contactați cu minim 24 de ore înainte.</p>

    <p>Cordial,<br>Echipa HQS Imobiliare</p>
  </div>

  <div style="background: #f0f4f8; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
    <p style="margin: 0; font-size: 12px; color: #666;">
      HQS Imobiliare | Bd. Unirii 120, București | <a href="https://hqsimobiliare.ro">hqsimobiliare.ro</a>
    </p>
  </div>
</body>
</html>`,
  textBody: `Bună {{clientName}},

Aceasta este o amintire că aveți o vizionare programată MÂINE.

Detalii Programare:
- Proprietate: {{propertyTitle}}
- Adresă: {{propertyAddress}}
- Dată: {{appointmentDate}}
- Oră: {{appointmentTime}}
- Agent: {{agentName}}

Nu uitați să aduceți:
- Act de identitate (CI/Pașaport)
- Dacă sunteți interesat de achiziție: dovadă finanțare sau extras de cont

Pentru a reprograma sau anula, vă rugăm să ne contactați cu minim 24 de ore înainte.

Echipa HQS Imobiliare`,
}

// Template: 2-Hour Reminder
export const reminder2hTemplate: EmailTemplate = {
  subject: 'Vizionare în 2 ore! - {{propertyTitle}} la {{appointmentTime}}',
  htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vizionare În Curând</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🏠 Vizionare În Curând</h1>
    <p style="color: #d1fae5; margin: 10px 0 0;">Suntem cu dumneavoastră!</p>
  </div>

  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
    <p>Bună {{clientName}},</p>

    <p>vizionarea proprietății <strong>{{propertyTitle}}</strong> va avea loc în <strong>2 ore</strong>.</p>

    <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
      <h3 style="margin-top: 0; color: #065f46;">Locație și Contact</h3>
      <p style="margin: 8px 0;"><strong>Adresă:</strong> {{propertyAddress}}</p>
      <p style="margin: 8px 0;"><strong>Oră:</strong> {{appointmentTime}}</p>
      <p style="margin: 8px 0;"><strong>Agent:</strong> {{agentName}}</p>
      <p style="margin: 8px 0;"><strong>Telefon Agent:</strong> <a href="tel:{{agentPhone}}">{{agentPhone}}</a></p>
    </div>

    <p>Pentru orice întârziere sau问题了, vă rugăm să contactați direct agentul.</p>

    <p>Vă dorim o vizionare plăcută!</p>
    <p>Cordial,<br>Echipa HQS Imobiliare</p>
  </div>

  <div style="background: #f0f4f8; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
    <p style="margin: 0; font-size: 12px; color: #666;">
      HQS Imobiliare | Bd. Unirii 120, București | <a href="https://hqsimobiliare.ro">hqsimobiliare.ro</a>
    </p>
  </div>
</body>
</html>`,
  textBody: `Bună {{clientName}},

Vizionarea proprietății {{propertyTitle}} va avea loc în 2 ore.

Locație și Contact:
- Adresă: {{propertyAddress}}
- Oră: {{appointmentTime}}
- Agent: {{agentName}}
- Telefon Agent: {{agentPhone}}

Pentru orice întârziere, vă rugăm să contactați direct agentul.

Vă dorim o vizionare plăcută!
Echipa HQS Imobiliare`,
}

// Template: Document Uploaded
export const documentUploadedTemplate: EmailTemplate = {
  subject: 'Document încărcat: {{documentName}} - {{propertyTitle}}',
  htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document Încărcat</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">📄 Document Încărcat</h1>
    <p style="color: #e0e7ff; margin: 10px 0 0;">Un nou document este disponibil</p>
  </div>

  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
    <p>Bună {{recipientName}},</p>

    <p>Un nou document a fost încărcat pentru proprietatea <strong>{{propertyTitle}}</strong>.</p>

    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #1e3a5f;">Detalii Document</h3>
      <p style="margin: 8px 0;"><strong>Nume document:</strong> {{documentName}}</p>
      <p style="margin: 8px 0;"><strong>Tip document:</strong> {{documentType}}</p>
      <p style="margin: 8px 0;"><strong>Încărcat de:</strong> {{uploadedBy}}</p>
      <p style="margin: 8px 0;"><strong>Data:</strong> {{uploadDate}}</p>
    </div>

    <p>Documentul poate fi accesat din panoul dumneavoastră HQS Imobiliare.</p>

    <p>Cordial,<br>Echipa HQS Imobiliare</p>
  </div>

  <div style="background: #f0f4f8; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
    <p style="margin: 0; font-size: 12px; color: #666;">
      HQS Imobiliare | Bd. Unirii 120, București | <a href="https://hqsimobiliare.ro">hqsimobiliare.ro</a>
    </p>
  </div>
</body>
</html>`,
  textBody: `Bună {{recipientName}},

Un nou document a fost încărcat pentru proprietatea {{propertyTitle}}.

Detalii Document:
- Nume document: {{documentName}}
- Tip document: {{documentType}}
- Încărcat de: {{uploadedBy}}
- Data: {{uploadDate}}

Documentul poate fi accesat din panoul dumneavoastră HQS Imobiliare.

Echipa HQS Imobiliare`,
}

// All email templates mapped by key
export const emailTemplates: Record<string, EmailTemplate> = {
  bookingConfirmation: bookingConfirmationTemplate,
  reminder24h: reminder24hTemplate,
  reminder2h: reminder2hTemplate,
  documentUploaded: documentUploadedTemplate,
}

/**
 * Replace {{variable}} placeholders in a template string with actual data.
 */
export function interpolateTemplate(template: string, data: EmailTemplateData): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = data[key]
    return value !== undefined && value !== null ? String(value) : match
  })
}

/**
 * Process an email template with provided data and return the rendered subject and body.
 */
export function renderEmailTemplate(
  templateKey: string,
  data: EmailTemplateData,
): { subject: string; htmlBody: string; textBody: string } | null {
  const template = emailTemplates[templateKey]
  if (!template) {
    console.error(`[email-templates] Unknown template key: ${templateKey}`)
    return null
  }

  return {
    subject: interpolateTemplate(template.subject, data),
    htmlBody: interpolateTemplate(template.htmlBody, data),
    textBody: interpolateTemplate(template.textBody, data),
  }
}
