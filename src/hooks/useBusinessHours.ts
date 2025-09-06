import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'

export interface BusinessHour {
  id: string
  day_type: string
  time_slots: { start: string; end: string }[]
  is_closed: boolean
  created_at: string
  updated_at: string
}

export interface BusinessHourInput {
  day_type: string
  time_slots: { start: string; end: string }[]
  is_closed: boolean
}

export const useBusinessHours = () => {
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBusinessHours = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('business_hours')
        .select('*')
        .order('day_type')

      if (error) throw error

      setBusinessHours((data || []).map(hour => ({
        ...hour,
        time_slots: hour.time_slots as { start: string; end: string }[]
      })))
    } catch (err) {
      console.error('Error fetching business hours:', err)
      setError(err instanceof Error ? err.message : 'Error loading business hours')
    } finally {
      setLoading(false)
    }
  }, [])

  const saveBusinessHour = async (hourData: BusinessHourInput) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('business_hours')
        .upsert({
          day_type: hourData.day_type,
          time_slots: hourData.time_slots,
          is_closed: hourData.is_closed,
          updated_at: new Date().toISOString()
        })
        .select()

      if (error) throw error

      await fetchBusinessHours()
      return data
    } catch (err) {
      console.error('Error saving business hours:', err)
      setError(err instanceof Error ? err.message : 'Error saving business hours')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteBusinessHour = async (dayType: string) => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase
        .from('business_hours')
        .delete()
        .eq('day_type', dayType)

      if (error) throw error

      await fetchBusinessHours()
    } catch (err) {
      console.error('Error deleting business hours:', err)
      setError(err instanceof Error ? err.message : 'Error deleting business hours')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getBusinessHoursByDay = (dayType: string): BusinessHour | null => {
    return businessHours.find(hour => hour.day_type === dayType) || null
  }

  useEffect(() => {
    fetchBusinessHours()
  }, [fetchBusinessHours])

  return {
    businessHours,
    loading,
    error,
    saveBusinessHour,
    deleteBusinessHour,
    getBusinessHoursByDay,
    refetch: fetchBusinessHours
  }
}
