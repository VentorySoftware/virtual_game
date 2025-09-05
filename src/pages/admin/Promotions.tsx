import { useState, useEffect } from "react"
import { Navigate } from "react-router-dom"
import { 
  Percent, 
  Clock, 
  Calendar, 
  Star, 
  Search, 
  Plus,
  Edit,
  Trash2,
  Tag,
  TrendingUp,
  Gift
} from "lucide-react"
import AdminLayout from "@/components/admin/AdminLayout"
import { CyberButton } from "@/components/ui/cyber-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import { useNotifications } from "@/hooks/useNotifications"

interface Product {
  id: string
  title: string
  price: number
  original_price?: number
  discount_percentage: number
  type: 'digital' | 'physical' | 'preorder' | 'bundle'
  preorder_date?: string
  release_date?: string
  is_featured: boolean
  is_active: boolean
  created_at: string
  image_url?: string
  category?: { name: string }
  platform?: { name: string }
}

const PromotionsAdmin = () => {
  const { user } = useAuth()
  const notifications = useNotifications()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreatePromotion, setShowCreatePromotion] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [promotionData, setPromotionData] = useState({
    productId: '',
    discount_percentage: '',
    original_price: '',
    preorder_date: '',
    release_date: '',
    is_featured: false,
    promotion_end_date: ''
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
        await fetchProducts()
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

  const createPromotion = async () => {
    try {
      if (!promotionData.productId) {
        notifications.warning('Selecciona un producto')
        return
      }

      const updates: any = {}
      
      if (promotionData.discount_percentage) {
        updates.discount_percentage = parseInt(promotionData.discount_percentage)
      }
      
      if (promotionData.original_price) {
        updates.original_price = parseFloat(promotionData.original_price)
      }
      
      if (promotionData.preorder_date) {
        updates.preorder_date = promotionData.preorder_date
        updates.type = 'preorder'
      }
      
      if (promotionData.release_date) {
        updates.release_date = promotionData.release_date
      }
      
      updates.is_featured = promotionData.is_featured

      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', promotionData.productId)

      if (error) throw error

      setShowCreatePromotion(false)
      resetForm()
      await fetchProducts()
      notifications.success('Promoción creada exitosamente')
    } catch (error: any) {
      console.error('Error creating promotion:', error)
      notifications.error(`Error al crear promoción: ${error.message}`)
    }
  }

  const updatePromotion = async () => {
    if (!editingProduct) return

    try {
      const updates: any = {}
      
      if (promotionData.discount_percentage) {
        updates.discount_percentage = parseInt(promotionData.discount_percentage)
      }
      
      if (promotionData.original_price) {
        updates.original_price = parseFloat(promotionData.original_price)
      }
      
      if (promotionData.preorder_date) {
        updates.preorder_date = promotionData.preorder_date
        updates.type = 'preorder'
      }
      
      if (promotionData.release_date) {
        updates.release_date = promotionData.release_date
      }
      
      updates.is_featured = promotionData.is_featured

      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', editingProduct.id)

      if (error) throw error

      setEditingProduct(null)
      setShowCreatePromotion(false)
      resetForm()
      await fetchProducts()
      notifications.success('Promoción actualizada exitosamente')
    } catch (error: any) {
      console.error('Error updating promotion:', error)
      notifications.error(`Error al actualizar promoción: ${error.message}`)
    }
  }

  const removePromotion = async (productId: string, type: 'discount' | 'preorder' | 'featured') => {
    try {
      let updates: any = {}
      
      switch (type) {
        case 'discount':
          updates = { discount_percentage: 0, original_price: null }
          break
        case 'preorder':
          updates = { type: 'digital', preorder_date: null, release_date: null }
          break
        case 'featured':
          updates = { is_featured: false }
          break
      }

      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', productId)

      if (error) throw error
      
      await fetchProducts()
      notifications.success('Promoción removida exitosamente')
    } catch (error: any) {
      console.error('Error removing promotion:', error)
      notifications.error(`Error al remover promoción: ${error.message}`)
    }
  }

  const resetForm = () => {
    setPromotionData({
      productId: '',
      discount_percentage: '',
      original_price: '',
      preorder_date: '',
      release_date: '',
      is_featured: false,
      promotion_end_date: ''
    })
  }

  const startEditing = (product: Product) => {
    setEditingProduct(product)
    setPromotionData({
      productId: product.id,
      discount_percentage: product.discount_percentage.toString(),
      original_price: product.original_price?.toString() || '',
      preorder_date: product.preorder_date?.split('T')[0] || '',
      release_date: product.release_date?.split('T')[0] || '',
      is_featured: product.is_featured,
      promotion_end_date: ''
    })
    setShowCreatePromotion(true)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(price)
  }

  // Filter products for different promotion types
  const discountedProducts = products.filter(p => p.discount_percentage > 0)
  const preorderProducts = products.filter(p => p.type === 'preorder')
  const featuredProducts = products.filter(p => p.is_featured)
  const availableProducts = products.filter(p => p.is_active)

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="animate-cyber-pulse text-primary">Cargando promociones...</div>
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
              Gestión de Promociones
            </h1>
            <p className="text-muted-foreground">
              Administra ofertas, pre-órdenes y lanzamientos especiales
            </p>
          </div>
          <CyberButton 
            className="flex items-center gap-2"
            onClick={() => {
              setEditingProduct(null)
              resetForm()
              setShowCreatePromotion(true)
            }}
          >
            <Plus className="h-4 w-4" />
            Nueva Promoción
          </CyberButton>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="cyber-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ofertas Activas</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold neon-text">{discountedProducts.length}</div>
            </CardContent>
          </Card>

          <Card className="cyber-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pre-órdenes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold neon-text">{preorderProducts.length}</div>
            </CardContent>
          </Card>

          <Card className="cyber-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Destacados</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold neon-text">{featuredProducts.length}</div>
            </CardContent>
          </Card>

          <Card className="cyber-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold neon-text">{availableProducts.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Create/Edit Promotion Modal */}
        {showCreatePromotion && (
          <Card className="cyber-card">
            <CardHeader>
              <CardTitle>
                {editingProduct ? 'Editar Promoción' : 'Crear Nueva Promoción'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!editingProduct && (
                <div>
                  <Label htmlFor="product">Producto</Label>
                  <Select 
                    value={promotionData.productId} 
                    onValueChange={(value) => setPromotionData({...promotionData, productId: value})}
                  >
                    <SelectTrigger className="cyber-border">
                      <SelectValue placeholder="Seleccionar producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Tabs defaultValue="discount" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="discount">Ofertas</TabsTrigger>
                  <TabsTrigger value="preorder">Pre-órdenes</TabsTrigger>
                  <TabsTrigger value="featured">Destacados</TabsTrigger>
                </TabsList>

                <TabsContent value="discount" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="discount">Descuento (%)</Label>
                      <Input
                        id="discount"
                        type="number"
                        min="0"
                        max="90"
                        value={promotionData.discount_percentage}
                        onChange={(e) => setPromotionData({...promotionData, discount_percentage: e.target.value})}
                        className="cyber-border"
                        placeholder="15"
                      />
                    </div>
                    <div>
                      <Label htmlFor="original_price">Precio Original</Label>
                      <Input
                        id="original_price"
                        type="number"
                        step="0.01"
                        value={promotionData.original_price}
                        onChange={(e) => setPromotionData({...promotionData, original_price: e.target.value})}
                        className="cyber-border"
                        placeholder="5000.00"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="preorder" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="preorder_date">Fecha de Pre-orden</Label>
                      <Input
                        id="preorder_date"
                        type="date"
                        value={promotionData.preorder_date}
                        onChange={(e) => setPromotionData({...promotionData, preorder_date: e.target.value})}
                        className="cyber-border"
                      />
                    </div>
                    <div>
                      <Label htmlFor="release_date">Fecha de Lanzamiento</Label>
                      <Input
                        id="release_date"
                        type="date"
                        value={promotionData.release_date}
                        onChange={(e) => setPromotionData({...promotionData, release_date: e.target.value})}
                        className="cyber-border"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="featured" className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_featured"
                      checked={promotionData.is_featured}
                      onChange={(e) => setPromotionData({...promotionData, is_featured: e.target.checked})}
                      className="rounded"
                    />
                    <Label htmlFor="is_featured">Marcar como producto destacado</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Los productos destacados aparecen en la página principal y en secciones especiales.
                  </p>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2">
                <CyberButton 
                  onClick={editingProduct ? updatePromotion : createPromotion} 
                >
                  {editingProduct ? 'Actualizar' : 'Crear'} Promoción
                </CyberButton>
                <CyberButton 
                  variant="outline" 
                  onClick={() => {
                    setShowCreatePromotion(false)
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

        {/* Search */}
        <Card className="cyber-card">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 cyber-border"
              />
            </div>
          </CardContent>
        </Card>

        {/* Products with Promotions */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="discounts">Con Descuento</TabsTrigger>
            <TabsTrigger value="preorders">Pre-órdenes</TabsTrigger>
            <TabsTrigger value="featured">Destacados</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="space-y-4">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="cyber-card hover:shadow-glow-primary transition-all">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Product Info */}
                      <div className="flex items-center gap-4">
                        <img
                          src={product.image_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100&h=100&fit=crop'}
                          alt={product.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="space-y-2">
                          <h3 className="font-bold text-lg">{product.title}</h3>
                          <div className="flex items-center gap-2">
                            {product.discount_percentage > 0 && (
                              <Badge className="bg-destructive/20 text-destructive border-destructive/30">
                                -{product.discount_percentage}%
                              </Badge>
                            )}
                            {product.type === 'preorder' && (
                              <Badge className="bg-accent/20 text-accent border-accent/30">
                                Pre-orden
                              </Badge>
                            )}
                            {product.is_featured && (
                              <Badge className="bg-primary/20 text-primary border-primary/30">
                                Destacado
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {product.category?.name} • {product.platform?.name}
                          </div>
                        </div>
                      </div>

                      {/* Price & Actions */}
                      <div className="flex flex-col sm:flex-row items-end gap-4">
                        <div className="text-right">
                          <div className="text-lg font-bold neon-text">
                            {formatPrice(product.price)}
                          </div>
                          {product.original_price && product.original_price > product.price && (
                            <div className="text-sm text-muted-foreground line-through">
                              {formatPrice(product.original_price)}
                            </div>
                          )}
                          {product.preorder_date && (
                            <div className="text-xs text-accent">
                              Pre-orden: {new Date(product.preorder_date).toLocaleDateString('es-AR')}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <CyberButton
                            variant="outline"
                            size="sm"
                            onClick={() => startEditing(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </CyberButton>
                          
                          {product.discount_percentage > 0 && (
                            <CyberButton
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => removePromotion(product.id, 'discount')}
                            >
                              <Percent className="h-4 w-4" />
                            </CyberButton>
                          )}
                          
                          {product.type === 'preorder' && (
                            <CyberButton
                              variant="ghost"
                              size="sm"
                              className="text-accent hover:text-accent"
                              onClick={() => removePromotion(product.id, 'preorder')}
                            >
                              <Clock className="h-4 w-4" />
                            </CyberButton>
                          )}
                          
                          {product.is_featured && (
                            <CyberButton
                              variant="ghost"
                              size="sm"
                              className="text-primary hover:text-primary"
                              onClick={() => removePromotion(product.id, 'featured')}
                            >
                              <Star className="h-4 w-4" />
                            </CyberButton>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="discounts">
            <div className="space-y-4">
              {discountedProducts.map((product) => (
                <Card key={product.id} className="cyber-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img
                          src={product.image_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100&h=100&fit=crop'}
                          alt={product.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div>
                          <h3 className="font-bold">{product.title}</h3>
                          <Badge className="bg-destructive/20 text-destructive border-destructive/30">
                            -{product.discount_percentage}% OFF
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold neon-text">
                          {formatPrice(product.price)}
                        </div>
                        <div className="text-sm text-muted-foreground line-through">
                          {formatPrice(product.original_price || 0)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="preorders">
            <div className="space-y-4">
              {preorderProducts.map((product) => (
                <Card key={product.id} className="cyber-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img
                          src={product.image_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100&h=100&fit=crop'}
                          alt={product.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div>
                          <h3 className="font-bold">{product.title}</h3>
                          <Badge className="bg-accent/20 text-accent border-accent/30">
                            Pre-orden disponible
                          </Badge>
                          {product.release_date && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Lanzamiento: {new Date(product.release_date).toLocaleDateString('es-AR')}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-lg font-bold neon-text">
                        {formatPrice(product.price)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="featured">
            <div className="space-y-4">
              {featuredProducts.map((product) => (
                <Card key={product.id} className="cyber-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img
                          src={product.image_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100&h=100&fit=crop'}
                          alt={product.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div>
                          <h3 className="font-bold">{product.title}</h3>
                          <Badge className="bg-primary/20 text-primary border-primary/30">
                            <Star className="h-3 w-3 mr-1" />
                            Producto Destacado
                          </Badge>
                        </div>
                      </div>
                      <div className="text-lg font-bold neon-text">
                        {formatPrice(product.price)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}

export default PromotionsAdmin