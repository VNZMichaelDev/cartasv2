import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { code, roomId } = await request.json()

    let room
    if (code) {
      // Join by code
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select("id, status")
        .eq("code", code.toUpperCase())
        .eq("status", "waiting")
        .single()

      if (roomError || !roomData) {
        return NextResponse.json({ error: "Room not found or not available" }, { status: 404 })
      }
      room = roomData
    } else if (roomId) {
      // Join by room ID
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select("id, status")
        .eq("id", roomId)
        .eq("status", "waiting")
        .single()

      if (roomError || !roomData) {
        return NextResponse.json({ error: "Room not found or not available" }, { status: 404 })
      }
      room = roomData
    } else {
      return NextResponse.json({ error: "Code or roomId required" }, { status: 400 })
    }

    // Check if room is full (max 2 players for Truco)
    const { data: players, error: playersError } = await supabase
      .from("room_players")
      .select("player_id")
      .eq("room_id", room.id)
      .eq("connected", true)

    if (playersError) throw playersError

    if (players && players.length >= 2) {
      return NextResponse.json({ error: "Room is full" }, { status: 400 })
    }

    // Check if player is already in room
    const existingPlayer = players?.find((p) => p.player_id === user.id)
    if (existingPlayer) {
      return NextResponse.json({
        success: true,
        roomId: room.id,
        message: "Already in room",
      })
    }

    // Add player to room
    const { error: joinError } = await supabase.from("room_players").insert({
      room_id: room.id,
      player_id: user.id,
    })

    if (joinError) throw joinError

    return NextResponse.json({
      success: true,
      roomId: room.id,
    })
  } catch (error) {
    console.error("Error joining room:", error)
    return NextResponse.json({ error: "Failed to join room" }, { status: 500 })
  }
}
