"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface RoomListItem {
  id: string
  code: string | null
  status: string
  playerCount: number
  maxPoints: number
  withFlor: boolean
  createdAt: string
  creator: string
}

export function useRoomsList() {
  const [rooms, setRooms] = useState<RoomListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    let channel: RealtimeChannel

    const fetchRooms = async () => {
      try {
        const response = await fetch("/api/rooms")
        const data = await response.json()

        if (!response.ok) throw new Error(data.error)
        setRooms(data.rooms || [])
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch rooms")
        setRooms([])
      } finally {
        setLoading(false)
      }
    }

    const setupRealtimeSubscription = () => {
      channel = supabase
        .channel("rooms-list")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "rooms",
          },
          () => {
            fetchRooms()
          },
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "room_players",
          },
          () => {
            fetchRooms()
          },
        )
        .subscribe()
    }

    fetchRooms()
    setupRealtimeSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [supabase])

  const refreshRooms = () => {
    setLoading(true)
    fetchRooms()
  }

  return { rooms, loading, error, refreshRooms }
}

async function fetchRooms() {
  const response = await fetch("/api/rooms")
  const data = await response.json()
  if (!response.ok) throw new Error(data.error)
  return data.rooms || []
}
