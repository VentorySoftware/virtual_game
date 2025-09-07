import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Link, Navigate } from "react-router-dom"
import { Gamepad2, Eye, EyeOff, Mail, Lock, User } from "lucide-react"
import { CyberButton } from "@/components/ui/cyber-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    gender: '',
  })
  const [loading, setLoading] = useState(false)

  const { user, signIn, signUp } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  // Obtener returnUrl de los parámetros de la URL
  const searchParams = new URLSearchParams(location.search)
  const returnUrl = searchParams.get('returnUrl') || '/'

  // Redirect if already authenticated
  if (user) {
    return <Navigate to={returnUrl} replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password)
        if (error) {
          toast({
            title: "Error de inicio de sesión",
            description: error.message === "Invalid login credentials" 
              ? "Credenciales incorrectas. Verifica tu email y contraseña."
              : error.message,
            variant: "destructive",
          })
        } else {
          toast({
            title: "¡Bienvenido!",
            description: "Has iniciado sesión correctamente.",
          })
          // Redirigir a la URL de retorno
          navigate(returnUrl)
        }
      } else {
        const { error } = await signUp(
          formData.email,
          formData.password,
          formData.firstName,
          formData.lastName,
          formData.gender
        )
        if (error) {
          toast({
            title: "Error de registro",
            description: error.message === "User already registered" 
              ? "Este email ya está registrado. Intenta iniciar sesión."
              : error.message,
            variant: "destructive",
          })
        } else {
          toast({
            title: "¡Registro exitoso!",
            description: "Ahora puedes iniciar sesión con tu cuenta.",
          })
          // Cambiar a la vista de login después del registro exitoso
          setIsLogin(true)
          // Limpiar el formulario
          setFormData({
            email: formData.email, // Mantener el email para facilitar el login
            password: '',
            firstName: '',
            lastName: '',
            gender: '',
          })
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <Gamepad2 className="h-8 w-8 text-primary animate-cyber-pulse" />
            <span className="text-2xl font-bold font-orbitron neon-text">
              Virtual<span className="text-secondary">Game</span>
            </span>
          </Link>
          <h1 className="text-3xl font-bold font-orbitron neon-text mb-2">
            {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
          </h1>
          <p className="text-muted-foreground">
            {isLogin 
              ? "Accede a tu cuenta para continuar" 
              : "Únete a la mejor tienda de juegos digitales"
            }
          </p>
        </div>

        {/* Form */}
        <div className="cyber-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        placeholder="Tu nombre"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="pl-10 cyber-border"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellido</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        placeholder="Tu apellido"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="pl-10 cyber-border"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Género</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                    required={!isLogin}
                  >
                    <SelectTrigger className="cyber-border">
                      <SelectValue placeholder="Selecciona tu género" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hombre">Hombre</SelectItem>
                      <SelectItem value="Mujer">Mujer</SelectItem>
                      <SelectItem value="Otro / No binario">Otro / No binario</SelectItem>
                      <SelectItem value="Prefiero no decirlo">Prefiero no decirlo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10 cyber-border"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Tu contraseña"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10 pr-10 cyber-border"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <CyberButton
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Cargando..." : (isLogin ? "Iniciar Sesión" : "Crear Cuenta")}
            </CyberButton>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}
            </p>
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:text-secondary transition-colors font-medium neon-text"
            >
              {isLogin ? "Crear cuenta" : "Iniciar sesión"}
            </button>
          </div>
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <Link 
            to="/" 
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Auth