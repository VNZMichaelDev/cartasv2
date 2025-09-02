"use client"

import { useState } from "react"
import { StartScreen } from "@/components/truco/start-screen"
import { LobbyScreen } from "@/components/truco/lobby-screen"
import { GameScreen } from "@/components/truco/game-screen"
import type { GameConfig } from "@/types/truco"

type Screen = "start" | "lobby" | "game"

export default function TrucoGame() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("start")
  const [roomId, setRoomId] = useState("")
  const [gameConfig, setGameConfig] = useState<GameConfig>({ maxPoints: 15, withFlor: true })
  const [playerName, setPlayerName] = useState("")
  const [playerId, setPlayerId] = useState("")

  if (!playerId) {
    const anonymousId = `player_${Math.random().toString(36).substr(2, 9)}`
    setPlayerId(anonymousId)
  }

  const handleStartGame = (config: GameConfig, name: string) => {
    setGameConfig(config)
    setPlayerName(name)
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
        <LobbyScreen
          gameConfig={gameConfig}
          playerName={playerName}
          playerId={playerId}
          onJoinRoom={handleJoinRoom}
          onBack={() => setCurrentScreen("start")}
        />
      )}
      {currentScreen === "game" && (
        <GameScreen roomId={roomId} playerName={playerName} playerId={playerId} onBack={handleBackToLobby} />
      )}
    </main>
  )
}

