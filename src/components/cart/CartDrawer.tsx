import { Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react"
import { CyberButton } from "@/components/ui/cyber-button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useCart } from "@/contexts/CartContext"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Link } from "react-router-dom"

interface CartDrawerProps {
  children: React.ReactNode
}

export const CartDrawer = ({ children }: CartDrawerProps) => {
  const { items, totalItems, totalPrice, updateQuantity, removeFromCart, loading } = useCart()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(price)
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg bg-card border-primary/20">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-orbitron neon-text">
            <ShoppingCart className="h-5 w-5" />
            Carrito de Compras
            {totalItems > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {totalItems}
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-cyber-pulse text-primary">Cargando...</div>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">Tu carrito está vacío</p>
              <p className="text-sm text-muted-foreground">
                Agrega algunos productos increíbles
              </p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-auto py-4">
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="cyber-card p-4">
                      <div className="flex gap-3">
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.product_name}
                            className="w-16 h-16 object-cover rounded-lg border border-primary/20"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-sm line-clamp-2 mb-2">
                            {item.product_name}
                          </h4>
                          <div className="flex items-center justify-between">
                            <span className="text-primary font-bold">
                              {formatPrice(item.price)}
                            </span>
                            <div className="flex items-center gap-2">
                              <CyberButton
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </CyberButton>
                              <span className="w-8 text-center text-sm">
                                {item.quantity}
                              </span>
                              <CyberButton
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </CyberButton>
                              <CyberButton
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => removeFromCart(item.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </CyberButton>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-primary/20 pt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total:</span>
                  <span className="text-xl font-bold neon-text">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
                
                <Link to="/checkout">
                  <CyberButton className="w-full" size="lg">
                    Proceder al Checkout
                  </CyberButton>
                </Link>
                
                <Link to="/catalog">
                  <CyberButton variant="outline" className="w-full">
                    Continuar Comprando
                  </CyberButton>
                </Link>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}