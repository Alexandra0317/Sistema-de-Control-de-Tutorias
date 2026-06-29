const API_BASE = import.meta.env.VITE_API_URL || '/api'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  token?: string | null
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { body, token, headers, ...rest } = options

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (headers) {
    const extra = new Headers(headers)
    extra.forEach((value, key) => {
      requestHeaders[key] = value
    })
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...rest,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new ApiError(data.message || 'Error en la solicitud', response.status)
  }

  return data as T
}

export async function apiUpload<T>(
  endpoint: string,
  formData: FormData,
  token?: string | null,
): Promise<T> {
  const requestHeaders: Record<string, string> = {}

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: requestHeaders,
    body: formData,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new ApiError(data.message || 'Error en la solicitud', response.status)
  }

  return data as T
}

export async function apiDownload(
  endpoint: string,
  token: string,
  filename: string,
): Promise<void> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new ApiError(data.message || 'Error al descargar archivo', response.status)
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
