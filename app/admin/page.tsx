"use client"

import { CardUpload } from "@/components/truco/card-upload"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getAvailableCardImages, getMissingCardImages } from "@/lib/card-images"

export default function AdminPage() {
  const availableImages = getAvailableCardImages()
  const missingImages = getMissingCardImages()

  const handleImagesUploaded = (files: File[]) => {
    console.log(
      "Imágenes subidas:",
      files.map((f) => f.name),
    )
    // Here you would typically upload to your storage service
    // For now, just log the files
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Administración de Cartas</h1>
        <p className="text-muted-foreground">Gestiona las imágenes de las cartas del juego de Truco</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Estado de las Imágenes</CardTitle>
            <CardDescription>Resumen de las imágenes de cartas disponibles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Total de cartas:</span>
              <span className="font-bold">40</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Imágenes configuradas:</span>
              <span className="font-bold text-green-600">{availableImages.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Imágenes faltantes:</span>
              <span className="font-bold text-red-600">{missingImages.length}</span>
            </div>

            {missingImages.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Cartas faltantes:</p>
                <div className="text-xs text-muted-foreground max-h-32 overflow-y-auto">
                  {missingImages.map((card) => (
                    <div key={card}>{card}</div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instrucciones</CardTitle>
            <CardDescription>Cómo subir las imágenes de las cartas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-medium">1. Preparar las imágenes</p>
              <p className="text-muted-foreground">
                Asegúrate de que las imágenes tengan nombres descriptivos y sean de buena calidad.
              </p>
            </div>
            <div>
              <p className="font-medium">2. Subir de 10 en 10</p>
              <p className="text-muted-foreground">
                Puedes subir hasta 10 imágenes a la vez para mantener el proceso organizado.
              </p>
            </div>
            <div>
              <p className="font-medium">3. Verificar</p>
              <p className="text-muted-foreground">
                Las cartas aparecerán automáticamente en el juego una vez subidas correctamente.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <CardUpload onImagesUploaded={handleImagesUploaded} />
    </div>
  )
}
