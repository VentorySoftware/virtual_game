import { useState, useMemo } from "react"
import { useProducts } from "@/hooks/useProducts"
import { useCategories } from "@/hooks/useCategories"
import { usePlatforms } from "@/hooks/usePlatforms"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import ProductCard from "@/components/products/ProductCard"
import { Badge } from "@/components/ui/badge"
import { CyberButton } from "@/components/ui/cyber-button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  SlidersHorizontal,
  X
} from "lucide-react"

type SortOption = 'newest' | 'oldest' | 'price-low' | 'price-high' | 'rating' | 'popular'

const Catalog = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)
  
  const { products, loading } = useProducts()
  const { categories } = useCategories()
  const { platforms } = usePlatforms()

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.category?.name.toLowerCase().includes(query) ||
        product.platform?.name.toLowerCase().includes(query)
      )
    }

    // Category filter
    if (selectedCategory && selectedCategory !== "all") {
      filtered = filtered.filter(product => 
        product.category?.slug === selectedCategory
      )
    }

    // Platform filter
    if (selectedPlatform && selectedPlatform !== "all") {
      filtered = filtered.filter(product => 
        product.platform?.slug === selectedPlatform
      )
    }

    // Type filter
    if (selectedType && selectedType !== "all") {
      filtered = filtered.filter(product => product.type === selectedType)
    }

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'price-low':
          return a.price - b.price
        case 'price-high':
          return b.price - a.price
        case 'rating':
          return b.rating - a.rating
        case 'popular':
          return b.total_reviews - a.total_reviews
        default:
          return 0
      }
    })

    return filtered
  }, [products, searchQuery, selectedCategory, selectedPlatform, selectedType, sortBy])

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory("all")
    setSelectedPlatform("all")
    setSelectedType("all")
    setSortBy('newest')
  }

  const hasActiveFilters = searchQuery || selectedCategory !== "all" || selectedPlatform !== "all" || selectedType !== "all" || sortBy !== 'newest'

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
      
      <main className="container py-8 space-y-6">
        {/* Page Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold font-orbitron">
            <span className="neon-text">Catálogo</span>{" "}
            <span className="text-primary">Completo</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Explora nuestra colección completa de juegos digitales
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="cyber-card">
          <CardContent className="p-6 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar juegos por título, género, plataforma..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 cyber-border"
              />
            </div>

            {/* Mobile Filters Toggle */}
            <div className="flex items-center justify-between lg:hidden">
              <CyberButton
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </CyberButton>
              
              <div className="flex items-center gap-2">
                <CyberButton
                  variant={viewMode === "grid" ? "cyber" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="w-4 h-4" />
                </CyberButton>
                <CyberButton
                  variant={viewMode === "list" ? "cyber" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </CyberButton>
              </div>
            </div>

            {/* Filters */}
            <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 ${showFilters || window.innerWidth >= 1024 ? 'block' : 'hidden lg:grid'}`}>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="cyber-border">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.slug}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger className="cyber-border">
                  <SelectValue placeholder="Plataforma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las plataformas</SelectItem>
                  {platforms.map((platform) => (
                    <SelectItem key={platform.id} value={platform.slug}>
                      {platform.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="cyber-border">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="digital">Digital</SelectItem>
                  <SelectItem value="preorder">Pre-orden</SelectItem>
                  <SelectItem value="bundle">Pack/Bundle</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger className="cyber-border">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Más reciente</SelectItem>
                  <SelectItem value="oldest">Más antiguo</SelectItem>
                  <SelectItem value="price-low">Precio: menor a mayor</SelectItem>
                  <SelectItem value="price-high">Precio: mayor a menor</SelectItem>
                  <SelectItem value="rating">Mejor calificados</SelectItem>
                  <SelectItem value="popular">Más populares</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active Filters and Clear */}
            {hasActiveFilters && (
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {searchQuery && (
                    <Badge variant="secondary" className="gap-1">
                      Búsqueda: {searchQuery}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery("")} />
                    </Badge>
                  )}
                  {selectedCategory && selectedCategory !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      {categories.find(c => c.slug === selectedCategory)?.name}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCategory("all")} />
                    </Badge>
                  )}
                  {selectedPlatform && selectedPlatform !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      {platforms.find(p => p.slug === selectedPlatform)?.name}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedPlatform("all")} />
                    </Badge>
                  )}
                  {selectedType && selectedType !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      {selectedType === 'preorder' ? 'Pre-orden' : selectedType === 'bundle' ? 'Pack' : 'Digital'}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedType("all")} />
                    </Badge>
                  )}
                </div>
                
                <CyberButton variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Limpiar filtros
                </CyberButton>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold font-orbitron">
              Resultados <span className="text-primary">({filteredAndSortedProducts.length})</span>
            </h2>
            <p className="text-muted-foreground">
              {filteredAndSortedProducts.length === 0 
                ? "No se encontraron productos"
                : `${filteredAndSortedProducts.length} producto${filteredAndSortedProducts.length !== 1 ? 's' : ''} encontrado${filteredAndSortedProducts.length !== 1 ? 's' : ''}`
              }
            </p>
          </div>

          {/* Desktop View Toggle */}
          <div className="hidden lg:flex items-center gap-2">
            <CyberButton
              variant={viewMode === "grid" ? "cyber" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="w-4 h-4" />
            </CyberButton>
            <CyberButton
              variant={viewMode === "list" ? "cyber" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </CyberButton>
          </div>
        </div>

        {/* Products Grid */}
        {filteredAndSortedProducts.length > 0 ? (
          <div className={`grid gap-6 ${
            viewMode === "grid" 
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
              : "grid-cols-1 gap-4"
          }`}>
            {filteredAndSortedProducts.map((product) => (
              <ProductCard key={product.id} product={product} showAddToCart={true} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 space-y-4">
            <Search className="w-16 h-16 mx-auto text-muted-foreground" />
            <h3 className="text-xl font-semibold">No se encontraron productos</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              No hay productos que coincidan con los filtros aplicados. 
              Intenta ajustar los criterios de búsqueda.
            </p>
            <CyberButton onClick={clearFilters}>
              Limpiar filtros
            </CyberButton>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

export default Catalog