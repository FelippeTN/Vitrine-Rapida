import { FetchHttpClient } from '@/api/httpClient'
import { LocalStorageTokenStore } from '@/api/tokenStore'
import { ApiCollectionsService } from '@/api/collectionsService'
import { ApiProductsService } from '@/api/productsService'
import { API_BASE_URL } from '@/api/config'
import type { Plan, UserPlanInfo } from './types'

const tokenStore = new LocalStorageTokenStore('token')
const http = new FetchHttpClient(tokenStore)

export const collectionsService = new ApiCollectionsService(http)
export const productsService = new ApiProductsService(http)

// Plans service
export const plansService = {
  async getAll(): Promise<Plan[]> {
    const response = await fetch(`${API_BASE_URL}/public/plans`)
    if (!response.ok) throw new Error('Failed to fetch plans')
    return response.json()
  },

  async getMyPlanInfo(): Promise<UserPlanInfo> {
    const token = tokenStore.getToken()
    const response = await fetch(`${API_BASE_URL}/protected/my-plan`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) throw new Error('Failed to fetch plan info')
    return response.json()
  },

  async upgradePlan(planId: number): Promise<{ message: string; plan: Plan }> {
    const token = tokenStore.getToken()
    const response = await fetch(`${API_BASE_URL}/protected/upgrade-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ plan_id: planId }),
    })
    if (!response.ok) throw new Error('Failed to upgrade plan')
    return response.json()
  },

  async createPaymentIntent(amount: number, currency: string): Promise<{ clientSecret: string }> {
    const token = tokenStore.getToken()
    const response = await fetch(`${API_BASE_URL}/protected/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount, currency }),
    })
    if (!response.ok) throw new Error('Failed to create payment intent')
    return response.json()
  },
}

export * from './types'
export * from './errors'
