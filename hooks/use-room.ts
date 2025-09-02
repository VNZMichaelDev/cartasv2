"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface Room {
  id: string
  code: string | null
  status: "waiting" | "playing" | "ended"
  max_points: number
  with_flor: boolean
  created_at: string
  players: Array<{
    player_id: string
    connected: boolean
    profiles: {
      id: string
      display_name: string
    }
  }>
}

export function useRoom(roomId: string | null) {
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!roomId) {
      setRoom(null)
      setLoading(false)
      return
    }

    let channel: RealtimeChannel

    const fetchRoom = async () => {
      try {
        const { data, error } = await supabase
          .from("rooms")
          .select(`
            id,
            code,
            status,
            max_points,
            with_flor,
            created_at,
            room_players (
              player_id,
              connected,
              profiles (
                id,
                display_name
              )
            )
          `)
          .eq("id", roomId)
          .single()

        if (error) throw error
        setRoom(data as Room)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch room")
        setRoom(null)
      } finally {
        setLoading(false)
      }
    }

    const setupRealtimeSubscription = () => {
      channel = supabase
        .channel(`room-${roomId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "rooms",
            filter: `id=eq.${roomId}`,
          },
          () => {
            fetchRoom()
          },
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "room_players",
            filter: `room_id=eq.${roomId}`,
          },
          () => {
            fetchRoom()
          },
        )
        .subscribe()
    }

    fetchRoom()
    setupRealtimeSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [roomId, supabase])

  return { room, loading, error }
}
