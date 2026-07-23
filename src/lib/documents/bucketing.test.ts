import { describe, it, expect } from 'vitest'
import {
  bucketForStatus,
  groupByBucket,
  bucketIndex,
  mostAdvancedBucket,
  DOCUMENT_BUCKET_ORDER,
  DOCUMENT_BUCKETS,
} from './bucketing'
import type { DocumentStatus } from './types'

describe('bucketForStatus', () => {
  const cases: Array<[DocumentStatus, 'draft' | 'review' | 'sign' | 'signed' | 'closed']> = [
    ['DRAFT', 'draft'],
    ['REQUESTED', 'review'],
    ['IN_REVIEW', 'review'],
    ['NEEDS_INFO', 'review'],
    ['READY_TO_SIGN', 'sign'],
    ['PARTIALLY_SIGNED', 'sign'],
    ['SIGNED', 'signed'],
    ['APPROVED', 'signed'],
    ['REJECTED', 'closed'],
    ['CANCELLED', 'closed'],
    ['SUPERSEDED', 'closed'],
  ]

  it.each(cases)('maps %s to %s', (status, expected) => {
    expect(bucketForStatus(status)).toBe(expected)
  })

  it('exposes exactly 5 buckets', () => {
    expect(DOCUMENT_BUCKETS).toHaveLength(5)
  })

  it('orders buckets as draft → review → sign → signed → closed', () => {
    expect(DOCUMENT_BUCKET_ORDER).toEqual(['draft', 'review', 'sign', 'signed', 'closed'])
  })
})

describe('bucketIndex', () => {
  it('returns the bucket position in the canonical order', () => {
    expect(bucketIndex('draft')).toBe(0)
    expect(bucketIndex('review')).toBe(1)
    expect(bucketIndex('sign')).toBe(2)
    expect(bucketIndex('signed')).toBe(3)
    expect(bucketIndex('closed')).toBe(4)
  })
})

describe('groupByBucket', () => {
  it('groups a mixed list into the five buckets', () => {
    const grouped = groupByBucket([
      { status: 'DRAFT' as DocumentStatus, id: 'a' },
      { status: 'IN_REVIEW' as DocumentStatus, id: 'b' },
      { status: 'READY_TO_SIGN' as DocumentStatus, id: 'c' },
      { status: 'SIGNED' as DocumentStatus, id: 'd' },
      { status: 'CANCELLED' as DocumentStatus, id: 'e' },
    ])
    expect(grouped.draft.map((d) => d.id)).toEqual(['a'])
    expect(grouped.review.map((d) => d.id)).toEqual(['b'])
    expect(grouped.sign.map((d) => d.id)).toEqual(['c'])
    expect(grouped.signed.map((d) => d.id)).toEqual(['d'])
    expect(grouped.closed.map((d) => d.id)).toEqual(['e'])
  })

  it('returns empty arrays for empty input', () => {
    const grouped = groupByBucket([])
    expect(grouped.draft).toEqual([])
    expect(grouped.review).toEqual([])
    expect(grouped.sign).toEqual([])
    expect(grouped.signed).toEqual([])
    expect(grouped.closed).toEqual([])
  })
})

describe('mostAdvancedBucket', () => {
  it('returns null for an empty list', () => {
    expect(mostAdvancedBucket([])).toBeNull()
  })

  it('returns the highest bucket present', () => {
    expect(mostAdvancedBucket([{ status: 'DRAFT' as DocumentStatus }])).toBe('draft')
    expect(
      mostAdvancedBucket([
        { status: 'DRAFT' as DocumentStatus },
        { status: 'IN_REVIEW' as DocumentStatus },
      ]),
    ).toBe('review')
    expect(
      mostAdvancedBucket([
        { status: 'READY_TO_SIGN' as DocumentStatus },
        { status: 'IN_REVIEW' as DocumentStatus },
        { status: 'APPROVED' as DocumentStatus },
      ]),
    ).toBe('signed')
  })

  it('treats APPROVED as more advanced than REJECTED', () => {
    expect(
      mostAdvancedBucket([
        { status: 'REJECTED' as DocumentStatus },
        { status: 'APPROVED' as DocumentStatus },
      ]),
    ).toBe('signed')
  })
})
