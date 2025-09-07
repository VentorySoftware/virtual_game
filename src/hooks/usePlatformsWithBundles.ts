import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import type { Platform } from '@/types/database'

export const usePlatformsWithBundles = () => {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPlatformsWithBundles = async () => {
      try {
        setLoading(true)
        setError(null)

        // First, get all active platforms
        const { data: allPlatforms, error: platformsError } = await supabase
          .from('platforms')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })

        if (platformsError) {
          throw platformsError
        }

        // Then, get all active bundles with their platform information
        const { data: bundles, error: bundlesError } = await supabase
          .from('product_bundles')
          .select(`
            *,
            bundle_items:bundle_items(
              *,
              product:products(*, platform:platforms(*))
            )
          `)
          .eq('is_active', true)

        if (bundlesError) {
          throw bundlesError
        }

        // Extract unique platform IDs that have at least one bundle
        const platformsWithBundles = new Set<string>()

        bundles?.forEach((bundle: any) => {
          bundle.bundle_items?.forEach((item: any) => {
            if (item.product?.platform?.id) {
              platformsWithBundles.add(item.product.platform.id)
            }
          })
        })

        // Filter platforms to only include those with bundles
        const filteredPlatforms = allPlatforms?.filter(platform =>
          platformsWithBundles.has(platform.id)
        ) || []

        setPlatforms(filteredPlatforms)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading platforms with bundles')
        console.error('Error fetching platforms with bundles:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPlatformsWithBundles()
  }, [])

  return { platforms, loading, error }
}
