import { useToast } from "@/hooks/use-toast"

interface NotificationOptions {
  title?: string
  description?: string
  duration?: number
}

interface ConfirmOptions {
  title?: string
  description: string
  confirmText?: string
  cancelText?: string
}

export const useNotifications = () => {
  const { toast } = useToast()

  const success = (message: string, options?: NotificationOptions) => {
    toast({
      title: options?.title || "Éxito",
      description: message,
      duration: options?.duration || 3000,
      variant: "default",
    })
  }

  const error = (message: string, options?: NotificationOptions) => {
    toast({
      title: options?.title || "Error",
      description: message,
      duration: options?.duration || 5000,
      variant: "destructive",
    })
  }

  const warning = (message: string, options?: NotificationOptions) => {
    toast({
      title: options?.title || "Advertencia",
      description: message,
      duration: options?.duration || 4000,
      variant: "default",
    })
  }

  const info = (message: string, options?: NotificationOptions) => {
    toast({
      title: options?.title || "Información",
      description: message,
      duration: options?.duration || 3000,
      variant: "default",
    })
  }

  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      const confirmed = window.confirm(`${options.title || "Confirmar acción"}\n\n${options.description}`)
      resolve(confirmed)
    })
  }

  return {
    success,
    error,
    warning,
    info,
    confirm,
  }
}