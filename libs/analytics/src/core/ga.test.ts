import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Ga } from './Ga'

const measurementId = 'G-TEST'
const scriptSrc = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`

describe('Ga', () => {
  beforeEach(() => {
    window.gtag = undefined
    window.dataLayer = undefined
    document.head.innerHTML = ''
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('injects the gtag.js script for its id', () => {
    new Ga({ measurementId })

    expect(document.querySelector(`script[src="${scriptSrc}"]`)).not.toBeNull()
  })

  it('defines a gtag stub that pushes the arguments object gtag.js reads', () => {
    new Ga({ measurementId })

    expect(Object.prototype.toString.call(window.dataLayer?.[0])).toBe('[object Arguments]')
  })

  it('keeps an existing dataLayer', () => {
    const existing = ['page-entry']
    window.dataLayer = existing

    new Ga({ measurementId })

    expect(window.dataLayer).toBe(existing)
    expect(window.dataLayer[0]).toBe('page-entry')
  })

  it('keeps the page\'s gtag and configures its id there', () => {
    const pageGtag = vi.fn()
    window.gtag = pageGtag

    new Ga({ measurementId })

    expect(window.gtag).toBe(pageGtag)
    expect(pageGtag).toHaveBeenCalledWith('config', measurementId)
  })

  it('does not configure its id again when its script is already on the page', () => {
    const script = document.createElement('script')
    script.src = scriptSrc
    document.head.appendChild(script)
    const pageGtag = vi.fn()
    window.gtag = pageGtag

    new Ga({ measurementId })

    expect(pageGtag).not.toHaveBeenCalledWith('config', measurementId)
  })

  it('sends events only to its own property', () => {
    const ga = new Ga({ measurementId })
    const mockGtag = vi.fn()
    window.gtag = mockGtag

    ga.processAnalyticsEvent({ eventName: 'purchase', eventParams: { value: 10, items: [{ item_id: 'A' }] } })

    expect(mockGtag).toHaveBeenCalledWith('event', 'purchase', { value: 10, items: [{ item_id: 'A' }], send_to: measurementId })
  })

  it('logs an error when gtag is missing', () => {
    const ga = new Ga({ measurementId })
    window.gtag = undefined
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    ga.processAnalyticsEvent({ eventName: 'purchase', eventParams: {} })

    expect(errorSpy).toHaveBeenCalledWith('[GA] gtag is not defined')
  })
})
