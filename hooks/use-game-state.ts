"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import type { RealtimeChannel } from "@supabase/supabase-js"
import type { GameState } from "@/types/truco"

interface GameMove {
  id: string
  player_id: string
  move_type: string
  move_data: any
  created_at: string
}

export function useGameState(roomId: string | null, userId: string | null) {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [playerHand, setPlayerHand] = useState<any[]>([])
  const [recentMoves, setRecentMoves] = useState<GameMove[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!roomId || !userId) {
      setGameState(null)
      setPlayerHand([])
      setRecentMoves([])
      setLoading(false)
      return
    }

    let channel: RealtimeChannel

    const fetchGameState = async () => {
      try {
        const { data, error } = await supabase.from("game_states").select("*").eq("room_id", roomId).single()

        if (error) {
          if (error.code === "PGRST116") {
            // No game state yet (game not started)
            setGameState(null)
            setPlayerHand([])
          } else {
            throw error
          }
        } else {
          // Convert database format to GameState format
          const convertedState: GameState = {
            deck: data.deck,
            hands: data.hands,
            table: data.table_cards,
            wonTricks: data.won_tricks,
            turnPlayerId: data.turn_player_id,
            handStarterId: data.hand_starter_id,
            roundNumber: data.round_number,
            call: data.current_call,
            accepted: data.call_accepted,
            scores: data.scores,
            winnerId: data.winner_id,
            phase: data.phase,
            config: {
              maxPoints: data.max_points || 15,
              withFlor: data.with_flor || true,
            },
            envidoPoints: data.envido_points || {},
            florCalled: data.flor_called,
            envidoCalled: data.envido_called,
          }

          setGameState(convertedState)
          setPlayerHand(convertedState.hands[userId] || [])
        }

        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch game state")
        setGameState(null)
        setPlayerHand([])
      } finally {
        setLoading(false)
      }
    }

    const fetchRecentMoves = async () => {
      try {
        const { data, error } = await supabase
          .from("game_moves")
          .select("*")
          .eq("room_id", roomId)
          .order("created_at", { ascending: false })
          .limit(10)

        if (error) throw error
        setRecentMoves(data || [])
      } catch (err) {
        console.error("Failed to fetch recent moves:", err)
      }
    }

    const setupRealtimeSubscription = () => {
      channel = supabase
        .channel(`game-${roomId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "game_states",
            filter: `room_id=eq.${roomId}`,
          },
          () => {
            fetchGameState()
          },
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "game_moves",
            filter: `room_id=eq.${roomId}`,
          },
          (payload) => {
            setRecentMoves((prev) => [payload.new as GameMove, ...prev.slice(0, 9)])
            fetchGameState() // Refresh game state when new moves are made
          },
        )
        .subscribe()
    }

    fetchGameState()
    fetchRecentMoves()
    setupRealtimeSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [roomId, userId, supabase])

  return { gameState, playerHand, recentMoves, loading, error }
}
