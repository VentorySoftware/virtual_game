import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import type { Product } from '@/types/database'

export const useProducts = (filters?: {
  category?: string
  platform?: string
  type?: string
  featured?: boolean
  limit?: number
}) => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)

        let query = supabase
          .from('products')
          .select(`
            *,
            category:categories(*),
            platform:platforms(*)
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        // Apply filters
        if (filters?.category) {
          query = query.eq('categories.slug', filters.category)
        }
        
        if (filters?.platform) {
          query = query.eq('platforms.slug', filters.platform)
        }

        if (filters?.type) {
          query = query.eq('type', filters.type as any)
        }

        if (filters?.featured) {
          query = query.eq('is_featured', true)
        }

        if (filters?.limit) {
          query = query.limit(filters.limit)
        }

        const { data, error } = await query

        if (error) {
          throw error
        }

        setProducts((data as any) || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading products')
        console.error('Error fetching products:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [filters?.category, filters?.platform, filters?.type, filters?.featured, filters?.limit])

  return { products, loading, error }
}

export const useFeaturedProducts = () => {
  return useProducts({ featured: true, limit: 8 })
}

export const usePreorderProducts = () => {
  return useProducts({ type: 'preorder' })
}

export const useProductsByCategory = (categorySlug: string, limit?: number) => {
  return useProducts({ category: categorySlug, limit })
}

export const useProductsByPlatform = (platformSlug: string, limit?: number) => {
  return useProducts({ platform: platformSlug, limit })
}