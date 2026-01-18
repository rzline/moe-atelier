import {
  BACKEND_LOG_MAX_CHARS,
  backendLogOutbound,
  backendLogRequests,
  backendLogResponse,
} from './config.mjs'

const truncateLogText = (value = '') => {
  if (value.length <= BACKEND_LOG_MAX_CHARS) return value
  return `${value.slice(0, BACKEND_LOG_MAX_CHARS)}...<${value.length}>`
}

export const formatLogPayload = (payload) => {
  if (payload === null || payload === undefined) return String(payload)
  if (typeof payload === 'string') {
    if (payload.startsWith('data:image')) {
      return `${payload.slice(0, 60)}...<data:image>`
    }
    return truncateLogText(payload)
  }
  try {
    return JSON.stringify(
      payload,
      (_key, value) => {
        if (typeof value === 'string') {
          if (value.startsWith('data:image')) {
            return `${value.slice(0, 60)}...<data:image>`
          }
          return truncateLogText(value)
        }
        return value
      },
      2,
    )
  } catch {
    return String(payload)
  }
}

export const logBackendResponse = (label, payload) => {
  if (!backendLogResponse) return
  console.log(`[backend] ${label}:`, formatLogPayload(payload))
}

export const logBackendRequest = (label, payload) => {
  if (!backendLogRequests) return
  console.log(`[backend] ${label}:`, formatLogPayload(payload))
}

export const logBackendOutbound = (label, payload) => {
  if (!backendLogOutbound) return
  console.log(`[backend] ${label}:`, formatLogPayload(payload))
}

export const describeFetchError = (err) => ({
  name: err?.name,
  message: err?.message,
  code: err?.code || err?.cause?.code,
  errno: err?.errno || err?.cause?.errno,
  type: err?.type || err?.cause?.type,
})
