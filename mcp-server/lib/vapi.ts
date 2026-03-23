const VAPI_API_KEY = process.env.VAPI_API_KEY!
const VAPI_BASE = 'https://api.vapi.ai'

async function vapiRequest(method: string, path: string, body?: any): Promise<any> {
  const res = await fetch(`${VAPI_BASE}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`VAPI ${method} ${path} failed (${res.status}): ${text}`)
  }
  return res.json()
}

export const vapi = {
  // Assistants
  listAssistants: () => vapiRequest('GET', '/assistant'),
  getAssistant: (id: string) => vapiRequest('GET', `/assistant/${id}`),
  createAssistant: (config: any) => vapiRequest('POST', '/assistant', config),
  updateAssistant: (id: string, updates: any) => vapiRequest('PATCH', `/assistant/${id}`, updates),
  deleteAssistant: (id: string) => vapiRequest('DELETE', `/assistant/${id}`),

  // Phone Numbers
  listPhoneNumbers: () => vapiRequest('GET', '/phone-number'),
  getPhoneNumber: (id: string) => vapiRequest('GET', `/phone-number/${id}`),
  updatePhoneNumber: (id: string, updates: any) => vapiRequest('PATCH', `/phone-number/${id}`, updates),

  // Calls
  listCalls: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return vapiRequest('GET', `/call${query}`)
  },
  getCall: (id: string) => vapiRequest('GET', `/call/${id}`),
  createCall: (config: any) => vapiRequest('POST', '/call', config),
}
