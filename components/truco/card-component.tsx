"use client"

import type { Card } from "@/types/truco"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface CardProps {
  card: Card
  onClick?: () => void
  disabled?: boolean
  size?: "sm" | "md" | "lg"
  faceDown?: boolean
}

const SUIT_SYMBOLS = {
  espadas: "♠",
  bastos: "♣",
  oros: "♦",
  copas: "♥",
}

const SUIT_COLORS = {
  espadas: "text-gray-900",
  bastos: "text-gray-900",
  oros: "text-amber-600",
  copas: "text-red-600",
}

const RANK_DISPLAY = {
  1: "A",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  10: "J",
  11: "Q",
  12: "K",
}

function getCardImagePath(card: Card): string {
  // Convert suit and rank to image filename format
  const suitMap = {
    espadas: "spades",
    bastos: "clubs",
    oros: "diamonds",
    copas: "hearts",
  }

  const rankMap = {
    1: "ace",
    2: "2",
    3: "3",
    4: "4",
    5: "5",
    6: "6",
    7: "7",
    10: "jack",
    11: "queen",
    12: "king",
  }

  return `/cards/${rankMap[card.rank]}_of_${suitMap[card.suit]}.png`
}

export function CardComponent({ card, onClick, disabled = false, size = "md", faceDown = false }: CardProps) {
  const [imageError, setImageError] = useState(false)

  const sizeClasses = {
    sm: "w-12 h-16 text-xs",
    md: "w-16 h-24 text-sm",
    lg: "w-20 h-28 text-base",
  }

  if (faceDown) {
    return (
      <div
        className={cn(
          "bg-gradient-to-br from-blue-900 to-blue-700 border-2 border-blue-800 rounded-lg flex items-center justify-center cursor-pointer shadow-md",
          sizeClasses[size],
          disabled && "opacity-50 cursor-not-allowed",
        )}
        onClick={!disabled ? onClick : undefined}
      >
        <div className="text-blue-200 font-bold text-lg">?</div>
      </div>
    )
  }

  const useImage = (card.imageUrl || !imageError) && !imageError
  const imagePath = card.imageUrl || getCardImagePath(card)

  if (useImage) {
    return (
      <div
        className={cn(
          "bg-white border-2 border-gray-300 rounded-lg overflow-hidden cursor-pointer shadow-md hover:shadow-lg transition-all duration-200 relative",
          sizeClasses[size],
          disabled && "opacity-50 cursor-not-allowed",
          onClick && !disabled && "hover:scale-105 hover:border-primary",
        )}
        onClick={!disabled ? onClick : undefined}
      >
        <img
          src={imagePath || "/placeholder.svg"}
          alt={`${RANK_DISPLAY[card.rank]} de ${card.suit}`}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
          loading="lazy"
        />
        {onClick && !disabled && (
          <div className="absolute inset-0 bg-black/0 hover:bg-black/5 transition-colors duration-200" />
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "bg-white border-2 border-gray-300 rounded-lg flex flex-col items-center justify-between p-1 cursor-pointer shadow-md hover:shadow-lg transition-all duration-200",
        sizeClasses[size],
        disabled && "opacity-50 cursor-not-allowed",
        onClick && !disabled && "hover:scale-105 hover:border-primary",
      )}
      onClick={!disabled ? onClick : undefined}
    >
      <div className={cn("font-bold", SUIT_COLORS[card.suit])}>{RANK_DISPLAY[card.rank]}</div>
      <div className={cn("text-2xl", SUIT_COLORS[card.suit])}>{SUIT_SYMBOLS[card.suit]}</div>
      <div className={cn("font-bold rotate-180", SUIT_COLORS[card.suit])}>{RANK_DISPLAY[card.rank]}</div>
    </div>
  )
}
