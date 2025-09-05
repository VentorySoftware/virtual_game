import { MessageCircle } from "lucide-react"
import { useSiteSettings } from "@/hooks/useSiteSettings"

const WhatsAppWidget = () => {
  const { settings } = useSiteSettings()
  
  // Use the WhatsApp number from settings, fallback to default if not configured
  const whatsappNumber = settings.whatsapp_number || "5411123456789"

  const openWhatsApp = () => {
    const message = "¡Hola! Necesito ayuda con VirtualGame"
    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank')
  }

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button
        onClick={openWhatsApp}
        className="group flex items-center justify-center w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full shadow-lg hover:shadow-green-500/25 transition-all duration-300 transform hover:scale-110"
      >
        <MessageCircle className="h-6 w-6 text-white animate-bounce" />
      </button>
      
      {/* Tooltip */}
      <div className="absolute right-16 top-1/2 -translate-y-1/2 bg-black/90 text-white text-sm px-3 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        💬 ¿Necesitas ayuda?
      </div>
    </div>
  )
}

export default WhatsAppWidget