import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { TrucoEngine } from "@/lib/truco-engine"

export async function POST(request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params
    const { type, callType } = await request.json() // type: 'truco' | 'envido' | 'flor', callType for envido variants
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current game state
    const { data: gameState, error: gameError } = await supabase
      .from("game_states")
      .select("*")
      .eq("room_id", roomId)
      .single()

    if (gameError || !gameState) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    // Apply call using TrucoEngine
    const engine = new TrucoEngine()
    let updatedState

    switch (type) {
      case "truco":
        updatedState = engine.callTruco(gameState, user.id)
        break
      case "envido":
        updatedState = engine.callEnvido(gameState, user.id, callType)
        break
      case "flor":
        updatedState = engine.callFlor(gameState, user.id)
        break
      default:
        return NextResponse.json({ error: "Invalid call type" }, { status: 400 })
    }

    // Update game state in database
    const { error: updateError } = await supabase
      .from("game_states")
      .update({
        current_call: updatedState.call,
        call_accepted: updatedState.accepted,
        phase: updatedState.phase,
        envido_points: updatedState.envidoPoints,
        flor_called: updatedState.florCalled,
        envido_called: updatedState.envidoCalled,
      })
      .eq("room_id", roomId)

    if (updateError) throw updateError

    // Record the move for real-time updates
    const { error: moveError } = await supabase.from("game_moves").insert({
      room_id: roomId,
      player_id: user.id,
      move_type: `call_${type}`,
      move_data: { type, callType, call: updatedState.call },
    })

    if (moveError) throw moveError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error making call:", error)
    return NextResponse.json({ error: "Failed to make call" }, { status: 500 })
  }
}
