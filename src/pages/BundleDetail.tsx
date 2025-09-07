import { useParams, useNavigate } from "react-router-dom"
import { useBundles } from "@/hooks/useBundles"
import { useCart } from "@/contexts/CartContext"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { Badge } from "@/components/ui/badge"
import { CyberButton } from "@/components/ui/cyber-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Star, ShoppingCart, ArrowLeft, Gift } from "lucide-react"
import { useSiteSettings } from "@/hooks/useSiteSettings"

const BundleDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { bundles, loading } = useBundles()
  const { addToCart } = useCart()
  const { settings } = useSiteSettings()

  // Use id string directly without converting to number
  const bundleId = id || null
  const bundle = bundleId ? bundles.find(b => b.id === bundleId) : null

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

  if (!bundle) {
    return (
      <div className="min-h-screen bg-gradient-dark">
        <Header />
        <div className="container py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Pack no encontrado</h1>
          <p className="text-muted-foreground mb-6">El pack que buscas no existe o ha sido eliminado.</p>
          <CyberButton onClick={() => navigate('/packs')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Packs
          </CyberButton>
        </div>
        <Footer />
      </div>
    )
  }

  const savings = bundle.original_total && bundle.bundle_price
    ? bundle.original_total - bundle.bundle_price
    : 0
  const savingsPercentage = bundle.original_total
    ? Math.round((savings / bundle.original_total) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Header />

      <main className="container py-8 space-y-8">
        {/* Back Button */}
        <div className="flex items-center gap-4">
          <CyberButton variant="outline" onClick={() => navigate('/packs')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Packs
          </CyberButton>
        </div>

        {/* Hero Section */}
        <div className="text-center space-y-6 py-12 relative">
          <div className="absolute inset-0 bg-gradient-glow opacity-20 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Package className="w-8 h-8 text-secondary" />
              <Badge variant="outline" className="border-secondary text-secondary bg-secondary/10">
                Pack Especial
              </Badge>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold font-orbitron mb-4">
              <span className="neon-text">{bundle.name}</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              {bundle.description}
            </p>
          </div>
        </div>

        {/* Bundle Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Games List */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-secondary" />
                  Juegos incluidos ({bundle.bundle_items?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {bundle.bundle_items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-card/50 border border-primary/10 hover:bg-card/70 cursor-pointer transition-colors"
                    onClick={() => item.product?.slug && navigate(`/product/${item.product.slug}`)}
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={item.product?.image_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100&h=75&fit=crop'}
                        alt={item.product?.title || 'Game'}
                        className="w-16 h-12 rounded object-cover"
                      />
                      <div>
                        <h4 className="font-semibold">
                          {item.product?.title || 'Juego incluido'}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {item.product?.platform?.name || 'Multi'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        ${item.product?.price.toLocaleString('es-AR') || '0'}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-sm text-muted-foreground">
                          x{item.quantity}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Pricing & Actions */}
          <div className="space-y-6">
            {/* Pricing Card */}
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle>Precio del Pack</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Precio individual:</span>
                    <span className="line-through text-muted-foreground">
                      ${bundle.original_total?.toLocaleString('es-AR') || '0'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Precio del pack:</span>
                    <span className="text-3xl font-bold text-secondary font-orbitron">
                      ${bundle.bundle_price.toLocaleString('es-AR')}
                    </span>
                  </div>
                  {savings > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-emerald-400 font-semibold">Ahorras:</span>
                      <span className="text-emerald-400 font-semibold">
                        ${savings.toLocaleString('es-AR')} ({savingsPercentage}%)
                      </span>
                    </div>
                  )}
                </div>

                <CyberButton
                  className="w-full"
                  size="lg"
                  onClick={() => addToCart({
                    bundle_id: bundle.id,
                    product_name: bundle.name,
                    price: bundle.bundle_price,
                    quantity: 1,
                    type: 'bundle'
                  })}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Agregar al carrito
                </CyberButton>
              </CardContent>
            </Card>

            {/* Benefits */}
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-secondary" />
                  Beneficios del Pack
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-secondary rounded-full" />
                  <span className="text-sm">Hasta {savingsPercentage}% de descuento</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="text-sm">Todos los juegos en una compra</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-accent rounded-full" />
                  <span className="text-sm">Acceso inmediato a todos los títulos</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <section className="mt-12">
          <Card className="cyber-card bg-gradient-cyber">
            <CardContent className="p-8 text-center space-y-4">
              <h3 className="text-2xl font-bold font-orbitron text-white">
                ¿Necesitas ayuda?
              </h3>
              <p className="text-white/80 max-w-2xl mx-auto">
                Si tienes alguna duda sobre este pack o quieres personalizar uno,
                contáctanos por WhatsApp y te ayudaremos.
              </p>
              <CyberButton
                variant="outline"
                className="bg-white/10 border-white/30 text-white hover:bg-white hover:text-black"
                onClick={() => window.open(`https://wa.me/${settings.whatsapp_number || '5411123456789'}?text=Hola! Tengo una consulta sobre el pack "${bundle.name}".`, '_blank')}
              >
                Contactar por WhatsApp
              </CyberButton>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default BundleDetail
