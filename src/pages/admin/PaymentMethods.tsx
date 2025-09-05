import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Eye, EyeOff, GripVertical, CreditCard, Building2, Smartphone } from "lucide-react"
import AdminLayout from "@/components/admin/AdminLayout"
import { CyberButton } from "@/components/ui/cyber-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface PaymentMethod {
  id: string
  name: string
  code: string
  description: string
  is_active: boolean
  display_order: number
  icon_name: string
  configuration: any
  created_at: string
  updated_at: string
}

const iconOptions = [
  { value: 'CreditCard', label: 'Tarjeta de Crédito', icon: CreditCard },
  { value: 'Building2', label: 'Banco', icon: Building2 },
  { value: 'Smartphone', label: 'Móvil', icon: Smartphone },
]

const PaymentMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    is_active: true,
    display_order: 0,
    icon_name: 'CreditCard',
    configuration: '{}'
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchPaymentMethods()
  }, [])

  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      setPaymentMethods(data || [])
    } catch (error) {
      console.error('Error fetching payment methods:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los medios de pago",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      is_active: true,
      display_order: paymentMethods.length,
      icon_name: 'CreditCard',
      configuration: '{}'
    })
    setEditingMethod(null)
  }

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method)
    setFormData({
      name: method.name,
      code: method.code,
      description: method.description || '',
      is_active: method.is_active,
      display_order: method.display_order,
      icon_name: method.icon_name || 'CreditCard',
      configuration: JSON.stringify(method.configuration || {}, null, 2)
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let configuration = {}
      try {
        configuration = JSON.parse(formData.configuration)
      } catch (error) {
        throw new Error('La configuración JSON no es válida')
      }

      const methodData = {
        name: formData.name,
        code: formData.code,
        description: formData.description,
        is_active: formData.is_active,
        display_order: formData.display_order,
        icon_name: formData.icon_name,
        configuration
      }

      if (editingMethod) {
        const { error } = await supabase
          .from('payment_methods')
          .update(methodData)
          .eq('id', editingMethod.id)

        if (error) throw error

        toast({
          title: "Éxito",
          description: "Medio de pago actualizado correctamente",
        })
      } else {
        const { error } = await supabase
          .from('payment_methods')
          .insert([methodData])

        if (error) throw error

        toast({
          title: "Éxito",
          description: "Medio de pago creado correctamente",
        })
      }

      setIsDialogOpen(false)
      resetForm()
      fetchPaymentMethods()
    } catch (error: any) {
      console.error('Error saving payment method:', error)
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el medio de pago",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este medio de pago?')) return

    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Éxito",
        description: "Medio de pago eliminado correctamente",
      })
      fetchPaymentMethods()
    } catch (error) {
      console.error('Error deleting payment method:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el medio de pago",
        variant: "destructive",
      })
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Éxito",
        description: `Medio de pago ${!currentStatus ? 'activado' : 'desactivado'} correctamente`,
      })
      fetchPaymentMethods()
    } catch (error) {
      console.error('Error toggling payment method:', error)
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del medio de pago",
        variant: "destructive",
      })
    }
  }

  const getIcon = (iconName: string) => {
    const iconOption = iconOptions.find(option => option.value === iconName)
    return iconOption ? iconOption.icon : CreditCard
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold font-orbitron neon-text">
              Medios de Pago
            </h1>
            <p className="text-muted-foreground">
              Gestiona los métodos de pago disponibles para los clientes
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <CyberButton onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Medio de Pago
              </CyberButton>
            </DialogTrigger>
            <DialogContent className="max-w-2xl cyber-card">
              <DialogHeader>
                <DialogTitle className="font-orbitron">
                  {editingMethod ? 'Editar' : 'Agregar'} Medio de Pago
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="cyber-border"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Código *</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                      className="cyber-border"
                      placeholder="ej: stripe, paypal"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="cyber-border"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="icon">Icono</Label>
                    <Select value={formData.icon_name} onValueChange={(value) => setFormData(prev => ({ ...prev, icon_name: value }))}>
                      <SelectTrigger className="cyber-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {iconOptions.map((option) => {
                          const Icon = option.icon
                          return (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {option.label}
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="display_order">Orden de visualización</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                      className="cyber-border"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="configuration">Configuración (JSON)</Label>
                  <Textarea
                    id="configuration"
                    value={formData.configuration}
                    onChange={(e) => setFormData(prev => ({ ...prev, configuration: e.target.value }))}
                    className="cyber-border font-mono text-sm"
                    rows={4}
                    placeholder='{"key": "value"}'
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Activo</Label>
                </div>

                <div className="flex justify-end space-x-2">
                  <CyberButton 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </CyberButton>
                  <CyberButton type="submit" disabled={loading}>
                    {loading ? 'Guardando...' : (editingMethod ? 'Actualizar' : 'Crear')}
                  </CyberButton>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando medios de pago...</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {paymentMethods.map((method) => {
              const Icon = getIcon(method.icon_name)
              return (
                <Card key={method.id} className="cyber-card">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="font-orbitron flex items-center gap-2">
                            {method.name}
                            <Badge variant={method.is_active ? "default" : "secondary"}>
                              {method.is_active ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Código: {method.code} • Orden: {method.display_order}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CyberButton
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleActive(method.id, method.is_active)}
                        >
                          {method.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </CyberButton>
                        <CyberButton
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(method)}
                        >
                          <Edit className="h-4 w-4" />
                        </CyberButton>
                        <CyberButton
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(method.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </CyberButton>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {method.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {method.description}
                      </p>
                    )}
                    
                    {Object.keys(method.configuration || {}).length > 0 && (
                      <div className="bg-card/30 rounded p-3">
                        <h4 className="text-xs font-semibold text-muted-foreground mb-2">CONFIGURACIÓN</h4>
                        <pre className="text-xs overflow-auto">
                          {JSON.stringify(method.configuration, null, 2)}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}

            {paymentMethods.length === 0 && (
              <Card className="cyber-card">
                <CardContent className="text-center py-12">
                  <CreditCard className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No hay medios de pago configurados</h3>
                  <p className="text-muted-foreground mb-6">
                    Agrega medios de pago para que los clientes puedan realizar compras
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default PaymentMethods