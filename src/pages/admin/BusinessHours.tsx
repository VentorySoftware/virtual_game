import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CyberButton } from '@/components/ui/cyber-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useBusinessHours } from '@/hooks/useBusinessHours'
import { Clock, Plus, Trash2, Save } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'

type TimeSlot = {
  start: string
  end: string
}

const BusinessHours = () => {
  const { businessHours, loading, saveBusinessHour, deleteBusinessHour } = useBusinessHours()
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
    const existing = businessHours.find(h => h.day_type === dayType)
    return existing ? {
      time_slots: existing.time_slots as TimeSlot[],
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
      // Clear editing state for this day type
      setEditingHours(prev => {
        const updated = { ...prev }
        delete updated[dayType]
        return updated
      })
    } catch (error) {
      console.error('Error saving hours:', error)
    }
  }

  const handleDelete = async (dayType: string) => {
    try {
      await deleteBusinessHour(dayType)
    } catch (error) {
      console.error('Error deleting hours:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Clock className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-orbitron neon-text">
            Horarios de Atención
          </h1>
          <p className="text-muted-foreground">
            Configura los horarios de atención para diferentes días de la semana
          </p>
        </div>
      </div>

      <Tabs defaultValue="lunes a viernes" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {dayTypes.map(({ key, label }) => (
            <TabsTrigger key={key} value={key}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {dayTypes.map(({ key, label }) => {
          const hours = getEditingHours(key)
          const hasChanges = JSON.stringify(hours) !== JSON.stringify(getCurrentHours(key))

          return (
            <TabsContent key={key} value={key} className="space-y-6">
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    {label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Closed Toggle */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`closed-${key}`}
                      checked={hours.is_closed}
                      onCheckedChange={(checked) =>
                        updateEditingHours(key, { is_closed: checked })
                      }
                    />
                    <Label htmlFor={`closed-${key}`}>
                      {hours.is_closed ? 'Cerrado' : 'Abierto'}
                    </Label>
                  </div>

                  {/* Time Slots */}
                  {!hours.is_closed && (
                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Franjas Horarias</Label>
                      {hours.time_slots.map((slot, index) => (
                        <div key={index} className="flex items-center gap-4 p-4 border border-primary/20 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`start-${key}-${index}`}>Desde:</Label>
                            <Input
                              id={`start-${key}-${index}`}
                              type="time"
                              value={slot.start}
                              onChange={(e) => updateTimeSlot(key, index, 'start', e.target.value)}
                              className="w-32"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`end-${key}-${index}`}>Hasta:</Label>
                            <Input
                              id={`end-${key}-${index}`}
                              type="time"
                              value={slot.end}
                              onChange={(e) => updateTimeSlot(key, index, 'end', e.target.value)}
                              className="w-32"
                            />
                          </div>
                          {hours.time_slots.length > 1 && (
                            <CyberButton
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTimeSlot(key, index)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </CyberButton>
                          )}
                        </div>
                      ))}

                      <CyberButton
                        variant="outline"
                        onClick={() => addTimeSlot(key)}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar franja horaria
                      </CyberButton>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <CyberButton
                      onClick={() => handleSave(key)}
                      disabled={!hasChanges}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Guardar
                    </CyberButton>
                    {businessHours.some(h => h.day_type === key) && (
                      <CyberButton
                        variant="outline"
                        onClick={() => handleDelete(key)}
                        className="flex items-center gap-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </CyberButton>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}

export default BusinessHours
