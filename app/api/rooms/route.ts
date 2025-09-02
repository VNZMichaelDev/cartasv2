import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Get waiting rooms with player count
    const { data: rooms, error } = await supabase
      .from("rooms")
      .select(`
        id,
        code,
        status,
        max_points,
        with_flor,
        created_at,
        creator_id,
        profiles!creator_id (display_name),
        room_players (
          player_id,
          connected,
          profiles (display_name)
        )
      `)
      .eq("status", "waiting")
      .order("created_at", { ascending: false })

    if (error) throw error

    const sanitizedRooms =
      rooms?.map((room) => ({
        id: room.id,
        code: room.code,
        status: room.status,
        playerCount: room.room_players?.filter((p) => p.connected).length || 0,
        maxPoints: room.max_points,
        withFlor: room.with_flor,
        createdAt: room.created_at,
        creator: room.profiles?.display_name,
      })) || []

    return NextResponse.json({ rooms: sanitizedRooms })
  } catch (error) {
    console.error("Error fetching rooms:", error)
    return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { maxPoints = 15, withFlor = true } = await request.json()

    // Generate unique room code
    const { data: codeResult, error: codeError } = await supabase.rpc("generate_room_code")

    if (codeError) throw codeError

    // Create room
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .insert({
        creator_id: user.id,
        code: codeResult,
        max_points: maxPoints,
        with_flor: withFlor,
      })
      .select()
      .single()

    if (roomError) throw roomError

    // Add creator as first player
    const { error: playerError } = await supabase.from("room_players").insert({
      room_id: room.id,
      player_id: user.id,
    })

    if (playerError) throw playerError

    return NextResponse.json({
      success: true,
      roomId: room.id,
      code: room.code,
    })
  } catch (error) {
    console.error("Error creating room:", error)
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 })
  }
}
