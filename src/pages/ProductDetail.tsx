import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { Product } from "@/types/database"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { Badge } from "@/components/ui/badge"
import { CyberButton } from "@/components/ui/cyber-button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Star,
  ShoppingCart,
  Heart,
  Share2,
  Clock,
  Shield,
  Zap,
  ArrowLeft,
  MessageCircle
} from "lucide-react"
import { useSiteSettings } from "@/hooks/useSiteSettings"

const ProductDetail = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const { settings } = useSiteSettings()

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return

      try {
        setLoading(true)
        
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            category:categories(*),
            platform:platforms(*)
          `)
          .eq('slug', slug)
          .eq('is_active', true)
          .single()

        if (error) {
          console.error('Error fetching product:', error)
          navigate('/404')
          return
        }

        setProduct(data)
      } catch (error) {
        console.error('Error:', error)
        navigate('/404')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [slug, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-dark">
        <Header />
        <div className="container py-20 text-center">
          <h1 className="text-4xl font-bold mb-4">Producto no encontrado</h1>
          <CyberButton onClick={() => navigate('/')}>
            Volver al inicio
          </CyberButton>
        </div>
        <Footer />
      </div>
    )
  }

  const discountPercentage = product.discount_percentage || 0
  const isPreOrder = product.type === 'preorder'
  const platformName = product.platform?.name || 'Multi'
  const categoryName = product.category?.name || 'General'

  const images = [
    product.image_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=800&h=600&fit=crop'
  ]

  const whatsappMessage = `Hola! Me interesa el juego *${product.title}* (${platformName}) por $${product.price.toLocaleString('es-AR')}. ¿Podrían darme más información?`
  let whatsappNumber = settings.whatsapp_number || ''

  // Remove leading '+' if present for WhatsApp URL format
  if (whatsappNumber.startsWith('+')) {
    whatsappNumber = whatsappNumber.substring(1)
  }

  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`
    : undefined

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Header />
      
      <main className="container py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm">
          <CyberButton variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver
          </CyberButton>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground">{categoryName}</span>
          <span className="text-muted-foreground">/</span>
          <span>{product.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images Section */}
          <div className="space-y-4">
            <div className="aspect-video rounded-lg overflow-hidden bg-card">
              <img
                src={images[selectedImageIndex]}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Thumbnail Gallery */}
            <div className="flex gap-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`aspect-video w-20 rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImageIndex === index ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.title} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {isPreOrder && (
                <Badge className="bg-accent text-accent-foreground animate-pulse">
                  <Clock className="w-3 h-3 mr-1" />
                  Pre-orden
                </Badge>
              )}
              {discountPercentage > 0 && (
                <Badge variant="destructive">
                  -{discountPercentage}% OFF
                </Badge>
              )}
              <Badge variant="outline" style={{ borderColor: product.platform?.color }}>
                {platformName}
              </Badge>
              <Badge variant="secondary">
                {categoryName}
              </Badge>
            </div>

            {/* Title and Rating */}
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold font-orbitron">
                {product.title}
              </h1>
              
              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating) 
                          ? "text-accent fill-accent" 
                          : "text-muted-foreground"
                      }`} 
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  ({product.rating}) · {product.total_reviews} reseñas
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-primary font-orbitron">
                  ${product.price.toLocaleString('es-AR')}
                </span>
                {product.original_price && product.original_price > product.price && (
                  <span className="text-xl text-muted-foreground line-through">
                    ${product.original_price.toLocaleString('es-AR')}
                  </span>
                )}
              </div>
              {isPreOrder && product.preorder_date && (
                <p className="text-sm text-secondary">
                  Fecha de lanzamiento: {new Date(product.preorder_date).toLocaleDateString('es-AR')}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="font-semibold">Descripción</h3>
              <p className="text-muted-foreground">
                {product.description || product.short_description || 'Descripción no disponible'}
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <div className="flex gap-3">
                <CyberButton className="flex-1" size="lg">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {isPreOrder ? 'Pre-ordenar' : 'Agregar al Carrito'}
                </CyberButton>
                <CyberButton variant="outline" size="lg">
                  <Heart className="w-5 h-5" />
                </CyberButton>
                <CyberButton variant="outline" size="lg">
                  <Share2 className="w-5 h-5" />
                </CyberButton>
              </div>

              <CyberButton 
                variant="secondary" 
                className="w-full" 
                size="lg"
                onClick={() => window.open(whatsappUrl, '_blank')}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Consultar por WhatsApp
              </CyberButton>
            </div>

            {/* Features */}
            <Card className="cyber-card">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-semibold text-sm">Entrega Inmediata</p>
                      <p className="text-xs text-muted-foreground">Digital instantáneo</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-semibold text-sm">100% Seguro</p>
                      <p className="text-xs text-muted-foreground">Compra protegida</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-semibold text-sm">Soporte 24/7</p>
                      <p className="text-xs text-muted-foreground">Asistencia completa</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Info Tabs */}
        <div className="mt-12 space-y-6">
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="cyber-card">
              <CardContent className="p-6">
                <h3 className="font-bold mb-4">Especificaciones</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plataforma:</span>
                    <span>{platformName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Género:</span>
                    <span>{categoryName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo:</span>
                    <span className="capitalize">{product.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SKU:</span>
                    <span>{product.sku || 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cyber-card">
              <CardContent className="p-6">
                <h3 className="font-bold mb-4">Información de Entrega</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Entrega Digital</p>
                      <p className="text-xs text-muted-foreground">
                        Recibirás el código de activación por email instantáneamente
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Garantía</p>
                      <p className="text-xs text-muted-foreground">
                        Garantía de funcionamiento y soporte post-venta
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default ProductDetail