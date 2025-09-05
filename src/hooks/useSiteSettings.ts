import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

interface SiteSettings {
  site_name: string
  site_description: string
  contact_email: string
  contact_phone: string
  contact_address: string
  whatsapp_number: string
  social_facebook: string
  social_instagram: string
  social_twitter: string
  currency: string
  tax_rate: string
}

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<Partial<SiteSettings>>({})
  const [loading, setLoading] = useState(true)

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')

      if (error) throw error
      
      // Convert array of settings to object
      
      const settingsObj: Partial<SiteSettings> = {}
      
      data?.forEach((setting: any) => {
        settingsObj[setting.key as keyof SiteSettings] = setting.value
      })
      
      setSettings(settingsObj)
    } catch (error) {
      console.error('Error fetching site settings:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  return { settings, loading, refetch: fetchSettings }
}
