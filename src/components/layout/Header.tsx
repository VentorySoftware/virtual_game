import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Search, ShoppingCart, User, Menu, X, Gamepad2 } from "lucide-react"
import { CyberButton } from "@/components/ui/cyber-button"
import { Input } from "@/components/ui/input"

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()

  const navigation = [
    { name: "Inicio", href: "/" },
    { name: "Categorías", href: "/categories" },
    { name: "Pre-órdenes", href: "/pre-orders" },
    { name: "Packs", href: "/packs" },
    { name: "Ofertas", href: "/deals" },
  ]

  const isActive = (href: string) => {
    return location.pathname === href
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top bar */}
      <div className="border-b border-primary/10 bg-gradient-dark">
        <div className="container flex h-10 items-center justify-between text-xs">
          <div className="flex items-center space-x-4 text-muted-foreground">
            <span>🎮 Entrega inmediata</span>
            <span>💎 Garantía total</span>
            <span>🔒 Compra segura</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-secondary">WhatsApp: +54 9 11 1234-5678</span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <Gamepad2 className="h-8 w-8 text-primary animate-cyber-pulse" />
          <span className="text-2xl font-bold font-orbitron neon-text">
            Virtual<span className="text-secondary">Game</span>
          </span>
        </Link>

        {/* Search bar - Desktop */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar juegos, consolas, packs..."
              className="pl-10 bg-card/50 border-primary/20 focus:border-primary cyber-border"
            />
          </div>
        </div>

        {/* Navigation - Desktop */}
        <nav className="hidden lg:flex items-center space-x-6">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`text-sm font-medium transition-colors hover:text-primary hover:neon-text ${
                isActive(item.href) 
                  ? "text-primary neon-text" 
                  : "text-foreground"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          <CyberButton variant="ghost" size="icon">
            <User className="h-5 w-5" />
          </CyberButton>
          
          <CyberButton variant="ghost" size="icon" className="relative">
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center animate-cyber-pulse">
              3
            </span>
          </CyberButton>

          {/* Mobile menu button */}
          <CyberButton
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </CyberButton>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-primary/20 bg-card/95 backdrop-blur">
          <div className="container py-4 space-y-4">
            {/* Mobile search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar juegos..."
                className="pl-10 bg-background/50 border-primary/20"
              />
            </div>
            
            {/* Mobile navigation */}
            <nav className="flex flex-col space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive(item.href)
                      ? "text-primary bg-primary/5 neon-text"
                      : "text-foreground hover:text-primary hover:bg-primary/5"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header