import { usePreorderProducts } from "@/hooks/useProducts"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import ProductCard from "@/components/products/ProductCard"
import { Badge } from "@/components/ui/badge"
import { CyberButton } from "@/components/ui/cyber-button"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, Calendar, Bell, Star } from "lucide-react"

const Preorders = () => {
  const { products: preorderProducts, loading } = usePreorderProducts()

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
              <Clock className="w-6 h-6 text-accent animate-pulse" />
              <Badge variant="outline" className="border-accent text-accent bg-accent/10 animate-pulse">
                Próximos Lanzamientos
              </Badge>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold font-orbitron mb-4">
              <span className="neon-text">Pre-órdenes</span>{" "}
              <span className="text-accent">Disponibles</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Asegura tu copia de los juegos más esperados del año. 
              Pre-ordena ahora y obtén acceso inmediato en el día de lanzamiento.
            </p>
          </div>
        </div>

        {/* Benefits Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="cyber-card text-center">
            <CardContent className="p-6 space-y-4">
              <div className="w-12 h-12 mx-auto bg-accent/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-bold">Acceso Garantizado</h3>
              <p className="text-sm text-muted-foreground">
                Tu copia estará lista exactamente en la fecha de lanzamiento
              </p>
            </CardContent>
          </Card>

          <Card className="cyber-card text-center">
            <CardContent className="p-6 space-y-4">
              <div className="w-12 h-12 mx-auto bg-primary/20 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold">Contenido Exclusivo</h3>
              <p className="text-sm text-muted-foreground">
                Recibe bonificaciones y contenido adicional solo para pre-órdenes
              </p>
            </CardContent>
          </Card>

          <Card className="cyber-card text-center">
            <CardContent className="p-6 space-y-4">
              <div className="w-12 h-12 mx-auto bg-secondary/20 rounded-lg flex items-center justify-center">
                <Bell className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="font-bold">Notificaciones</h3>
              <p className="text-sm text-muted-foreground">
                Te avisamos cuando tu juego esté listo para descargar
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Pre-orders Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold font-orbitron">
              Juegos <span className="text-accent">Disponibles</span>
            </h2>
            <Badge variant="outline" className="border-accent text-accent">
              {preorderProducts.length} pre-órdenes activas
            </Badge>
          </div>

          {preorderProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {preorderProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 space-y-4">
              <Clock className="w-16 h-16 mx-auto text-muted-foreground" />
              <h3 className="text-xl font-semibold">No hay pre-órdenes disponibles</h3>
              <p className="text-muted-foreground">
                Actualmente no tenemos juegos disponibles para pre-orden. 
                ¡Vuelve pronto para ver los próximos lanzamientos!
              </p>
              <CyberButton onClick={() => window.location.href = '/catalog'}>
                Ver catálogo completo
              </CyberButton>
            </div>
          )}
        </section>

        {/* Info Section */}
        <section className="mt-12">
          <Card className="cyber-card bg-gradient-cyber">
            <CardContent className="p-8 text-center space-y-4">
              <h3 className="text-2xl font-bold font-orbitron text-white">
                ¿Cómo funcionan las pre-órdenes?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="text-white/90">
                  <div className="text-3xl font-bold text-accent mb-2">1</div>
                  <h4 className="font-semibold mb-2">Pre-ordena</h4>
                  <p className="text-sm text-white/80">
                    Realiza tu pedido y asegura tu copia del juego
                  </p>
                </div>
                <div className="text-white/90">
                  <div className="text-3xl font-bold text-accent mb-2">2</div>
                  <h4 className="font-semibold mb-2">Te notificamos</h4>
                  <p className="text-sm text-white/80">
                    Recibirás una notificación cuando esté listo
                  </p>
                </div>
                <div className="text-white/90">
                  <div className="text-3xl font-bold text-accent mb-2">3</div>
                  <h4 className="font-semibold mb-2">¡A jugar!</h4>
                  <p className="text-sm text-white/80">
                    Recibe tu código y comienza a jugar inmediatamente
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default Preorders