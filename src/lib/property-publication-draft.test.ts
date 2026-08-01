import { describe, expect, it } from 'vitest'

import { createEmptyPropertyFormData } from '@/lib/property-form-data'
import {
  countTransientPropertyAssets,
  createPropertyPublicationDraft,
  hasMeaningfulPropertyDraft,
  parsePropertyPublicationDraft,
  propertyPublicationDraftKey,
} from '@/lib/property-publication-draft'

describe('property publication drafts', () => {
  it('keeps resumable fields but omits device-local media', () => {
    const form = createEmptyPropertyFormData()
    form.title = 'Apartament luminos'
    form.galleryUrls = [
      'data:image/jpeg;base64,temporary',
      'https://cdn.example.com/listing.jpg',
    ]
    form.coverUrl = form.galleryUrls[0]
    form.virtualTour = {
      mode: 'NATIVE',
      provider: null,
      externalUrl: '',
      entrySceneId: 'local-scene',
      scenes: [
        {
          id: 'local-scene',
          title: 'Living',
          imageUrl: 'data:image/jpeg;base64,panorama',
          sortOrder: 0,
          initialYaw: 0,
          initialPitch: 0,
          initialFov: 100,
          hotspots: [],
        },
      ],
    }

    const draft = createPropertyPublicationDraft(form, new Date('2026-08-02T10:00:00.000Z'))

    expect(draft.data.title).toBe('Apartament luminos')
    expect(draft.data.galleryUrls).toEqual(['https://cdn.example.com/listing.jpg'])
    expect(draft.data.coverUrl).toBe('https://cdn.example.com/listing.jpg')
    expect(draft.data.virtualTour.mode).toBe('NATIVE')
    expect(draft.data.virtualTour.scenes).toEqual([])
    expect(draft.omittedLocalAssets).toBe(2)
    expect(countTransientPropertyAssets(form)).toBe(2)
  })

  it('round-trips a valid draft and rejects malformed storage values', () => {
    const form = createEmptyPropertyFormData()
    form.address = 'Strada Exemplu 10'
    const draft = createPropertyPublicationDraft(form, new Date('2026-08-02T10:00:00.000Z'))

    expect(parsePropertyPublicationDraft(JSON.stringify(draft))).toEqual(draft)
    expect(parsePropertyPublicationDraft('{broken')).toBeNull()
    expect(parsePropertyPublicationDraft(JSON.stringify({ ...draft, version: 99 }))).toBeNull()
  })

  it('detects meaningful progress and scopes drafts per account', () => {
    const empty = createEmptyPropertyFormData()
    expect(hasMeaningfulPropertyDraft(empty)).toBe(false)

    empty.price = '120000'
    expect(hasMeaningfulPropertyDraft(empty)).toBe(true)
    expect(propertyPublicationDraftKey('user-123')).toBe('hqs:property-publication-draft:user-123')
  })
})
