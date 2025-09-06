import { useState, useEffect } from "react"
import { Navigate } from "react-router-dom"
import { Plus, Search, Edit, Trash2, Gamepad2, Tag, Palette } from "lucide-react"
import AdminLayout from "@/components/admin/AdminLayout"
import { CyberButton } from "@/components/ui/cyber-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import { useNotifications } from "@/hooks/useNotifications"
import type { Platform } from "@/types/database"

const PlatformsAdmin = () => {
  const { user } = useAuth()
  const notifications = useNotifications()
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreatePlatform, setShowCreatePlatform] = useState(false)
  const [editingPlatform, setEditingPlatform] = useState<Platform | null>(null)
  const [newPlatform, setNewPlatform] = useState({
    name: '',
    type: 'PC' as Platform['type'],
    icon_url: '',
    color: '#FF006E',
    sort_order: '0'
  })

  const platformTypes: Platform['type'][] = [
    'PC', 'PS5', 'PS4', 'PS3', 'Xbox Series', 'Xbox One', 'Xbox 360', 
    'Nintendo Switch', 'Nintendo 3DS', 'Mobile'
  ]

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
        await fetchPlatforms()
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  const fetchPlatforms = async () => {
    try {
      const { data, error } = await supabase
        .from('platforms')
        .select('*')
        .order('sort_order', { ascending: true })

      if (error) throw error
      setPlatforms(data || [])
    } catch (error) {
      console.error('Error fetching platforms:', error)
    }
  }

  const createPlatform = async () => {
    try {
      if (!newPlatform.name) {
        notifications.warning('El nombre de la plataforma es obligatorio')
        return
      }

      const slug = newPlatform.name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      const { error } = await supabase
        .from('platforms')
        .insert({
          name: newPlatform.name,
          slug: slug,
          type: newPlatform.type,
          icon_url: newPlatform.icon_url || null,
          color: newPlatform.color,
          sort_order: parseInt(newPlatform.sort_order) || 0,
          is_active: true
        })

      if (error) throw error

      setShowCreatePlatform(false)
      resetForm()
      await fetchPlatforms()
      notifications.success('Plataforma creada exitosamente')
    } catch (error: any) {
      console.error('Error creating platform:', error)
      notifications.error(`Error al crear plataforma: ${error.message}`)
    }
  }

  const updatePlatform = async () => {
    if (!editingPlatform) return

    try {
      const slug = newPlatform.name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      const { error } = await supabase
        .from('platforms')
        .update({
          name: newPlatform.name,
          slug: slug,
          type: newPlatform.type,
          icon_url: newPlatform.icon_url || null,
          color: newPlatform.color,
          sort_order: parseInt(newPlatform.sort_order) || 0
        })
        .eq('id', editingPlatform.id)

      if (error) throw error

      setEditingPlatform(null)
      resetForm()
      await fetchPlatforms()
      notifications.success('Plataforma actualizada exitosamente')
    } catch (error: any) {
      console.error('Error updating platform:', error)
      notifications.error(`Error al actualizar plataforma: ${error.message}`)
    }
  }

  const deletePlatform = async (platformId: string) => {
    const confirmed = await notifications.confirm({
      description: '¿Estás seguro de que quieres eliminar esta plataforma?'
    })
    if (!confirmed) return

    try {
      const { error } = await supabase
        .from('platforms')
        .update({ is_active: false })
        .eq('id', platformId)

      if (error) throw error
      
      await fetchPlatforms()
      notifications.success('Plataforma eliminada exitosamente')
    } catch (error) {
      console.error('Error deleting platform:', error)
      notifications.error('Error al eliminar la plataforma')
    }
  }

  const resetForm = () => {
    setNewPlatform({
      name: '',
      type: 'PC',
      icon_url: '',
      color: '#FF006E',
      sort_order: '0'
    })
  }

  const startEditing = (platform: Platform) => {
    setEditingPlatform(platform)
    setNewPlatform({
      name: platform.name,
      type: platform.type,
      icon_url: platform.icon_url || '',
      color: platform.color,
      sort_order: platform.sort_order.toString()
    })
    setShowCreatePlatform(true)
  }

  const filteredPlatforms = platforms.filter(platform =>
    platform.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    platform.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="animate-cyber-pulse text-primary">Cargando plataformas...</div>
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
              Gestión de Plataformas
            </h1>
            <p className="text-muted-foreground">
              Administra las plataformas de juegos
            </p>
          </div>
          <CyberButton 
            className="flex items-center gap-2"
            onClick={() => {
              setEditingPlatform(null)
              resetForm()
              setShowCreatePlatform(true)
            }}
          >
            <Plus className="h-4 w-4" />
            Nueva Plataforma
          </CyberButton>
        </div>

        {/* Create/Edit Platform Modal */}
        {showCreatePlatform && (
          <Card className="cyber-card">
            <CardHeader>
              <CardTitle>
                {editingPlatform ? 'Editar Plataforma' : 'Crear Nueva Plataforma'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={newPlatform.name}
                    onChange={(e) => setNewPlatform({...newPlatform, name: e.target.value})}
                    className="cyber-border"
                    placeholder="Nombre de la plataforma"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Tipo *</Label>
                  <Select 
                    value={newPlatform.type} 
                    onValueChange={(value) => setNewPlatform({...newPlatform, type: value as Platform['type']})}
                  >
                    <SelectTrigger className="cyber-border">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {platformTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="color">Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={newPlatform.color}
                      onChange={(e) => setNewPlatform({...newPlatform, color: e.target.value})}
                      className="cyber-border w-20 h-10 p-1"
                    />
                    <Input
                      value={newPlatform.color}
                      onChange={(e) => setNewPlatform({...newPlatform, color: e.target.value})}
                      className="cyber-border flex-1"
                      placeholder="#FF006E"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="sort_order">Orden</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={newPlatform.sort_order}
                    onChange={(e) => setNewPlatform({...newPlatform, sort_order: e.target.value})}
                    className="cyber-border"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="icon_url">URL del Icono</Label>
                <Input
                  id="icon_url"
                  value={newPlatform.icon_url}
                  onChange={(e) => setNewPlatform({...newPlatform, icon_url: e.target.value})}
                  className="cyber-border"
                  placeholder="https://ejemplo.com/icono.png"
                />
              </div>

              <div className="flex gap-2">
                <CyberButton 
                  onClick={editingPlatform ? updatePlatform : createPlatform} 
                  disabled={!newPlatform.name}
                >
                  {editingPlatform ? 'Actualizar' : 'Crear'} Plataforma
                </CyberButton>
                <CyberButton 
                  variant="outline" 
                  onClick={() => {
                    setShowCreatePlatform(false)
                    setEditingPlatform(null)
                    resetForm()
                  }}
                >
                  Cancelar
                </CyberButton>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <Card className="cyber-card">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar plataformas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 cyber-border"
              />
            </div>
          </CardContent>
        </Card>

        {/* Platforms Grid */}
        {filteredPlatforms.length === 0 ? (
          <Card className="cyber-card">
            <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
              <Gamepad2 className="h-16 w-16 text-muted-foreground" />
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">No se encontraron plataformas</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando tu primera plataforma'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlatforms.map((platform) => (
              <Card key={platform.id} className="cyber-card group hover:shadow-glow-primary">
                <CardHeader className="p-0">
                  <div className="relative">
                    <div 
                      className="w-full h-32 rounded-t-lg flex items-center justify-center"
                      style={{ backgroundColor: platform.color + '20' }}
                    >
                      {platform.icon_url ? (
                        <img
                          src={platform.icon_url}
                          alt={platform.name}
                          className="w-16 h-16 object-contain"
                        />
                      ) : (
                        <Gamepad2 
                          className="w-16 h-16" 
                          style={{ color: platform.color }}
                        />
                      )}
                    </div>
                    <div className="absolute top-2 left-2 flex gap-2">
                      {!platform.is_active && (
                        <Badge variant="destructive">
                          Inactiva
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {platform.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Tipo: {platform.type}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      Orden: {platform.sort_order}
                    </span>
                    <div className="flex items-center gap-1">
                      <Palette className="h-3 w-3" />
                      <div 
                        className="w-4 h-4 rounded border border-border"
                        style={{ backgroundColor: platform.color }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1">
                    <CyberButton 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => startEditing(platform)}
                    >
                      <Edit className="h-4 w-4" />
                    </CyberButton>
                    <CyberButton 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deletePlatform(platform.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </CyberButton>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Creado: {new Date(platform.created_at).toLocaleDateString('es-AR')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default PlatformsAdmin