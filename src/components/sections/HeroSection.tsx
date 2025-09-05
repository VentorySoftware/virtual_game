import { CyberButton } from "@/components/ui/cyber-button"
import { Badge } from "@/components/ui/badge"
import { Play, Zap, Star } from "lucide-react"
import heroImage from "@/assets/hero-gaming.jpg"

const HeroSection = () => {
  return (
    <section className="relative min-h-[80vh] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Cyberpunk Gaming Setup" 
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-dark opacity-80" />
        <div className="absolute inset-0 grid-pattern opacity-20" />
      </div>

      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-glow rounded-full blur-3xl opacity-30 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-secondary rounded-full blur-3xl opacity-20 animate-pulse delay-1000" />

      {/* Content */}
      <div className="relative container grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-20">
        <div className="space-y-8">
          {/* Badge */}
          <Badge variant="outline" className="border-primary text-primary bg-primary/10 animate-neon-flicker">
            <Zap className="w-4 h-4 mr-2" />
            Entrega Inmediata
          </Badge>

          {/* Main title */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-orbitron leading-tight">
              <span className="neon-text">Virtual</span>
              <br />
              <span className="text-secondary">Game</span>
              <br />
              <span className="text-accent">Store</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-rajdhani">
              Los mejores juegos digitales al mejor precio
              <br />
              <span className="text-primary">Compra segura • Entrega inmediata</span>
            </p>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-8 text-center lg:text-left">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-primary font-orbitron">5000+</div>
              <div className="text-sm text-muted-foreground">Juegos</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-secondary font-orbitron">24/7</div>
              <div className="text-sm text-muted-foreground">Soporte</div>
            </div>
            <div className="space-y-1 flex items-center gap-1">
              <Star className="w-5 h-5 text-accent fill-accent" />
              <div>
                <div className="text-2xl font-bold text-accent font-orbitron">4.9</div>
                <div className="text-sm text-muted-foreground">Rating</div>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <CyberButton variant="cyber" size="xl" className="group">
              <Play className="w-5 h-5 mr-2 group-hover:animate-pulse" />
              Explorar Catálogo
            </CyberButton>
            <CyberButton variant="neon" size="xl">
              Ver Pre-órdenes
            </CyberButton>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8">
            <div className="text-center space-y-2 p-4 cyber-card">
              <div className="text-primary text-2xl">🎮</div>
              <div className="text-sm font-medium">Todas las Plataformas</div>
            </div>
            <div className="text-center space-y-2 p-4 cyber-card">
              <div className="text-secondary text-2xl">⚡</div>
              <div className="text-sm font-medium">Entrega Inmediata</div>
            </div>
            <div className="text-center space-y-2 p-4 cyber-card">
              <div className="text-accent text-2xl">🔒</div>
              <div className="text-sm font-medium">Compra Segura</div>
            </div>
            <div className="text-center space-y-2 p-4 cyber-card">
              <div className="text-primary text-2xl">💎</div>
              <div className="text-sm font-medium">Mejor Precio</div>
            </div>
          </div>
        </div>

        {/* Right side - Featured game or promotional content */}
        <div className="hidden lg:block relative">
          <div className="cyber-card p-8 space-y-6 animate-cyber-pulse">
            <Badge className="bg-accent text-accent-foreground">Destacado</Badge>
            <h3 className="text-2xl font-bold font-orbitron">Cyberpunk 2077</h3>
            <p className="text-muted-foreground">
              Experimenta Night City como nunca antes. Edición completa con todas las expansiones.
            </p>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-3xl font-bold text-primary font-orbitron">$15.999</span>
                <span className="text-sm text-muted-foreground line-through ml-2">$25.999</span>
              </div>
              <Badge className="bg-destructive text-destructive-foreground">-40%</Badge>
            </div>
            <CyberButton className="w-full" variant="secondary">
              Comprar Ahora
            </CyberButton>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection