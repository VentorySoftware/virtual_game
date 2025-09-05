import { useEffect, useState } from "react"
import { useParams, Navigate, Link } from "react-router-dom"
import { CheckCircle, Package, Mail, Phone, MapPin, Calendar } from "lucide-react"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { CyberButton } from "@/components/ui/cyber-button"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"

interface Order {
  id: string
  order_number: string
  total: number
  status: string
  created_at: string
  billing_info: any
  customer_notes: string
  order_items: Array<{
    id: string
    product_name: string
    quantity: number
    price: number
  }>
}

const OrderConfirmation = () => {
  const { orderNumber } = useParams()
  const { user } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (orderNumber) {
      fetchOrder()
    }
  }, [orderNumber])

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
              <CheckCircle className="h-16 w-16 text-green-500 animate-cyber-pulse" />
            </div>
            <h1 className="text-3xl font-bold font-orbitron neon-text mb-2">
              ¡Pedido Confirmado!
            </h1>
            <p className="text-muted-foreground">
              Tu pedido ha sido procesado correctamente
            </p>
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
                    <div key={item.id} className="flex justify-between items-center py-2 border-b border-primary/10">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Cantidad: {item.quantity}
                        </p>
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