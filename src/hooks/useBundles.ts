import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import type { ProductBundle } from '@/types/database'

export const useBundles = (limit?: number) => {
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
              product:products(*)
            )
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (limit) {
          query = query.limit(limit)
        }

        const { data, error } = await query

        if (error) {
          throw error
        }

        setBundles((data as any) || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading bundles')
        console.error('Error fetching bundles:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchBundles()
  }, [limit])

  return { bundles, loading, error }
}