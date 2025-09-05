import { useState, useEffect } from "react"
import { Navigate } from "react-router-dom"
import { Search, UserCheck, UserX, Crown, Shield } from "lucide-react"
import AdminLayout from "@/components/admin/AdminLayout"
import { CyberButton } from "@/components/ui/cyber-button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"

interface User {
  id: string
  email: string
  created_at: string
  profiles?: {
    first_name: string
    last_name: string
    phone: string
  } | null
  user_roles?: Array<{
    role: string
  }>
}

const UsersAdmin = () => {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (user) {
      checkAdminStatus()
    }
  }, [user])

  const checkAdminStatus = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase.rpc('is_admin', { _user_id: user.id })
      
      if (error) throw error
      
      setIsAdmin(data)
      
      if (data) {
        await fetchUsers()
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      // Get users from auth metadata (simplified approach)
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles(role)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Convert profiles to user format
      const usersData: User[] = profilesData?.map(profile => ({
        id: profile.user_id,
        email: profile.email,
        created_at: profile.created_at,
        profiles: profile.first_name || profile.last_name || profile.phone ? {
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
        } : null,
        user_roles: Array.isArray(profile.user_roles) ? profile.user_roles : []
      })) || []

      setUsers(usersData)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const updateUserRole = async (userId: string, role: 'admin', action: 'add' | 'remove') => {
    try {
      if (action === 'add') {
        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: role
          })
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', role)
        
        if (error) throw error
      }
      
      await fetchUsers()
    } catch (error) {
      console.error('Error updating user role:', error)
      alert('Error al actualizar el rol del usuario')
    }
  }

  const getUserRoles = (user: User): string[] => {
    return user.user_roles?.map(ur => ur.role) || []
  }

  const isUserAdmin = (user: User): boolean => {
    return getUserRoles(user).includes('admin')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="animate-cyber-pulse text-primary">Cargando usuarios...</div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-orbitron neon-text">
            Gestión de Usuarios
          </h1>
          <p className="text-muted-foreground">
            Administra usuarios y roles del sistema
          </p>
        </div>

        {/* Search */}
        <Card className="cyber-card">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por email o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 cyber-border"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="cyber-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold neon-text">{users.length}</div>
            </CardContent>
          </Card>

          <Card className="cyber-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administradores</CardTitle>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold neon-text">
                {users.filter(isUserAdmin).length}
              </div>
            </CardContent>
          </Card>

          <Card className="cyber-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuarios Regulares</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold neon-text">
                {users.filter(u => !isUserAdmin(u)).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        {filteredUsers.length === 0 ? (
          <Card className="cyber-card">
            <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
              <UserX className="h-16 w-16 text-muted-foreground" />
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">No se encontraron usuarios</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Intenta con otros términos de búsqueda' : 'No hay usuarios registrados'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((userData) => (
              <Card key={userData.id} className="cyber-card hover:shadow-glow-primary transition-all">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* User Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-lg">{userData.email}</h3>
                        {isUserAdmin(userData) && (
                          <Badge className="bg-primary/20 text-primary border-primary/30">
                            <Crown className="h-3 w-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {userData.profiles && (
                          <p>
                            Nombre: {userData.profiles.first_name} {userData.profiles.last_name}
                          </p>
                        )}
                        {userData.profiles?.phone && (
                          <p>Teléfono: {userData.profiles.phone}</p>
                        )}
                        <p>
                          Registrado: {formatDate(userData.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      {isUserAdmin(userData) ? (
                        <CyberButton
                          variant="outline"
                          size="sm"
                          onClick={() => updateUserRole(userData.id, 'admin', 'remove')}
                          className="text-destructive border-destructive hover:bg-destructive/10"
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Quitar Admin
                        </CyberButton>
                      ) : (
                        <CyberButton
                          variant="outline"
                          size="sm"
                          onClick={() => updateUserRole(userData.id, 'admin', 'add')}
                          className="text-primary border-primary hover:bg-primary/10"
                        >
                          <Crown className="h-4 w-4 mr-1" />
                          Hacer Admin
                        </CyberButton>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default UsersAdmin