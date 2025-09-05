import { useState } from "react"
import { MessageCircle, X, Send } from "lucide-react"
import { CyberButton } from "@/components/ui/cyber-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSiteSettings } from "@/hooks/useSiteSettings"

const WhatsAppWidget = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { settings } = useSiteSettings()
  
  // Use the WhatsApp number from settings, fallback to default if not configured
  const whatsappNumber = settings.whatsapp_number || "5411123456789"
  
  const quickMessages = [
    "¡Hola! Quiero información sobre ofertas",
    "Necesito ayuda con mi pedido",
    "¿Tienen stock de juegos de PS5?", 
    "Información sobre métodos de pago",
    "¿Cómo activo mis códigos de juego?"
  ]

  const sendMessage = (message: string) => {
    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank')
    setIsOpen(false)
  }

  return (
    <>
      {/* WhatsApp Chat Widget */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 max-w-[calc(100vw-3rem)]">
          <Card className="cyber-card shadow-lg border-green-500/20 bg-card/95 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <CardTitle className="text-lg">VirtualGame Support</CardTitle>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                ¡Hola! 👋 ¿En qué puedo ayudarte hoy?
              </p>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {quickMessages.map((message, index) => (
                <button
                  key={index}
                  onClick={() => sendMessage(message)}
                  className="w-full text-left p-3 rounded-lg bg-background/50 hover:bg-primary/10 border border-primary/20 transition-colors text-sm"
                >
                  {message}
                </button>
              ))}
              
              <div className="pt-2 border-t border-primary/20">
                <CyberButton
                  onClick={() => sendMessage("¡Hola! Necesito ayuda con VirtualGame")}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Send className="h-4 w-4" />
                  Iniciar Chat Personalizado
                </CyberButton>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Floating WhatsApp Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group flex items-center justify-center w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full shadow-lg hover:shadow-green-500/25 transition-all duration-300 transform hover:scale-110"
        >
          {isOpen ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <MessageCircle className="h-6 w-6 text-white animate-bounce" />
          )}
        </button>
        
        {/* Tooltip */}
        {!isOpen && (
          <div className="absolute right-16 top-1/2 -translate-y-1/2 bg-black/90 text-white text-sm px-3 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            💬 ¿Necesitas ayuda?
          </div>
        )}
      </div>
    </>
  )
}

export default WhatsAppWidget