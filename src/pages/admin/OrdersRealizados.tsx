import { useState, useEffect, useMemo } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { Search, Eye, Package, Filter, FileText, FileSpreadsheet, ArrowUp, ArrowDown } from "lucide-react"
import AdminLayout from "@/components/admin/AdminLayout"
import PackProducts from "@/components/admin/PackProducts"
import { CyberButton } from "@/components/ui/cyber-button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import { useNotifications } from "@/hooks/useNotifications"
import { useToast } from "@/hooks/use-toast"

interface OrderWithRelations {
  id: string
  order_number: string
  total: number
  status: 'paid' | 'delivered' | 'cancelled' | 'pending' | 'verifying' | 'draft'
  payment_status: string
  payment_method: string | null
  balance: number | null
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
  }>
}

const OrdersRealizados = () => {
  const { user } = useAuth()
  const notifications = useNotifications()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [orders, setOrders] = useState<OrderWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Sorting state
  const [sortBy, setSortBy] = useState<'order_number' | 'created_at' | 'total' | 'status'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Export state
  const [isExporting, setIsExporting] = useState(false)

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
      console.log('User is admin:', data)
      setIsAdmin(data)
      if (data) {
        console.log('Calling fetchOrders...')
        await fetchOrders()
      } else {
        console.log('User is not admin, skipping fetchOrders')
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
          order_items!order_id(id, product_name, quantity, price, product_id),
          billing_info
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      console.log('Fetched all orders:', data)
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
      notifications.error('Error al cargar los pedidos: ' + error.message)
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
      paid: { label: 'Pagado', class: 'bg-green-500/20 text-green-400 border-green-500/30' },
      delivered: { label: 'Entregado', class: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
      cancelled: { label: 'Cancelado', class: 'bg-red-500/20 text-red-400 border-red-500/30' },
      pending: { label: 'Pendiente de Pago', class: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
      verifying: { label: 'Verificando', class: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      draft: { label: 'Pendiente', class: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
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
      const headers = ['Número de Pedido', 'Fecha', 'Cliente', 'Estado', 'Total', 'Método de Pago', 'Saldo']
      const csvData = filteredOrders.map(order => [
        order.order_number,
        formatDate(order.created_at),
        order.profiles?.email || order.billing_info?.email || 'N/A',
        order.status,
        formatPrice(Number(order.total)),
        order.payment_method || 'N/A',
        order.balance !== null ? formatPrice(order.balance) : 'N/A'
      ])

      const csvContent = [headers, ...csvData]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `pedidos_realizados_${new Date().toISOString().split('T')[0]}.csv`
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

  // Modal functions
  const openOrderDetails = (order: OrderWithRelations) => {
    console.log('🚀 Navigating to order detail from OrdersRealizados:', order.id)
    navigate(`/admin/orders/${order.id}`)
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
  }, [searchTerm, statusFilter])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="animate-cyber-pulse text-primary">Cargando pedidos realizados...</div>
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
            Pedidos Realizados
          </h1>
          <p className="text-muted-foreground">
            Visualiza y consulta el estado de las ventas realizadas
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
                    {isExporting ? 'Exportando...' : 'Exportar CSV'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={exportToCSV}
                    disabled={isExporting}
                    className="cyber-border"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    {isExporting ? 'Exportando...' : 'Exportar Excel'}
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
                    <SelectItem value="paid">Pagado</SelectItem>
                    <SelectItem value="delivered">Entregado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                    <SelectItem value="pending">Pendiente de Pago</SelectItem>
                    <SelectItem value="verifying">Verificando</SelectItem>
                    <SelectItem value="draft">Pendiente</SelectItem>
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
              Lista de Pedidos Realizados
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
                          Estado
                        </TableHead>
                        <TableHead className="w-[140px] min-w-[140px]">
                          Método de Pago
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
                        <TableHead className="w-[120px] min-w-[120px]">
                          Saldo
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
                          <TableCell>
                            {order.payment_method || 'N/A'}
                          </TableCell>
                          <TableCell className="text-right font-medium font-mono">
                            {formatPrice(Number(order.total))}
                          </TableCell>
                          <TableCell>
                            {order.balance !== null ? formatPrice(order.balance) : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col sm:flex-row gap-2">
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

      </div>
    </AdminLayout>
  )
}

export default OrdersRealizados
