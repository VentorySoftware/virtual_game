import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CyberButton } from '@/components/ui/cyber-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useBusinessHours, type BusinessHourInput } from '@/hooks/useBusinessHours'
import { Clock, Plus, Trash2, Save, CheckCircle } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import AdminLayout from '@/components/admin/AdminLayout'

type TimeSlot = {
  start: string
  end: string
}

const BusinessHoursAdmin = () => {
  const { businessHours, loading, saveBusinessHour, deleteBusinessHour, getBusinessHoursByDay } = useBusinessHours()
  const notifications = useNotifications()
  
  const [editingHours, setEditingHours] = useState<{
    [key: string]: {
      time_slots: TimeSlot[]
      is_closed: boolean
    }
  }>({})

  const dayTypes = [
    { key: 'lunes a viernes', label: 'Lunes a Viernes' },
    { key: 'sabados', label: 'Sábados' },
    { key: 'domingo', label: 'Domingo' },
    { key: 'feriados', label: 'Feriados' }
  ]

  const getCurrentHours = (dayType: string) => {
    const existing = getBusinessHoursByDay(dayType)
    return existing ? {
      time_slots: existing.time_slots,
      is_closed: existing.is_closed
    } : {
      time_slots: [{ start: '09:00', end: '18:00' }],
      is_closed: false
    }
  }

  const getEditingHours = (dayType: string) => {
    return editingHours[dayType] || getCurrentHours(dayType)
  }

  const updateEditingHours = (dayType: string, updates: Partial<{ time_slots: TimeSlot[], is_closed: boolean }>) => {
    setEditingHours(prev => ({
      ...prev,
      [dayType]: {
        ...getEditingHours(dayType),
        ...updates
      }
    }))
  }

  const addTimeSlot = (dayType: string) => {
    const current = getEditingHours(dayType)
    updateEditingHours(dayType, {
      time_slots: [...current.time_slots, { start: '09:00', end: '18:00' }]
    })
  }

  const updateTimeSlot = (dayType: string, index: number, field: 'start' | 'end', value: string) => {
    const current = getEditingHours(dayType)
    const updatedSlots = [...current.time_slots]
    updatedSlots[index] = { ...updatedSlots[index], [field]: value }
    updateEditingHours(dayType, { time_slots: updatedSlots })
  }

  const removeTimeSlot = (dayType: string, index: number) => {
    const current = getEditingHours(dayType)
    if (current.time_slots.length > 1) {
      const updatedSlots = current.time_slots.filter((_, i) => i !== index)
      updateEditingHours(dayType, { time_slots: updatedSlots })
    }
  }

  const handleSave = async (dayType: string) => {
    try {
      const hours = getEditingHours(dayType)
      await saveBusinessHour({
        day_type: dayType,
        time_slots: hours.time_slots,
        is_closed: hours.is_closed
      })
      
      // Clear editing state for this day
      setEditingHours(prev => {
        const { [dayType]: _, ...rest } = prev
        return rest
      })
      
      notifications.success('Horarios guardados exitosamente')
    } catch (error) {
      notifications.error('Error al guardar los horarios')
      console.error('Error saving business hours:', error)
    }
  }

  return (
    <AdminLayout>
      <div className="container py-8">
        <div className="flex items-center gap-3 mb-8">
          <Clock className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold font-orbitron">Horarios de Atención</h1>
            <p className="text-muted-foreground">Configura los horarios de atención del negocio</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-800 dark:text-green-200">Gestión de Horarios Activa</h3>
                <p className="text-green-700 dark:text-green-300 text-sm mt-1">
                  Configura los horarios de atención para diferentes días de la semana. Los cambios se guardarán automáticamente.
                </p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="lunes a viernes" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              {dayTypes.map((dayType) => (
                <TabsTrigger 
                  key={dayType.key} 
                  value={dayType.key}
                  className="text-xs sm:text-sm"
                >
                  {dayType.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {dayTypes.map((dayType) => (
              <TabsContent key={dayType.key} value={dayType.key} className="mt-6">
                <Card className="cyber-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      Horarios para {dayType.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Closed toggle */}
                    <div className="flex items-center justify-between p-4 bg-card/50 rounded-lg border">
                      <div>
                        <Label className="text-base font-medium">Cerrado</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Marcar como cerrado para {dayType.label.toLowerCase()}
                        </p>
                      </div>
                      <Switch
                        checked={getEditingHours(dayType.key).is_closed}
                        onCheckedChange={(checked) => 
                          updateEditingHours(dayType.key, { is_closed: checked })
                        }
                      />
                    </div>

                    {/* Time slots */}
                    {!getEditingHours(dayType.key).is_closed && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-medium">Horarios de Atención</Label>
                          <CyberButton
                            variant="outline"
                            size="sm"
                            onClick={() => addTimeSlot(dayType.key)}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Agregar Horario
                          </CyberButton>
                        </div>

                        {getEditingHours(dayType.key).time_slots.map((slot, index) => (
                          <div key={index} className="flex items-center gap-4 p-4 bg-card/30 rounded-lg border">
                            <div className="flex-1 grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor={`start-${dayType.key}-${index}`} className="text-sm">
                                  Apertura
                                </Label>
                                <Input
                                  id={`start-${dayType.key}-${index}`}
                                  type="time"
                                  value={slot.start}
                                  onChange={(e) => updateTimeSlot(dayType.key, index, 'start', e.target.value)}
                                  className="cyber-border"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`end-${dayType.key}-${index}`} className="text-sm">
                                  Cierre
                                </Label>
                                <Input
                                  id={`end-${dayType.key}-${index}`}
                                  type="time"
                                  value={slot.end}
                                  onChange={(e) => updateTimeSlot(dayType.key, index, 'end', e.target.value)}
                                  className="cyber-border"
                                />
                              </div>
                            </div>
                            
                            {getEditingHours(dayType.key).time_slots.length > 1 && (
                              <CyberButton
                                variant="outline"
                                size="icon"
                                onClick={() => removeTimeSlot(dayType.key, index)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </CyberButton>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Save button */}
                    <div className="pt-4 border-t">
                      <CyberButton
                        onClick={() => handleSave(dayType.key)}
                        disabled={loading}
                        className="w-full"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {loading ? 'Guardando...' : 'Guardar Horarios'}
                      </CyberButton>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </AdminLayout>
  )
}

export default BusinessHoursAdmin