"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, ImageIcon, Check } from "lucide-react"

interface CardUploadProps {
  onImagesUploaded?: (images: File[]) => void
}

export function CardUpload({ onImagesUploaded }: CardUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith("image/"))

    if (files.length > 0) {
      setUploadedFiles((prev) => [...prev, ...files])
      onImagesUploaded?.(files)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((file) => file.type.startsWith("image/"))

    if (files.length > 0) {
      setUploadedFiles((prev) => [...prev, ...files])
      onImagesUploaded?.(files)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Subir Imágenes de Cartas
        </CardTitle>
        <CardDescription>
          Sube las imágenes de las cartas de Truco. Puedes subir hasta 10 imágenes a la vez. Formatos soportados: PNG,
          JPG, JPEG, WebP.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drag and Drop Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">Arrastra y suelta las imágenes aquí</p>
          <p className="text-sm text-muted-foreground mb-4">o haz clic para seleccionar archivos</p>
          <Label htmlFor="card-images" className="cursor-pointer">
            <Button variant="outline" asChild>
              <span>Seleccionar Imágenes</span>
            </Button>
          </Label>
          <Input id="card-images" type="file" multiple accept="image/*" className="hidden" onChange={handleFileInput} />
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Archivos subidos ({uploadedFiles.length})</Label>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 text-sm p-2 bg-muted rounded">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="flex-1 truncate">{file.name}</span>
                  <span className="text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            <strong>Convención de nombres sugerida:</strong>
          </p>
          <p>• ace_of_spades.png, 2_of_hearts.png, jack_of_clubs.png, etc.</p>
          <p>• Las imágenes se guardarán en la carpeta /public/cards/</p>
          <p>• Tamaño recomendado: 240x336 píxeles (proporción 5:7)</p>
        </div>
      </CardContent>
    </Card>
  )
}
