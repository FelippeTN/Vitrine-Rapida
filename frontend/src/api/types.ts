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

export type ProductImage = {
  id: number
  product_id: number
  image_url: string
  position: number
  created_at: string
}

export type Product = {
  id: number
  owner_id: number
  collection_id: number | null
  name: string
  description: string
  price: number
  stock?: number
  sizes?: string
  image_url?: string | null
  images?: ProductImage[]
  created_at: string
  updated_at: string
}

export type CreateProductInput = {
  name: string
  description: string
  price: number
  stock?: number
  sizes?: string
  collection_id?: number | null
  image?: File | null
  images?: File[]
}

export type UpdateProductInput = {
  name?: string
  description?: string
  price?: number
  stock?: number
  sizes?: string
  collection_id?: number | null
  image?: File | null
  images?: File[]
  delete_image_ids?: number[]
}

export type OrderItemInput = {
  product_id: number
  quantity: number
  size?: string
}

export type CreateOrderInput = {
  items: OrderItemInput[]
}

export type ShareCollectionResponse = {
  share_token: string
}

export type PublicCatalogResponse = {
  collection: Collection
  products: Product[]
  owner_phone: string
  store_name: string
  store_logo: string
}

export type Plan = {
  id: number
  name: string
  display_name: string
  description: string
  price: number
  max_products: number
  max_collections: number
  features: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type UserPlanInfo = {
  plan: Plan
  product_count: number
  collection_count: number
  can_create_product: boolean
  can_create_collection: boolean
}

export type UpgradeError = {
  error: string
  limit: number
  current_count: number
  plan_name: string
  upgrade_required: boolean
}

