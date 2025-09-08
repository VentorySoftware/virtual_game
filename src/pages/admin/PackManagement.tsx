import { useState, useEffect, useMemo } from "react"
import AdminLayout from "@/components/admin/AdminLayout"
import { CyberButton } from "@/components/ui/cyber-button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Calendar } from "lucide-react"
import { usePlatforms } from "@/hooks/usePlatforms"
import { useProducts } from "@/hooks/useProducts"
import { supabase } from "@/integrations/supabase/client"
import { useNotifications } from "@/hooks/useNotifications"
import { format } from "date-fns"

interface Product {
  id: string
  title: string
  description: string
  price: number
  platform: {
    id: string
    name: string
    slug: string
  }
}

interface Pack {
  id: string
  name: string
  description: string
  is_active: boolean
  valid_until: string | null
  platform_id: string
  discount_percentage: number
  bundle_items: Array<{
    id: string
    product_id: string
    product: Product
  }>
  created_at: string
}

const PackManagement = () => {
  const notifications = useNotifications()
  const { platforms } = usePlatforms()
  const { products } = useProducts()

  const [packs, setPacks] = useState<Pack[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [packToDelete, setPackToDelete] = useState<Pack | null>(null)

  // Form state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [validUntil, setValidUntil] = useState<string | null>(null)
  const [platformId, setPlatformId] = useState<string>("")
  const [discountPercentage, setDiscountPercentage] = useState<number>(0)
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set())

  // Filter products by selected platform
  const filteredProducts = useMemo(() => {
    if (!platformId) return []
    return products.filter(p => p.platform.id === platformId)
  }, [platformId, products])

  useEffect(() => {
    fetchPacks()
  }, [filter])

  useEffect(() => {
    if (selectedPack) {
      setName(selectedPack.name)
      setDescription(selectedPack.description)
      setIsActive(selectedPack.is_active)
      setValidUntil(selectedPack.valid_until ? selectedPack.valid_until.split("T")[0] : null)
      setPlatformId(selectedPack.platform_id)
      setDiscountPercentage(selectedPack.discount_percentage)
      setSelectedProductIds(new Set(selectedPack.bundle_items.map(item => item.product_id)))
    } else {
      resetForm()
    }
  }, [selectedPack])

  const resetForm = () => {
    setName("")
    setDescription("")
    setIsActive(true)
    setValidUntil(null)
    setPlatformId("")
    setDiscountPercentage(0)
    setSelectedProductIds(new Set())
  }

  const fetchPacks = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from("product_bundles")
        .select(`
          id,
          name,
          description,
          is_active,
          valid_until,
          platform_id,
          discount_percentage,
          created_at,
          bundle_items:bundle_items(
            id,
            product_id,
            product:products(
              id,
              title,
              description,
              price,
              platform:platforms(
                id,
                name,
                slug
              )
            )
          )
        `)
        .order("created_at", { ascending: false })

      if (filter === 'active') {
        query = query.eq('is_active', true)
      } else if (filter === 'inactive') {
        query = query.eq('is_active', false)
      }

      const { data, error } = await query

      if (error) throw error
      
      // Transform data to match Pack interface
      const transformedPacks = (data || []).map(pack => ({
        ...pack,
        bundle_items: (pack.bundle_items || []).map((item: any) => ({
          ...item,
          product: Array.isArray(item.product) ? item.product[0] : item.product
        }))
      }))
      
      setPacks(transformedPacks as any)
    } catch (error) {
      notifications.error("Error al cargar los packs")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const savePack = async () => {
    if (!name || !platformId) {
      notifications.error("El nombre y la plataforma son obligatorios")
      return
    }

    if (selectedProductIds.size === 0) {
      notifications.error("Debe seleccionar al menos un producto")
      return
    }

    try {
      // Get product prices from database to ensure accuracy
      const { data: selectedProductsData, error: productsError } = await supabase
        .from("products")
        .select("id, price")
        .in("id", Array.from(selectedProductIds))

      if (productsError) {
        console.error("Error fetching product prices:", productsError)
        throw productsError
      }

      // Calculate total price from database data (sum of product prices without discount)
      const totalPrice = selectedProductsData.reduce((sum, product) => {
        // Quantity is always 1 as per current logic
        return sum + product.price
      }, 0)

      // Calculate bundle price applying discount on total price
      const bundlePrice = Math.round(totalPrice * (1 - discountPercentage / 100))

      console.log("Price calculation:", {
        selectedProducts: selectedProductsData.length,
        totalPrice,
        discountPercentage,
        bundlePrice
      })

      // Additional validation logs
      if (totalPrice <= 0) {
        console.warn("Warning: totalPrice is zero or negative, check product prices and selection.")
      }
      if (bundlePrice < 0) {
        console.warn("Warning: bundlePrice is negative, check discountPercentage value.")
      }

      let packId = selectedPack?.id

      if (packId) {
        // Update existing pack
        const { error } = await supabase
          .from("product_bundles")
          .update({
            name,
            description,
            is_active: isActive,
            valid_until: validUntil || null,
            platform_id: platformId,
            discount_percentage: discountPercentage,
            bundle_price: bundlePrice,
            original_total: totalPrice,
          })
          .eq("id", packId)

        if (error) {
          console.error("Error updating pack:", error)
          throw error
        }

        // Update bundle items: delete old and insert new
        await supabase.from("bundle_items").delete().eq("bundle_id", packId)

        const newItems = Array.from(selectedProductIds).map(product_id => ({
          bundle_id: packId,
          product_id,
          quantity: 1,
        }))

        if (newItems.length > 0) {
          const { error: insertError } = await supabase.from("bundle_items").insert(newItems)
          if (insertError) {
            console.error("Error inserting bundle items:", insertError)
            throw insertError
          }
        }
      } else {
        // Insert new pack
        const packData = {
          name,
          description,
          is_active: isActive,
          valid_until: validUntil || null,
          platform_id: platformId,
          discount_percentage: discountPercentage,
          bundle_price: bundlePrice,
          original_total: totalPrice,
        }

        console.log("Inserting pack with data:", packData)

        const { data, error } = await supabase
          .from("product_bundles")
          .insert([packData])
          .select()
          .single()

        if (error) {
          console.error("Error inserting pack:", error)
          throw error
        }

        packId = data.id
        console.log("Pack created with ID:", packId)

        const newItems = Array.from(selectedProductIds).map(product_id => ({
          bundle_id: packId,
          product_id,
          quantity: 1,
        }))

        if (newItems.length > 0) {
          console.log("Inserting bundle items:", newItems)
          const { error: insertError } = await supabase.from("bundle_items").insert(newItems)
          if (insertError) {
            console.error("Error inserting bundle items:", insertError)
            throw insertError
          }
        }
      }

      notifications.success("Pack guardado correctamente")
      setIsDialogOpen(false)
      setSelectedPack(null)
      fetchPacks()
    } catch (error: any) {
      console.error("Full error details:", error)
      notifications.error(`Error al guardar el pack: ${error.message || 'Error desconocido'}`)
    }
  }

  const toggleProductSelection = (productId: string) => {
    const newSet = new Set(selectedProductIds)
    if (newSet.has(productId)) {
      newSet.delete(productId)
    } else {
      newSet.add(productId)
    }
    setSelectedProductIds(newSet)
  }

  const deletePack = async (pack: Pack) => {
    try {
      await supabase.from("product_bundles").delete().eq("id", pack.id)
      notifications.success("Pack eliminado correctamente")
      fetchPacks()
    } catch (error) {
      notifications.error("Error al eliminar el pack")
    }
    setPackToDelete(null)
  }

  const toggleVisibility = async (pack: Pack) => {
    try {
      const { error } = await supabase
        .from("product_bundles")
        .update({ is_active: !pack.is_active })
        .eq("id", pack.id)
      if (error) throw error
      notifications.success("Visibilidad actualizada")
      fetchPacks()
    } catch (error) {
      notifications.error("Error al actualizar visibilidad")
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-orbitron neon-text">Gestión de packs</h1>
          <p className="text-muted-foreground">Administra los packs de productos, crea, edita y limita su visibilidad.</p>
        </div>

        <div className="flex justify-between items-center">
          <CyberButton onClick={() => { setSelectedPack(null); setIsDialogOpen(true); }}>
            Nuevo pack
          </CyberButton>

          <Select value={filter} onValueChange={(value: 'all' | 'active' | 'inactive') => setFilter(value)}>
            <SelectTrigger className="w-48 border border-border bg-input text-foreground rounded-md">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent className="bg-background text-foreground">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="cyber-card">
          <CardHeader>
            <CardTitle>Packs existentes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Cargando packs...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Plataforma</TableHead>
                    <TableHead>Vigencia</TableHead>
                    <TableHead>Activo</TableHead>
                    <TableHead>Descuento %</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packs.map(pack => (
                    <TableRow key={pack.id}>
                      <TableCell>{pack.name}</TableCell>
                      <TableCell>{pack.description}</TableCell>
                      <TableCell>{platforms.find(p => p.id === pack.platform_id)?.name || "N/A"}</TableCell>
                      <TableCell>{pack.valid_until ? format(new Date(pack.valid_until), "dd/MM/yyyy") : "Sin límite"}</TableCell>
                      <TableCell>{pack.is_active ? "Sí" : "No"}</TableCell>
                      <TableCell>{pack.discount_percentage}%</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <CyberButton size="sm" variant="outline" onClick={() => { setSelectedPack(pack); setIsDialogOpen(true); }}>
                            Editar
                          </CyberButton>
                          <CyberButton size="sm" variant="outline" onClick={() => toggleVisibility(pack)}>
                            {pack.is_active ? "Ocultar" : "Mostrar"}
                          </CyberButton>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                Eliminar
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Esto eliminará permanentemente el pack "{pack.name}".
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deletePack(pack)}>
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto cyber-card">
            <DialogHeader>
              <DialogTitle>{selectedPack ? "Editar pack" : "Nuevo pack"}</DialogTitle>
              <DialogDescription>Completa los campos para guardar el pack</DialogDescription>
            </DialogHeader>

            <form onSubmit={e => { e.preventDefault(); savePack(); }}>
              <div className="space-y-4 p-6 bg-background border border-border rounded-lg shadow-lg">
                <input
                  placeholder="Nombre del pack"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  placeholder="Descripción del pack"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="flex items-center space-x-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={e => setIsActive(e.target.checked)}
                      className="form-checkbox h-5 w-5 text-primary"
                    />
                    <span className="text-foreground">Activo</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <span className="text-foreground">Fecha de vigencia:</span>
                    <input
                      type="date"
                      value={validUntil || ""}
                      onChange={e => setValidUntil(e.target.value)}
                      className="px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </label>
                </div>
                <Select value={platformId} onValueChange={setPlatformId} required>
                  <SelectTrigger className="border border-border bg-input text-foreground rounded-md">
                    <SelectValue placeholder="Selecciona una plataforma" />
                  </SelectTrigger>
                  <SelectContent className="bg-background text-foreground">
                    {platforms.map(platform => (
                      <SelectItem key={platform.id} value={platform.id} className="hover:bg-primary hover:text-background">
                        {platform.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div>
                  <p className="font-semibold mb-2 text-foreground">Productos disponibles</p>
                  <div className="max-h-48 overflow-y-auto border border-border rounded p-2 space-y-1 bg-input text-foreground">
                    {filteredProducts.length === 0 && <p className="text-muted-foreground">Selecciona una plataforma para ver productos</p>}
                    {filteredProducts.map(product => (
                      <label key={product.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.has(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                          className="form-checkbox h-4 w-4 text-primary"
                        />
                        <div>
                          <p className="font-semibold">{product.title}</p>
                          <p className="text-xs text-muted-foreground">{product.description}</p>
                          <p className="text-xs font-mono">${product.price.toLocaleString('es-AR')}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="Porcentaje de descuento"
                  value={discountPercentage}
                  onChange={e => setDiscountPercentage(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); setSelectedPack(null); }}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-primary text-background hover:bg-primary/90">
                    Guardar
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}

export default PackManagement
