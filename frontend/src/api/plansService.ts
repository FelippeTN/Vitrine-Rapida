import type { HttpClient } from '@/api/httpClient'
import type { Plan, UserPlanInfo } from './types'

export interface PlansService {
  getAll(): Promise<Plan[]>
  getMyPlanInfo(): Promise<UserPlanInfo>
  upgradePlan(planId: number): Promise<{ message: string; plan: Plan }>
  createPaymentIntent(amount: number, currency: string): Promise<{ clientSecret: string }>
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

  async upgradePlan(planId: number): Promise<{ message: string; plan: Plan }> {
    return this.http.request<{ message: string; plan: Plan }>('POST', '/protected/upgrade-plan', {
      body: { plan_id: planId },
      auth: true,
    })
  }

  async createPaymentIntent(amount: number, currency: string): Promise<{ clientSecret: string }> {
    return this.http.request<{ clientSecret: string }>('POST', '/protected/create-payment-intent', {
      body: { amount, currency },
      auth: true,
    })
  }
}
