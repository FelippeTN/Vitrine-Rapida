import type { HttpClient } from './httpClient'
import type { CreateOrderInput } from './types'

export interface OrdersService {
    create(input: CreateOrderInput): Promise<{ order_token: string; total: number }>
}

export class ApiOrdersService implements OrdersService {
    private readonly http: HttpClient

    constructor(http: HttpClient) {
        this.http = http
    }

    create(input: CreateOrderInput): Promise<{ order_token: string; total: number }> {
        return this.http.request('POST', '/public/orders', { body: input })
    }
}
