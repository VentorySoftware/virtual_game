import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Skeleton } from '@/components/ui/skeleton'

interface PackProduct {
  id: string
  product_name: string
  quantity: number
  price: number
}

interface PackProductsProps {
  packId: string
}

const PackProducts = ({ packId }: PackProductsProps) => {
  const [products, setProducts] = useState<PackProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPackProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        // Query bundle_items table with product details
        const { data, error } = await supabase
          .from('bundle_items')
          .select(`
            id,
            quantity,
            product:products(
              id,
              title,
              description,
              price
            )
          `)
          .eq('bundle_id', packId)

        if (error) throw error

        // Transform the data to match our interface
        const transformedProducts = (data || []).map(item => ({
          id: item.id,
          product_name: item.product?.title || 'Producto desconocido',
          quantity: item.quantity,
          price: item.product?.price || 0
        }))

        setProducts(transformedProducts)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading pack products')
      } finally {
        setLoading(false)
      }
    }

    fetchPackProducts()
  }, [packId])

  if (loading) {
    return <Skeleton className="h-20 w-full" />
  }

  if (error) {
    return <div className="text-red-500 text-sm">Error cargando productos del pack: {error}</div>
  }

  if (products.length === 0) {
    return <div className="text-sm text-muted-foreground">No hay productos en este pack.</div>
  }

  return (
    <div className="mt-2 ml-4 border-l border-primary/30 pl-4">
      <h5 className="font-semibold mb-2">Productos del Pack:</h5>
      <ul className="list-disc list-inside text-sm">
        {products.map((product) => (
          <li key={product.id}>
            {product.product_name} - Cantidad: {product.quantity} - Precio: ${product.price.toFixed(2)}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default PackProducts
