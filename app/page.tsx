"use client"

import { useState } from "react"
import { StartScreen } from "@/components/truco/start-screen"
import { LobbyScreen } from "@/components/truco/lobby-screen"
import { GameScreen } from "@/components/truco/game-screen"
import { AuthScreen } from "@/components/auth/auth-screen"
import { useAuth } from "@/hooks/use-auth"
import type { GameConfig } from "@/types/truco"

type Screen = "start" | "lobby" | "game"

export default function TrucoGame() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("start")
  const [roomId, setRoomId] = useState("")
  const [gameConfig, setGameConfig] = useState<GameConfig>({ maxPoints: 15, withFlor: true })
  const { user, loading } = useAuth()

  if (loading) {
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
    return <AuthScreen onAuthenticated={() => setCurrentScreen("start")} />
  }

  const handleStartGame = (config: GameConfig) => {
    setGameConfig(config)
    setCurrentScreen("lobby")
  }

  const handleJoinRoom = (id: string) => {
    setRoomId(id)
    setCurrentScreen("game")
  }

  const handleBackToLobby = () => {
    setCurrentScreen("lobby")
  }

  return (
    <main className="min-h-screen bg-background">
      {currentScreen === "start" && <StartScreen onStart={handleStartGame} />}
      {currentScreen === "lobby" && (
        <LobbyScreen gameConfig={gameConfig} onJoinRoom={handleJoinRoom} onBack={() => setCurrentScreen("start")} />
      )}
      {currentScreen === "game" && <GameScreen roomId={roomId} onBack={handleBackToLobby} />}
    </main>
  )
}
