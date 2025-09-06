import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  FolderTree,
  Megaphone,
  Menu,
  X,
  LogOut,
  Gamepad2,
  Home,
  CreditCard,
  Clock
} from "lucide-react"
import { CyberButton } from "@/components/ui/cyber-button"
import { useAuth } from "@/contexts/AuthContext"

interface AdminLayoutProps {
  children: React.ReactNode
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Productos', href: '/admin/products', icon: Package },
    { name: 'Categorías', href: '/admin/categories', icon: FolderTree },
    { name: 'Plataformas', href: '/admin/platforms', icon: Gamepad2 },
    { name: 'Promociones', href: '/admin/promotions', icon: Megaphone },
    { name: 'Medios de Pago', href: '/admin/payment-methods', icon: CreditCard },
    { name: 'Pedidos', href: '/admin/orders', icon: ShoppingCart },
    { name: 'Usuarios', href: '/admin/users', icon: Users },
    { name: 'Horarios', href: '/admin/business-hours', icon: Clock },
    { name: 'Configuración', href: '/admin/settings', icon: Settings },
  ]

  const isActive = (href: string) => {
    if (href === '/admin') {
      return location.pathname === href
    }
    return location.pathname.startsWith(href)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate("/")
  }

  return (
    <div className="min-h-screen bg-gradient-dark flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-card/95 backdrop-blur border-r border-primary/20 transform ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-primary/20">
          <Link to="/" className="flex items-center space-x-2">
            <Gamepad2 className="h-8 w-8 text-primary animate-cyber-pulse" />
            <span className="text-xl font-bold font-orbitron neon-text">
              VG<span className="text-secondary">Admin</span>
            </span>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-muted-foreground hover:text-foreground"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-6 py-6 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-primary/10"
                }`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Info & Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-primary/20">
          <div className="space-y-4">
            <div className="text-sm">
              <p className="text-muted-foreground">Conectado como:</p>
              <p className="font-medium truncate">{user?.email}</p>
            </div>
            <div className="flex flex-col space-y-2">
              <CyberButton variant="outline" size="sm" asChild>
                <Link to="/" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Ir al Sitio
                </Link>
              </CyberButton>
              <CyberButton 
                variant="ghost" 
                size="sm" 
                onClick={handleSignOut}
                className="flex items-center gap-2 text-destructive hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                Cerrar Sesión
              </CyberButton>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 lg:pl-0">
        {/* Top bar */}
        <div className="sticky top-0 z-30 flex h-16 items-center justify-between bg-background/95 backdrop-blur border-b border-primary/20 px-6">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex items-center space-x-4 ml-auto">
            <span className="text-sm text-muted-foreground hidden sm:block">
              Panel de Administración
            </span>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AdminLayout