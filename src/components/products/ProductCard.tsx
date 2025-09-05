import { Badge } from "@/components/ui/badge"
import { CyberButton } from "@/components/ui/cyber-button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Star, ShoppingCart, Eye } from "lucide-react"

interface Product {
  id: string
  title: string
  platform: string
  originalPrice: number
  price: number
  discount?: number
  rating: number
  image: string
  isPreOrder?: boolean
  releaseDate?: string
}

interface ProductCardProps {
  product: Product
}

const ProductCard = ({ product }: ProductCardProps) => {
  const discountPercentage = product.originalPrice > product.price 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  return (
    <Card className="cyber-card group hover:shadow-glow-primary transition-all duration-300 transform hover:-translate-y-1">
      <CardContent className="p-0">
        {/* Image */}
        <div className="relative overflow-hidden rounded-t-lg">
          <img 
            src={product.image} 
            alt={product.title}
            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
          />
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.isPreOrder && (
              <Badge className="bg-accent text-accent-foreground animate-pulse">
                Pre-orden
              </Badge>
            )}
            {discountPercentage > 0 && (
              <Badge className="bg-destructive text-destructive-foreground">
                -{discountPercentage}%
              </Badge>
            )}
          </div>

          {/* Platform badge */}
          <Badge 
            variant="outline" 
            className="absolute top-2 right-2 bg-background/80 border-primary/30"
          >
            {product.platform}
          </Badge>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-2 left-2 right-2 flex gap-2">
              <CyberButton variant="secondary" size="sm" className="flex-1">
                <Eye className="w-4 h-4 mr-1" />
                Ver
              </CyberButton>
              <CyberButton variant="default" size="sm" className="flex-1">
                <ShoppingCart className="w-4 h-4 mr-1" />
                Carrito
              </CyberButton>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {product.title}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`w-3 h-3 ${
                  i < Math.floor(product.rating) 
                    ? "text-accent fill-accent" 
                    : "text-muted-foreground"
                }`} 
              />
            ))}
            <span className="text-xs text-muted-foreground ml-1">
              ({product.rating})
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-primary font-orbitron">
                  ${product.price.toLocaleString('es-AR')}
                </span>
                {product.originalPrice > product.price && (
                  <span className="text-sm text-muted-foreground line-through">
                    ${product.originalPrice.toLocaleString('es-AR')}
                  </span>
                )}
              </div>
              {product.isPreOrder && product.releaseDate && (
                <div className="text-xs text-secondary">
                  Lanzamiento: {product.releaseDate}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        <CyberButton 
          variant="outline" 
          className="flex-1"
          size="sm"
        >
          Ver Detalles
        </CyberButton>
        <CyberButton 
          variant="cyber" 
          className="flex-1"
          size="sm"
        >
          <ShoppingCart className="w-4 h-4 mr-1" />
          {product.isPreOrder ? 'Pre-ordenar' : 'Comprar'}
        </CyberButton>
      </CardFooter>
    </Card>
  )
}

export default ProductCard