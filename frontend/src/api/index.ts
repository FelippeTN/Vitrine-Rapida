import { FetchHttpClient } from '@/api/httpClient'
import { LocalStorageTokenStore } from '@/api/tokenStore'
import { ApiCollectionsService } from '@/api/collectionsService'
import { ApiProductsService } from '@/api/productsService'
import { ApiPlansService } from '@/api/plansService'
import { ApiOrdersService } from '@/api/ordersService'


const tokenStore = new LocalStorageTokenStore('token')
const http = new FetchHttpClient(tokenStore)

export const collectionsService = new ApiCollectionsService(http)
export const productsService = new ApiProductsService(http)
export const plansService = new ApiPlansService(http)
export const ordersService = new ApiOrdersService(http)


export * from './types'
export * from './errors'
