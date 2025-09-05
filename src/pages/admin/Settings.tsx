import { useState, useEffect } from "react"
import { Navigate } from "react-router-dom"
import { Settings, Save, Globe, Mail, Phone, MapPin, Palette, RotateCcw } from "lucide-react"
import AdminLayout from "@/components/admin/AdminLayout"
import { CyberButton } from "@/components/ui/cyber-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"

interface SiteSetting {
  key: string
  value: any
  description?: string
}

const SettingsAdmin = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    site_name: '',
    site_description: '',
    contact_email: '',
    contact_phone: '',
    contact_address: '',
    whatsapp_number: '',
    social_facebook: '',
    social_instagram: '',
    social_twitter: '',
    currency: 'ARS',
    tax_rate: '21'
  })
  const [colorSettings, setColorSettings] = useState({
    primary_hue: '326',
    primary_saturation: '100',
    primary_lightness: '51',
    secondary_hue: '174', 
    secondary_saturation: '100',
    secondary_lightness: '48',
    accent_hue: '48',
    accent_saturation: '100',
    accent_lightness: '52'
  })

  const defaultColors = {
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

  useEffect(() => {
    if (user) {
      checkAdminStatus()
    }
  }, [user])

  const checkAdminStatus = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase.rpc('is_admin', { _user_id: user.id })
      
      if (error) throw error
      
      setIsAdmin(data)
      
      if (data) {
        await fetchSettings()
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')

      if (error) throw error
      
      // Convert array of settings to object
      const settingsObj = { ...settings }
      const colorsObj = { ...colorSettings }
      
      data?.forEach((setting: SiteSetting) => {
        if (setting.key in settingsObj) {
          settingsObj[setting.key as keyof typeof settings] = setting.value
        } else if (setting.key in colorsObj) {
          colorsObj[setting.key as keyof typeof colorSettings] = setting.value
        }
      })
      
      setSettings(settingsObj)
      setColorSettings(colorsObj)
      
      // Apply colors to CSS
      applyColors(colorsObj)
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const applyColors = (colors: typeof colorSettings) => {
    const root = document.documentElement
    
    // Apply primary color
    root.style.setProperty('--primary', `${colors.primary_hue} ${colors.primary_saturation}% ${colors.primary_lightness}%`)
    
    // Apply secondary color
    root.style.setProperty('--secondary', `${colors.secondary_hue} ${colors.secondary_saturation}% ${colors.secondary_lightness}%`)
    
    // Apply accent color
    root.style.setProperty('--accent', `${colors.accent_hue} ${colors.accent_saturation}% ${colors.accent_lightness}%`)
    
    // Update gradients and glows
    root.style.setProperty('--gradient-primary', `linear-gradient(135deg, hsl(${colors.primary_hue} ${colors.primary_saturation}% ${colors.primary_lightness}%), hsl(${colors.primary_hue} ${colors.primary_saturation}% 35%))`)
    root.style.setProperty('--gradient-secondary', `linear-gradient(135deg, hsl(${colors.secondary_hue} ${colors.secondary_saturation}% ${colors.secondary_lightness}%), hsl(${colors.secondary_hue} ${colors.secondary_saturation}% 35%))`)
    root.style.setProperty('--gradient-accent', `linear-gradient(135deg, hsl(${colors.accent_hue} ${colors.accent_saturation}% ${colors.accent_lightness}%), hsl(${colors.accent_hue} ${colors.accent_saturation}% 40%))`)
    root.style.setProperty('--gradient-cyber', `linear-gradient(135deg, hsl(${colors.primary_hue} ${colors.primary_saturation}% ${colors.primary_lightness}%), hsl(${colors.secondary_hue} ${colors.secondary_saturation}% ${colors.secondary_lightness}%))`)
  }

  const saveColorSettings = async () => {
    setSaving(true)
    try {
      // Save color settings
      const colorSettingsArray = Object.entries(colorSettings).map(([key, value]) => ({
        key,
        value,
        description: `Color setting: ${key}`
      }))

      for (const setting of colorSettingsArray) {
        const { error } = await supabase
          .from('site_settings')
          .upsert(setting, { onConflict: 'key' })

        if (error) throw error
      }
      
      applyColors(colorSettings)
      alert('Colores guardados exitosamente')
    } catch (error: any) {
      console.error('Error saving colors:', error)
      alert(`Error al guardar colores: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const resetColors = async () => {
    if (!confirm('¿Estás seguro de que quieres restablecer los colores a los valores originales?')) return
    
    setColorSettings(defaultColors)
    applyColors(defaultColors)
    
    // Save default colors to database
    setSaving(true)
    try {
      const colorSettingsArray = Object.entries(defaultColors).map(([key, value]) => ({
        key,
        value,
        description: `Color setting: ${key}`
      }))

      for (const setting of colorSettingsArray) {
        const { error } = await supabase
          .from('site_settings')
          .upsert(setting, { onConflict: 'key' })

        if (error) throw error
      }
      
      alert('Colores restablecidos a valores originales')
    } catch (error: any) {
      console.error('Error resetting colors:', error)
      alert(`Error al restablecer colores: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleColorChange = (colorType: 'primary' | 'secondary' | 'accent', property: 'hue' | 'saturation' | 'lightness', value: string) => {
    const key = `${colorType}_${property}` as keyof typeof colorSettings
    const newColors = { ...colorSettings, [key]: value }
    setColorSettings(newColors)
    
    // Apply immediately for live preview
    applyColors(newColors)
  }

  const hslToHex = (h: number, s: number, l: number): string => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  const hexToHsl = (hex: string): [number, number, number] => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      // Prepare settings array for upsert
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        description: getSettingDescription(key)
      }))

      for (const setting of settingsArray) {
        const { error } = await supabase
          .from('site_settings')
          .upsert(setting, { onConflict: 'key' })

        if (error) throw error
      }

      alert('Configuración guardada exitosamente')
    } catch (error: any) {
      console.error('Error saving settings:', error)
      alert(`Error al guardar configuración: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const getSettingDescription = (key: string): string => {
    const descriptions: { [key: string]: string } = {
      site_name: 'Nombre del sitio web',
      site_description: 'Descripción del sitio web',
      contact_email: 'Email de contacto principal',
      contact_phone: 'Teléfono de contacto',
      contact_address: 'Dirección física',
      whatsapp_number: 'Número de WhatsApp',
      social_facebook: 'URL de Facebook',
      social_instagram: 'URL de Instagram',
      social_twitter: 'URL de Twitter',
      currency: 'Moneda por defecto',
      tax_rate: 'Tasa de impuestos (%)'
    }
    return descriptions[key] || ''
  }

  const handleInputChange = (key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="animate-cyber-pulse text-primary">Cargando configuración...</div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold font-orbitron neon-text">
              Configuración del Sistema
            </h1>
            <p className="text-muted-foreground">
              Gestiona la configuración general del sitio
            </p>
          </div>
          <CyberButton 
            className="flex items-center gap-2"
            onClick={saveSettings}
            disabled={saving}
          >
            <Save className="h-4 w-4" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </CyberButton>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="contact">Contacto</TabsTrigger>
            <TabsTrigger value="social">Redes Sociales</TabsTrigger>
            <TabsTrigger value="colors">Colores</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Configuración General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="site_name">Nombre del Sitio</Label>
                  <Input
                    id="site_name"
                    value={settings.site_name}
                    onChange={(e) => handleInputChange('site_name', e.target.value)}
                    className="cyber-border"
                    placeholder="VirtualGame Store"
                  />
                </div>

                <div>
                  <Label htmlFor="site_description">Descripción del Sitio</Label>
                  <Textarea
                    id="site_description"
                    value={settings.site_description}
                    onChange={(e) => handleInputChange('site_description', e.target.value)}
                    className="cyber-border"
                    placeholder="Tu tienda de videojuegos favorita"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="currency">Moneda</Label>
                    <Input
                      id="currency"
                      value={settings.currency}
                      onChange={(e) => handleInputChange('currency', e.target.value)}
                      className="cyber-border"
                      placeholder="ARS"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tax_rate">Tasa de Impuestos (%)</Label>
                    <Input
                      id="tax_rate"
                      type="number"
                      value={settings.tax_rate}
                      onChange={(e) => handleInputChange('tax_rate', e.target.value)}
                      className="cyber-border"
                      placeholder="21"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact">
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Información de Contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="contact_email">Email de Contacto</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="contact_email"
                      type="email"
                      value={settings.contact_email}
                      onChange={(e) => handleInputChange('contact_email', e.target.value)}
                      className="pl-10 cyber-border"
                      placeholder="contacto@virtualgame.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="contact_phone">Teléfono de Contacto</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="contact_phone"
                      value={settings.contact_phone}
                      onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                      className="pl-10 cyber-border"
                      placeholder="+54 9 11 1234-5678"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="whatsapp_number">Número de WhatsApp</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="whatsapp_number"
                      value={settings.whatsapp_number}
                      onChange={(e) => handleInputChange('whatsapp_number', e.target.value)}
                      className="pl-10 cyber-border"
                      placeholder="+5491112345678"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="contact_address">Dirección</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea
                      id="contact_address"
                      value={settings.contact_address}
                      onChange={(e) => handleInputChange('contact_address', e.target.value)}
                      className="pl-10 cyber-border"
                      placeholder="Av. Corrientes 1234, CABA, Argentina"
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="social">
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle>Redes Sociales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="social_facebook">Facebook</Label>
                  <Input
                    id="social_facebook"
                    value={settings.social_facebook}
                    onChange={(e) => handleInputChange('social_facebook', e.target.value)}
                    className="cyber-border"
                    placeholder="https://facebook.com/virtualgame"
                  />
                </div>

                <div>
                  <Label htmlFor="social_instagram">Instagram</Label>
                  <Input
                    id="social_instagram"
                    value={settings.social_instagram}
                    onChange={(e) => handleInputChange('social_instagram', e.target.value)}
                    className="cyber-border"
                    placeholder="https://instagram.com/virtualgame"
                  />
                </div>

                <div>
                  <Label htmlFor="social_twitter">Twitter</Label>
                  <Input
                    id="social_twitter"
                    value={settings.social_twitter}
                    onChange={(e) => handleInputChange('social_twitter', e.target.value)}
                    className="cyber-border"
                    placeholder="https://twitter.com/virtualgame"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="colors">
            <div className="space-y-6">
              <Card className="cyber-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Paleta de Colores del Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-sm text-muted-foreground mb-4">
                    Personaliza los colores principales del sistema. Los cambios se aplican en tiempo real.
                  </div>

                  {/* Primary Color */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Color Primario (Rosa Neón)</Label>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-12 h-12 rounded-lg border-2 border-white/20"
                          style={{ 
                            backgroundColor: `hsl(${colorSettings.primary_hue}, ${colorSettings.primary_saturation}%, ${colorSettings.primary_lightness}%)` 
                          }}
                        />
                        <input
                          type="color"
                          value={hslToHex(
                            parseInt(colorSettings.primary_hue), 
                            parseInt(colorSettings.primary_saturation), 
                            parseInt(colorSettings.primary_lightness)
                          )}
                          onChange={(e) => {
                            const [h, s, l] = hexToHsl(e.target.value);
                            handleColorChange('primary', 'hue', h.toString());
                            handleColorChange('primary', 'saturation', s.toString());
                            handleColorChange('primary', 'lightness', l.toString());
                          }}
                          className="w-8 h-8 rounded border-none cursor-pointer"
                        />
                      </div>
                      <div>
                        <Label htmlFor="primary_hue" className="text-xs">Matiz</Label>
                        <Input
                          id="primary_hue"
                          type="range"
                          min="0"
                          max="360"
                          value={colorSettings.primary_hue}
                          onChange={(e) => handleColorChange('primary', 'hue', e.target.value)}
                          className="cyber-border"
                        />
                        <div className="text-xs text-center mt-1">{colorSettings.primary_hue}°</div>
                      </div>
                      <div>
                        <Label htmlFor="primary_saturation" className="text-xs">Saturación</Label>
                        <Input
                          id="primary_saturation"
                          type="range"
                          min="0"
                          max="100"
                          value={colorSettings.primary_saturation}
                          onChange={(e) => handleColorChange('primary', 'saturation', e.target.value)}
                          className="cyber-border"
                        />
                        <div className="text-xs text-center mt-1">{colorSettings.primary_saturation}%</div>
                      </div>
                      <div>
                        <Label htmlFor="primary_lightness" className="text-xs">Luminosidad</Label>
                        <Input
                          id="primary_lightness"
                          type="range"
                          min="0"
                          max="100"
                          value={colorSettings.primary_lightness}
                          onChange={(e) => handleColorChange('primary', 'lightness', e.target.value)}
                          className="cyber-border"
                        />
                        <div className="text-xs text-center mt-1">{colorSettings.primary_lightness}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Secondary Color */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Color Secundario (Turquesa)</Label>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-12 h-12 rounded-lg border-2 border-white/20"
                          style={{ 
                            backgroundColor: `hsl(${colorSettings.secondary_hue}, ${colorSettings.secondary_saturation}%, ${colorSettings.secondary_lightness}%)` 
                          }}
                        />
                        <input
                          type="color"
                          value={hslToHex(
                            parseInt(colorSettings.secondary_hue), 
                            parseInt(colorSettings.secondary_saturation), 
                            parseInt(colorSettings.secondary_lightness)
                          )}
                          onChange={(e) => {
                            const [h, s, l] = hexToHsl(e.target.value);
                            handleColorChange('secondary', 'hue', h.toString());
                            handleColorChange('secondary', 'saturation', s.toString());
                            handleColorChange('secondary', 'lightness', l.toString());
                          }}
                          className="w-8 h-8 rounded border-none cursor-pointer"
                        />
                      </div>
                      <div>
                        <Label htmlFor="secondary_hue" className="text-xs">Matiz</Label>
                        <Input
                          id="secondary_hue"
                          type="range"
                          min="0"
                          max="360"
                          value={colorSettings.secondary_hue}
                          onChange={(e) => handleColorChange('secondary', 'hue', e.target.value)}
                          className="cyber-border"
                        />
                        <div className="text-xs text-center mt-1">{colorSettings.secondary_hue}°</div>
                      </div>
                      <div>
                        <Label htmlFor="secondary_saturation" className="text-xs">Saturación</Label>
                        <Input
                          id="secondary_saturation"
                          type="range"
                          min="0"
                          max="100"
                          value={colorSettings.secondary_saturation}
                          onChange={(e) => handleColorChange('secondary', 'saturation', e.target.value)}
                          className="cyber-border"
                        />
                        <div className="text-xs text-center mt-1">{colorSettings.secondary_saturation}%</div>
                      </div>
                      <div>
                        <Label htmlFor="secondary_lightness" className="text-xs">Luminosidad</Label>
                        <Input
                          id="secondary_lightness"
                          type="range"
                          min="0"
                          max="100"
                          value={colorSettings.secondary_lightness}
                          onChange={(e) => handleColorChange('secondary', 'lightness', e.target.value)}
                          className="cyber-border"
                        />
                        <div className="text-xs text-center mt-1">{colorSettings.secondary_lightness}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Color de Acento (Amarillo)</Label>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-12 h-12 rounded-lg border-2 border-white/20"
                          style={{ 
                            backgroundColor: `hsl(${colorSettings.accent_hue}, ${colorSettings.accent_saturation}%, ${colorSettings.accent_lightness}%)` 
                          }}
                        />
                        <input
                          type="color"
                          value={hslToHex(
                            parseInt(colorSettings.accent_hue), 
                            parseInt(colorSettings.accent_saturation), 
                            parseInt(colorSettings.accent_lightness)
                          )}
                          onChange={(e) => {
                            const [h, s, l] = hexToHsl(e.target.value);
                            handleColorChange('accent', 'hue', h.toString());
                            handleColorChange('accent', 'saturation', s.toString());
                            handleColorChange('accent', 'lightness', l.toString());
                          }}
                          className="w-8 h-8 rounded border-none cursor-pointer"
                        />
                      </div>
                      <div>
                        <Label htmlFor="accent_hue" className="text-xs">Matiz</Label>
                        <Input
                          id="accent_hue"
                          type="range"
                          min="0"
                          max="360"
                          value={colorSettings.accent_hue}
                          onChange={(e) => handleColorChange('accent', 'hue', e.target.value)}
                          className="cyber-border"
                        />
                        <div className="text-xs text-center mt-1">{colorSettings.accent_hue}°</div>
                      </div>
                      <div>
                        <Label htmlFor="accent_saturation" className="text-xs">Saturación</Label>
                        <Input
                          id="accent_saturation"
                          type="range"
                          min="0"
                          max="100"
                          value={colorSettings.accent_saturation}
                          onChange={(e) => handleColorChange('accent', 'saturation', e.target.value)}
                          className="cyber-border"
                        />
                        <div className="text-xs text-center mt-1">{colorSettings.accent_saturation}%</div>
                      </div>
                      <div>
                        <Label htmlFor="accent_lightness" className="text-xs">Luminosidad</Label>
                        <Input
                          id="accent_lightness"
                          type="range"
                          min="0"
                          max="100"
                          value={colorSettings.accent_lightness}
                          onChange={(e) => handleColorChange('accent', 'lightness', e.target.value)}
                          className="cyber-border"
                        />
                        <div className="text-xs text-center mt-1">{colorSettings.accent_lightness}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4 border-t border-primary/20">
                    <CyberButton 
                      onClick={saveColorSettings}
                      disabled={saving}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {saving ? 'Guardando...' : 'Guardar Colores'}
                    </CyberButton>
                    <CyberButton 
                      variant="outline"
                      onClick={resetColors}
                      disabled={saving}
                      className="flex items-center gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Restablecer Originales
                    </CyberButton>
                  </div>

                  {/* Preview Section */}
                  <div className="mt-6 p-4 rounded-lg bg-card/50 border border-primary/20">
                    <h4 className="text-sm font-medium mb-3">Vista Previa</h4>
                    <div className="flex gap-4 items-center">
                      <CyberButton size="sm" className="animate-cyber-pulse">
                        Botón Primario
                      </CyberButton>
                      <span className="neon-text font-orbitron">Texto con Efecto Neón</span>
                      <div className="px-3 py-1 rounded bg-gradient-cyber text-xs">
                        Gradiente Cyber
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}

export default SettingsAdmin