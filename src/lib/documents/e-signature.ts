/**
 * E-signature provider abstraction.
 *
 * Defines the interface for integrating with eIDAS-compliant e-signature
 * providers (CertSign, Trans Sped, Yousign, Autenti, DocuSign, etc.).
 *
 * This module provides the interface and a console-based mock for
 * development. Swap in a real provider by implementing ESignatureProvider.
 *
 * Signature levels under eIDAS:
 *   - SIMPLE:        Click-to-sign in the platform (current implementation)
 *   - ADVANCED:      Uniquely linked to signer, detectable if changed (AdES)
 *   - QUALIFIED:     Equivalent to handwritten signature (QES)
 *
 * For Romanian real estate:
 *   - Brokerage agreements:    ADVANCED is sufficient
 *   - Sale-purchase contracts: QUALIFIED recommended (notaries may require)
 *   - Rental contracts:        ADVANCED is sufficient
 *   - Owner mandates:          ADVANCED is sufficient
 */

import type { Document, SignatureRequirement } from './types'

// ─── Types ───────────────────────────────────────────────────

export interface SignerInfo {
  id: string
  name: string
  email: string
  role: 'CLIENT' | 'OWNER' | 'AGENT'
}

export interface Envelope {
  /** Provider's envelope/transaction ID. */
  id: string
  /** Status of the envelope in the provider's system. */
  status: EnvelopeStatus
  /** URL where the signer can access the document for signing. */
  signingUrl: string | null
  /** When the envelope was created. */
  createdAt: string
  /** When the envelope expires (signing link validity). */
  expiresAt: string | null
}

export type EnvelopeStatus =
  | 'created'      // envelope created, waiting for signatures
  | 'sent'         // signing invitations sent
  | 'in_progress'  // at least one signer has acted
  | 'completed'    // all signatures collected
  | 'declined'     // a signer declined
  | 'expired'      // signing window expired
  | 'voided'       // cancelled by sender
  | 'error'        // provider error

export interface SignatureProof {
  /** The signed document bytes (PDF with embedded signatures). */
  signedDocument: Uint8Array
  /** X.509 certificate used for signing (base64). */
  certificate: string | null
  /** RFC 3161 timestamp token (base64). */
  timestampToken: string | null
  /** IP address recorded by the provider. */
  signerIp: string | null
  /** Exact time the signature was applied. */
  signedAt: string
  /** Provider-specific reference. */
  providerRef: string
}

export interface CreateEnvelopeOptions {
  /** The document to be signed. */
  document: Document
  /** PDF bytes of the document. */
  documentBytes: Uint8Array
  /** Who needs to sign. */
  signers: SignerInfo[]
  /** Required signature level. */
  signatureLevel: SignatureRequirement
  /** Message to display to signers. */
  message?: string
  /** Signing link validity in hours. Default: 72. */
  validityHours?: number
}

/** The provider interface — implement this for each e-signature service. */
export interface ESignatureProvider {
  /** Human-readable provider name. */
  readonly name: string

  /** Create a signing envelope and return the signing URL(s). */
  createEnvelope(options: CreateEnvelopeOptions): Promise<Envelope>

  /** Check the current status of an envelope. */
  getEnvelopeStatus(envelopeId: string): Promise<EnvelopeStatus>

  /** Get the signing proof after completion. */
  getSignatureProof(envelopeId: string): Promise<SignatureProof>

  /** Cancel/void an envelope. */
  cancelEnvelope(envelopeId: string): Promise<void>
}

// ─── Mock Provider (for development) ─────────────────────────

/**
 * Console-based mock provider for development and testing.
 *
 * In dev mode, signing is simulated:
 *   1. createEnvelope() returns a mock URL
 *   2. getEnvelopeStatus() returns 'completed' after a delay
 *   3. getSignatureProof() returns a self-signed certificate
 *
 * Replace with a real provider in production.
 */
export class MockESignatureProvider implements ESignatureProvider {
  readonly name = 'Mock (dev only)'
  private envelopes = new Map<string, Envelope>()

  async createEnvelope(options: CreateEnvelopeOptions): Promise<Envelope> {
    const id = `env_mock_${crypto.randomUUID().slice(0, 8)}`
    const now = new Date()
    const expiresAt = options.validityHours
      ? new Date(now.getTime() + options.validityHours * 60 * 60 * 1_000).toISOString()
      : new Date(now.getTime() + 72 * 60 * 60 * 1_000).toISOString()

    const envelope: Envelope = {
      id,
      status: 'created',
      signingUrl: `https://mock-sign.example.com/sign/${id}`,
      createdAt: now.toISOString(),
      expiresAt,
    }

    this.envelopes.set(id, envelope)
    console.info(`[e-sign:mock] Created envelope ${id} for ${options.signers.length} signer(s)`)
    console.info(`[e-sign:mock] Signing URL: ${envelope.signingUrl}`)

    return envelope
  }

  async getEnvelopeStatus(envelopeId: string): Promise<EnvelopeStatus> {
    const envelope = this.envelopes.get(envelopeId)
    if (!envelope) return 'error'

    // In mock mode, auto-complete after 5 seconds
    const age = Date.now() - new Date(envelope.createdAt).getTime()
    if (age > 5_000) {
      envelope.status = 'completed'
    }

    return envelope.status
  }

  async getSignatureProof(envelopeId: string): Promise<SignatureProof> {
    const envelope = this.envelopes.get(envelopeId)
    if (!envelope) throw new Error(`Envelope ${envelopeId} not found`)

    return {
      signedDocument: new Uint8Array(), // empty in mock mode
      certificate: btoa('MOCK_CERTIFICATE_NOT_FOR_PRODUCTION'),
      timestampToken: btoa('MOCK_TIMESTAMP_NOT_FOR_PRODUCTION'),
      signerIp: '127.0.0.1',
      signedAt: new Date().toISOString(),
      providerRef: `mock_ref_${envelopeId}`,
    }
  }

  async cancelEnvelope(envelopeId: string): Promise<void> {
    const envelope = this.envelopes.get(envelopeId)
    if (envelope) {
      envelope.status = 'voided'
      console.info(`[e-sign:mock] Cancelled envelope ${envelopeId}`)
    }
  }
}

// ─── Provider Registry ───────────────────────────────────────

let activeProvider: ESignatureProvider | null = null

/**
 * Get the configured e-signature provider.
 * Falls back to the mock provider in development.
 */
export function getSignatureProvider(): ESignatureProvider {
  if (!activeProvider) {
    // In production, load the configured provider
    // For now, always use the mock
    activeProvider = new MockESignatureProvider()
  }
  return activeProvider
}

/**
 * Set the active e-signature provider.
 * Call this at app startup with the production provider.
 */
export function setSignatureProvider(provider: ESignatureProvider): void {
  activeProvider = provider
}
