import { useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { CreditCard, Mail, MapPin, Phone, User, ShoppingCart } from "lucide-react"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { CyberButton } from "@/components/ui/cyber-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useCart } from "@/contexts/CartContext"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface CheckoutFormData {
  email: string
  firstName: string
  lastName: string
  phone: string
  address: string
  city: string
  postalCode: string
  notes: string
}

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart()
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CheckoutFormData>({
    email: user?.email || '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    notes: ''
  })

  // Redirect if cart is empty
  if (items.length === 0) {
    return <Navigate to="/catalog" replace />
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(price)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create order in database
      const orderData = {
        user_id: user?.id || null,
        order_number: `VG${Date.now()}`,
        subtotal: totalPrice,
        total: totalPrice,
        status: 'draft' as const,
        billing_info: {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
        },
        customer_notes: formData.notes,
        payment_method: null,
        payment_status: 'pending'
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        bundle_id: item.bundle_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.price
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // Create Stripe payment session
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-payment', {
        body: { orderId: order.id }
      })

      if (paymentError) throw paymentError
      if (!paymentData?.url) throw new Error('No payment URL received')

      // Open Stripe checkout in a new tab
      window.open(paymentData.url, '_blank')

      toast({
        title: "Redirigiendo al pago",
        description: `Pedido ${order.order_number} creado. Completá el pago en la nueva ventana.`,
      })

      // Clear cart after successful order creation
      await clearCart()

      // Redirect to order confirmation after a short delay
      setTimeout(() => {
        navigate(`/order-confirmation/${order.order_number}`)
      }, 2000)
      
    } catch (error) {
      console.error('Error creating order:', error)
      toast({
        title: "Error",
        description: "No se pudo crear el pedido. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold font-orbitron neon-text mb-8">
            Finalizar Compra
          </h1>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Checkout Form */}
            <div className="cyber-card p-6">
              <h2 className="text-xl font-bold font-orbitron mb-6">
                Información de Facturación
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="pl-10 cyber-border"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellido *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="pl-10 cyber-border"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pl-10 cyber-border"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="pl-10 cyber-border"
                      placeholder="+54 9 11 1234-5678"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="pl-10 cyber-border"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Ciudad</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="cyber-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Código Postal</Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      className="cyber-border"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notas del Pedido</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="cyber-border"
                    placeholder="Instrucciones especiales, preferencias de entrega, etc."
                    rows={3}
                  />
                </div>

              <CyberButton
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? "Creando pedido..." : "Proceder al Pago"}
              </CyberButton>
              </form>
            </div>

            {/* Order Summary */}
            <div className="cyber-card p-6">
              <h2 className="text-xl font-bold font-orbitron mb-6 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Resumen del Pedido
              </h2>

              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 p-3 bg-card/30 rounded-lg border border-primary/10">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.product_name}
                        className="w-16 h-16 object-cover rounded border border-primary/20"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-sm mb-1">{item.product_name}</h4>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">
                          Cantidad: {item.quantity}
                        </span>
                        <span className="text-primary font-bold">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="border-t border-primary/20 pt-4 space-y-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="neon-text">{formatPrice(totalPrice)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    * Los productos digitales se entregarán por email
                  </p>
                  <p className="text-sm text-muted-foreground">
                    * Procesamiento instantáneo garantizado
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default Checkout