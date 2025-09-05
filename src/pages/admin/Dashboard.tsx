import { useState, useEffect } from "react"
import { Navigate } from "react-router-dom"
import { 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  DollarSign,
  Clock,
  Eye
} from "lucide-react"
import AdminLayout from "@/components/admin/AdminLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"

interface DashboardStats {
  totalProducts: number
  totalOrders: number
  totalUsers: number
  totalRevenue: number
  recentOrders: Array<{
    id: string
    order_number: string
    total: number
    status: string
    created_at: string
    billing_info: any
  }>
}

const Dashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    recentOrders: []
  })
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

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
        await fetchDashboardStats()
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  const fetchDashboardStats = async () => {
    try {
      // Fetch products count
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })

      // Fetch orders count and revenue
      const { data: ordersData } = await supabase
        .from('orders')
        .select('total')
      
      // Fetch users count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // Fetch recent orders
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      const totalRevenue = ordersData?.reduce((sum, order) => sum + Number(order.total), 0) || 0

      setStats({
        totalProducts: productsCount || 0,
        totalOrders: ordersData?.length || 0,
        totalUsers: usersCount || 0,
        totalRevenue,
        recentOrders: recentOrders || []
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="animate-cyber-pulse text-primary">Verificando permisos...</div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-orbitron neon-text">
            Panel de Administración
          </h1>
          <p className="text-muted-foreground">
            Bienvenido al centro de control de VirtualGame
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="cyber-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold neon-text">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                Productos activos en catálogo
              </p>
            </CardContent>
          </Card>

          <Card className="cyber-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pedidos</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold neon-text">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                Pedidos procesados
              </p>
            </CardContent>
          </Card>

          <Card className="cyber-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold neon-text">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Usuarios registrados
              </p>
            </CardContent>
          </Card>

          <Card className="cyber-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold neon-text">
                {formatPrice(stats.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                Revenue acumulado
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card className="cyber-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pedidos Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No hay pedidos recientes
              </p>
            ) : (
              <div className="space-y-4">
                {stats.recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-primary/20 bg-card/30"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">#{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.billing_info?.email || 'Email no disponible'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-bold neon-text">
                        {formatPrice(Number(order.total))}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded ${
                        order.status === 'paid' 
                          ? 'bg-green-500/20 text-green-400'
                          : order.status === 'draft'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {order.status === 'draft' ? 'Pendiente' : 
                         order.status === 'paid' ? 'Pagado' : order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="cyber-card cursor-pointer hover:shadow-glow-primary transition-all">
            <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
              <Package className="h-12 w-12 text-primary" />
              <div className="text-center">
                <h3 className="font-semibold">Gestionar Productos</h3>
                <p className="text-sm text-muted-foreground">
                  Agregar, editar y eliminar productos
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="cyber-card cursor-pointer hover:shadow-glow-primary transition-all">
            <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
              <ShoppingCart className="h-12 w-12 text-primary" />
              <div className="text-center">
                <h3 className="font-semibold">Ver Pedidos</h3>
                <p className="text-sm text-muted-foreground">
                  Revisar y gestionar pedidos
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="cyber-card cursor-pointer hover:shadow-glow-primary transition-all">
            <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
              <Users className="h-12 w-12 text-primary" />
              <div className="text-center">
                <h3 className="font-semibold">Gestionar Usuarios</h3>
                <p className="text-sm text-muted-foreground">
                  Administrar usuarios y roles
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

export default Dashboard