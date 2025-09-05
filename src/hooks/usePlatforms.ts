import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import type { Platform } from '@/types/database'

export const usePlatforms = () => {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from('platforms')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })

        if (error) {
          throw error
        }

        setPlatforms(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading platforms')
        console.error('Error fetching platforms:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPlatforms()
  }, [])

  return { platforms, loading, error }
}