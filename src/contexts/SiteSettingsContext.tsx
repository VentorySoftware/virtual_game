import { createContext, useContext, ReactNode } from 'react'
import { useSiteSettings as useOriginalSiteSettings } from '@/hooks/useSiteSettings'

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

interface SiteSettingsContextType {
  settings: Partial<SiteSettings>
  loading: boolean
  refetch: () => Promise<void>
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined)

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext)
  if (context === undefined) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider')
  }
  return context
}

interface SiteSettingsProviderProps {
  children: ReactNode
}

export const SiteSettingsProvider = ({ children }: SiteSettingsProviderProps) => {
  const siteSettings = useOriginalSiteSettings()
  
  return (
    <SiteSettingsContext.Provider value={siteSettings}>
      {children}
    </SiteSettingsContext.Provider>
  )
}