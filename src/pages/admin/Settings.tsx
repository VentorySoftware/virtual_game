import { useState, useEffect } from "react"
import { Navigate } from "react-router-dom"
import { Settings, Save, Globe, Mail, Phone, MapPin } from "lucide-react"
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
      data?.forEach((setting: SiteSetting) => {
        settingsObj[setting.key as keyof typeof settings] = setting.value
      })
      
      setSettings(settingsObj)
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="contact">Contacto</TabsTrigger>
            <TabsTrigger value="social">Redes Sociales</TabsTrigger>
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
        </Tabs>
      </div>
    </AdminLayout>
  )
}

export default SettingsAdmin