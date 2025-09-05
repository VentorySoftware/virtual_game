import { useMemo } from "react"
import { useProducts } from "@/hooks/useProducts"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import ProductCard from "@/components/products/ProductCard"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Flame, Zap, Timer, TrendingDown } from "lucide-react"

const Deals = () => {
  const { products, loading } = useProducts()

  // Filter products with discounts
  const dealsProducts = useMemo(() => {
    return products
      .filter(product => product.discount_percentage > 0)
      .sort((a, b) => b.discount_percentage - a.discount_percentage)
  }, [products])

  // Categorize deals
  const megaDeals = dealsProducts.filter(p => p.discount_percentage >= 30)
  const hotDeals = dealsProducts.filter(p => p.discount_percentage >= 15 && p.discount_percentage < 30)
  const regularDeals = dealsProducts.filter(p => p.discount_percentage > 0 && p.discount_percentage < 15)

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

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Header />
      
      <main className="container py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-6 py-12 relative">
          <div className="absolute inset-0 bg-gradient-glow opacity-20 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Flame className="w-6 h-6 text-destructive animate-pulse" />
              <Badge variant="destructive" className="animate-pulse">
                Ofertas Limitadas
              </Badge>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold font-orbitron mb-4">
              <span className="neon-text">Ofertas</span>{" "}
              <span className="text-destructive">Especiales</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Aprovecha nuestras ofertas especiales con descuentos de hasta 50% 
              en los mejores juegos. ¡Por tiempo limitado!
            </p>
          </div>
        </div>

        {/* Stats */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <Card className="cyber-card text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-destructive">{dealsProducts.length}</div>
              <div className="text-sm text-muted-foreground">Ofertas Activas</div>
            </CardContent>
          </Card>
          <Card className="cyber-card text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">{megaDeals.length}</div>
              <div className="text-sm text-muted-foreground">Mega Ofertas</div>
            </CardContent>
          </Card>
          <Card className="cyber-card text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-secondary">50%</div>
              <div className="text-sm text-muted-foreground">Descuento Máximo</div>
            </CardContent>
          </Card>
          <Card className="cyber-card text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-accent">24h</div>
              <div className="text-sm text-muted-foreground">Tiempo Restante</div>
            </CardContent>
          </Card>
        </section>

        {/* Mega Deals */}
        {megaDeals.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <TrendingDown className="w-6 h-6 text-destructive" />
              <h2 className="text-3xl font-bold font-orbitron">
                <span className="text-destructive">Mega</span> Ofertas
              </h2>
              <Badge variant="destructive" className="animate-pulse">
                30% OFF o más
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {megaDeals.map((product) => (
                <ProductCard key={product.id} product={product} showAddToCart={true} />
              ))}
            </div>
          </section>
        )}

        {/* Hot Deals */}
        {hotDeals.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <Flame className="w-6 h-6 text-primary animate-pulse" />
              <h2 className="text-3xl font-bold font-orbitron">
                Ofertas <span className="text-primary">Calientes</span>
              </h2>
              <Badge variant="outline" className="border-primary text-primary">
                15-29% OFF
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {hotDeals.map((product) => (
                <ProductCard key={product.id} product={product} showAddToCart={true} />
              ))}
            </div>
          </section>
        )}

        {/* Regular Deals */}
        {regularDeals.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-secondary" />
              <h2 className="text-3xl font-bold font-orbitron">
                Ofertas <span className="text-secondary">Rápidas</span>
              </h2>
              <Badge variant="outline" className="border-secondary text-secondary">
                Hasta 15% OFF
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {regularDeals.map((product) => (
                <ProductCard key={product.id} product={product} showAddToCart={true} />
              ))}
            </div>
          </section>
        )}

        {/* No Deals Available */}
        {dealsProducts.length === 0 && (
          <div className="text-center py-12 space-y-4">
            <Flame className="w-16 h-16 mx-auto text-muted-foreground" />
            <h3 className="text-xl font-semibold">No hay ofertas disponibles</h3>
            <p className="text-muted-foreground">
              Actualmente no tenemos ofertas especiales activas. 
              ¡Vuelve pronto para ver nuestros descuentos!
            </p>
          </div>
        )}

        {/* Limited Time Banner */}
        <section className="mt-12">
          <Card className="cyber-card bg-gradient-cyber">
            <CardContent className="p-8 text-center space-y-4">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Timer className="w-6 h-6 text-white animate-pulse" />
                <Badge className="bg-white/20 text-white border-white/30">
                  ¡Tiempo Limitado!
                </Badge>
              </div>
              <h3 className="text-2xl font-bold font-orbitron text-white">
                Ofertas por Tiempo Limitado
              </h3>
              <p className="text-white/80 max-w-2xl mx-auto">
                Nuestras ofertas especiales cambian regularmente. 
                Suscríbete a nuestras notificaciones para no perderte ninguna oportunidad.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                <button className="px-6 py-3 bg-white/10 border border-white/30 text-white rounded-lg hover:bg-white/20 transition-colors">
                  🔔 Notificarme de Ofertas
                </button>
                <button 
                  className="px-6 py-3 bg-white/10 border border-white/30 text-white rounded-lg hover:bg-white/20 transition-colors"
                  onClick={() => window.open('https://wa.me/5411123456789?text=Hola! Quiero estar al tanto de las ofertas especiales.', '_blank')}
                >
                  📱 WhatsApp VIP
                </button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default Deals