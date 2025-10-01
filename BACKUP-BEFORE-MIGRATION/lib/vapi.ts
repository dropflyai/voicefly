interface VAPICallRequest {
  assistant_id?: string
  phone_number: string
  customer?: {
    number?: string
    name?: string
  }
}

interface VAPICallResponse {
  id: string
  status: 'queued' | 'ringing' | 'in-progress' | 'completed' | 'failed'
  created_at: string
  phone_number: string
}

class VAPIClient {
  private apiKey: string
  private baseUrl = 'https://api.vapi.ai'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`VAPI API Error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  async createCall(params: VAPICallRequest): Promise<VAPICallResponse> {
    return this.request<VAPICallResponse>('/call', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  async getCall(callId: string): Promise<VAPICallResponse> {
    return this.request<VAPICallResponse>(`/call/${callId}`)
  }

  async getCalls(limit = 100): Promise<VAPICallResponse[]> {
    return this.request<VAPICallResponse[]>(`/call?limit=${limit}`)
  }

  async createAssistant(config: any) {
    return this.request('/assistant', {
      method: 'POST',
      body: JSON.stringify(config),
    })
  }

  async getAssistants() {
    return this.request('/assistant')
  }
}

// Export a singleton instance
export const vapi = new VAPIClient(process.env.VAPI_API_KEY || '')

// Types for external use
export type { VAPICallRequest, VAPICallResponse }