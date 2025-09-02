"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Copy, Users, RefreshCw, Clock, Settings } from "lucide-react"
import { useRoomsList } from "@/hooks/use-rooms-list"
import { useAuth } from "@/hooks/use-auth"
import type { GameConfig } from "@/types/truco"

interface LobbyScreenProps {
  gameConfig: GameConfig
  onJoinRoom: (roomId: string) => void
  onBack: () => void
}

interface WaitingRoom {
  id: string
  code?: string
  playerCount: number
  createdAt: string
  maxPoints: number
  withFlor: boolean
  creator: string
}

export function LobbyScreen({ gameConfig, onJoinRoom, onBack }: LobbyScreenProps) {
  const [joinRoomId, setJoinRoomId] = useState("")
  const [createdRoomId, setCreatedRoomId] = useState("")
  const [createdRoomCode, setCreatedRoomCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [quickMatchLoading, setQuickMatchLoading] = useState(false)

  const { user } = useAuth()
  const { rooms: waitingRooms, loading: roomsLoading, refreshRooms } = useRoomsList()

  const handleCreateRoom = async () => {
    if (!user) return

    setLoading(true)
    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maxPoints: gameConfig.maxPoints,
          withFlor: gameConfig.withFlor,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setCreatedRoomId(data.roomId)
        setCreatedRoomCode(data.code || "")
        refreshRooms()
      } else {
        console.error("Failed to create room:", data.error)
      }
    } catch (error) {
      console.error("Error creating room:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickMatch = async () => {
    const compatibleRooms = waitingRooms.filter(
      (room) =>
        room.maxPoints === gameConfig.maxPoints && room.withFlor === gameConfig.withFlor && room.playerCount < 2,
    )

    if (compatibleRooms.length > 0) {
      // Join the first available compatible room
      const room = compatibleRooms[0]
      await handleJoinRoom(room.id)
    } else {
      // Create a new room if no compatible rooms found
      await handleCreateRoom()
      if (createdRoomId) {
        onJoinRoom(createdRoomId)
      }
    }
  }

  const handleJoinRoom = async (roomId?: string) => {
    const targetRoomId = roomId || joinRoomId.trim()
    if (!targetRoomId || !user) return

    try {
      const response = await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: targetRoomId }),
      })

      const data = await response.json()
      if (data.success) {
        onJoinRoom(data.roomId)
      } else {
        console.error("Failed to join room:", data.error)
      }
    } catch (error) {
      console.error("Error joining room:", error)
    }
  }

  const handleJoinByCode = async () => {
    if (!joinRoomId.trim() || !user) return

    try {
      const response = await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: joinRoomId.trim().toUpperCase() }),
      })

      const data = await response.json()
      if (data.success) {
        onJoinRoom(data.roomId)
      } else {
        console.error("Failed to join room by code:", data.error)
      }
    } catch (error) {
      console.error("Error joining room by code:", error)
    }
  }

  const handleJoinCreatedRoom = () => {
    if (createdRoomId) {
      onJoinRoom(createdRoomId)
    }
  }

  const copyRoomCode = () => {
    navigator.clipboard.writeText(createdRoomCode || createdRoomId)
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "Ahora"
    if (diffMins < 60) return `${diffMins}m`
    const diffHours = Math.floor(diffMins / 60)
    return `${diffHours}h`
  }

  const getConfigBadge = (config: { maxPoints: number; withFlor: boolean }) => {
    return `${config.maxPoints}pts${config.withFlor ? " +Flor" : ""}`
  }

  // Filter rooms that match current player's configuration
  const compatibleRooms = waitingRooms.filter(
    (room) => room.maxPoints === gameConfig.maxPoints && room.withFlor === gameConfig.withFlor,
  )

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-primary">
              Bienvenido, {user.user_metadata?.display_name || "Jugador"}
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Elegí cómo querés jugar</span>
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <Badge variant="outline">{getConfigBadge(gameConfig)}</Badge>
              </div>
              <span className="text-green-600">Conectado</span>
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={refreshRooms} disabled={roomsLoading}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Quick Match */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-center">
                <Users className="h-5 w-5" />
                Emparejamiento Rápido
              </CardTitle>
              <CardDescription className="text-center">
                Te conectamos automáticamente con un oponente que tenga tu misma configuración
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleQuickMatch} className="w-full" disabled={quickMatchLoading} size="lg">
                {quickMatchLoading ? "Buscando oponente..." : "Buscar Partida Rápida"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Create Room */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Crear Sala
              </CardTitle>
              <CardDescription>Creá una nueva sala y invitá a un amigo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!createdRoomId ? (
                <Button onClick={handleCreateRoom} className="w-full" disabled={loading}>
                  {loading ? "Creando..." : "Crear Nueva Sala"}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Código de Acceso:</p>
                    <div className="flex items-center gap-2">
                      <code className="text-lg font-mono font-bold text-primary">
                        {createdRoomCode || createdRoomId}
                      </code>
                      <Button size="sm" variant="outline" onClick={copyRoomCode}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-2 bg-muted/50 rounded text-xs">
                    <div className="flex items-center gap-2">
                      <Settings className="h-3 w-3" />
                      <span>{getConfigBadge(gameConfig)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Compartí este código con tu oponente</p>
                  <Button onClick={handleJoinCreatedRoom} className="w-full">
                    Entrar a la Sala
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Join Room */}
          <Card>
            <CardHeader>
              <CardTitle>Unirse con Código</CardTitle>
              <CardDescription>Ingresá el código de una sala existente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="roomId" className="block text-sm font-medium mb-2">
                  Código de Sala
                </label>
                <Input
                  id="roomId"
                  type="text"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                  placeholder="Ej: ABC123"
                  className="w-full font-mono"
                  maxLength={6}
                />
              </div>
              <Button onClick={handleJoinByCode} className="w-full" disabled={!joinRoomId.trim()}>
                Unirse a la Sala
              </Button>
            </CardContent>
          </Card>

          {/* Compatible Rooms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Salas Compatibles</span>
                <Badge variant="secondary">{compatibleRooms.length}</Badge>
              </CardTitle>
              <CardDescription>Salas con tu misma configuración</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {roomsLoading ? (
                  <div className="text-center text-muted-foreground py-4">Cargando...</div>
                ) : compatibleRooms.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">No hay salas compatibles</div>
                ) : (
                  compatibleRooms.map((room) => (
                    <div
                      key={room.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <code className="font-mono font-bold text-sm">{room.code || room.id.slice(0, 6)}</code>
                          <Badge variant="outline" className="text-xs">
                            {room.playerCount}/2
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatTimeAgo(room.createdAt)}</span>
                          <Settings className="h-3 w-3" />
                          <span>{getConfigBadge({ maxPoints: room.maxPoints, withFlor: room.withFlor })}</span>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handleJoinRoom(room.id)} disabled={room.playerCount >= 2}>
                        {room.playerCount >= 2 ? "Llena" : "Unirse"}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {/* Room Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estadísticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{compatibleRooms.length}</div>
                  <div className="text-sm text-muted-foreground">Salas Compatibles</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-secondary">{waitingRooms.length}</div>
                  <div className="text-sm text-muted-foreground">Total Salas</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent">
                    {waitingRooms.reduce((acc, room) => acc + room.playerCount, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Jugadores Online</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Tu Configuración
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Puntos para ganar:</span>
                  <Badge variant="outline">{gameConfig.maxPoints} puntos</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Flor:</span>
                  <Badge variant={gameConfig.withFlor ? "default" : "secondary"}>
                    {gameConfig.withFlor ? "Habilitada" : "Deshabilitada"}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  Solo podés unirte a salas con la misma configuración
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
