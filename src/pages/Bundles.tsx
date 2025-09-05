import { useBundles } from "@/hooks/useBundles"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { Badge } from "@/components/ui/badge"
import { CyberButton } from "@/components/ui/cyber-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Star, ShoppingCart, ArrowRight, Gift } from "lucide-react"

const Bundles = () => {
  const { bundles, loading } = useBundles()

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
              <Package className="w-6 h-6 text-secondary" />
              <Badge variant="outline" className="border-secondary text-secondary bg-secondary/10">
                Packs Exclusivos
              </Badge>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold font-orbitron mb-4">
              <span className="neon-text">Packs</span>{" "}
              <span className="text-secondary">Especiales</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Ahorra más comprando nuestros packs especiales. 
              Múltiples juegos al mejor precio combinado con descuentos únicos.
            </p>
          </div>
        </div>

        {/* Benefits */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="cyber-card text-center">
            <CardContent className="p-6 space-y-4">
              <div className="w-12 h-12 mx-auto bg-secondary/20 rounded-lg flex items-center justify-center">
                <Gift className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="font-bold">Máximo Ahorro</h3>
              <p className="text-sm text-muted-foreground">
                Hasta 40% de descuento comparado con compras individuales
              </p>
            </CardContent>
          </Card>

          <Card className="cyber-card text-center">
            <CardContent className="p-6 space-y-4">
              <div className="w-12 h-12 mx-auto bg-primary/20 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold">Juegos Curados</h3>
              <p className="text-sm text-muted-foreground">
                Selecciones especiales de los mejores títulos por género
              </p>
            </CardContent>
          </Card>

          <Card className="cyber-card text-center">
            <CardContent className="p-6 space-y-4">
              <div className="w-12 h-12 mx-auto bg-accent/20 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-bold">Todo Incluido</h3>
              <p className="text-sm text-muted-foreground">
                Todos los juegos del pack en una sola compra conveniente
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Bundles Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold font-orbitron">
              Packs <span className="text-secondary">Disponibles</span>
            </h2>
            <Badge variant="outline" className="border-secondary text-secondary">
              {bundles.length} packs activos
            </Badge>
          </div>

          {bundles.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {bundles.map((bundle) => {
                const savings = bundle.original_total && bundle.bundle_price 
                  ? bundle.original_total - bundle.bundle_price 
                  : 0
                const savingsPercentage = bundle.original_total 
                  ? Math.round((savings / bundle.original_total) * 100)
                  : 0

                return (
                  <Card key={bundle.id} className="cyber-card group hover:shadow-glow-secondary transition-all duration-300">
                    <CardHeader className="relative">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <Badge className="bg-secondary/20 text-secondary border-secondary">
                            {bundle.badge_text}
                          </Badge>
                          <CardTitle className="text-xl font-orbitron group-hover:text-secondary transition-colors">
                            {bundle.name}
                          </CardTitle>
                          <p className="text-muted-foreground text-sm">
                            {bundle.description}
                          </p>
                        </div>
                        
                        {savingsPercentage > 0 && (
                          <Badge variant="destructive" className="animate-pulse">
                            -{savingsPercentage}% OFF
                          </Badge>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      {/* Games in Bundle */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                          Juegos incluidos ({bundle.bundle_items?.length || 0})
                        </h4>
                        <div className="grid gap-2">
                          {bundle.bundle_items?.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-card/50 border border-primary/10">
                              <div className="flex items-center gap-3">
                                <img
                                  src={item.product?.image_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100&h=75&fit=crop'}
                                  alt={item.product?.title || 'Game'}
                                  className="w-12 h-9 rounded object-cover"
                                />
                                <div>
                                  <h5 className="font-semibold text-sm">
                                    {item.product?.title || 'Juego incluido'}
                                  </h5>
                                  <p className="text-xs text-muted-foreground">
                                    {item.product?.platform?.name || 'Multi'}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold">
                                  ${item.product?.price.toLocaleString('es-AR') || '0'}
                                </p>
                                {item.quantity > 1 && (
                                  <p className="text-xs text-muted-foreground">
                                    x{item.quantity}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Pricing */}
                      <div className="space-y-3 p-4 rounded-lg bg-secondary/5 border border-secondary/20">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Precio individual:</span>
                          <span className="line-through text-muted-foreground">
                            ${bundle.original_total?.toLocaleString('es-AR') || '0'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Precio del pack:</span>
                          <span className="text-2xl font-bold text-secondary font-orbitron">
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

                      {/* Actions */}
                      <div className="flex gap-3">
                        <CyberButton className="flex-1" size="lg">
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Comprar Pack
                        </CyberButton>
                        <CyberButton variant="outline" size="lg">
                          <ArrowRight className="w-4 h-4" />
                        </CyberButton>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 space-y-4">
              <Package className="w-16 h-16 mx-auto text-muted-foreground" />
              <h3 className="text-xl font-semibold">No hay packs disponibles</h3>
              <p className="text-muted-foreground">
                Actualmente no tenemos packs especiales disponibles. 
                ¡Vuelve pronto para ver nuestras ofertas combinadas!
              </p>
              <CyberButton onClick={() => window.location.href = '/catalog'}>
                Ver catálogo individual
              </CyberButton>
            </div>
          )}
        </section>

        {/* Call to Action */}
        <section className="mt-12">
          <Card className="cyber-card bg-gradient-cyber">
            <CardContent className="p-8 text-center space-y-4">
              <h3 className="text-2xl font-bold font-orbitron text-white">
                ¿No encuentras el pack perfecto?
              </h3>
              <p className="text-white/80 max-w-2xl mx-auto">
                Contáctanos por WhatsApp y armaremos un pack personalizado 
                con los juegos que más te interesan al mejor precio.
              </p>
              <CyberButton 
                variant="outline" 
                className="bg-white/10 border-white/30 text-white hover:bg-white hover:text-black"
                onClick={() => window.open('https://wa.me/5411123456789?text=Hola! Me interesa armar un pack personalizado de juegos.', '_blank')}
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

export default Bundles