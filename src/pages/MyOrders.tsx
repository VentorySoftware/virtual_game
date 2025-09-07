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
import { useSiteSettings } from "@/hooks/useSiteSettings"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

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
  const { settings } = useSiteSettings()

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

  const printReceipt = (order: Order) => {
    const doc = new jsPDF()

    // Header with store information
    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    const storeName = settings.site_name || "Virtual Game"
    doc.text(storeName, 105, 20, { align: "center" })

    // Store description
    if (settings.site_description) {
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      const descriptionLines = doc.splitTextToSize(settings.site_description, 180)
      doc.text(descriptionLines, 105, 30, { align: "center" })
    }

    // Store contact information
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    let yPos = settings.site_description ? 45 : 35

    if (settings.contact_email) {
      doc.text(`Email: ${settings.contact_email}`, 105, yPos, { align: "center" })
      yPos += 5
    }

    if (settings.whatsapp_number) {
      doc.text(`WhatsApp: ${settings.whatsapp_number}`, 105, yPos, { align: "center" })
      yPos += 5
    }

    if (settings.contact_address) {
      doc.text(`Dirección: ${settings.contact_address}`, 105, yPos, { align: "center" })
      yPos += 5
    }

    // Separator line
    doc.setLineWidth(0.5)
    doc.line(20, yPos + 5, 190, yPos + 5)

    // Order information
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("RECIBO DE COMPRA", 105, yPos + 15, { align: "center" })

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Número de Pedido: ${order.order_number}`, 20, yPos + 25)
    doc.text(`Fecha: ${formatDate(order.created_at)}`, 20, yPos + 32)
    doc.text(`Estado: ${getStatusBadge(order.status).props.children[1]}`, 20, yPos + 39)
    doc.text(`Método de Pago: ${getPaymentMethodLabel(order.payment_method)}`, 20, yPos + 46)
    doc.text(`Estado de Pago: ${order.payment_status === 'paid' ? 'Pagado' : order.payment_status === 'pending' ? 'Pendiente' : order.payment_status}`, 20, yPos + 53)

    // Customer information
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("Información del Cliente:", 20, yPos + 60)

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Nombre: ${order.billing_info.firstName} ${order.billing_info.lastName}`, 20, yPos + 67)
    doc.text(`Email: ${order.billing_info.email}`, 20, yPos + 74)

    if (order.billing_info.phone) {
      doc.text(`Teléfono: ${order.billing_info.phone}`, 20, yPos + 81)
    }

    if (order.billing_info.address) {
      doc.text(`Dirección: ${order.billing_info.address}`, 20, yPos + 88)
      if (order.billing_info.city && order.billing_info.postalCode) {
        doc.text(`${order.billing_info.city} ${order.billing_info.postalCode}`, 20, yPos + 95)
      }
    }

    // Products table
    const tableStartY = order.billing_info.address ? yPos + 105 : yPos + 90

    const columns = ["Producto", "Cantidad", "Precio Unit.", "Total"]
    const rows = order.order_items.map(item => [
      item.product_name,
      item.quantity.toString(),
      formatPrice(item.price),
      formatPrice(item.price * item.quantity)
    ])

    autoTable(doc, {
      startY: tableStartY,
      head: [columns],
      body: rows,
      theme: "grid",
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: "bold"
      },
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'right' }
      }
    })

    // Total
    const finalY = (doc as any).lastAutoTable.finalY || tableStartY + 50
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text(`TOTAL: ${formatPrice(order.total)}`, 170, finalY + 10, { align: "right" })

    // Footer
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.text("Este documento no tiene validez fiscal", 105, 280, { align: "center" })
    doc.text("Sistema desarrollado por NUVEM Software", 105, 286, { align: "center" })

    doc.save(`Recibo_${storeName}_${order.order_number}.pdf`)
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
                          <div className="mt-4 flex justify-end">
                            <CyberButton
                              variant="outline"
                              size="sm"
                              onClick={() => printReceipt(selectedOrder)}
                            >
                              Descargar Recibo
                            </CyberButton>
                          </div>
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