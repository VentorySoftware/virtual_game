import { useState, useEffect } from "react"
import { Navigate } from "react-router-dom"
import { Plus, Search, Edit, Trash2, FolderTree, Tag, Image as ImageIcon } from "lucide-react"
import AdminLayout from "@/components/admin/AdminLayout"
import { CyberButton } from "@/components/ui/cyber-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import { ImageUploadCrop } from "@/components/admin/ImageUploadCrop"
import { useNotifications } from "@/hooks/useNotifications"

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  parent_id: string | null
}

const CategoriesAdmin = () => {
  const { user } = useAuth()
  const notifications = useNotifications()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    image_url: '',
    sort_order: '0'
  })
  const [showImageEditor, setShowImageEditor] = useState(false)

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
        await fetchCategories()
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const createCategory = async () => {
    try {
      if (!newCategory.name) {
        notifications.warning('El nombre de la categoría es obligatorio')
        return
      }

      const slug = newCategory.name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      const { error } = await supabase
        .from('categories')
        .insert({
          name: newCategory.name,
          slug: slug,
          description: newCategory.description || null,
          image_url: newCategory.image_url || null,
          sort_order: parseInt(newCategory.sort_order) || 0,
          is_active: true
        })

      if (error) throw error

      setShowCreateCategory(false)
      resetForm()
      await fetchCategories()
      notifications.success('Categoría creada exitosamente')
    } catch (error: any) {
      console.error('Error creating category:', error)
      notifications.error(`Error al crear categoría: ${error.message}`)
    }
  }

  const updateCategory = async () => {
    if (!editingCategory) return

    try {
      const slug = newCategory.name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      const { error } = await supabase
        .from('categories')
        .update({
          name: newCategory.name,
          slug: slug,
          description: newCategory.description || null,
          image_url: newCategory.image_url || null,
          sort_order: parseInt(newCategory.sort_order) || 0
        })
        .eq('id', editingCategory.id)

      if (error) throw error

      setEditingCategory(null)
      resetForm()
      await fetchCategories()
      notifications.success('Categoría actualizada exitosamente')
    } catch (error: any) {
      console.error('Error updating category:', error)
      notifications.error(`Error al actualizar categoría: ${error.message}`)
    }
  }

  const deleteCategory = async (categoryId: string) => {
    const confirmed = await notifications.confirm({
      description: '¿Estás seguro de que quieres eliminar esta categoría?'
    })
    if (!confirmed) return

    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: false })
        .eq('id', categoryId)

      if (error) throw error
      
      await fetchCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      notifications.error('Error al eliminar la categoría')
    }
  }

  const resetForm = () => {
    setNewCategory({
      name: '',
      description: '',
      image_url: '',
      sort_order: '0'
    })
    setShowImageEditor(false)
  }

  const startEditing = (category: Category) => {
    setEditingCategory(category)
    setNewCategory({
      name: category.name,
      description: category.description || '',
      image_url: category.image_url || '',
      sort_order: category.sort_order.toString()
    })
    setShowCreateCategory(true)
  }

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="animate-cyber-pulse text-primary">Cargando categorías...</div>
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
              Gestión de Categorías
            </h1>
            <p className="text-muted-foreground">
              Administra las categorías de productos
            </p>
          </div>
          <CyberButton 
            className="flex items-center gap-2"
            onClick={() => {
              setEditingCategory(null)
              resetForm()
              setShowCreateCategory(true)
            }}
          >
            <Plus className="h-4 w-4" />
            Nueva Categoría
          </CyberButton>
        </div>

        {/* Image Editor Modal */}
        {showImageEditor && (
          <ImageUploadCrop
            onImageSave={(imageUrl) => {
              setNewCategory({...newCategory, image_url: imageUrl})
              setShowImageEditor(false)
            }}
            onCancel={() => setShowImageEditor(false)}
            initialImage={newCategory.image_url}
            bucketName="products"
            folder="categories"
          />
        )}

        {/* Create/Edit Category Modal */}
        {showCreateCategory && !showImageEditor && (
          <Card className="cyber-card">
            <CardHeader>
              <CardTitle>
                {editingCategory ? 'Editar Categoría' : 'Crear Nueva Categoría'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                    className="cyber-border"
                    placeholder="Nombre de la categoría"
                  />
                </div>
                <div>
                  <Label htmlFor="sort_order">Orden</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={newCategory.sort_order}
                    onChange={(e) => setNewCategory({...newCategory, sort_order: e.target.value})}
                    className="cyber-border"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                  className="cyber-border"
                  placeholder="Descripción de la categoría"
                  rows={3}
                />
              </div>

              <div>
                <Label>Imagen de Categoría</Label>
                <div className="space-y-3">
                  {newCategory.image_url && !showImageEditor && (
                    <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                      <img 
                        src={newCategory.image_url} 
                        alt="Vista previa" 
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Imagen seleccionada</p>
                        <p className="text-xs text-muted-foreground">
                          {newCategory.image_url.split('/').pop()}
                        </p>
                      </div>
                      <CyberButton 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowImageEditor(true)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </CyberButton>
                    </div>
                  )}
                  
                  {!newCategory.image_url && !showImageEditor && (
                    <CyberButton 
                      variant="outline" 
                      onClick={() => setShowImageEditor(true)}
                      className="w-full justify-center"
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Subir Imagen
                    </CyberButton>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <CyberButton 
                  onClick={editingCategory ? updateCategory : createCategory} 
                  disabled={!newCategory.name}
                >
                  {editingCategory ? 'Actualizar' : 'Crear'} Categoría
                </CyberButton>
                <CyberButton 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateCategory(false)
                    setEditingCategory(null)
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
                placeholder="Buscar categorías..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 cyber-border"
              />
            </div>
          </CardContent>
        </Card>

        {/* Categories Grid */}
        {filteredCategories.length === 0 ? (
          <Card className="cyber-card">
            <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
              <FolderTree className="h-16 w-16 text-muted-foreground" />
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">No se encontraron categorías</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando tu primera categoría'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category) => (
              <Card key={category.id} className="cyber-card group hover:shadow-glow-primary">
                <CardHeader className="p-0">
                  <div className="relative">
                    <img
                      src={category.image_url || 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=400&h=200&fit=crop'}
                      alt={category.name}
                      className="w-full h-32 object-cover rounded-t-lg"
                    />
                    <div className="absolute top-2 left-2 flex gap-2">
                      {!category.is_active && (
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
                      {category.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {category.description || 'Sin descripción'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      Orden: {category.sort_order}
                    </span>
                    <span className="text-muted-foreground">
                      {category.slug}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-1">
                    <CyberButton 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => startEditing(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </CyberButton>
                    <CyberButton 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteCategory(category.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </CyberButton>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Creado: {new Date(category.created_at).toLocaleDateString('es-AR')}
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

export default CategoriesAdmin