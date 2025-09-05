import { useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { CreditCard, Mail, MapPin, Phone, User, ShoppingCart, Building2, Smartphone } from "lucide-react"
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
import { useSiteSettings } from "@/hooks/useSiteSettings"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

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

type PaymentMethod = 'bank_transfer' | 'mercado_pago'

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart()
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const { settings } = useSiteSettings()
  
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer')
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

  const createOrder = async () => {
    const orderData = {
      user_id: user?.id || null,
      order_number: `VG${Date.now()}`,
      subtotal: totalPrice,
      total: totalPrice,
      status: 'pending' as const,
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
      payment_method: paymentMethod,
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

    return order
  }

  const generateWhatsAppMessage = (order: any) => {
    let message = `🎮 *NUEVO PEDIDO - ${order.order_number}*\n\n`
    message += `👤 *Cliente:* ${formData.firstName} ${formData.lastName}\n`
    message += `📧 *Email:* ${formData.email}\n`
    if (formData.phone) message += `📱 *Teléfono:* ${formData.phone}\n`
    if (formData.address) message += `📍 *Dirección:* ${formData.address}, ${formData.city} ${formData.postalCode}\n`
    message += `\n🛒 *PRODUCTOS:*\n`
    
    items.forEach((item, index) => {
      message += `${index + 1}. ${item.product_name}\n`
      message += `   Cantidad: ${item.quantity}\n`
      message += `   Precio unitario: ${formatPrice(item.price)}\n`
      message += `   Subtotal: ${formatPrice(item.price * item.quantity)}\n\n`
    })
    
    message += `💰 *TOTAL: ${formatPrice(totalPrice)}*\n\n`
    message += `💳 *Método de pago:* Transferencia Bancaria\n`
    message += `📋 *Estado:* Pendiente de confirmación de pago\n`
    
    if (formData.notes) {
      message += `\n📝 *Notas del cliente:*\n${formData.notes}\n`
    }
    
    message += `\n⚠️ *Acción requerida:* Validar transferencia y confirmar pedido`
    
    return message
  }

  const handleBankTransfer = async (order: any) => {
    const whatsappNumber = settings.whatsapp_number || "5411123456789"
    const message = generateWhatsAppMessage(order)
    const encodedMessage = encodeURIComponent(message)
    
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank')
    
    toast({
      title: "Pedido creado",
      description: `Pedido ${order.order_number} creado. Se abrió WhatsApp para confirmar el pago.`,
    })

    await clearCart()
    navigate(`/order-confirmation/${order.order_number}`)
  }

  const handleMercadoPago = async (order: any) => {
    try {
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-mercadopago-payment', {
        body: { orderId: order.id }
      })

      if (paymentError) throw paymentError
      if (!paymentData?.init_point) throw new Error('No payment URL received')

      window.open(paymentData.init_point, '_blank')
      
      toast({
        title: "Redirigiendo a MercadoPago",
        description: `Pedido ${order.order_number} creado. Completá el pago en la nueva ventana.`,
      })

      await clearCart()
      
      setTimeout(() => {
        navigate(`/order-confirmation/${order.order_number}`)
      }, 2000)
    } catch (error) {
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const order = await createOrder()

      if (paymentMethod === 'bank_transfer') {
        await handleBankTransfer(order)
      } else if (paymentMethod === 'mercado_pago') {
        await handleMercadoPago(order)
      }
      
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

                {/* Payment Method Selection */}
                <div className="space-y-4 p-4 border border-primary/20 rounded-lg bg-card/10">
                  <Label className="text-base font-semibold">Método de Pago</Label>
                  <RadioGroup value={paymentMethod} onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}>
                    <div className="flex items-center space-x-2 p-3 border border-primary/10 rounded-lg hover:bg-card/20 cursor-pointer">
                      <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                      <Label htmlFor="bank_transfer" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Building2 className="h-4 w-4 text-blue-400" />
                        <div>
                          <div className="font-medium">Transferencia Bancaria</div>
                          <div className="text-sm text-muted-foreground">Pago manual - Confirmación vía WhatsApp</div>
                        </div>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 p-3 border border-primary/10 rounded-lg hover:bg-card/20 cursor-pointer">
                      <RadioGroupItem value="mercado_pago" id="mercado_pago" />
                      <Label htmlFor="mercado_pago" className="flex items-center gap-2 cursor-pointer flex-1">
                        <CreditCard className="h-4 w-4 text-blue-500" />
                        <div>
                          <div className="font-medium">MercadoPago</div>
                          <div className="text-sm text-muted-foreground">Pago inmediato - Tarjeta o transferencia</div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

              <CyberButton
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? "Creando pedido..." : 
                 paymentMethod === 'bank_transfer' ? "Crear Pedido y Enviar por WhatsApp" : 
                 "Proceder con MercadoPago"}
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