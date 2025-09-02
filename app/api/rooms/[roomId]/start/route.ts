import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { TrucoEngine } from "@/lib/truco-engine"

export async function POST(request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get room and verify user is creator
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select(`
        id,
        creator_id,
        status,
        max_points,
        with_flor,
        room_players (
          player_id,
          connected,
          profiles (id, display_name)
        )
      `)
      .eq("id", roomId)
      .single()

    if (roomError || !room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    if (room.creator_id !== user.id) {
      return NextResponse.json({ error: "Only room creator can start game" }, { status: 403 })
    }

    if (room.status !== "waiting") {
      return NextResponse.json({ error: "Game already started" }, { status: 400 })
    }

    const connectedPlayers = room.room_players?.filter((p) => p.connected) || []
    if (connectedPlayers.length !== 2) {
      return NextResponse.json({ error: "Need exactly 2 players to start" }, { status: 400 })
    }

    // Create initial game state using TrucoEngine
    const players = connectedPlayers.map((p) => ({
      id: p.player_id,
      name: p.profiles?.display_name || "Jugador",
      connected: true,
    }))

    const gameConfig = {
      maxPoints: room.max_points,
      withFlor: room.with_flor,
    }

    const engine = new TrucoEngine()
    const gameState = engine.createGame(players, gameConfig)

    // Save game state to database
    const { error: gameError } = await supabase.from("game_states").insert({
      room_id: roomId,
      deck: gameState.deck,
      hands: gameState.hands,
      table_cards: gameState.table,
      won_tricks: gameState.wonTricks,
      turn_player_id: gameState.turnPlayerId,
      hand_starter_id: gameState.handStarterId,
      round_number: gameState.roundNumber,
      current_call: gameState.call,
      call_accepted: gameState.accepted,
      scores: gameState.scores,
      phase: gameState.phase,
      envido_points: gameState.envidoPoints,
      flor_called: gameState.florCalled,
      envido_called: gameState.envidoCalled,
    })

    if (gameError) throw gameError

    // Update room status
    const { error: updateError } = await supabase.from("rooms").update({ status: "playing" }).eq("id", roomId)

    if (updateError) throw updateError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error starting game:", error)
    return NextResponse.json({ error: "Failed to start game" }, { status: 500 })
  }
}
