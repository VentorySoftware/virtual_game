export interface Product {
  id: string
  title: string
  slug: string
  description: string | null
  short_description: string | null
  sku: string | null
  original_price: number | null
  price: number
  discount_percentage: number
  type: 'digital' | 'physical' | 'preorder' | 'bundle'
  is_active: boolean
  is_featured: boolean
  stock_quantity: number
  digital_content: string | null
  release_date: string | null
  preorder_date: string | null
  rating: number
  total_reviews: number
  image_url: string | null
  gallery: any
  seo_title: string | null
  seo_description: string | null
  meta_keywords: any | null
  created_at: string
  updated_at: string
  category?: Category
  platform?: Platform
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  parent_id: string | null
  sort_order: number
  is_active: boolean
  seo_title: string | null
  seo_description: string | null
  created_at: string
  updated_at: string
}

export interface Platform {
  id: string
  name: string
  slug: string
  type: 'PC' | 'PS5' | 'PS4' | 'PS3' | 'Xbox Series' | 'Xbox One' | 'Xbox 360' | 'Nintendo Switch' | 'Nintendo 3DS' | 'Mobile'
  icon_url: string | null
  color: string
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface ProductBundle {
  id: string
  name: string
  description: string | null
  bundle_price: number
  original_total: number | null
  is_active: boolean
  badge_text: string
  created_at: string
  updated_at: string
  bundle_items?: BundleItem[]
}

export interface BundleItem {
  id: string
  bundle_id: string
  product_id: string
  quantity: number
  created_at: string
  product?: Product
}

export interface Coupon {
  id: string
  code: string
  description: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  minimum_amount: number
  usage_limit: number | null
  used_count: number
  expires_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  featured_image: string | null
  author_id: string | null
  is_published: boolean
  is_featured: boolean
  tags: any | null
  seo_title: string | null
  seo_description: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface Banner {
  id: string
  title: string
  subtitle: string | null
  image_url: string | null
  link_url: string | null
  button_text: string | null
  position: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SiteSetting {
  id: string
  key: string
  value: any
  description: string | null
  created_at: string
  updated_at: string
}