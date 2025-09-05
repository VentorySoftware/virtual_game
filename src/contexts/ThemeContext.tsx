import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from "@/integrations/supabase/client"

interface ColorSettings {
  primary_hue: string
  primary_saturation: string
  primary_lightness: string
  secondary_hue: string
  secondary_saturation: string
  secondary_lightness: string
  accent_hue: string
  accent_saturation: string
  accent_lightness: string
}

interface ThemeContextType {
  colorSettings: ColorSettings
  setColorSettings: (colors: ColorSettings) => void
  applyColors: (colors: ColorSettings) => void
  resetColors: () => void
  defaultColors: ColorSettings
}

const defaultColors: ColorSettings = {
  primary_hue: '326',
  primary_saturation: '100',
  primary_lightness: '51',
  secondary_hue: '174',
  secondary_saturation: '100',
  secondary_lightness: '48',
  accent_hue: '48',
  accent_saturation: '100',
  accent_lightness: '52'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [colorSettings, setColorSettings] = useState<ColorSettings>(defaultColors)

  const applyColors = (colors: ColorSettings) => {
    const root = document.documentElement
    
    // Apply primary color
    root.style.setProperty('--primary', `${colors.primary_hue} ${colors.primary_saturation}% ${colors.primary_lightness}%`)
    
    // Apply secondary color
    root.style.setProperty('--secondary', `${colors.secondary_hue} ${colors.secondary_saturation}% ${colors.secondary_lightness}%`)
    
    // Apply accent color
    root.style.setProperty('--accent', `${colors.accent_hue} ${colors.accent_saturation}% ${colors.accent_lightness}%`)
    
    // Update ring color to match primary
    root.style.setProperty('--ring', `${colors.primary_hue} ${colors.primary_saturation}% ${colors.primary_lightness}%`)
    
    // Update gradients and glows
    root.style.setProperty('--gradient-primary', `linear-gradient(135deg, hsl(${colors.primary_hue} ${colors.primary_saturation}% ${colors.primary_lightness}%), hsl(${colors.primary_hue} ${colors.primary_saturation}% 35%))`)
    root.style.setProperty('--gradient-secondary', `linear-gradient(135deg, hsl(${colors.secondary_hue} ${colors.secondary_saturation}% ${colors.secondary_lightness}%), hsl(${colors.secondary_hue} ${colors.secondary_saturation}% 35%))`)
    root.style.setProperty('--gradient-accent', `linear-gradient(135deg, hsl(${colors.accent_hue} ${colors.accent_saturation}% ${colors.accent_lightness}%), hsl(${colors.accent_hue} ${colors.accent_saturation}% 40%))`)
    root.style.setProperty('--gradient-cyber', `linear-gradient(135deg, hsl(${colors.primary_hue} ${colors.primary_saturation}% ${colors.primary_lightness}%), hsl(${colors.secondary_hue} ${colors.secondary_saturation}% ${colors.secondary_lightness}%))`)
    
    // Update glows
    root.style.setProperty('--glow-primary', `0 0 20px hsl(${colors.primary_hue} ${colors.primary_saturation}% ${colors.primary_lightness}% / 0.5)`)
    root.style.setProperty('--glow-secondary', `0 0 20px hsl(${colors.secondary_hue} ${colors.secondary_saturation}% ${colors.secondary_lightness}% / 0.5)`)
    root.style.setProperty('--glow-accent', `0 0 20px hsl(${colors.accent_hue} ${colors.accent_saturation}% ${colors.accent_lightness}% / 0.5)`)
  }

  const resetColors = () => {
    setColorSettings(defaultColors)
    applyColors(defaultColors)
  }

  const loadColorsFromDB = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .in('key', [
          'primary_hue', 'primary_saturation', 'primary_lightness',
          'secondary_hue', 'secondary_saturation', 'secondary_lightness',
          'accent_hue', 'accent_saturation', 'accent_lightness'
        ])

      if (error) throw error
      
      if (data && data.length > 0) {
        const colorsFromDB = { ...defaultColors }
        data.forEach(setting => {
          if (setting.key in colorsFromDB) {
            colorsFromDB[setting.key as keyof ColorSettings] = String(setting.value)
          }
        })
        
        setColorSettings(colorsFromDB)
        applyColors(colorsFromDB)
      } else {
        // No settings in DB, use defaults
        applyColors(defaultColors)
      }
    } catch (error) {
      console.error('Error loading colors from DB:', error)
      // Fallback to default colors
      applyColors(defaultColors)
    }
  }

  useEffect(() => {
    loadColorsFromDB()
  }, [])

  return (
    <ThemeContext.Provider value={{
      colorSettings,
      setColorSettings,
      applyColors,
      resetColors,
      defaultColors
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}