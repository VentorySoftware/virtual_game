import { Gamepad2, Mail, Phone, MapPin, Facebook, Instagram, Twitter, Youtube } from "lucide-react"
import { CyberButton } from "@/components/ui/cyber-button"
import { Badge } from "@/components/ui/badge"

import { useSiteSettings } from '@/hooks/useSiteSettings'

const Footer = () => {
  const { settings, loading } = useSiteSettings()
  const currentYear = new Date().getFullYear()

  const address = settings.contact_address || 'Buenos Aires, Argentina'
  const phone = settings.whatsapp_number || '+54 9 11 1234-5678'
  const email = settings.contact_email || 'soporte@virtualgame.com'

  return (
    <footer className="bg-gradient-dark border-t border-primary/20 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 grid-pattern opacity-10" />
      
      <div className="container py-16 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          
          {/* Company Info */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Gamepad2 className="h-8 w-8 text-primary animate-cyber-pulse" />
              <span className="text-2xl font-bold font-orbitron neon-text">
                Virtual<span className="text-secondary">Game</span>
              </span>
            </div>
            
            <p className="text-muted-foreground">
              La tienda online líder en juegos digitales. Compra segura, entrega inmediata 
              y el mejor soporte al cliente.
            </p>

            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-3 text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{address}</span>
              </div>
              <div className="flex items-center space-x-3 text-muted-foreground">
                <Phone className="h-4 w-4 text-secondary" />
                <span>{phone}</span>
              </div>
              <div className="flex items-center space-x-3 text-muted-foreground">
                <Mail className="h-4 w-4 text-accent" />
                <span>{email}</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4">
              <CyberButton variant="ghost" size="icon">
                <Facebook className="h-4 w-4" />
              </CyberButton>
              <CyberButton variant="ghost" size="icon">
                <Instagram className="h-4 w-4" />
              </CyberButton>
              <CyberButton variant="ghost" size="icon">
                <Twitter className="h-4 w-4" />
              </CyberButton>
              <CyberButton variant="ghost" size="icon">
                <Youtube className="h-4 w-4" />
              </CyberButton>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold font-orbitron text-primary">Navegación</h3>
            <ul className="space-y-3 text-sm">
              {[
                { name: "Inicio", href: "/" },
                { name: "Todas las Categorías", href: "/categories" },
                { name: "Pre-órdenes", href: "/pre-orders" },
                { name: "Packs y Combos", href: "/packs" },
                { name: "Ofertas Especiales", href: "/deals" },
                { name: "Blog", href: "/blog" },
              ].map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors hover:neon-text"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold font-orbitron text-secondary">Soporte</h3>
            <ul className="space-y-3 text-sm">
              {[
                { name: "Centro de Ayuda", href: "/help" },
                { name: "FAQ", href: "/faq" },
                { name: "Cómo Comprar", href: "/how-to-buy" },
                { name: "Medios de Pago", href: "/payment-methods" },
                { name: "Términos y Condiciones", href: "/terms" },
                { name: "Política de Privacidad", href: "/privacy" },
              ].map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href}
                    className="text-muted-foreground hover:text-secondary transition-colors hover:neon-text"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter & Benefits */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold font-orbitron text-accent">Beneficios</h3>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-sm text-muted-foreground">Entrega inmediata</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                <span className="text-sm text-muted-foreground">Garantía total</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                <span className="text-sm text-muted-foreground">Soporte 24/7</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-sm text-muted-foreground">Mejores precios</span>
              </div>
            </div>

            <div className="cyber-card p-4">
              <h4 className="font-semibold mb-2 text-primary">Horarios de Atención</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Lunes a Viernes: 9:00 - 22:00</p>
                <p>Sábados: 10:00 - 20:00</p>
                <p>Domingos: 12:00 - 18:00</p>
              </div>
              <Badge className="mt-3 bg-secondary/20 text-secondary">
                Chat en vivo disponible
              </Badge>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-primary/20 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="text-sm text-muted-foreground">
              © {currentYear} Virtual Game Store. Desarrollado por{" "}
              <span className="text-primary font-semibold">Nuvem Software</span>. 
              Todos los derechos reservados.
            </div>
            
            <div className="flex items-center space-x-6 text-sm">
              <Badge variant="outline" className="border-primary text-primary">
                🔒 SSL Seguro
              </Badge>
              <Badge variant="outline" className="border-secondary text-secondary">
                💳 Pagos Protegidos
              </Badge>
              <Badge variant="outline" className="border-accent text-accent">
                ⚡ Entrega Inmediata
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer