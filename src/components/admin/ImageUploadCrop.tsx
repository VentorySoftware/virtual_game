import { useState, useRef, useCallback } from "react"
import ReactCrop, { Crop, PixelCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import { Upload, Save, X, Image as ImageIcon, RotateCw } from "lucide-react"
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
  const [imageSrc, setImageSrc] = useState<string>("")
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [rotation, setRotation] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      if (e.target?.result) {
        setImageSrc(e.target.result as string)
        // Set default crop to center of image
        setCrop({
          unit: '%',
          x: 10,
          y: 10,
          width: 80,
          height: 80
        })
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  // Helper function to create cropped canvas
  const getCroppedCanvas = useCallback((
    image: HTMLImageElement,
    crop: PixelCrop,
    rotation: number = 0
  ) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('No 2d context')

    const rotRad = (rotation * Math.PI) / 180
    const { naturalWidth: imgWidth, naturalHeight: imgHeight } = image

    // Calculate rotated dimensions
    const cos = Math.abs(Math.cos(rotRad))
    const sin = Math.abs(Math.sin(rotRad))
    const rotatedWidth = imgWidth * cos + imgHeight * sin
    const rotatedHeight = imgWidth * sin + imgHeight * cos

    // Set canvas size to crop size
    canvas.width = crop.width
    canvas.height = crop.height

    // Calculate scale factors
    const scaleX = rotatedWidth / imgWidth
    const scaleY = rotatedHeight / imgHeight

    ctx.save()

    // Move to center of crop area
    ctx.translate(crop.width / 2, crop.height / 2)
    
    // Apply rotation
    ctx.rotate(rotRad)
    
    // Draw image centered and scaled
    ctx.drawImage(
      image,
      (-imgWidth / 2) * scaleX,
      (-imgHeight / 2) * scaleY,
      imgWidth * scaleX,
      imgHeight * scaleY
    )

    ctx.restore()

    return canvas
  }, [])

  const handleSave = async () => {
    if (!completedCrop || !imgRef.current || !selectedFile) {
      toast.error("Por favor selecciona un área para recortar")
      return
    }

    setIsLoading(true)
    
    try {
      const canvas = getCroppedCanvas(imgRef.current, completedCrop, rotation)
      
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
        }, 'image/jpeg', 0.8)
      })

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
            {/* Image Crop Area */}
            <div className="border border-border rounded-lg overflow-hidden">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                minWidth={100}
                minHeight={100}
              >
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={imageSrc}
                  style={{ 
                    transform: `rotate(${rotation}deg)`,
                    maxWidth: '100%',
                    maxHeight: '400px'
                  }}
                />
              </ReactCrop>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <CyberButton variant="outline" size="sm" onClick={handleRotate}>
                <RotateCw className="h-4 w-4 mr-1" />
                Rotar
              </CyberButton>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              <CyberButton variant="outline" onClick={() => {
                setSelectedFile(null)
                setImageSrc("")
                setCrop(undefined)
                setCompletedCrop(undefined)
                setRotation(0)
              }}>
                Cambiar Imagen
              </CyberButton>
              <CyberButton 
                onClick={handleSave} 
                disabled={isLoading || !completedCrop}
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

        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </CardContent>
    </Card>
  )
}