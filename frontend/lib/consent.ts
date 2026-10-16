'use client'

export type ConsentCategory = 'necessary' | 'analytics' | 'marketing'
export type ConsentState = Record<ConsentCategory, boolean>

const CONSENT_KEY = 'cookie_consent'

const DEFAULT_CONSENT: ConsentState = {
  necessary: true,
  analytics: false,
  marketing: false,
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function getConsent(): ConsentState {
  if (typeof window === 'undefined') return DEFAULT_CONSENT
  try {
    const stored = localStorage.getItem(CONSENT_KEY)
    if (!stored) return DEFAULT_CONSENT
    return { ...DEFAULT_CONSENT, ...JSON.parse(stored), necessary: true }
  } catch {
    return DEFAULT_CONSENT
  }
}

export function setConsent(state: ConsentState): void {
  if (typeof window === 'undefined') return

  state.necessary = true
  localStorage.setItem(CONSENT_KEY, JSON.stringify(state))

  // Update Google Consent Mode
  window.gtag?.('consent', 'update', {
    analytics_storage: state.analytics ? 'granted' : 'denied',
    functionality_storage: state.analytics ? 'granted' : 'denied',
    ad_storage: state.marketing ? 'granted' : 'denied',
    ad_user_data: state.marketing ? 'granted' : 'denied',
    ad_personalization: state.marketing ? 'granted' : 'denied',
  })

  window.dispatchEvent(new CustomEvent('consent-updated', { detail: state }))
}

export function hasConsent(category: ConsentCategory): boolean {
  if (category === 'necessary') return true
  return getConsent()[category]
}

export function hasConsentBeenGiven(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(CONSENT_KEY) !== null
}

export function initConsentMode(): void {
  if (typeof window === 'undefined') return

  const consent = getConsent()
  const hasInteracted = hasConsentBeenGiven()

  window.gtag?.('consent', 'default', {
    analytics_storage: hasInteracted && consent.analytics ? 'granted' : 'denied',
    functionality_storage: hasInteracted && consent.analytics ? 'granted' : 'denied',
    ad_storage: hasInteracted && consent.marketing ? 'granted' : 'denied',
    ad_user_data: hasInteracted && consent.marketing ? 'granted' : 'denied',
    ad_personalization: hasInteracted && consent.marketing ? 'granted' : 'denied',
    wait_for_update: 500,
  })
}
