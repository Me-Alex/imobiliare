import { describe, it, expect } from 'vitest'
import { isValidEmail, normalizeEmail } from './validators'

describe('isValidEmail', () => {
  it.each([
    'user@example.com',
    'first.last+tag@example.co',
    'a_b-c@sub.domain.io',
    'office@hqs.ro',
  ])('accepts %s', (value) => {
    expect(isValidEmail(value)).toBe(true)
  })

  it.each([
    '',
    '   ',
    'not-an-email',
    '@example.com',
    'user@',
    'user@x',
    'user@x.y',
    'user space@example.com',
    'user<>@example.com',
    '"quoted"@example.com',
    'a'.repeat(65) + '@x.com', // local part too long
  ])('rejects %s', (value) => {
    expect(isValidEmail(value)).toBe(false)
  })

  it('rejects non-string input', () => {
    expect(isValidEmail(undefined)).toBe(false)
    expect(isValidEmail(null)).toBe(false)
    expect(isValidEmail(42)).toBe(false)
    expect(isValidEmail({})).toBe(false)
  })
})

describe('normalizeEmail', () => {
  it('lowercases and trims', () => {
    expect(normalizeEmail('  User@Example.COM ')).toBe('user@example.com')
  })
})
