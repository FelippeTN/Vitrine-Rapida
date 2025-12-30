export type Collection = {
  id: number
  owner_id: number
  share_token?: string | null
  name: string
  description: string
  created_at: string
  updated_at: string
}

export type CreateCollectionInput = {
  name: string
  description?: string
}

export type UpdateCollectionInput = {
  name?: string
  description?: string
}

export type Product = {
  id: number
  owner_id: number
  collection_id: number | null
  name: string
  description: string
  price: number
  image_url?: string | null
  created_at: string
  updated_at: string
}

export type CreateProductInput = {
  name: string
  description: string
  price: number
  collection_id?: number | null
  image?: File | null
}

export type UpdateProductInput = {
  name?: string
  description?: string
  price?: number
  collection_id?: number | null
  image?: File | null
}

export type ShareCollectionResponse = {
  share_token: string
}

export type PublicCatalogResponse = {
  collection: Collection
  products: Product[]
}
