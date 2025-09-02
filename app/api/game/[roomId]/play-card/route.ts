import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { TrucoEngine } from "@/lib/truco-engine"

export async function POST(request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params
    const { cardId } = await request.json()
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

    // Verify it's player's turn
    if (gameState.turn_player_id !== user.id) {
      return NextResponse.json({ error: "Not your turn" }, { status: 400 })
    }

    // Apply move using TrucoEngine
    const engine = new TrucoEngine()
    const updatedState = engine.playCard(gameState, user.id, cardId)

    // Update game state in database
    const { error: updateError } = await supabase
      .from("game_states")
      .update({
        hands: updatedState.hands,
        table_cards: updatedState.table,
        won_tricks: updatedState.wonTricks,
        turn_player_id: updatedState.turnPlayerId,
        round_number: updatedState.roundNumber,
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
      move_type: "play_card",
      move_data: { cardId, card: updatedState.table.plays.find((p) => p.playerId === user.id)?.card },
    })

    if (moveError) throw moveError

    // Update room status if game ended
    if (updatedState.winnerId) {
      await supabase.from("rooms").update({ status: "ended" }).eq("id", roomId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error playing card:", error)
    return NextResponse.json({ error: "Failed to play card" }, { status: 500 })
  }
}
