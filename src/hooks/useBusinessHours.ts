import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useNotifications } from './useNotifications'
import { Tables } from '@/integrations/supabase/types'

type BusinessHour = Tables<'business_hours'>
type TimeSlot = {
  start: string
  end: string
}

export const useBusinessHours = () => {
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([])
  const [loading, setLoading] = useState(true)
  const notifications = useNotifications()

  const fetchBusinessHours = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('business_hours')
        .select('*')
        .order('day_type')

      if (error) throw error
      setBusinessHours(data || [])
    } catch (error) {
      console.error('Error fetching business hours:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      notifications.error(`Error al cargar horarios: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }, [notifications])

  useEffect(() => {
    fetchBusinessHours()
  }, [fetchBusinessHours])

  const saveBusinessHour = async (hourData: {
    day_type: string
    time_slots: TimeSlot[]
    is_closed: boolean
  }) => {
    try {
      const { data, error } = await supabase
        .from('business_hours')
        .upsert({
          day_type: hourData.day_type,
          time_slots: hourData.time_slots,
          is_closed: hourData.is_closed
        }, { onConflict: 'day_type' })
        .select()
        .single()

      if (error) throw error

      // Update local state
      setBusinessHours(prev =>
        prev.filter(h => h.day_type !== hourData.day_type).concat(data)
      )

      notifications.success('Horarios guardados exitosamente')
      return data
    } catch (error) {
      console.error('Error saving business hours:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      notifications.error(`Error al guardar horarios: ${errorMessage}`)
      throw error
    }
  }

  const deleteBusinessHour = async (dayType: string) => {
    try {
      const { error } = await supabase
        .from('business_hours')
        .delete()
        .eq('day_type', dayType)

      if (error) throw error

      // Update local state
      setBusinessHours(prev => prev.filter(h => h.day_type !== dayType))

      notifications.success('Horarios eliminados exitosamente')
    } catch (error) {
      console.error('Error deleting business hours:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      notifications.error(`Error al eliminar horarios: ${errorMessage}`)
      throw error
    }
  }

  return {
    businessHours,
    loading,
    saveBusinessHour,
    deleteBusinessHour,
    refetch: fetchBusinessHours
  }
}
