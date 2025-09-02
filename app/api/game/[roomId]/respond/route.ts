import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { TrucoEngine } from "@/lib/truco-engine"

export async function POST(request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params
    const { accept } = await request.json()
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

    if (!gameState.current_call) {
      return NextResponse.json({ error: "No call to respond to" }, { status: 400 })
    }

    // Apply response using TrucoEngine
    const engine = new TrucoEngine()
    const updatedState = engine.respondToCall(gameState, user.id, accept)

    // Update game state in database
    const { error: updateError } = await supabase
      .from("game_states")
      .update({
        current_call: updatedState.call,
        call_accepted: updatedState.accepted,
        scores: updatedState.scores,
        winner_id: updatedState.winnerId,
        phase: updatedState.phase,
      })
      .eq("room_id", roomId)

    if (updateError) throw updateError

    // Record the move for real-time updates
    const { error: moveError } = await supabase.from("game_moves").insert({
      room_id: roomId,
      player_id: user.id,
      move_type: accept ? "accept_call" : "reject_call",
      move_data: { accept, call: gameState.current_call },
    })

    if (moveError) throw moveError

    // Update room status if game ended
    if (updatedState.winnerId) {
      await supabase.from("rooms").update({ status: "ended" }).eq("id", roomId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error responding to call:", error)
    return NextResponse.json({ error: "Failed to respond to call" }, { status: 500 })
  }
}
