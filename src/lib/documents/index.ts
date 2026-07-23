/**
 * Public API for the documents module.
 *
 * Anything outside `src/lib/documents/` should import from here, not from
 * individual files. This keeps the surface stable while we move things around.
 */

export * from './types'
export * from './state-machine'
export * from './identity'
export * from './flow'
export {
  TEMPLATES,
  TEMPLATES_IN_ORDER,
  getTemplate,
  getStartableTemplatesForRole,
} from './templates'
export {
  AGENCY_FIELDS,
  PRIVACY_FIELDS,
  CLIENT_IDENTITY_FIELDS,
  OWNER_IDENTITY_FIELDS,
  PROPERTY_FIELDS,
  PROPERTY_LEGAL_FIELDS,
  composeDocumentFields,
  findField,
  pickClientIdentityFields,
  pickOwnerIdentityFields,
} from './fields'
