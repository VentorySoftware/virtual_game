import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import type { ProductBundle } from '@/types/database'

export type SortOption = 'recent' | 'oldest' | 'price_asc' | 'price_desc'

export const useBundles = (
  limit?: number,
  platformFilter?: string,
  searchText?: string,
  sortOption?: SortOption
) => {
  const [bundles, setBundles] = useState<ProductBundle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBundles = async () => {
      try {
        setLoading(true)
        setError(null)

        let query = supabase
          .from('product_bundles')
          .select(`
            *,
            bundle_items:bundle_items(
              *,
              product:products(*, platform:platforms(*))
            )
          `)
          .eq('is_active', true)

        // Apply platform filter
        if (platformFilter && platformFilter !== 'all') {
          // Supabase does not support filtering on nested foreign tables with eq directly
          // We need to filter client-side after fetching or use a different approach
          // For now, remove this filter and do client-side filtering in the hook
          // query = query
          //   .eq('bundle_items.product.platform.slug', platformFilter)
        }

        // Apply search filter
        if (searchText && searchText.trim()) {
          // For now, we'll do client-side search since Supabase nested filtering is complex
          // query = query.or(`name.ilike.${searchTerm},bundle_items.product.title.ilike.${searchTerm}`)
        }

        // Apply sorting
        switch (sortOption) {
          case 'recent':
            query = query.order('created_at', { ascending: false })
            break
          case 'oldest':
            query = query.order('created_at', { ascending: true })
            break
          case 'price_asc':
            query = query.order('bundle_price', { ascending: true })
            break
          case 'price_desc':
            query = query.order('bundle_price', { ascending: false })
            break
          default:
            query = query.order('created_at', { ascending: false })
        }

        if (limit) {
          query = query.limit(limit)
        }

        const { data, error } = await query

        if (error) {
          throw error
        }

        let filteredBundles = (data as any) || []

        // Apply client-side platform filtering
        if (platformFilter && platformFilter !== 'all') {
          filteredBundles = filteredBundles.filter(bundle =>
            bundle.bundle_items?.some((item: any) =>
              item.product?.platform?.slug === platformFilter
            )
          )
        }

        // Apply client-side search filtering
        if (searchText && searchText.trim()) {
          const searchTerm = searchText.trim().toLowerCase()
          filteredBundles = filteredBundles.filter(bundle => {
            // Search in bundle name
            if (bundle.name?.toLowerCase().includes(searchTerm)) {
              return true
            }
            // Search in product titles
            return bundle.bundle_items?.some((item: any) =>
              item.product?.title?.toLowerCase().includes(searchTerm)
            )
          })
        }

        setBundles(filteredBundles)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading bundles')
        console.error('Error fetching bundles:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchBundles()
  }, [limit, platformFilter, searchText, sortOption])

  return { bundles, loading, error }
}
