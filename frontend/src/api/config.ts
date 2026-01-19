export const API_BASE_URL: string = (
  (import.meta as any).env?.VITE_API_URL as string | undefined
) ?? 'http://localhost:8081'

export function joinUrl(base: string, path: string): string {
  const normalizedBase = base.replace(/\/+$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${normalizedBase}${normalizedPath}`
}
