import { useState } from "react"
import { useCategories } from "@/hooks/useCategories"
import { usePlatforms } from "@/hooks/usePlatforms"
import { useProductsByCategory } from "@/hooks/useProducts"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import ProductCard from "@/components/products/ProductCard"
import { Badge } from "@/components/ui/badge"
import { CyberButton } from "@/components/ui/cyber-button"
import { Card } from "@/components/ui/card"
import { Gamepad2, Filter, Grid, List } from "lucide-react"

const Categories = () => {
  const { categories, loading: categoriesLoading } = useCategories()
  const { platforms, loading: platformsLoading } = usePlatforms()
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const { products, loading: productsLoading } = useProductsByCategory(selectedCategory, 12)

  if (categoriesLoading || platformsLoading) {
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
      
      <main className="container py-8 space-y-8">
        {/* Page Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Gamepad2 className="w-6 h-6 text-primary" />
            <Badge variant="outline" className="border-primary text-primary">
              Catálogo Completo
            </Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-orbitron">
            <span className="neon-text">Explora</span>{" "}
            <span className="text-primary">Categorías</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Encuentra tu próxima aventura navegando por nuestras categorías especializadas
          </p>
        </div>

        {/* Categories Grid */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold font-orbitron text-center">
            Navegar por <span className="text-secondary">Género</span>
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Card 
              className={`cyber-card p-4 text-center cursor-pointer transition-all hover:shadow-glow-primary ${
                selectedCategory === "" ? "border-primary shadow-glow-primary" : ""
              }`}
              onClick={() => setSelectedCategory("")}
            >
              <div className="space-y-2">
                <Gamepad2 className="w-8 h-8 mx-auto text-primary" />
                <h3 className="font-semibold">Todos</h3>
                <p className="text-xs text-muted-foreground">Ver todo</p>
              </div>
            </Card>

            {categories.map((category) => (
              <Card 
                key={category.id}
                className={`cyber-card p-4 text-center cursor-pointer transition-all hover:shadow-glow-primary ${
                  selectedCategory === category.slug ? "border-primary shadow-glow-primary" : ""
                }`}
                onClick={() => setSelectedCategory(category.slug)}
              >
                <div className="space-y-2">
                  <div className="w-8 h-8 mx-auto bg-primary/20 rounded-lg flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">
                      {category.name.charAt(0)}
                    </span>
                  </div>
                  <h3 className="font-semibold">{category.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {category.description || "Juegos épicos"}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Platforms */}
        {/* Section removed to hide platform badges as requested */}

        {/* Products Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-orbitron">
              {selectedCategory ? (
                <>Juegos de <span className="text-primary capitalize">{selectedCategory}</span></>
              ) : (
                <>Todos los <span className="text-primary">Juegos</span></>
              )}
            </h2>

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

          {productsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className={`grid gap-6 ${
              viewMode === "grid" 
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                : "grid-cols-1 gap-4"
            }`}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {products.length === 0 && !productsLoading && (
            <div className="text-center py-12 space-y-4">
              <Gamepad2 className="w-16 h-16 mx-auto text-muted-foreground" />
              <h3 className="text-xl font-semibold">No hay productos disponibles</h3>
              <p className="text-muted-foreground">
                {selectedCategory 
                  ? `No hay juegos disponibles en la categoría "${selectedCategory}"`
                  : "No hay productos disponibles en este momento"
                }
              </p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default Categories