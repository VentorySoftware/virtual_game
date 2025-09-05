import { useState, useEffect } from 'react'
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

  useEffect(() => {
    fetchBusinessHours()
  }, [])

  const fetchBusinessHours = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('business_hours')
        .select('*')
        .order('day_type')

      if (error) throw error
      setBusinessHours(data || [])
    } catch (error: any) {
      console.error('Error fetching business hours:', error)
      notifications.error(`Error al cargar horarios: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

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
    } catch (error: any) {
      console.error('Error saving business hours:', error)
      notifications.error(`Error al guardar horarios: ${error.message}`)
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
    } catch (error: any) {
      console.error('Error deleting business hours:', error)
      notifications.error(`Error al eliminar horarios: ${error.message}`)
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
