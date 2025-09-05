import { Badge } from "@/components/ui/badge"
import { CyberButton } from "@/components/ui/cyber-button"
import { Gamepad2, Monitor, Smartphone, Clock } from "lucide-react"
import platformsImage from "@/assets/gaming-platforms.jpg"

const categories = [
  {
    id: 1,
    name: "PlayStation",
    icon: Gamepad2,
    count: "1,250+ juegos",
    color: "text-primary",
    bgColor: "bg-primary/10",
    description: "PS4 • PS5 • Exclusivos"
  },
  {
    id: 2,
    name: "Xbox",
    icon: Monitor,
    count: "980+ juegos", 
    color: "text-secondary",
    bgColor: "bg-secondary/10",
    description: "Xbox One • Series X/S"
  },
  {
    id: 3,
    name: "Nintendo",
    icon: Gamepad2,
    count: "750+ juegos",
    color: "text-accent",
    bgColor: "bg-accent/10", 
    description: "Switch • Exclusivos"
  },
  {
    id: 4,
    name: "PC Gaming",
    icon: Monitor,
    count: "2,500+ juegos",
    color: "text-primary",
    bgColor: "bg-primary/10",
    description: "Steam • Epic • Origin"
  },
  {
    id: 5,
    name: "Mobile",
    icon: Smartphone,
    count: "500+ juegos",
    color: "text-secondary", 
    bgColor: "bg-secondary/10",
    description: "iOS • Android • Premium"
  },
  {
    id: 6,
    name: "Retro Games",
    icon: Clock,
    count: "300+ juegos",
    color: "text-accent",
    bgColor: "bg-accent/10",
    description: "PS3 • Clásicos • Nostalgia"
  }
]

const CategoriesSection = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 grid-pattern opacity-5" />
      
      <div className="container">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <Badge variant="outline" className="border-secondary text-secondary bg-secondary/10">
            Plataformas Disponibles
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold font-orbitron">
            <span className="neon-text">Todas las</span>{" "}
            <span className="text-secondary">Plataformas</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Encuentra los mejores juegos para tu plataforma favorita. 
            Desde los últimos lanzamientos hasta los clásicos retro.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {categories.map((category) => {
            const IconComponent = category.icon
            return (
              <div 
                key={category.id}
                className="cyber-card group cursor-pointer hover:shadow-glow-primary transition-all duration-300"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-lg ${category.bgColor} transition-colors duration-300`}>
                      <IconComponent className={`w-6 h-6 ${category.color}`} />
                    </div>
                    <Badge 
                      variant="outline" 
                      className="border-primary/30 text-primary animate-pulse"
                    >
                      {category.count}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold font-orbitron group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  </div>

                  <CyberButton 
                    variant="outline" 
                    className="w-full group-hover:variant-primary"
                    size="sm"
                  >
                    Explorar Catálogo
                  </CyberButton>
                </div>
              </div>
            )
          })}
        </div>

        {/* Featured Platforms Banner */}
        <div className="relative rounded-2xl overflow-hidden cyber-border">
          <img 
            src={platformsImage} 
            alt="Gaming Platforms" 
            className="w-full h-64 object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-cyber opacity-70" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-6">
              <h3 className="text-2xl md:text-4xl font-bold font-orbitron text-white">
                Compatibilidad Total
              </h3>
              <p className="text-lg text-white/80 max-w-lg">
                Juegos verificados y compatibles con todas las plataformas más populares
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Badge className="bg-white/20 text-white border-white/30">PlayStation</Badge>
                <Badge className="bg-white/20 text-white border-white/30">Xbox</Badge>
                <Badge className="bg-white/20 text-white border-white/30">Nintendo</Badge>
                <Badge className="bg-white/20 text-white border-white/30">PC</Badge>
                <Badge className="bg-white/20 text-white border-white/30">Mobile</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CategoriesSection