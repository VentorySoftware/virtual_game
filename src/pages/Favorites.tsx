import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { Product } from "@/types/database"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import ProductCard from "@/components/products/ProductCard"
import { CyberButton } from "@/components/ui/cyber-button"
import { Heart, ArrowLeft } from "lucide-react"

const Favorites = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [favoriteProducts, setFavoriteProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate('/auth')
      return
    }
    fetchFavorites()
  }, [user, navigate])

  const fetchFavorites = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('user_favorites')
        .select(`
          product_id,
          products (
            *,
            category:categories(*),
            platform:platforms(*)
          )
        `)
        .eq('user_id', user.id)

      if (error) throw error

      const products = data
        .map(item => item.products)
        .filter((product): product is any => product !== null)

      setFavoriteProducts(products)
    } catch (error) {
      console.error('Error fetching favorites:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Header />
      
      <main className="container py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm">
          <CyberButton variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver
          </CyberButton>
          <span className="text-muted-foreground">/</span>
          <span>Mis Favoritos</span>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-8 h-8 text-red-500 fill-red-500" />
          <div>
            <h1 className="text-3xl font-bold font-orbitron">Mis Favoritos</h1>
            <p className="text-muted-foreground">
              {favoriteProducts.length} {favoriteProducts.length === 1 ? 'juego favorito' : 'juegos favoritos'}
            </p>
          </div>
        </div>

        {/* Content */}
        {favoriteProducts.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No tienes favoritos aún</h2>
            <p className="text-muted-foreground mb-6">
              Explora nuestro catálogo y marca tus juegos favoritos con el corazón
            </p>
            <CyberButton onClick={() => navigate('/catalog')}>
              Explorar Catálogo
            </CyberButton>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favoriteProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

export default Favorites