"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Wifi, Settings, Flower } from "lucide-react"
import { useRoom } from "@/hooks/use-room"
import { useGameState } from "@/hooks/use-game-state"
import { useAuth } from "@/hooks/use-auth"
import { GameTable } from "./game-table"
import { PlayerHand } from "./player-hand"
import { GameControls } from "./game-controls"
import { GameMessages } from "./game-messages"
import { useToast } from "@/hooks/use-toast"

interface GameScreenProps {
  roomId: string
  onBack: () => void
}

interface GameMessage {
  type: "info" | "action" | "truco" | "envido" | "flor" | "winner"
  text: string
  timestamp: Date
}

export function GameScreen({ roomId, onBack }: GameScreenProps) {
  const [messages, setMessages] = useState<GameMessage[]>([])
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)
  const { toast } = useToast()

  const { user } = useAuth()
  const { room, loading: roomLoading } = useRoom(roomId)
  const { gameState, playerHand, recentMoves, loading: gameLoading } = useGameState(roomId, user?.id || null)

  useEffect(() => {
    if (recentMoves.length > 0) {
      const newMessages = recentMoves.map((move) => ({
        type: move.move_type.includes("truco")
          ? ("truco" as const)
          : move.move_type.includes("envido")
            ? ("envido" as const)
            : move.move_type.includes("flor")
              ? ("flor" as const)
              : ("action" as const),
        text: `Jugada: ${move.move_type}`,
        timestamp: new Date(move.created_at),
      }))
      setMessages((prev) => [...newMessages, ...prev].slice(0, 20)) // Keep last 20 messages
    }
  }, [recentMoves])

  const handleStartGame = useCallback(async () => {
    if (!user || actionInProgress) return

    setActionInProgress("starting")
    try {
      const response = await fetch(`/api/rooms/${roomId}/start`, {
        method: "POST",
      })

      const data = await response.json()
      if (!data.success) {
        toast({
          title: "Error",
          description: data.error || "No se pudo iniciar la partida",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al iniciar la partida",
        variant: "destructive",
      })
    } finally {
      setActionInProgress(null)
    }
  }, [roomId, user, actionInProgress, toast])

  const handlePlayCard = useCallback(
    async (cardId: string) => {
      if (!user || actionInProgress || gameState?.turnPlayerId !== user.id) return

      setActionInProgress("playing-card")
      try {
        const response = await fetch(`/api/game/${roomId}/play-card`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cardId }),
        })

        const data = await response.json()
        if (!data.success) {
          toast({
            title: "Error",
            description: data.error || "No se pudo jugar la carta",
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Error al jugar la carta",
          variant: "destructive",
        })
      } finally {
        setActionInProgress(null)
      }
    },
    [roomId, user, actionInProgress, gameState?.turnPlayerId, toast],
  )

  const handleCallTruco = useCallback(async () => {
    if (!user || actionInProgress) return

    setActionInProgress("calling-truco")
    try {
      const response = await fetch(`/api/game/${roomId}/call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "truco" }),
      })

      const data = await response.json()
      if (!data.success) {
        toast({
          title: "Error",
          description: data.error || "No se pudo cantar truco",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cantar truco",
        variant: "destructive",
      })
    } finally {
      setActionInProgress(null)
    }
  }, [roomId, user, actionInProgress, toast])

  const handleCallEnvido = useCallback(
    async (callType: "envido" | "real_envido" | "falta_envido") => {
      if (!user || actionInProgress) return

      setActionInProgress(`calling-${callType}`)
      try {
        const response = await fetch(`/api/game/${roomId}/call`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "envido", callType }),
        })

        const data = await response.json()
        if (!data.success) {
          toast({
            title: "Error",
            description: data.error || "No se pudo cantar envido",
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Error al cantar envido",
          variant: "destructive",
        })
      } finally {
        setActionInProgress(null)
      }
    },
    [roomId, user, actionInProgress, toast],
  )

  const handleCallFlor = useCallback(async () => {
    if (!user || actionInProgress) return

    setActionInProgress("calling-flor")
    try {
      const response = await fetch(`/api/game/${roomId}/call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "flor" }),
      })

      const data = await response.json()
      if (!data.success) {
        toast({
          title: "Error",
          description: data.error || "No se pudo cantar flor",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cantar flor",
        variant: "destructive",
      })
    } finally {
      setActionInProgress(null)
    }
  }, [roomId, user, actionInProgress, toast])

  const handleAcceptCall = useCallback(async () => {
    if (!user || actionInProgress) return

    setActionInProgress("accepting-call")
    try {
      const response = await fetch(`/api/game/${roomId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accept: true }),
      })

      const data = await response.json()
      if (!data.success) {
        toast({
          title: "Error",
          description: data.error || "No se pudo aceptar la jugada",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al aceptar la jugada",
        variant: "destructive",
      })
    } finally {
      setActionInProgress(null)
    }
  }, [roomId, user, actionInProgress, toast])

  const handleRejectCall = useCallback(async () => {
    if (!user || actionInProgress) return

    setActionInProgress("rejecting-call")
    try {
      const response = await fetch(`/api/game/${roomId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accept: false }),
      })

      const data = await response.json()
      if (!data.success) {
        toast({
          title: "Error",
          description: data.error || "No se pudo rechazar la jugada",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al rechazar la jugada",
        variant: "destructive",
      })
    } finally {
      setActionInProgress(null)
    }
  }, [roomId, user, actionInProgress, toast])

  const playerNames =
    room?.players?.reduce(
      (acc, player) => {
        acc[player.player_id] = player.profiles?.display_name || "Jugador"
        return acc
      },
      {} as { [key: string]: string },
    ) || {}

  const isMyTurn = gameState?.turnPlayerId === user?.id
  const canStartGame = room?.status === "waiting" && room?.players?.length === 2
  const gameInProgress = room?.status === "playing"

  if (roomLoading || gameLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <div>No autorizado</div>
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-primary">Sala: {roomId}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Jugador: {user.user_metadata?.display_name || "Jugador"}</span>
              <div className="flex items-center gap-1">
                <Wifi className="h-3 w-3 text-green-600" />
                <span className="text-green-600">Conectado</span>
              </div>
              {room && <span>Jugadores: {room.players?.length || 0}/2</span>}
              {gameState?.config && (
                <div className="flex items-center gap-1">
                  <Settings className="h-3 w-3" />
                  <span>{gameState.config.maxPoints}pts</span>
                  {gameState.config.withFlor && <Flower className="h-3 w-3" />}
                </div>
              )}
              {gameInProgress && isMyTurn && <span className="text-amber-600 font-medium">Tu turno</span>}
            </div>
          </div>
        </div>

        {room?.status === "waiting" ? (
          /* Waiting Room */
          <div className="flex items-center justify-center min-h-96">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-center">Esperando Jugadores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {room.players?.map((player) => (
                    <div key={player.player_id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                      <span>{player.profiles?.display_name || "Jugador"}</span>
                      <div className="flex items-center gap-1">
                        <Wifi className="h-3 w-3 text-green-600" />
                        <span className="text-green-600">Conectado</span>
                      </div>
                    </div>
                  ))}
                </div>
                {canStartGame && (
                  <Button onClick={handleStartGame} className="w-full" disabled={actionInProgress === "starting"}>
                    {actionInProgress === "starting" ? "Iniciando..." : "Comenzar Partida"}
                  </Button>
                )}
                {!canStartGame && (room.players?.length || 0) < 2 && (
                  <p className="text-center text-muted-foreground">Esperando que se una otro jugador...</p>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Game Interface */
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Main Game Area */}
            <div className="lg:col-span-3 space-y-6">
              {/* Game Table */}
              {gameState && (
                <GameTable
                  gameState={gameState}
                  playerNames={playerNames}
                  currentPlayerId={user.id}
                  actionInProgress={actionInProgress}
                />
              )}

              {/* Player Hand */}
              {playerHand.length > 0 && (
                <PlayerHand
                  cards={playerHand}
                  onCardPlay={handlePlayCard}
                  disabled={
                    room?.status !== "playing" || gameState?.phase !== "playing" || !isMyTurn || !!actionInProgress
                  }
                  isMyTurn={isMyTurn && gameState?.phase === "playing"}
                  actionInProgress={actionInProgress === "playing-card"}
                />
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Score Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Puntaje</span>
                    {gameState?.config && (
                      <Badge variant="outline" className="text-xs">
                        Hasta {gameState.config.maxPoints}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {gameState?.scores &&
                      Object.entries(gameState.scores).map(([playerId, score]) => (
                        <div key={playerId} className="flex justify-between">
                          <span className={playerId === user.id ? "font-medium" : ""}>
                            {playerNames[playerId] || "Jugador"}
                          </span>
                          <span className="font-bold">{score}</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Game Controls */}
              {gameInProgress && gameState && (
                <Card>
                  <CardContent className="pt-6">
                    <GameControls
                      gameState={gameState}
                      currentPlayerId={user.id}
                      onCallTruco={handleCallTruco}
                      onCallEnvido={handleCallEnvido}
                      onCallFlor={handleCallFlor}
                      onAcceptCall={handleAcceptCall}
                      onRejectCall={handleRejectCall}
                      onSkipPhase={() => {}} // Not implemented yet
                      disabled={!!actionInProgress}
                      actionInProgress={actionInProgress}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Game Messages */}
              <GameMessages messages={messages} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
