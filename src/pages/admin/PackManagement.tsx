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
    return products.filter(p => p.platform_id === platformId)
  }, [platformId, products])

  useEffect(() => {
    fetchPacks()
  }, [])

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
      const { data, error } = await supabase
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

      if (error) throw error
      setPacks(data || [])
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

    try {
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
          })
          .eq("id", packId)

        if (error) throw error

        // Update bundle items: delete old and insert new
        await supabase.from("bundle_items").delete().eq("bundle_id", packId)

        const newItems = Array.from(selectedProductIds).map(product_id => ({
          bundle_id: packId,
          product_id,
          quantity: 1,
        }))

        if (newItems.length > 0) {
          const { error: insertError } = await supabase.from("bundle_items").insert(newItems)
          if (insertError) throw insertError
        }
      } else {
        // Insert new pack
        const { data, error } = await supabase
          .from("product_bundles")
          .insert([{
            name,
            description,
            is_active: isActive,
            valid_until: validUntil || null,
            platform_id: platformId,
            discount_percentage: discountPercentage,
          }])
          .select()
          .single()

        if (error) throw error

        packId = data.id

        const newItems = Array.from(selectedProductIds).map(product_id => ({
          bundle_id: packId,
          product_id,
          quantity: 1,
        }))

        if (newItems.length > 0) {
          const { error: insertError } = await supabase.from("bundle_items").insert(newItems)
          if (insertError) throw insertError
        }
      }

      notifications.success("Pack guardado correctamente")
      setIsDialogOpen(false)
      setSelectedPack(null)
      fetchPacks()
    } catch (error) {
      notifications.error("Error al guardar el pack")
      console.error(error)
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-orbitron neon-text">Gestión de packs</h1>
          <p className="text-muted-foreground">Administra los packs de productos, crea, edita y limita su visibilidad.</p>
        </div>

        <CyberButton onClick={() => { setSelectedPack(null); setIsDialogOpen(true); }}>
          Nuevo pack
        </CyberButton>

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
                        <CyberButton size="sm" variant="outline" onClick={() => { setSelectedPack(pack); setIsDialogOpen(true); }}>
                          Editar
                        </CyberButton>
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
              <div className="space-y-4">
                <input
                  placeholder="Nombre del pack"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="cyber-input w-full"
                />
                <input
                  placeholder="Descripción del pack"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="cyber-input w-full"
                />
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={e => setIsActive(e.target.checked)}
                    />
                    <span>Activo</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <span>Fecha de vigencia:</span>
                    <input
                      type="date"
                      value={validUntil || ""}
                      onChange={e => setValidUntil(e.target.value)}
                      className="cyber-input"
                    />
                  </label>
                </div>
                <Select value={platformId} onValueChange={setPlatformId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una plataforma" />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map(platform => (
                      <SelectItem key={platform.id} value={platform.id}>
                        {platform.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div>
                  <p className="font-semibold mb-2">Productos disponibles</p>
                  <div className="max-h-48 overflow-y-auto border border-primary rounded p-2 space-y-1">
                    {filteredProducts.length === 0 && <p className="text-muted-foreground">Selecciona una plataforma para ver productos</p>}
                    {filteredProducts.map(product => (
                      <label key={product.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.has(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
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
                  className="cyber-input w-full"
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); setSelectedPack(null); }}>
                    Cancelar
                  </Button>
                  <Button type="submit">
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
