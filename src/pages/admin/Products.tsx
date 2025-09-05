import { useState, useEffect } from "react"
import { Navigate } from "react-router-dom"
import { Plus, Search, Edit, Trash2, Eye, Package } from "lucide-react"
import AdminLayout from "@/components/admin/AdminLayout"
import { CyberButton } from "@/components/ui/cyber-button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
          <CyberButton className="flex items-center gap-2">
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