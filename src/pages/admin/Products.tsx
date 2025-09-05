import { useState, useEffect } from "react"
import { Navigate } from "react-router-dom"
import { Plus, Search, Edit, Trash2, Eye, Package } from "lucide-react"
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
import type { Product } from "@/types/database"

interface ProductWithRelations extends Omit<Product, 'category' | 'platform'> {
  category?: { name: string } | null
  platform?: { name: string } | null
}

const ProductsAdmin = () => {
  const { user } = useAuth()
  const [products, setProducts] = useState<ProductWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateProduct, setShowCreateProduct] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [platforms, setPlatforms] = useState<any[]>([])
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
    type: 'digital' as 'digital' | 'physical' | 'preorder',
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
          category:categories(name),
          platform:platforms(name)
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
      
      await fetchProducts()
      alert('Producto creado exitosamente')
    } catch (error: any) {
      console.error('Error creating product:', error)
      alert(`Error al crear producto: ${error.message}`)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) return

    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', productId)

      if (error) throw error
      
      await fetchProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Error al eliminar el producto')
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(price)
  }

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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

        {/* Create Product Modal */}
        {showCreateProduct && (
          <Card className="cyber-card">
            <CardHeader>
              <CardTitle>Crear Nuevo Producto</CardTitle>
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
                      <SelectItem value="preorder">Pre-orden</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="image_url">URL de Imagen</Label>
                <Input
                  id="image_url"
                  value={newProduct.image_url}
                  onChange={(e) => setNewProduct({...newProduct, image_url: e.target.value})}
                  className="cyber-border"
                  placeholder="https://example.com/imagen.jpg"
                />
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
                  onClick={createProduct} 
                  disabled={!newProduct.title || !newProduct.price}
                >
                  Crear Producto
                </CyberButton>
                <CyberButton 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateProduct(false)
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
            onClick={() => setShowCreateProduct(true)}
          >
            <Plus className="h-4 w-4" />
            Nuevo Producto
          </CyberButton>
        </div>

        {/* Search and Filters */}
        <Card className="cyber-card">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar productos por nombre o SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 cyber-border"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <Card className="cyber-card">
            <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
              <Package className="h-16 w-16 text-muted-foreground" />
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">No se encontraron productos</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando tu primer producto'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
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
                      <CyberButton variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </CyberButton>
                      <CyberButton variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </CyberButton>
                      <CyberButton 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteProduct(product.id)}
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
        )}
      </div>
    </AdminLayout>
  )
}

export default ProductsAdmin