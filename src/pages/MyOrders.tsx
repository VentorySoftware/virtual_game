import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Package, Clock, CheckCircle, XCircle, Eye, ArrowLeft, Calendar, CreditCard, MapPin, User, Phone, Mail } from "lucide-react"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { CyberButton } from "@/components/ui/cyber-button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface OrderItem {
  id: string
  product_name: string
  quantity: number
  price: number
  digital_content?: string
}

interface Order {
  id: string
  order_number: string
  status: string
  payment_status: string
  payment_method: string
  subtotal: number
  total: number
  created_at: string
  billing_info: any // Changed from specific type to any to handle Json type from Supabase
  customer_notes?: string
  order_items: OrderItem[]
}

const MyOrders = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      fetchOrders()
    }
  }, [user])

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_name,
            quantity,
            price,
            digital_content
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los pedidos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, icon: Clock, label: "Pendiente" },
      verifying: { variant: "secondary" as const, icon: Clock, label: "Verificando" },
      paid: { variant: "default" as const, icon: CheckCircle, label: "Pagado" },
      delivered: { variant: "default" as const, icon: CheckCircle, label: "Entregado" },
      cancelled: { variant: "destructive" as const, icon: XCircle, label: "Cancelado" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getPaymentMethodLabel = (method: string) => {
    const methods = {
      bank_transfer: "Transferencia Bancaria",
      mercadopago: "MercadoPago",
      stripe: "Tarjeta de Crédito"
    }
    return methods[method as keyof typeof methods] || method
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-dark">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold font-orbitron neon-text mb-4">
              Acceso Restringido
            </h1>
            <p className="text-muted-foreground mb-4">
              Debes iniciar sesión para ver tus pedidos
            </p>
            <Link to="/auth">
              <CyberButton>Iniciar Sesión</CyberButton>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link to="/">
              <CyberButton variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </CyberButton>
            </Link>
            <div>
              <h1 className="text-3xl font-bold font-orbitron neon-text">
                Mis Pedidos
              </h1>
              <p className="text-muted-foreground">
                Consulta el estado y detalles de tus pedidos
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando pedidos...</p>
            </div>
          ) : orders.length === 0 ? (
            <Card className="cyber-card">
              <CardContent className="text-center py-12">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No tienes pedidos aún</h3>
                <p className="text-muted-foreground mb-6">
                  Cuando realices tu primera compra, aparecerá aquí
                </p>
                <Link to="/catalog">
                  <CyberButton>Explorar Catálogo</CyberButton>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <Card key={order.id} className="cyber-card">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="font-orbitron text-lg">
                          Pedido #{order.order_number}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {formatDate(order.created_at)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        {getStatusBadge(order.status)}
                        <div className="text-lg font-bold neon-text">
                          {formatPrice(order.total)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {getPaymentMethodLabel(order.payment_method)}
                        </span>
                      </div>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <CyberButton
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver Detalles
                          </CyberButton>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto cyber-card">
                          <DialogHeader>
                            <DialogTitle className="font-orbitron">
                              Detalles del Pedido #{order.order_number}
                            </DialogTitle>
                          </DialogHeader>
                          
                          {selectedOrder && (
                            <div className="space-y-6">
                              {/* Estado y información general */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold mb-2">Estado del Pedido</h4>
                                  {getStatusBadge(selectedOrder.status)}
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">Método de Pago</h4>
                                  <p className="text-sm">{getPaymentMethodLabel(selectedOrder.payment_method)}</p>
                                </div>
                              </div>

                              {/* Información de facturación */}
                              <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  Información de Facturación
                                </h4>
                                <div className="bg-card/30 rounded-lg p-4 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                                      {selectedOrder.billing_info.firstName} {selectedOrder.billing_info.lastName}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{selectedOrder.billing_info.email}</span>
                                  </div>
                                  {selectedOrder.billing_info.phone && (
                                    <div className="flex items-center gap-2">
                                      <Phone className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm">{selectedOrder.billing_info.phone}</span>
                                    </div>
                                  )}
                                  {selectedOrder.billing_info.address && (
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm">
                                        {selectedOrder.billing_info.address}, {selectedOrder.billing_info.city} {selectedOrder.billing_info.postalCode}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Productos */}
                              <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                  <Package className="h-4 w-4" />
                                  Productos
                                </h4>
                                <div className="space-y-3">
                                  {selectedOrder.order_items.map((item, index) => (
                                    <div key={item.id} className="bg-card/30 rounded-lg p-4">
                                      <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                          <h5 className="font-medium">{item.product_name}</h5>
                                          <p className="text-sm text-muted-foreground">
                                            Cantidad: {item.quantity} × {formatPrice(item.price)}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <span className="font-bold">
                                            {formatPrice(item.price * item.quantity)}
                                          </span>
                                        </div>
                                      </div>
                                      {item.digital_content && (
                                        <div className="mt-3 p-3 bg-primary/10 rounded border border-primary/20">
                                          <h6 className="text-sm font-semibold text-primary mb-1">Contenido Digital:</h6>
                                          <p className="text-xs text-muted-foreground break-all">
                                            {item.digital_content}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Total */}
                              <div className="border-t border-primary/20 pt-4">
                                <div className="flex justify-between items-center text-lg font-bold">
                                  <span>Total:</span>
                                  <span className="neon-text">{formatPrice(selectedOrder.total)}</span>
                                </div>
                              </div>

                              {/* Notas del cliente */}
                              {selectedOrder.customer_notes && (
                                <div>
                                  <h4 className="font-semibold mb-2">Notas del Pedido</h4>
                                  <p className="text-sm bg-card/30 p-3 rounded">
                                    {selectedOrder.customer_notes}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>

                    {/* Items preview */}
                    <div className="text-sm text-muted-foreground">
                      {order.order_items.length} producto{order.order_items.length !== 1 ? 's' : ''}: {' '}
                      {order.order_items.slice(0, 2).map(item => item.product_name).join(', ')}
                      {order.order_items.length > 2 && ` y ${order.order_items.length - 2} más`}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default MyOrders