import type { HttpClient } from '@/api/httpClient'
import type { Plan, UserPlanInfo } from './types'

export interface PlansService {
  getAll(): Promise<Plan[]>
  getMyPlanInfo(): Promise<UserPlanInfo>
  createCheckoutSession(planId: number): Promise<{ url: string }>
  cancelPlan(): Promise<{ message: string; plan?: Plan }>
}

export class ApiPlansService implements PlansService {
  private readonly http: HttpClient

  constructor(http: HttpClient) {
    this.http = http
  }

  async getAll(): Promise<Plan[]> {
    return this.http.request<Plan[]>('GET', '/public/plans', { auth: false })
  }

  async getMyPlanInfo(): Promise<UserPlanInfo> {
    return this.http.request<UserPlanInfo>('GET', '/protected/my-plan', { auth: true })
  }

  async createCheckoutSession(planId: number): Promise<{ url: string }> {
    return this.http.request<{ url: string }>('POST', '/protected/create-checkout-session', {
      body: { plan_id: planId },
      auth: true,
    })
  }

  async cancelPlan(): Promise<{ message: string; plan?: Plan }> {
    return this.http.request<{ message: string; plan?: Plan }>('POST', '/protected/cancel-plan', {
      auth: true,
    })
  }
}
