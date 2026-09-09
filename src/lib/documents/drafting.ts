/** Shared preparation and validation for the editing preview and generated document. */
export interface DraftField {
  key: string
  label: string
  type?: string
  required?: boolean
  readOnly?: boolean
  options?: ReadonlyArray<{ value: string; label: string }>
}

export interface DraftDefinition {
  kind: string
  fields: ReadonlyArray<DraftField>
}

export interface DraftIssue {
  key: string
  label: string
  message: string
  readOnly: boolean
}

interface DraftSubmission {
  id: string
  appointmentId: string
  requesterId: string
  documentKind: string
  status: string
  submittedData: Record<string, string>
  updatedAt: string
  createdAt: string
}

export function prepareDraftValues(
  definition: DraftDefinition,
  baseValues: Record<string, string>,
  inputValues: Record<string, string>,
): Record<string, string> {
  const values = Object.fromEntries(
    Object.entries(baseValues).map(([key, value]) => [key, String(value ?? '').trim()]),
  )
  for (const field of definition.fields) {
    if (!field.readOnly && Object.hasOwn(inputValues, field.key)) {
      values[field.key] = String(inputValues[field.key] ?? '').trim()
    } else if (!Object.hasOwn(values, field.key)) {
      values[field.key] = ''
    }
  }
  return values
}

export function mergeDraftSubmissions(
  definition: DraftDefinition,
  appointmentId: string,
  submissions: ReadonlyArray<DraftSubmission>,
  baseValues: Record<string, string>,
  allowedKeysByParticipant: Readonly<Record<string, ReadonlyArray<string>>>,
): Record<string, string> {
  // Resolve revisions before merging parties; cancelled or different dossiers never prefill a draft.
  const latestByParticipant = new Map<string, DraftSubmission>()
  for (const submission of [...submissions].sort((a, b) =>
    (a.updatedAt || a.createdAt).localeCompare(b.updatedAt || b.createdAt) || a.id.localeCompare(b.id),
  )) {
    if (submission.appointmentId !== appointmentId || submission.documentKind !== definition.kind) continue
    latestByParticipant.set(submission.requesterId, submission)
  }
  const inputValues: Record<string, string> = {}
  for (const submission of latestByParticipant.values()) {
    if (!['REQUESTED', 'IN_REVIEW'].includes(submission.status)) continue
    const allowed = allowedKeysByParticipant[submission.requesterId] || []
    for (const key of allowed) {
      if (Object.hasOwn(submission.submittedData, key)) inputValues[key] = submission.submittedData[key]
    }
  }
  return prepareDraftValues(definition, baseValues, inputValues)
}

function validDate(value: string, includeTime: boolean): boolean {
  const match = value.match(includeTime
    ? /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2})?$/
    : /^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return false
  const [, year, month, day, hour, minute] = match
  const date = new Date(`${year}-${month}-${day}T00:00:00Z`)
  return Number(year) > 0
    && date.getUTCFullYear() === Number(year)
    && date.getUTCMonth() + 1 === Number(month)
    && date.getUTCDate() === Number(day)
    && (!includeTime || (Number(hour) < 24 && Number(minute) < 60))
}

export function getDraftIssues(
  definition: DraftDefinition,
  template: { requiredFields: ReadonlyArray<string>; body?: string },
  values: Record<string, string>,
): DraftIssue[] {
  const issues = new Map<string, DraftIssue>()
  const fieldByKey = new Map(definition.fields.map(field => [field.key, field]))
  const addIssue = (key: string, message: string) => {
    if (issues.has(key)) return
    const field = fieldByKey.get(key)
    issues.set(key, { key, label: field?.label || 'Câmp din șablon', message, readOnly: !field || Boolean(field.readOnly) })
  }
  const required = new Set([
    ...template.requiredFields,
    ...definition.fields.filter(field => field.required).map(field => field.key),
  ])
  for (const key of required) {
    if (!values[key]?.trim()) addIssue(key, 'Completează acest câmp.')
  }
  for (const field of definition.fields) {
    const value = values[field.key]?.trim()
    if (!value) continue
    if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      addIssue(field.key, 'Introdu o adresă de e-mail validă.')
    }
    if (field.type === 'number' && !Number.isFinite(Number(value))) {
      addIssue(field.key, 'Introdu un număr valid.')
    }
    if ((field.type === 'date' || field.type === 'datetime-local') && !validDate(value, field.type === 'datetime-local')) {
      addIssue(field.key, 'Introdu o dată validă.')
    }
    if (field.type === 'select' && !field.options?.some(option => option.value === value)) {
      addIssue(field.key, 'Alege o opțiune din listă.')
    }
  }
  const positiveAmounts = new Set(['asking_price', 'offered_price', 'rent_amount'])
  const nonnegativeAmounts = new Set(['reservation_amount', 'deposit_amount', 'commission_value'])
  for (const field of definition.fields) {
    if (!positiveAmounts.has(field.key) && !nonnegativeAmounts.has(field.key)) continue
    const value = values[field.key]?.trim()
    if (!value) continue
    // Accept plain decimals and Romanian thousands/decimal separators, without altering reviewed text.
    const normalized = /^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(value)
      ? value.replaceAll('.', '').replace(',', '.')
      : /^\d+(?:[.,]\d{1,2})?$/.test(value) ? value.replace(',', '.') : ''
    const amount = normalized ? Number(normalized) : NaN
    if (!Number.isFinite(amount) || amount < 0 || (positiveAmounts.has(field.key) && amount === 0)) {
      addIssue(field.key, `Introdu o sumă ${positiveAmounts.has(field.key) ? 'mai mare decât zero' : 'pozitivă sau zero'}, de exemplu 1250 sau 1.250,50.`)
    }
  }
  const datePairs = definition.kind === 'rental_contract'
    ? [['lease_start_date', 'lease_end_date']]
    : ['brokerage_agreement', 'owner_mandate'].includes(definition.kind)
      ? [['contract_start_date', 'contract_end_date']]
      : []
  for (const [startKey, endKey] of datePairs) {
    if (values[startKey] && values[endKey] && !issues.has(startKey) && !issues.has(endKey)
      && values[endKey] <= values[startKey]) {
      addIssue(endKey, 'Data încetării trebuie să fie după data începerii.')
    }
  }
  if (definition.kind === 'rental_contract' && values.rent_due_day) {
    const day = Number(values.rent_due_day)
    if (!Number.isInteger(day) || day < 1 || day > 31) {
      addIssue('rent_due_day', 'Alege o zi între 1 și 31.')
    }
  }
  for (const match of (template.body || '').matchAll(/{{([^{}]*)}}/g)) {
    if (!/^[a-z0-9_]+$/.test(match[1]) || (!Object.hasOwn(values, match[1]) && !fieldByKey.has(match[1]))) {
      addIssue(match[1], 'Câmpul din șablon nu este disponibil. Cere administratorului să verifice șablonul.')
    }
  }
  return [...issues.values()]
}

export function renderDraftText(body: string, values: Record<string, string>): string {
  return body.replace(/{{([a-z0-9_]+)}}/g, (_match, key: string) => values[key] || '________________')
}
