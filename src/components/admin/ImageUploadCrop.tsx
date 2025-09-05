import { useState, useRef, useCallback } from "react"
import { Canvas as FabricCanvas, FabricImage } from "fabric"
import { Upload, RotateCw, ZoomIn, ZoomOut, Save, X, Image as ImageIcon } from "lucide-react"
import { CyberButton } from "@/components/ui/cyber-button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { supabase } from "@/integrations/supabase/client"

interface ImageUploadCropProps {
  onImageSave: (imageUrl: string) => void
  onCancel: () => void
  initialImage?: string
  bucketName?: string
  folder?: string
}

export const ImageUploadCrop = ({ 
  onImageSave, 
  onCancel, 
  initialImage,
  bucketName = "products",
  folder = "categories"
}: ImageUploadCropProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const initializeCanvas = useCallback((imageElement: HTMLImageElement) => {
    if (!canvasRef.current) return

    // Dispose existing canvas
    if (fabricCanvas) {
      fabricCanvas.dispose()
    }

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 400,
      height: 300,
      backgroundColor: "#ffffff",
    })

    // Create fabric image and add to canvas
    FabricImage.fromURL(imageElement.src).then((fabricImg) => {
      // Scale image to fit canvas while maintaining aspect ratio
      const canvasWidth = canvas.getWidth()
      const canvasHeight = canvas.getHeight()
      const imgWidth = fabricImg.width || 1
      const imgHeight = fabricImg.height || 1
      
      const scaleX = canvasWidth / imgWidth
      const scaleY = canvasHeight / imgHeight
      const scale = Math.min(scaleX, scaleY)
      
      fabricImg.scale(scale)
      
      // Center the image manually
      fabricImg.set({
        left: (canvasWidth - fabricImg.getScaledWidth()) / 2,
        top: (canvasHeight - fabricImg.getScaledHeight()) / 2
      })
      
      canvas.add(fabricImg)
      canvas.setActiveObject(fabricImg)
      canvas.renderAll()
    })

    setFabricCanvas(canvas)
  }, [fabricCanvas])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error("Por favor selecciona un archivo de imagen válido")
      return
    }

    setSelectedFile(file)
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => initializeCanvas(img)
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleRotate = () => {
    if (!fabricCanvas) return
    const activeObject = fabricCanvas.getActiveObject()
    if (activeObject) {
      activeObject.rotate((activeObject.angle || 0) + 90)
      fabricCanvas.renderAll()
    }
  }

  const handleZoomIn = () => {
    if (!fabricCanvas) return
    const activeObject = fabricCanvas.getActiveObject()
    if (activeObject) {
      const currentScale = activeObject.scaleX || 1
      activeObject.scale(currentScale * 1.1)
      fabricCanvas.renderAll()
    }
  }

  const handleZoomOut = () => {
    if (!fabricCanvas) return
    const activeObject = fabricCanvas.getActiveObject()
    if (activeObject) {
      const currentScale = activeObject.scaleX || 1
      activeObject.scale(currentScale * 0.9)
      fabricCanvas.renderAll()
    }
  }

  const handleSave = async () => {
    if (!fabricCanvas || !selectedFile) return

    setIsLoading(true)
    
    try {
      // Export canvas as blob
      const dataURL = fabricCanvas.toDataURL({
        format: 'jpeg',
        quality: 0.8,
        multiplier: 2 // Higher resolution
      })
      
      // Convert data URL to blob
      const response = await fetch(dataURL)
      const blob = await response.blob()
      
      // Generate unique filename
      const fileExt = selectedFile.name.split('.').pop() || 'jpg'
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: false
        })

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName)

      onImageSave(publicUrl)
      toast.success("Imagen guardada exitosamente")
      
    } catch (error) {
      console.error('Error saving image:', error)
      toast.error("Error al guardar la imagen")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="cyber-card">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-semibold">Editor de Imagen</Label>
          <CyberButton variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </CyberButton>
        </div>

        {!selectedFile ? (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Selecciona una imagen para editar
              </p>
              <CyberButton onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Seleccionar Imagen
              </CyberButton>
            </div>
            
            {initialImage && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Imagen actual:</p>
                <img 
                  src={initialImage} 
                  alt="Imagen actual" 
                  className="max-w-full h-32 object-cover rounded-lg mx-auto"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Canvas Editor */}
            <div className="border border-border rounded-lg overflow-hidden">
              <canvas ref={canvasRef} className="max-w-full" />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <CyberButton variant="outline" size="sm" onClick={handleRotate}>
                <RotateCw className="h-4 w-4 mr-1" />
                Rotar
              </CyberButton>
              <CyberButton variant="outline" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4 mr-1" />
                Zoom +
              </CyberButton>
              <CyberButton variant="outline" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4 mr-1" />
                Zoom -
              </CyberButton>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              <CyberButton variant="outline" onClick={() => setSelectedFile(null)}>
                Cambiar Imagen
              </CyberButton>
              <CyberButton 
                onClick={handleSave} 
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isLoading ? "Guardando..." : "Guardar"}
              </CyberButton>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </CardContent>
    </Card>
  )
}