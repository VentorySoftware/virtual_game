import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CyberButton } from '@/components/ui/cyber-button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'

interface OrderWithRelations {
  id: string
  order_number: string
  status: string
  payment_status: string
  total: number
  subtotal: number
  created_at: string
  updated_at: string
  billing_info: any
  customer_notes: string | null
  admin_notes: string | null
  delivered_at: string | null
  cancelled_at: string | null
  cancellation_reason: string | null
  user_id: string
  profiles?: {
    first_name: string | null
    last_name: string | null
    email: string | null
    phone: string | null
  } | null
  order_items: Array<{
    id: string
    product_name: string
    quantity: number
    price: number
    digital_content: string | null
  }>
}

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [order, setOrder] = useState<OrderWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [cancellationReason, setCancellationReason] = useState('')

  useEffect(() => {
    if (id) {
      fetchOrder()
    }
  }, [id])

  const fetchOrder = async () => {
    console.log('🔍 Fetching order with ID:', id)
    try {
      setLoading(true)
      
      // First fetch the order data
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('id', id)
        .single()

      if (orderError) throw orderError

      // Then fetch the profile data separately
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, email, phone')
        .eq('user_id', orderData.user_id)
        .single()

      // Combine the data
      const combinedData = {
        ...orderData,
        profiles: profileError ? null : profileData
      }

      console.log('📦 Order data received:', combinedData)
      
      setOrder(combinedData)
      setCancellationReason(combinedData.cancellation_reason || '')
    } catch (error) {
      console.error('💥 Error fetching order:', error)
      toast({
        title: "Error",
        description: "No se pudo cargar el pedido",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (newStatus: string, additionalFields: any = {}) => {
    if (!order) return

    try {
      setUpdating(true)
      
      const updateData: any = {
        status: newStatus,
        ...additionalFields
      }

      if (newStatus === 'delivered') {
        updateData.delivered_at = new Date().toISOString()
      } else if (newStatus === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString()
        updateData.cancellation_reason = cancellationReason
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', order.id)

      if (error) throw error

      toast({
        title: "Éxito",
        description: "Estado del pedido actualizado correctamente",
      })

      fetchOrder() // Refresh order data
    } catch (error) {
      console.error('Error updating order:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del pedido",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const openWhatsApp = () => {
    // Check phone in profiles first, then in billing_info as fallback
    let phone = order?.profiles?.phone
    if (!phone || phone.trim() === '') {
      phone = order?.billing_info?.phone
    }
    
    if (!phone || phone.trim() === '') {
      toast({
        title: "Error",
        description: "No hay número de teléfono registrado para este cliente",
        variant: "destructive",
      })
      return
    }

    const cleanPhone = phone.replace(/\D/g, '') // Remove non-numeric characters
    if (cleanPhone.length === 0) {
      toast({
        title: "Error",
        description: "El número de teléfono no es válido",
        variant: "destructive",
      })
      return
    }

    const message = `Hola! Te escribo sobre tu pedido #${order.order_number}. ¿En qué puedo ayudarte?`
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    
    window.open(whatsappUrl, '_blank')
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Borrador', variant: 'secondary' as const },
      pending: { label: 'Pendiente de pago', variant: 'destructive' as const },
      verified: { label: 'Verificado', variant: 'default' as const },
      paid: { label: 'Pagado', variant: 'default' as const },
      delivered: { label: 'Entregado', variant: 'default' as const },
      cancelled: { label: 'Cancelado', variant: 'destructive' as const },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'secondary' as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getActionButtons = () => {
    if (!order) return null

    const buttons = []

    // Status flow buttons
    if (order.status === 'pending') {
      buttons.push(
        <CyberButton
          key="verify"
          onClick={() => updateOrderStatus('verified')}
          disabled={updating}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Verificado
        </CyberButton>
      )
    } else if (order.status === 'verified') {
      buttons.push(
        <CyberButton
          key="paid"
          onClick={() => updateOrderStatus('paid')}
          disabled={updating}
          className="bg-green-600 hover:bg-green-700"
        >
          Pagado
        </CyberButton>
      )
    } else if (order.status === 'paid') {
      buttons.push(
        <CyberButton
          key="delivered"
          onClick={() => updateOrderStatus('delivered')}
          disabled={updating}
          className="bg-purple-600 hover:bg-purple-700"
        >
          Entregado
        </CyberButton>
      )
    }

    // Cancel button (available except for cancelled or delivered orders)
    if (order.status !== 'cancelled' && order.status !== 'delivered') {
      buttons.push(
        <CyberButton
          key="cancel"
          variant="outline"
          onClick={() => updateOrderStatus('cancelled')}
          disabled={updating}
          className="border-red-500 text-red-500 hover:bg-red-500/20"
        >
          Desestimar
        </CyberButton>
      )
    }

    return buttons
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Cargando pedido...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Pedido no encontrado</h2>
          <Button onClick={() => navigate('/admin/orders')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a pedidos
          </Button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate('/admin/orders')} variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Pedido #{order.order_number}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span>Estado actual:</span>
                {getStatusBadge(order.status)}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* WhatsApp Button */}
            <CyberButton
              variant="outline"
              onClick={openWhatsApp}
              className="bg-green-600/20 border-green-600 hover:bg-green-600/30"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Enviar WhatsApp a cliente
            </CyberButton>
            
            {/* Action Buttons */}
            {getActionButtons()}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary */}
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle>Resumen del Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-primary mb-3">Información General</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Número:</strong> #{order.order_number}</p>
                      <p><strong>Fecha:</strong> {formatDate(order.created_at)}</p>
                      <p><strong>Total:</strong> {formatPrice(Number(order.total))}</p>
                      <p><strong>Estado de pago:</strong> {order.payment_status}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-primary mb-3">Fechas Importantes</h4>
                    <div className="space-y-2 text-sm">
                      {order.delivered_at && (
                        <p><strong>Fecha de entrega:</strong> {formatDate(order.delivered_at)}</p>
                      )}
                      {order.cancelled_at && (
                        <p><strong>Fecha de cancelación:</strong> {formatDate(order.cancelled_at)}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle>Productos ({order.order_items.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border border-primary/20 rounded-lg bg-card/30">
                      <div className="flex-1">
                        <h4 className="font-semibold">{item.product_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Cantidad: {item.quantity} × {formatPrice(Number(item.price))}
                        </p>
                        {item.digital_content && (
                          <p className="text-xs text-primary mt-1">Contenido digital disponible</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          {formatPrice(Number(item.price) * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t border-primary/30 pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-lg">Total del Pedido:</span>
                      <span className="text-2xl font-bold text-primary">
                        {formatPrice(Number(order.total))}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cancellation Reason - Show for non-cancelled/non-delivered orders */}
            {order.status !== 'cancelled' && order.status !== 'delivered' && (
              <Card className="cyber-card border-orange-500/50">
                <CardHeader>
                  <CardTitle className="text-orange-500">Motivo de Cancelación</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Ingresa el motivo antes de cancelar</label>
                      <Textarea
                        value={cancellationReason}
                        onChange={(e) => setCancellationReason(e.target.value)}
                        placeholder="Ingresa el motivo de la cancelación..."
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cancellation Reason - Show for cancelled orders */}
            {order.status === 'cancelled' && (
              <Card className="cyber-card border-destructive/50">
                <CardHeader>
                  <CardTitle className="text-destructive">Información de Cancelación</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Motivo de cancelación</label>
                      <Textarea
                        value={cancellationReason}
                        onChange={(e) => setCancellationReason(e.target.value)}
                        placeholder="Ingresa el motivo de la cancelación..."
                        className="min-h-[100px]"
                      />
                      <Button
                        onClick={() => updateOrderStatus('cancelled')}
                        disabled={updating}
                        className="mt-2"
                        size="sm"
                      >
                        Actualizar motivo
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Customer Info */}
          <div className="space-y-6">
            {/* Customer Information */}
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle>Información del Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <p><strong>Email:</strong> {order.profiles?.email || order.billing_info?.email || 'N/A'}</p>
                  {order.profiles?.first_name && (
                    <p><strong>Nombre:</strong> {order.profiles.first_name} {order.profiles.last_name}</p>
                  )}
                  {order.profiles?.phone && (
                    <p><strong>Teléfono:</strong> {order.profiles.phone}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Billing Information */}
            {order.billing_info && Object.keys(order.billing_info).length > 0 && (
              <Card className="cyber-card">
                <CardHeader>
                  <CardTitle>Información de Facturación</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {Object.entries(order.billing_info).map(([key, value]) => (
                      <p key={key} className="capitalize">
                        <strong>{key.replace(/_/g, ' ')}:</strong> {String(value) || 'N/A'}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle>Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.customer_notes && (
                    <div>
                      <h5 className="font-medium text-sm text-primary">Notas del cliente:</h5>
                      <p className="text-sm text-muted-foreground mt-1">{order.customer_notes}</p>
                    </div>
                  )}
                  
                  {order.admin_notes && (
                    <div>
                      <h5 className="font-medium text-sm text-primary">Notas del administrador:</h5>
                      <p className="text-sm text-muted-foreground mt-1">{order.admin_notes}</p>
                    </div>
                  )}
                  
                  {!order.customer_notes && !order.admin_notes && (
                    <p className="text-sm text-muted-foreground">No hay notas disponibles</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default OrderDetail