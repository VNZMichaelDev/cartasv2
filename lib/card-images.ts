import type { Card, Suit, Rank } from "@/types/truco"

// Card image mapping for easy management
export const CARD_IMAGE_MAP: Record<string, string> = {
  // Espadas (Spades)
  "1-espadas": "/cards/ace_of_spades.png",
  "2-espadas": "/cards/2_of_spades.png",
  "3-espadas": "/cards/3_of_spades.png",
  "4-espadas": "/cards/4_of_spades.png",
  "5-espadas": "/cards/5_of_spades.png",
  "6-espadas": "/cards/6_of_spades.png",
  "7-espadas": "/cards/7_of_spades.png",
  "10-espadas": "/cards/jack_of_spades.png",
  "11-espadas": "/cards/queen_of_spades.png",
  "12-espadas": "/cards/king_of_spades.png",

  // Bastos (Clubs)
  "1-bastos": "/cards/ace_of_clubs.png",
  "2-bastos": "/cards/2_of_clubs.png",
  "3-bastos": "/cards/3_of_clubs.png",
  "4-bastos": "/cards/4_of_clubs.png",
  "5-bastos": "/cards/5_of_clubs.png",
  "6-bastos": "/cards/6_of_clubs.png",
  "7-bastos": "/cards/7_of_clubs.png",
  "10-bastos": "/cards/jack_of_clubs.png",
  "11-bastos": "/cards/queen_of_clubs.png",
  "12-bastos": "/cards/king_of_clubs.png",

  // Oros (Diamonds)
  "1-oros": "/cards/ace_of_diamonds.png",
  "2-oros": "/cards/2_of_diamonds.png",
  "3-oros": "/cards/3_of_diamonds.png",
  "4-oros": "/cards/4_of_diamonds.png",
  "5-oros": "/cards/5_of_diamonds.png",
  "6-oros": "/cards/6_of_diamonds.png",
  "7-oros": "/cards/7_of_diamonds.png",
  "10-oros": "/cards/jack_of_diamonds.png",
  "11-oros": "/cards/queen_of_diamonds.png",
  "12-oros": "/cards/king_of_diamonds.png",

  // Copas (Hearts)
  "1-copas": "/cards/ace_of_hearts.png",
  "2-copas": "/cards/2_of_hearts.png",
  "3-copas": "/cards/3_of_hearts.png",
  "4-copas": "/cards/4_of_hearts.png",
  "5-copas": "/cards/5_of_hearts.png",
  "6-copas": "/cards/6_of_hearts.png",
  "7-copas": "/cards/7_of_hearts.png",
  "10-copas": "/cards/jack_of_hearts.png",
  "11-copas": "/cards/queen_of_hearts.png",
  "12-copas": "/cards/king_of_hearts.png",
}

export function getCardImageUrl(suit: Suit, rank: Rank): string | undefined {
  const key = `${rank}-${suit}`
  return CARD_IMAGE_MAP[key]
}

export function createCardWithImage(suit: Suit, rank: Rank, id: string): Card {
  return {
    suit,
    rank,
    id,
    imageUrl: getCardImageUrl(suit, rank),
  }
}

// Helper to check if all card images are available
export function getAvailableCardImages(): string[] {
  return Object.values(CARD_IMAGE_MAP)
}

// Helper to get missing card images (for debugging)
export function getMissingCardImages(): string[] {
  const allCards: string[] = []
  const suits: Suit[] = ["espadas", "bastos", "oros", "copas"]
  const ranks: Rank[] = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12]

  suits.forEach((suit) => {
    ranks.forEach((rank) => {
      const key = `${rank}-${suit}`
      if (!CARD_IMAGE_MAP[key]) {
        allCards.push(key)
      }
    })
  })

  return allCards
}
