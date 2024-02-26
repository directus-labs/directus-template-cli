import {protectedDomains} from './protected-domains'

export default function validateUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    return !protectedDomains.includes(parsedUrl.hostname)
  } catch {
    return false
  }
}
