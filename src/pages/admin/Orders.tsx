import { useState, useEffect, useMemo } from "react"
import { Navigate } from "react-router-dom"
import { Search, Eye, Package, Calendar, Filter, Download, ArrowUpDown, ArrowUp, ArrowDown, FileText, FileSpreadsheet } from "lucide-react"
import AdminLayout from "@/components/admin/AdminLayout"
import { CyberButton } from "@/components/ui/cyber-button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import { useNotifications } from "@/hooks/useNotifications"
import { useCategories } from "@/hooks/useCategories"
import { usePlatforms } from "@/hooks/usePlatforms"
import { useProducts } from "@/hooks/useProducts"
import { useToast } from "@/hooks/use-toast"

interface OrderWithRelations {
  id: string
  order_number: string
  total: number
  status: 'draft' | 'paid' | 'verifying' | 'delivered' | 'cancelled' | 'pending'
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
    product_id: string | null
    product?: {
      category_id: string | null
      platform_id: string | null
    } | null
  }>
  categories: Array<{
    id: string
    name: string
  }>
  platforms: Array<{
    id: string
    name: string
  }>
}

const OrdersAdmin = () => {
  const { user } = useAuth()
  const notifications = useNotifications()
  const { categories } = useCategories()
  const { platforms } = usePlatforms()
  const { products } = useProducts()
  const { toast } = useToast()

  const [users, setUsers] = useState([])
  const [orders, setOrders] = useState<OrderWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [productFilter, setProductFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [platformFilter, setPlatformFilter] = useState("all")
  const [userFilter, setUserFilter] = useState("all")

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Sorting state
  const [sortBy, setSortBy] = useState<'order_number' | 'created_at' | 'total' | 'status'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Modal state
  const [selectedOrder, setSelectedOrder] = useState<OrderWithRelations | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Export state
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    if (user) {
      checkAdminStatus()
    }
  }, [user])

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase.from('profiles').select('id, email, first_name, last_name')
      setUsers(data || [])
    }
    fetchUsers()
  }, [])

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
          order_items(id, product_name, quantity, price, product_id, product:products(category_id, platform_id)),
          categories: order_items!inner.product!inner.categories (id, name),
          platforms: order_items!inner.product!inner.platforms (id, name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders((data || []) as unknown as OrderWithRelations[])
    } catch (error) {
      console.error('Error fetching orders:', error)
      notifications.error('Error al cargar los pedidos: ' + error.message)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: 'draft' | 'paid' | 'verifying' | 'delivered' | 'cancelled' | 'pending') => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (error) throw error

      await fetchOrders()
    } catch (error) {
      console.error('Error updating order status:', error)
      notifications.error('Error al actualizar el estado del pedido')
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

  const getStatusLabel = (status: string) => {
    const statusMap = {
      draft: 'Pendiente',
      paid: 'Pagado',
      verifying: 'Verificando',
      delivered: 'Entregado',
      cancelled: 'Cancelado',
      pending: 'Pendiente de Pago',
    }
    return statusMap[status as keyof typeof statusMap] || 'Pendiente'
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: 'Pendiente', class: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      paid: { label: 'Pagado', class: 'bg-green-500/20 text-green-400 border-green-500/30' },
      verifying: { label: 'Verificando', class: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      delivered: { label: 'Entregado', class: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
      cancelled: { label: 'Cancelado', class: 'bg-red-500/20 text-red-400 border-red-500/30' },
      pending: { label: 'Pendiente de Pago', class: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
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

    const matchesProduct = productFilter === "all" || order.order_items.some(item => item.product_id === productFilter)

    const matchesCategory = categoryFilter === "all" || order.order_items.some(item => item.product?.category_id === categoryFilter)

    const matchesPlatform = platformFilter === "all" || order.order_items.some(item => item.product?.platform_id === platformFilter)

    const matchesUser = userFilter === "all" || order.user_id === userFilter

    return matchesSearch && matchesStatus && matchesProduct && matchesCategory && matchesPlatform && matchesUser
  })

  // Sorting function
  const handleSort = (column: 'order_number' | 'created_at' | 'total' | 'status') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
    setCurrentPage(1) // Reset to first page when sorting
  }

  // Export functions
  const exportToCSV = () => {
    setIsExporting(true)
    try {
      const headers = ['Número de Pedido', 'Fecha', 'Cliente', 'Estado', 'Total', 'Productos']
      const csvData = filteredOrders.map(order => [
        order.order_number,
        formatDate(order.created_at),
        order.profiles?.email || order.billing_info?.email || 'N/A',
        getStatusLabel(order.status),
        formatPrice(Number(order.total)),
        order.order_items.map(item => `${item.product_name} (x${item.quantity})`).join('; ')
      ])

      const csvContent = [headers, ...csvData]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `pedidos_${new Date().toISOString().split('T')[0]}.csv`
      link.click()

      toast({
        title: "Exportación exitosa",
        description: "Los datos se han exportado a CSV correctamente.",
      })
    } catch (error) {
      toast({
        title: "Error en exportación",
        description: "Hubo un error al exportar los datos.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const exportToExcel = () => {
    setIsExporting(true)
    try {
      // For Excel export, we'll use CSV format as well since it's simpler
      // In a real application, you might want to use a library like xlsx
      exportToCSV()
    } catch (error) {
      toast({
        title: "Error en exportación",
        description: "Hubo un error al exportar los datos.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  // Modal functions
  const openOrderDetails = (order: OrderWithRelations) => {
    setSelectedOrder(order)
    setIsModalOpen(true)
  }

  const closeOrderDetails = () => {
    setIsModalOpen(false)
    setSelectedOrder(null)
  }

  // Sorted and paginated orders
  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'order_number':
          aValue = a.order_number
          bValue = b.order_number
          break
        case 'created_at':
          aValue = new Date(a.created_at)
          bValue = new Date(b.created_at)
          break
        case 'total':
          aValue = Number(a.total)
          bValue = Number(b.total)
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredOrders, sortBy, sortOrder])

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return sortedOrders.slice(startIndex, startIndex + pageSize)
  }, [sortedOrders, currentPage, pageSize])

  const totalPages = Math.ceil(sortedOrders.length / pageSize)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, productFilter, categoryFilter, platformFilter, userFilter])

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
            <div className="space-y-4">
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
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={exportToCSV}
                    disabled={isExporting}
                    className="cyber-border"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {isExporting ? 'Exportando...' : 'CSV'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={exportToExcel}
                    disabled={isExporting}
                    className="cyber-border"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    {isExporting ? 'Exportando...' : 'Excel'}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full cyber-border">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="draft">Pendiente</SelectItem>
                    <SelectItem value="pending">Pendiente de Pago</SelectItem>
                    <SelectItem value="paid">Pagado</SelectItem>
                    <SelectItem value="verifying">Verificando</SelectItem>
                    <SelectItem value="delivered">Entregado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={productFilter} onValueChange={setProductFilter}>
                  <SelectTrigger className="w-full cyber-border">
                    <SelectValue placeholder="Producto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los productos</SelectItem>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full cyber-border">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                  <SelectTrigger className="w-full cyber-border">
                    <SelectValue placeholder="Plataforma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las plataformas</SelectItem>
                    {platforms.map((platform) => (
                      <SelectItem key={platform.id} value={platform.name}>
                        {platform.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="w-full cyber-border">
                    <SelectValue placeholder="Usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los usuarios</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
                  <SelectTrigger className="w-full cyber-border">
                    <SelectValue placeholder="Por página" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 por página</SelectItem>
                    <SelectItem value="10">10 por página</SelectItem>
                    <SelectItem value="20">20 por página</SelectItem>
                    <SelectItem value="50">50 por página</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table View */}
        <Card className="cyber-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Lista de Pedidos
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              {filteredOrders.length === 0
                ? (searchTerm || statusFilter !== "all" ? 'No se encontraron pedidos con los filtros aplicados' : 'Aún no hay pedidos registrados')
                : `Mostrando ${paginatedOrders.length} de ${filteredOrders.length} pedidos`
              }
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <Package className="h-16 w-16 text-muted-foreground" />
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">No se encontraron pedidos</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || statusFilter !== "all" ? 'Intenta con otros filtros' : 'Aún no hay pedidos registrados'}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-primary/20">
                        <TableHead className="w-[120px] min-w-[120px]">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('order_number')}
                            className="h-auto p-0 font-medium hover:bg-transparent text-left"
                          >
                            Número
                            {sortBy === 'order_number' && (
                              sortOrder === 'asc' ? <ArrowUp className="h-4 w-4 ml-1 inline" /> : <ArrowDown className="h-4 w-4 ml-1 inline" />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead className="w-[140px] min-w-[140px]">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('created_at')}
                            className="h-auto p-0 font-medium hover:bg-transparent text-left"
                          >
                            Fecha
                            {sortBy === 'created_at' && (
                              sortOrder === 'asc' ? <ArrowUp className="h-4 w-4 ml-1 inline" /> : <ArrowDown className="h-4 w-4 ml-1 inline" />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead className="min-w-[200px] hidden md:table-cell">
                          Cliente
                        </TableHead>
                        <TableHead className="w-[120px] min-w-[120px]">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('status')}
                            className="h-auto p-0 font-medium hover:bg-transparent text-left"
                          >
                            Estado
                            {sortBy === 'status' && (
                              sortOrder === 'asc' ? <ArrowUp className="h-4 w-4 ml-1 inline" /> : <ArrowDown className="h-4 w-4 ml-1 inline" />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead className="w-[120px] min-w-[120px] text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('total')}
                            className="h-auto p-0 font-medium hover:bg-transparent"
                          >
                            Total
                            {sortBy === 'total' && (
                              sortOrder === 'asc' ? <ArrowUp className="h-4 w-4 ml-1 inline" /> : <ArrowDown className="h-4 w-4 ml-1 inline" />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead className="w-[200px] min-w-[200px]">
                          Acciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedOrders.map((order) => (
                        <TableRow key={order.id} className="hover:bg-muted/50 border-b border-primary/10">
                          <TableCell className="font-medium font-mono">
                            #{order.order_number}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{formatDate(order.created_at).split(',')[0]}</span>
                              <span className="text-xs text-muted-foreground">{formatDate(order.created_at).split(',')[1]}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {order.profiles?.first_name && order.profiles?.last_name
                                  ? `${order.profiles.first_name} ${order.profiles.last_name}`
                                  : order.profiles?.email || order.billing_info?.email || 'N/A'
                                }
                              </span>
                              <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                                {order.profiles?.email || order.billing_info?.email}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(order.status)}
                          </TableCell>
                          <TableCell className="text-right font-medium font-mono">
                            {formatPrice(Number(order.total))}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Select
                                value={order.status}
                                onValueChange={(value) => updateOrderStatus(order.id, value as any)}
                              >
                                <SelectTrigger className="w-full sm:w-32 h-8 text-xs cyber-border">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="draft">Pendiente</SelectItem>
                                  <SelectItem value="pending">Pendiente de Pago</SelectItem>
                                  <SelectItem value="paid">Pagado</SelectItem>
                                  <SelectItem value="verifying">Verificando</SelectItem>
                                  <SelectItem value="delivered">Entregado</SelectItem>
                                  <SelectItem value="cancelled">Cancelado</SelectItem>
                                </SelectContent>
                              </Select>
                              <CyberButton
                                variant="outline"
                                size="sm"
                                onClick={() => openOrderDetails(order)}
                                className="h-8 text-xs"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Ver
                              </CyberButton>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="border-t border-primary/20 p-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-muted-foreground">
                        Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, sortedOrders.length)} de {sortedOrders.length} pedidos
                      </div>
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                              className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const pageNumber = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                            return (
                              <PaginationItem key={pageNumber}>
                                <PaginationLink
                                  onClick={() => setCurrentPage(pageNumber)}
                                  isActive={currentPage === pageNumber}
                                  className="cursor-pointer"
                                >
                                  {pageNumber}
                                </PaginationLink>
                              </PaginationItem>
                            )
                          })}
                          <PaginationItem>
                            <PaginationNext
                              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                              className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Order Details Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto cyber-card">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <span>Detalles del Pedido #{selectedOrder?.order_number}</span>
                {selectedOrder && getStatusBadge(selectedOrder.status)}
              </DialogTitle>
              <DialogDescription>
                Información completa del pedido
              </DialogDescription>
            </DialogHeader>

            {selectedOrder && (
              <div className="space-y-8">
                {/* Order Summary */}
                <Card className="cyber-card">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold border-b border-primary/30 pb-2 mb-4">
                      Resumen del Pedido
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <section>
                        <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v7m-4-4h8" />
                          </svg>
                          Información del Cliente
                        </h4>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <p><strong>Email:</strong> {selectedOrder.profiles?.email || selectedOrder.billing_info?.email || 'N/A'}</p>
                          {selectedOrder.profiles?.first_name && (
                            <p><strong>Nombre:</strong> {selectedOrder.profiles.first_name} {selectedOrder.profiles.last_name}</p>
                          )}
                          <p><strong>Fecha:</strong> {formatDate(selectedOrder.created_at)}</p>
                        </div>
                      </section>
                      <section>
                        <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m-6-8h6" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20v-8m0 0l-4 4m4-4l4 4" />
                          </svg>
                          Información del Pedido
                        </h4>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <p><strong>Número:</strong> #{selectedOrder.order_number}</p>
                          <p><strong>Estado:</strong> {getStatusBadge(selectedOrder.status)}</p>
                          <p><strong>Total:</strong> {formatPrice(Number(selectedOrder.total))}</p>
                          <p><strong>Productos:</strong> {selectedOrder.order_items.length}</p>
                        </div>
                      </section>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Items */}
                <Card className="cyber-card">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold border-b border-primary/30 pb-2 mb-4">
                      Productos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {selectedOrder.order_items.map((item) => (
                        <div key={item.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border border-primary/20 rounded-lg bg-card/30">
                          <div className="flex-1">
                            <h4 className="font-semibold text-primary">{item.product_name}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Cantidad: {item.quantity} × {formatPrice(Number(item.price))}
                            </p>
                          </div>
                          <div className="text-right mt-3 md:mt-0">
                            <p className="font-bold neon-text text-lg">
                              {formatPrice(Number(item.price) * item.quantity)}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div className="border-t border-primary/30 pt-4 mt-4">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-primary text-lg">Total del Pedido:</span>
                          <span className="text-2xl font-extrabold neon-text">
                            {formatPrice(Number(selectedOrder.total))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Billing Information */}
                {selectedOrder.billing_info && (
                  <Card className="cyber-card">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold border-b border-primary/30 pb-2 mb-4">
                        Información de Facturación
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-muted-foreground">
                        {Object.entries(selectedOrder.billing_info).map(([key, value]) => (
                          <div key={key} className="capitalize">
                            <strong>{key.replace(/_/g, ' ')}:</strong> {String(value) || 'N/A'}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}

export default OrdersAdmin