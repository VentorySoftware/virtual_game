import { Badge } from "@/components/ui/badge"
import { CyberButton } from "@/components/ui/cyber-button"
import ProductCard from "@/components/products/ProductCard"
import { ArrowRight, Flame, Clock, Package } from "lucide-react"
import { useFeaturedProducts, usePreorderProducts } from "@/hooks/useProducts"

const FeaturedProducts = () => {
  const { products: featuredProducts, loading: featuredLoading } = useFeaturedProducts()
  const { products: preOrderProducts, loading: preOrderLoading } = usePreorderProducts()

  if (featuredLoading || preOrderLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-20">
      {/* Pre-orders Section */}
      {preOrderProducts.length > 0 && (
        <section className="py-16">
          <div className="container">
            <div className="flex items-center justify-between mb-12">
              <div className="space-y-4">
                <Badge variant="outline" className="border-accent text-accent bg-accent/10 animate-pulse">
                  <Clock className="w-4 h-4 mr-2" />
                  Pre-órdenes Disponibles
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold font-orbitron">
                  <span className="neon-text">Próximos</span>{" "}
                  <span className="text-accent">Lanzamientos</span>
                </h2>
                <p className="text-muted-foreground max-w-2xl">
                  Asegura tu copia de los juegos más esperados. Pre-ordena ahora y recibe beneficios exclusivos.
                </p>
              </div>
              
              <CyberButton variant="neon">
                Ver Todos
                <ArrowRight className="w-4 h-4 ml-2" />
              </CyberButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {preOrderProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Games Section */}
      <section className="py-16 relative">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-glow opacity-10 blur-3xl" />
        
        <div className="container relative">
          <div className="flex items-center justify-between mb-12">
            <div className="space-y-4">
              <Badge variant="outline" className="border-primary text-primary bg-primary/10">
                <Flame className="w-4 h-4 mr-2 animate-pulse" />
                Más Populares
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold font-orbitron">
                <span className="neon-text">Juegos</span>{" "}
                <span className="text-primary">Destacados</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl">
                Los títulos más vendidos y mejor valorados por nuestra comunidad. 
                Descubre por qué son los favoritos de los gamers.
              </p>
            </div>
            
            <CyberButton variant="cyber">
              Ver Catálogo Completo
              <ArrowRight className="w-4 h-4 ml-2" />
            </CyberButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {featuredProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Call to Action */}
          <div className="cyber-card p-8 text-center space-y-6 bg-gradient-cyber">
            <div className="space-y-4">
              <Badge className="bg-white/20 text-white border-white/30">
                <Package className="w-4 h-4 mr-2" />
                Packs Exclusivos
              </Badge>
              <h3 className="text-2xl font-bold font-orbitron text-white">
                Combos y Packs Especiales
              </h3>
              <p className="text-white/80 max-w-lg mx-auto">
                Ahorra más comprando nuestros packs especiales. 
                Múltiples juegos al mejor precio combinado.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <CyberButton 
                variant="outline" 
                className="bg-white/10 border-white/30 text-white hover:bg-white hover:text-black"
              >
                Ver Packs PS5
              </CyberButton>
              <CyberButton 
                variant="outline"
                className="bg-white/10 border-white/30 text-white hover:bg-white hover:text-black"
              >
                Ver Packs Xbox
              </CyberButton>
              <CyberButton 
                variant="outline"
                className="bg-white/10 border-white/30 text-white hover:bg-white hover:text-black"
              >
                Ver Packs PC
              </CyberButton>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default FeaturedProducts