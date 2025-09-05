import { useState, useEffect } from "react"
import { Navigate } from "react-router-dom"
import { Plus, Search, Edit, Trash2, Eye, Package, Image as ImageIcon } from "lucide-react"
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
import { ImageUploadCrop } from "@/components/admin/ImageUploadCrop"
import type { Product } from "@/types/database"

interface ProductWithRelations extends Omit<Product, 'category' | 'platform'> {
  category?: { id: string; name: string } | null
  platform?: { id: string; name: string } | null
}

const ProductsAdmin = () => {
  const { user } = useAuth()
  const [products, setProducts] = useState<ProductWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [visibilityFilter, setVisibilityFilter] = useState("all")
  const [showCreateProduct, setShowCreateProduct] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [platforms, setPlatforms] = useState<any[]>([])
  const [editingProduct, setEditingProduct] = useState<ProductWithRelations | null>(null)
  const [showImageEditor, setShowImageEditor] = useState(false)
  const [newProduct, setNewProduct] = useState({
    title: '',
    description: '',
    short_description: '',
    price: '',
    original_price: '',
    sku: '',
    image_url: '',
    category_id: '',
    platform_id: '',
    stock_quantity: '0',
    type: 'digital' as 'digital' | 'physical' | 'preorder' | 'bundle',
    is_featured: false
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
        await Promise.all([
          fetchProducts(),
          fetchCategories(),
          fetchPlatforms()
        ])
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name),
          platform:platforms(id, name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchPlatforms = async () => {
    try {
      const { data, error } = await supabase
        .from('platforms')
        .select('id, name')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setPlatforms(data || [])
    } catch (error) {
      console.error('Error fetching platforms:', error)
    }
  }

  const createProduct = async () => {
    try {
      if (!newProduct.title || !newProduct.price) {
        alert('Título y precio son obligatorios')
        return
      }

      const slug = newProduct.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      const { error } = await supabase
        .from('products')
        .insert({
          title: newProduct.title,
          slug: slug,
          description: newProduct.description,
          short_description: newProduct.short_description,
          price: parseFloat(newProduct.price),
          original_price: newProduct.original_price ? parseFloat(newProduct.original_price) : null,
          sku: newProduct.sku,
          image_url: newProduct.image_url,
          category_id: newProduct.category_id || null,
          platform_id: newProduct.platform_id || null,
          stock_quantity: parseInt(newProduct.stock_quantity) || 0,
          type: newProduct.type,
          is_featured: newProduct.is_featured,
          is_active: true
        })

      if (error) throw error

      setShowCreateProduct(false)
      resetForm()
      
      await fetchProducts()
      alert('Producto creado exitosamente')
    } catch (error: any) {
      console.error('Error creating product:', error)
      alert(`Error al crear producto: ${error.message}`)
    }
  }

  const toggleProductVisibility = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', productId)

      if (error) throw error
      
      await fetchProducts()
      alert(`Producto ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`)
    } catch (error) {
      console.error('Error updating product visibility:', error)
      alert('Error al cambiar la visibilidad del producto')
    }
  }

  const startEditing = (product: ProductWithRelations) => {
    setEditingProduct(product)
    setNewProduct({
      title: product.title,
      description: product.description || '',
      short_description: product.short_description || '',
      price: product.price.toString(),
      original_price: product.original_price?.toString() || '',
      sku: product.sku || '',
      image_url: product.image_url || '',
      category_id: product.category?.id || '',
      platform_id: product.platform?.id || '',
      stock_quantity: product.stock_quantity.toString(),
      type: product.type,
      is_featured: product.is_featured
    })
    setShowCreateProduct(true)
  }

  const updateProduct = async () => {
    if (!editingProduct) return

    try {
      if (!newProduct.title || !newProduct.price) {
        alert('Título y precio son obligatorios')
        return
      }

      const slug = newProduct.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      const { error } = await supabase
        .from('products')
        .update({
          title: newProduct.title,
          slug: slug,
          description: newProduct.description,
          short_description: newProduct.short_description,
          price: parseFloat(newProduct.price),
          original_price: newProduct.original_price ? parseFloat(newProduct.original_price) : null,
          sku: newProduct.sku,
          image_url: newProduct.image_url,
          category_id: newProduct.category_id || null,
          platform_id: newProduct.platform_id || null,
          stock_quantity: parseInt(newProduct.stock_quantity) || 0,
          type: newProduct.type,
          is_featured: newProduct.is_featured
        })
        .eq('id', editingProduct.id)

      if (error) throw error

      setShowCreateProduct(false)
      setEditingProduct(null)
      resetForm()
      
      await fetchProducts()
      alert('Producto actualizado exitosamente')
    } catch (error: any) {
      console.error('Error updating product:', error)
      alert(`Error al actualizar producto: ${error.message}`)
    }
  }

  const resetForm = () => {
    setNewProduct({
      title: '',
      description: '',
      short_description: '',
      price: '',
      original_price: '',
      sku: '',
      image_url: '',
      category_id: '',
      platform_id: '',
      stock_quantity: '0',
      type: 'digital',
      is_featured: false
    })
    setShowImageEditor(false)
  }

  const handleDeleteProduct = async (product: ProductWithRelations) => {
    const confirmMessage = product.is_active 
      ? '¿Estás seguro de que quieres desactivar este producto? Los usuarios no podrán verlo.'
      : '¿Estás seguro de que quieres eliminar permanentemente este producto?'
    
    if (!confirm(confirmMessage)) return

    try {
      if (product.is_active) {
        // Soft delete: just deactivate
        const { error } = await supabase
          .from('products')
          .update({ is_active: false })
          .eq('id', product.id)
        
        if (error) throw error
        alert('Producto desactivado exitosamente')
      } else {
        // Hard delete: remove from database
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', product.id)
        
        if (error) throw error
        alert('Producto eliminado permanentemente')
      }
      
      await fetchProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Error al procesar la eliminación del producto')
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(price)
  }

  const filteredProducts = products.filter(product => {
    // Filtro por búsqueda (nombre o SKU)
    const matchesSearch = searchTerm === "" || 
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    
    // Filtro por categoría
    const matchesCategory = categoryFilter === "all" || 
      product.category?.id === categoryFilter
    
    // Filtro por visibilidad
    const matchesVisibility = visibilityFilter === "all" ||
      (visibilityFilter === "active" && product.is_active) ||
      (visibilityFilter === "inactive" && !product.is_active)
    
    return matchesSearch && matchesCategory && matchesVisibility
  })

  const clearFilters = () => {
    setSearchTerm("")
    setCategoryFilter("all")
    setVisibilityFilter("all")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="animate-cyber-pulse text-primary">Cargando productos...</div>
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
              Gestión de Productos
            </h1>
            <p className="text-muted-foreground">
              Administra el catálogo de productos
            </p>
          </div>
          
          <CyberButton 
            className="flex items-center gap-2"
            onClick={() => {
              setEditingProduct(null)
              resetForm()
              setShowCreateProduct(true)
            }}
          >
            <Plus className="h-4 w-4" />
            Nuevo Producto
          </CyberButton>
        </div>

        {/* Image Editor Modal */}
        {showImageEditor && (
          <ImageUploadCrop
            onImageSave={(imageUrl) => {
              setNewProduct({...newProduct, image_url: imageUrl})
              setShowImageEditor(false)
            }}
            onCancel={() => setShowImageEditor(false)}
            initialImage={newProduct.image_url}
            bucketName="products"
            folder="products"
          />
        )}

        {/* Create/Edit Product Modal */}
        {showCreateProduct && !showImageEditor && (
          <Card className="cyber-card">
            <CardHeader>
              <CardTitle>
                {editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={newProduct.title}
                    onChange={(e) => setNewProduct({...newProduct, title: e.target.value})}
                    className="cyber-border"
                    placeholder="Nombre del producto"
                  />
                </div>
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                    className="cyber-border"
                    placeholder="Código único"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="short_description">Descripción Corta</Label>
                <Textarea
                  id="short_description"
                  value={newProduct.short_description}
                  onChange={(e) => setNewProduct({...newProduct, short_description: e.target.value})}
                  className="cyber-border"
                  placeholder="Descripción breve del producto"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  className="cyber-border"
                  placeholder="Descripción detallada del producto"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price">Precio *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                    className="cyber-border"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="original_price">Precio Original</Label>
                  <Input
                    id="original_price"
                    type="number"
                    step="0.01"
                    value={newProduct.original_price}
                    onChange={(e) => setNewProduct({...newProduct, original_price: e.target.value})}
                    className="cyber-border"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={newProduct.stock_quantity}
                    onChange={(e) => setNewProduct({...newProduct, stock_quantity: e.target.value})}
                    className="cyber-border"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="category">Categoría</Label>
                  <Select 
                    value={newProduct.category_id} 
                    onValueChange={(value) => setNewProduct({...newProduct, category_id: value})}
                  >
                    <SelectTrigger className="cyber-border">
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="platform">Plataforma</Label>
                  <Select 
                    value={newProduct.platform_id} 
                    onValueChange={(value) => setNewProduct({...newProduct, platform_id: value})}
                  >
                    <SelectTrigger className="cyber-border">
                      <SelectValue placeholder="Seleccionar plataforma" />
                    </SelectTrigger>
                    <SelectContent>
                      {platforms.map((platform) => (
                        <SelectItem key={platform.id} value={platform.id}>
                          {platform.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <Select 
                    value={newProduct.type} 
                    onValueChange={(value) => setNewProduct({...newProduct, type: value as any})}
                  >
                    <SelectTrigger className="cyber-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="digital">Digital</SelectItem>
                      <SelectItem value="physical">Físico</SelectItem>
                      <SelectItem value="bundle">Bundle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Imagen del Producto</Label>
                <div className="space-y-3">
                  {newProduct.image_url && !showImageEditor && (
                    <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                      <img 
                        src={newProduct.image_url} 
                        alt="Vista previa" 
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Imagen seleccionada</p>
                        <p className="text-xs text-muted-foreground">
                          {newProduct.image_url.split('/').pop()}
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
                  
                  {!newProduct.image_url && !showImageEditor && (
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

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={newProduct.is_featured}
                  onChange={(e) => setNewProduct({...newProduct, is_featured: e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="is_featured">Producto destacado</Label>
              </div>

              <div className="flex gap-2">
                <CyberButton 
                  onClick={editingProduct ? updateProduct : createProduct} 
                  disabled={!newProduct.title || !newProduct.price}
                >
                  {editingProduct ? 'Actualizar' : 'Crear'} Producto
                </CyberButton>
                <CyberButton 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateProduct(false)
                    setEditingProduct(null)
                    resetForm()
                  }}
                >
                  Cancelar
                </CyberButton>
              </div>
            </CardContent>
          </Card>
        )}
          <CyberButton 
            className="flex items-center gap-2"
            onClick={() => {
              setEditingProduct(null)
              resetForm()
              setShowCreateProduct(true)
            }}
          >
            <Plus className="h-4 w-4" />
            Nuevo Producto
          </CyberButton>
        </div>

        {/* Search and Filters */}
        <Card className="cyber-card">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar productos por nombre o SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 cyber-border"
                />
              </div>

              {/* Filters Row */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Category Filter */}
                <div className="flex-1">
                  <Label className="text-sm font-medium mb-2 block">Categoría</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="cyber-border">
                      <SelectValue placeholder="Todas las categorías" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Visibility Filter */}
                <div className="flex-1">
                  <Label className="text-sm font-medium mb-2 block">Estado</Label>
                  <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
                    <SelectTrigger className="cyber-border">
                      <SelectValue placeholder="Todos los estados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="active">Activos</SelectItem>
                      <SelectItem value="inactive">Inactivos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters Button */}
                <div className="flex-shrink-0 flex items-end">
                  <CyberButton 
                    variant="outline" 
                    onClick={clearFilters}
                    className="whitespace-nowrap"
                  >
                    Limpiar Filtros
                  </CyberButton>
                </div>
              </div>

              {/* Active Filters Summary */}
              {(searchTerm || categoryFilter !== "all" || visibilityFilter !== "all") && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {searchTerm && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Búsqueda: "{searchTerm}"
                      <button 
                        onClick={() => setSearchTerm("")}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {categoryFilter !== "all" && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Categoría: {categories.find(c => c.id === categoryFilter)?.name}
                      <button 
                        onClick={() => setCategoryFilter("all")}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {visibilityFilter !== "all" && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Estado: {visibilityFilter === 'active' ? 'Activos' : 'Inactivos'}
                      <button 
                        onClick={() => setVisibilityFilter("all")}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <Card className="cyber-card">
            <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
              <Package className="h-16 w-16 text-muted-foreground" />
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">
                  {(searchTerm || categoryFilter !== "all" || visibilityFilter !== "all") 
                    ? 'No se encontraron productos con los filtros aplicados' 
                    : 'No hay productos disponibles'
                  }
                </h3>
                <p className="text-muted-foreground">
                  {(searchTerm || categoryFilter !== "all" || visibilityFilter !== "all") 
                    ? 'Intenta ajustar los filtros o crear un nuevo producto'
                    : 'Comienza agregando tu primer producto'
                  }
                </p>
                {(searchTerm || categoryFilter !== "all" || visibilityFilter !== "all") && (
                  <CyberButton 
                    variant="outline" 
                    className="mt-3"
                    onClick={clearFilters}
                  >
                    Limpiar Filtros
                  </CyberButton>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Results Summary */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filteredProducts.length === products.length 
                  ? `Mostrando ${filteredProducts.length} productos`
                  : `Mostrando ${filteredProducts.length} de ${products.length} productos`
                }
              </p>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="cyber-card group hover:shadow-glow-primary">
                <CardHeader className="p-0">
                  <div className="relative">
                    <img
                      src={product.image_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=200&fit=crop'}
                      alt={product.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    <div className="absolute top-2 left-2 flex gap-2">
                      {product.is_featured && (
                        <Badge className="bg-primary/20 text-primary border-primary/30">
                          Destacado
                        </Badge>
                      )}
                      {product.type === 'preorder' && (
                        <Badge className="bg-accent/20 text-accent border-accent/30">
                          Pre-orden
                        </Badge>
                      )}
                      {!product.is_active && (
                        <Badge variant="destructive">
                          Inactivo
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                      {product.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      SKU: {product.sku || 'N/A'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {product.category?.name || 'Sin categoría'}
                    </span>
                    <span className="text-muted-foreground">
                      {product.platform?.name || 'Multi'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold neon-text">
                        {formatPrice(Number(product.price))}
                      </span>
                      {product.original_price && product.original_price > product.price && (
                        <span className="text-sm text-muted-foreground line-through ml-2">
                          {formatPrice(Number(product.original_price))}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <CyberButton 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => toggleProductVisibility(product.id, product.is_active)}
                        title={product.is_active ? 'Desactivar producto' : 'Activar producto'}
                      >
                        <Eye className={`h-4 w-4 ${product.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                      </CyberButton>
                      <CyberButton 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => startEditing(product)}
                        title="Editar producto"
                      >
                        <Edit className="h-4 w-4" />
                      </CyberButton>
                      <CyberButton 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteProduct(product)}
                        title={product.is_active ? 'Desactivar producto' : 'Eliminar permanentemente'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </CyberButton>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Stock: {product.stock_quantity}</span>
                    <span>Rating: {product.rating}/5</span>
                  </div>
                </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
    </AdminLayout>
  )
}

export default ProductsAdmin