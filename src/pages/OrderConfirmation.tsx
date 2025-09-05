import { useEffect, useState } from "react"
import { useParams, Navigate, Link, useSearchParams } from "react-router-dom"
import { CheckCircle, Package, Mail, Phone, MapPin, Calendar, Download, RefreshCw, MessageCircle } from "lucide-react"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { CyberButton } from "@/components/ui/cyber-button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { useSiteSettings } from "@/hooks/useSiteSettings"

interface Order {
  id: string
  order_number: string
  total: number
  status: string
  payment_status: string
  payment_method: string | null
  created_at: string
  billing_info: any
  customer_notes: string
  order_items: Array<{
    id: string
    product_name: string
    quantity: number
    price: number
    digital_content: string | null
  }>
}

const OrderConfirmation = () => {
  const { orderNumber } = useParams()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const paymentMethod = searchParams.get('payment_method')
  const { user } = useAuth()
  const { toast } = useToast()
  const { settings } = useSiteSettings()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [verifyingPayment, setVerifyingPayment] = useState(false)

  useEffect(() => {
    if (orderNumber) {
      fetchOrder()
      // If there's a session_id, verify payment
      if (sessionId) {
        verifyPayment()
      }
    }
  }, [orderNumber, sessionId])

  const verifyPayment = async () => {
    setVerifyingPayment(true)
    try {
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { sessionId, orderNumber }
      })

      if (error) throw error

      if (data.paid) {
        toast({
          title: "¡Pago confirmado!",
          description: "Tu pedido ha sido procesado exitosamente.",
        })
      }

      // Refresh order data after payment verification
      await fetchOrder()
    } catch (error) {
      console.error('Error verifying payment:', error)
      toast({
        title: "Error",
        description: "No se pudo verificar el pago. Intenta refrescar la página.",
        variant: "destructive",
      })
    } finally {
      setVerifyingPayment(false)
    }
  }

  const handleVerifyPayment = async () => {
    if (orderNumber) {
      await verifyPayment()
    }
  }

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*)
        `)
        .eq('order_number', orderNumber)
        .single()

      if (error) throw error
      if (!data) throw new Error('Pedido no encontrado')

      setOrder(data)
    } catch (error) {
      console.error('Error fetching order:', error)
      setError('No se pudo cargar la información del pedido')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const generateWhatsAppMessage = (order: Order) => {
    let message = `🎮 *NUEVO PEDIDO - ${order.order_number}*\n\n`
    message += `👤 *Cliente:* ${order.billing_info?.firstName || ''} ${order.billing_info?.lastName || ''}\n`
    message += `📧 *Email:* ${order.billing_info?.email || user?.email}\n`
    if (order.billing_info?.phone) message += `📱 *Teléfono:* ${order.billing_info.phone}\n`
    if (order.billing_info?.address) {
      message += `📍 *Dirección:* ${order.billing_info.address}`
      if (order.billing_info.city) message += `, ${order.billing_info.city}`
      if (order.billing_info.postalCode) message += ` ${order.billing_info.postalCode}`
      message += `\n`
    }
    message += `\n🛒 *PRODUCTOS:*\n`
    
    order.order_items.forEach((item, index) => {
      message += `${index + 1}. ${item.product_name}\n`
      message += `   Cantidad: ${item.quantity}\n`
      message += `   Precio unitario: ${formatPrice(Number(item.price))}\n`
      message += `   Subtotal: ${formatPrice(Number(item.price) * item.quantity)}\n\n`
    })
    
    message += `💰 *TOTAL: ${formatPrice(Number(order.total))}*\n\n`
    message += `💳 *Método de pago:* Transferencia Bancaria\n`
    message += `📋 *Estado:* Pendiente de confirmación de pago\n`
    
    if (order.customer_notes) {
      message += `\n📝 *Notas del cliente:*\n${order.customer_notes}\n`
    }
    
    message += `\n⚠️ *Acción requerida:* Validar transferencia y confirmar pedido`
    
    return message
  }

  const handleNotifyWhatsApp = () => {
    if (!order) return
    
    const whatsappNumber = settings.whatsapp_number || "5411123456789"
    const message = generateWhatsAppMessage(order)
    const encodedMessage = encodeURIComponent(message)
    
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank')
    
    toast({
      title: "WhatsApp abierto",
      description: "Se abrió WhatsApp con los detalles del pedido para notificar a la tienda.",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="animate-cyber-pulse text-primary">Cargando pedido...</div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-dark">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Error</h1>
          <p className="text-muted-foreground mb-6">{error || 'Pedido no encontrado'}</p>
          <Link to="/">
            <CyberButton>Volver al Inicio</CyberButton>
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <CheckCircle className={`h-16 w-16 ${
                order.status === 'paid' ? 'text-green-500' : 'text-yellow-500'
              } animate-cyber-pulse`} />
            </div>
            <h1 className="text-3xl font-bold font-orbitron neon-text mb-2">
              {order.status === 'paid' ? '¡Pago Confirmado!' : '¡Pedido Creado!'}
            </h1>
            <p className="text-muted-foreground">
              {order.status === 'paid' 
                ? 'Tu compra ha sido procesada exitosamente'
                : 'Tu pedido está pendiente de pago'
              }
            </p>
            
            {/* Payment verification button */}
            {order.status !== 'paid' && order.payment_method !== 'bank_transfer' && (
              <div className="mt-4">
                <CyberButton 
                  onClick={handleVerifyPayment}
                  disabled={verifyingPayment}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${verifyingPayment ? 'animate-spin' : ''}`} />
                  {verifyingPayment ? 'Verificando...' : 'Verificar Pago'}
                </CyberButton>
              </div>
            )}

            {/* WhatsApp notification for bank transfer */}
            {(order.payment_method === 'bank_transfer' || paymentMethod === 'bank_transfer') && order.status !== 'paid' && (
              <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <h3 className="font-semibold text-blue-400 mb-2">Transferencia Bancaria</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Para procesar tu pedido, notifica a la tienda por WhatsApp con los detalles de la transferencia.
                </p>
                <CyberButton 
                  onClick={handleNotifyWhatsApp}
                  className="flex items-center gap-2 bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30"
                >
                  <MessageCircle className="h-4 w-4" />
                  Notificar por WhatsApp
                </CyberButton>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Order Details */}
            <div className="cyber-card p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold font-orbitron">
                  Detalles del Pedido
                </h2>
                <Badge variant="outline">
                  {order.status === 'draft' ? 'Pendiente' : order.status}
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Número de Pedido:</span>
                  <span className="font-mono">{order.order_number}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estado:</span>
                  <div className="flex items-center gap-2">
                    {order.status === 'paid' ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        Pagado
                      </Badge>
                    ) : order.status === 'pending' ? (
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                        Pendiente
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        {order.status === 'draft' ? 'Borrador' : order.status}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pago:</span>
                  <span className={order.payment_status === 'paid' ? 'text-green-400' : 'text-yellow-400'}>
                    {order.payment_status === 'paid' ? 'Confirmado' : 'Pendiente'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha:</span>
                  <span>{formatDate(order.created_at)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-bold neon-text text-lg">
                    {formatPrice(Number(order.total))}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div className="border-t border-primary/20 pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Productos
                </h3>
                <div className="space-y-3">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start py-2 border-b border-primary/10">
                      <div className="flex-1">
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Cantidad: {item.quantity}
                        </p>
                        {/* Digital Content */}
                        {item.digital_content && order.status === 'paid' && (
                          <div className="mt-2 p-2 bg-green-500/10 border border-green-500/30 rounded">
                            <div className="flex items-center gap-2 mb-1">
                              <Download className="h-4 w-4 text-green-400" />
                              <span className="text-sm font-medium text-green-400">Contenido Digital</span>
                            </div>
                            {(() => {
                              try {
                                const content = JSON.parse(item.digital_content)
                                return (
                                  <div className="text-sm space-y-1">
                                    <p className="font-mono text-xs bg-background/50 p-1 rounded">
                                      Código: {content.digital_code}
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                      {content.instructions}
                                    </p>
                                  </div>
                                )
                              } catch {
                                return <p className="text-sm text-muted-foreground">Código disponible</p>
                              }
                            })()}
                          </div>
                        )}
                      </div>
                      <span className="font-bold">
                        {formatPrice(Number(item.price) * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Billing Information */}
            <div className="cyber-card p-6 space-y-6">
              <h2 className="text-xl font-bold font-orbitron">
                Información de Entrega
              </h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-muted-foreground">
                      {order.billing_info?.email || user?.email}
                    </p>
                  </div>
                </div>

                {order.billing_info?.firstName && (
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Nombre Completo</p>
                      <p className="text-muted-foreground">
                        {order.billing_info.firstName} {order.billing_info.lastName}
                      </p>
                    </div>
                  </div>
                )}

                {order.billing_info?.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Teléfono</p>
                      <p className="text-muted-foreground">
                        {order.billing_info.phone}
                      </p>
                    </div>
                  </div>
                )}

                {order.billing_info?.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Dirección</p>
                      <p className="text-muted-foreground">
                        {order.billing_info.address}
                        {order.billing_info.city && `, ${order.billing_info.city}`}
                        {order.billing_info.postalCode && ` (${order.billing_info.postalCode})`}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {order.customer_notes && (
                <div className="border-t border-primary/20 pt-4">
                  <h3 className="font-semibold mb-2">Notas del Pedido</h3>
                  <p className="text-muted-foreground bg-card/30 p-3 rounded border border-primary/10">
                    {order.customer_notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Next Steps */}
          <div className="mt-8 cyber-card p-6">
            <h2 className="text-xl font-bold font-orbitron mb-4">
              ¿Qué sigue?
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center space-y-2">
                <Calendar className="h-8 w-8 text-primary mx-auto" />
                <h3 className="font-semibold">Procesamiento</h3>
                <p className="text-sm text-muted-foreground">
                  Tu pedido será procesado en las próximas horas
                </p>
              </div>
              <div className="text-center space-y-2">
                <Mail className="h-8 w-8 text-primary mx-auto" />
                <h3 className="font-semibold">Entrega Digital</h3>
                <p className="text-sm text-muted-foreground">
                  Recibirás los códigos por email una vez confirmado el pago
                </p>
              </div>
              <div className="text-center space-y-2">
                <CheckCircle className="h-8 w-8 text-primary mx-auto" />
                <h3 className="font-semibold">¡Listo para jugar!</h3>
                <p className="text-sm text-muted-foreground">
                  Activa tus códigos y disfruta de tus juegos
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/">
              <CyberButton variant="outline">
                Volver al Inicio
              </CyberButton>
            </Link>
            <Link to="/catalog">
              <CyberButton>
                Seguir Comprando
              </CyberButton>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default OrderConfirmation