import { useState, useEffect } from "react"
import { Navigate } from "react-router-dom"
import { Search, Eye, Package, Calendar, Filter } from "lucide-react"
import AdminLayout from "@/components/admin/AdminLayout"
import { CyberButton } from "@/components/ui/cyber-button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"

interface OrderWithRelations {
  id: string
  order_number: string
  total: number
  status: 'draft' | 'paid' | 'verifying' | 'delivered' | 'cancelled'
  payment_status: string
  created_at: string
  billing_info: any
  user_id: string
  profiles?: {
    email: string
    first_name: string
    last_name: string
  } | null
  order_items: Array<{
    id: string
    product_name: string
    quantity: number
    price: number
  }>
}

const OrdersAdmin = () => {
  const { user } = useAuth()
  const [orders, setOrders] = useState<OrderWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    if (user) {
      checkAdminStatus()
    }
  }, [user])

  const checkAdminStatus = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase.rpc('is_admin', { _user_id: user.id })
      
      if (error) throw error
      
      setIsAdmin(data)
      
      if (data) {
        await fetchOrders()
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles(email, first_name, last_name),
          order_items(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders((data || []) as unknown as OrderWithRelations[])
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: 'draft' | 'paid' | 'verifying' | 'delivered' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (error) throw error
      
      await fetchOrders()
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Error al actualizar el estado del pedido')
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
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: 'Pendiente', class: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      paid: { label: 'Pagado', class: 'bg-green-500/20 text-green-400 border-green-500/30' },
      verifying: { label: 'Verificando', class: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      delivered: { label: 'Entregado', class: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
      cancelled: { label: 'Cancelado', class: 'bg-red-500/20 text-red-400 border-red-500/30' },
    }
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.draft
    return (
      <Badge className={statusInfo.class}>
        {statusInfo.label}
      </Badge>
    )
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.billing_info?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="animate-cyber-pulse text-primary">Cargando pedidos...</div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-orbitron neon-text">
            Gestión de Pedidos
          </h1>
          <p className="text-muted-foreground">
            Administra y rastrea todos los pedidos
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="cyber-card">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número de pedido o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 cyber-border"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 cyber-border">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="draft">Pendiente</SelectItem>
                  <SelectItem value="paid">Pagado</SelectItem>
                  <SelectItem value="verifying">Verificando</SelectItem>
                  <SelectItem value="delivered">Entregado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <Card className="cyber-card">
            <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
              <Package className="h-16 w-16 text-muted-foreground" />
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">No se encontraron pedidos</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== "all" ? 'Intenta con otros filtros' : 'Aún no hay pedidos registrados'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="cyber-card hover:shadow-glow-primary transition-all">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Order Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-lg">#{order.order_number}</h3>
                        {getStatusBadge(order.status)}
                      </div>
                      
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(order.created_at)}</span>
                        </div>
                        <p>
                          Cliente: {order.profiles?.email || order.billing_info?.email || 'Email no disponible'}
                        </p>
                        {order.profiles?.first_name && (
                          <p>
                            Nombre: {order.profiles.first_name} {order.profiles.last_name}
                          </p>
                        )}
                        <p>
                          {order.order_items.length} producto(s) - Total: {' '}
                          <span className="font-bold neon-text">
                            {formatPrice(Number(order.total))}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Select 
                        value={order.status} 
                        onValueChange={(value) => updateOrderStatus(order.id, value as any)}
                      >
                        <SelectTrigger className="w-full sm:w-36 cyber-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Pendiente</SelectItem>
                          <SelectItem value="paid">Pagado</SelectItem>
                          <SelectItem value="verifying">Verificando</SelectItem>
                          <SelectItem value="delivered">Entregado</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <CyberButton variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalles
                      </CyberButton>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="mt-4 pt-4 border-t border-primary/20">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                      {order.order_items.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex justify-between bg-card/30 px-3 py-2 rounded border border-primary/10">
                          <span className="truncate">{item.product_name}</span>
                          <span className="text-muted-foreground">x{item.quantity}</span>
                        </div>
                      ))}
                      {order.order_items.length > 3 && (
                        <div className="flex items-center justify-center bg-card/30 px-3 py-2 rounded border border-primary/10 text-muted-foreground">
                          +{order.order_items.length - 3} más
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default OrdersAdmin