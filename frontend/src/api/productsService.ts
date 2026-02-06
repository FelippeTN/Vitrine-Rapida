import type { HttpClient } from '@/api/httpClient'
import type { CreateProductInput, Product, UpdateProductInput } from '@/api/types'

export interface ProductsService {
  getMine(): Promise<Product[]>
  create(input: CreateProductInput): Promise<Product>
  update(id: number, input: UpdateProductInput): Promise<Product>
  remove(id: number): Promise<void>
  getPublic(filters?: { ownerId?: number; collectionId?: number }): Promise<Product[]>
}

export class ApiProductsService implements ProductsService {
  private readonly http: HttpClient

  constructor(http: HttpClient) {
    this.http = http
  }

  getMine(): Promise<Product[]> {
    return this.http.request<Product[]>('GET', '/protected/products', { auth: true })
  }

  create(input: CreateProductInput): Promise<Product> {
    const formData = new FormData()
    formData.append('name', input.name)
    formData.append('description', input.description)
    formData.append('price', String(input.price))
    if (input.stock !== undefined) {
      formData.append('stock', String(input.stock))
    }

    if (input.sizes) {
      formData.append('sizes', input.sizes)
    }

    if (input.collection_id) {
      formData.append('collection_id', String(input.collection_id))
    }

    if (input.images && input.images.length > 0) {
      input.images.forEach((file) => {
        formData.append('images', file)
      })
    } else if (input.image) {
      formData.append('image', input.image)
    }
    return this.http.request<Product>('POST', '/protected/products', { auth: true, body: formData })
  }

  update(id: number, input: UpdateProductInput): Promise<Product> {
    const formData = new FormData()
    if (input.name !== undefined) formData.append('name', input.name)
    if (input.description !== undefined) formData.append('description', input.description)
    if (input.price !== undefined) formData.append('price', String(input.price))
    if (input.stock !== undefined) formData.append('stock', String(input.stock))
    if (input.sizes !== undefined) formData.append('sizes', input.sizes)
    if (input.collection_id !== undefined && input.collection_id !== null) {
      formData.append('collection_id', String(input.collection_id))
    }

    if (input.images && input.images.length > 0) {
      input.images.forEach((file) => {
        formData.append('images', file)
      })
    } else if (input.image) {
      formData.append('image', input.image)
    }

    if (input.delete_image_ids && input.delete_image_ids.length > 0) {
      input.delete_image_ids.forEach((imgId) => {
        formData.append('delete_image_ids', String(imgId))
      })
    }
    return this.http.request<Product>('PUT', `/protected/products/${id}`, { auth: true, body: formData })
  }

  async remove(id: number): Promise<void> {
    await this.http.request<void>('DELETE', `/protected/products/${id}`, { auth: true })
  }

  getPublic(filters?: { ownerId?: number; collectionId?: number }): Promise<Product[]> {
    return this.http.request<Product[]>('GET', '/public/products', {
      query: {
        owner_id: filters?.ownerId,
        collection_id: filters?.collectionId,
      },
    })
  }
}
