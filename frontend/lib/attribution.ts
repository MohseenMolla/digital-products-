'use client'

const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const
const CLICK_IDS = ['fbclid', 'ttclid', 'gclid', 'gbraid', 'wbraid'] as const

export const ATTRIBUTION_COOKIE = '_sv_attr'
export const ATTRIBUTION_LAST_COOKIE = '_sv_attr_last'

export interface AttributionData {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
  fbclid?: string
  ttclid?: string
  gclid?: string
  gbraid?: string
  wbraid?: string
  landingPage: string
  referrer: string
  timestamp: number
}

function setCookie(name: string, value: string, days: number): void {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function captureAttribution(): AttributionData | null {
  if (typeof window === 'undefined') return null

  const params = new URLSearchParams(window.location.search)
  const data: Partial<AttributionData> = {}
  let hasParams = false

  for (const key of UTM_PARAMS) {
    const val = params.get(key)
    if (val) {
      data[key] = val
      hasParams = true
    }
  }

  for (const key of CLICK_IDS) {
    const val = params.get(key)
    if (val) {
      data[key] = val
      hasParams = true
    }
  }

  if (!hasParams && !document.referrer) return null

  return {
    ...data,
    landingPage: window.location.href,
    referrer: document.referrer,
    timestamp: Date.now(),
  } as AttributionData
}

export function getStoredAttribution(type: 'first' | 'last' = 'last'): AttributionData | null {
  if (typeof window === 'undefined') return null
  try {
    const cookie = getCookie(type === 'first' ? ATTRIBUTION_COOKIE : ATTRIBUTION_LAST_COOKIE)
    return cookie ? JSON.parse(cookie) : null
  } catch {
    return null
  }
}

export function storeAttribution(data: AttributionData): void {
  if (typeof window === 'undefined') return

  const value = JSON.stringify(data)

  // First-touch: only set if doesn't exist
  if (!getCookie(ATTRIBUTION_COOKIE)) {
    setCookie(ATTRIBUTION_COOKIE, value, 30)
  }

  // Last-touch: always update
  setCookie(ATTRIBUTION_LAST_COOKIE, value, 30)
}

export function buildFbc(fbclid: string): string {
  return `fb.1.${Date.now()}.${fbclid}`
}

export function buildTtp(ttclid: string): string {
  return ttclid
}
