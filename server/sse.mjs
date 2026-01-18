const sseClients = new Set()

export const sendSseEvent = (res, event, data) => {
  res.write(`event: ${event}\n`)
  res.write(`data: ${JSON.stringify(data)}\n\n`)
}

export const addSseClient = (res) => {
  sseClients.add(res)
}

export const removeSseClient = (res) => {
  sseClients.delete(res)
}

export const broadcastSseEvent = (event, data) => {
  for (const res of sseClients) {
    try {
      sendSseEvent(res, event, data)
    } catch (_err) {
      sseClients.delete(res)
    }
  }
}
