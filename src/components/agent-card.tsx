"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface AgentCardProps {
  name: "Phill" | "Carl" | "Gary"
  status: "stable" | "active" | "incident"
  domain: string
  war_room_id?: string | null
  last_change?: string
  onOpenWarRoom?: () => void
}

const statusConfig = {
  stable: {
    color: "bg-green-500",
    label: "Stable",
    ring: "ring-green-500/30",
  },
  active: {
    color: "bg-amber-500",
    label: "Active",
    ring: "ring-amber-500/30",
  },
  incident: {
    color: "bg-red-500",
    label: "Incident",
    ring: "ring-red-500/30",
  },
}

const agentRoles = {
  Phill: "Detection",
  Carl: "Investigation",
  Gary: "Resolution",
}

const agentColors = {
  Phill: "bg-blue-500",
  Carl: "bg-purple-500",
  Gary: "bg-green-500",
}

export default function AgentCard({ 
  name, 
  status, 
  domain, 
  war_room_id, 
  last_change,
  onOpenWarRoom 
}: AgentCardProps) {
  const config = statusConfig[status]
  const role = agentRoles[name]
  const avatarColor = agentColors[name]
  const isInWarRoom = !!war_room_id
  const [isPulsing, setIsPulsing] = useState(false)
  const [timeSinceChange, setTimeSinceChange] = useState<string>("")

  // Trigger pulse animation on status change
  useEffect(() => {
    setIsPulsing(true)
    const timer = setTimeout(() => setIsPulsing(false), 1000)
    return () => clearTimeout(timer)
  }, [status])

  // Calculate time since last change
  useEffect(() => {
    if (!last_change) return

    const updateTime = () => {
      const now = new Date()
      const changeTime = new Date(last_change)
      const diffMs = now.getTime() - changeTime.getTime()
      const diffSecs = Math.floor(diffMs / 1000)

      if (diffSecs < 60) {
        setTimeSinceChange(`${diffSecs}s ago`)
      } else if (diffSecs < 3600) {
        setTimeSinceChange(`${Math.floor(diffSecs / 60)}m ago`)
      } else {
        setTimeSinceChange(`${Math.floor(diffSecs / 3600)}h ago`)
      }
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [last_change])

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-300 ${
        isPulsing ? "scale-[1.02]" : ""
      } ${
        isInWarRoom ? "ring-2 ring-blue-500 shadow-lg shadow-blue-500/20" : ""
      } ${status === "incident" ? "ring-2 ring-red-500 shadow-lg shadow-red-500/20" : ""}`}
    >
      <div
        className={`absolute inset-0 ${
          status === "incident" ? "bg-gradient-to-br from-red-500/10 to-transparent" : ""
        } pointer-events-none`}
      />

      <div className="relative p-5">
        {/* Header: Avatar + Name + Role Badge */}
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
            {name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base text-foreground">{name}</h3>
            <Badge variant="secondary" className="mt-1 text-xs">
              {role}
            </Badge>
          </div>
          <div
            className={`w-3 h-3 rounded-full ${config.color} ring-4 ${config.ring} ${
              status === "active" || status === "incident" ? "animate-pulse" : ""
            } transition-all`}
          />
        </div>

        {/* Status Pill */}
        <div className="mb-4">
          <Badge 
            variant="outline" 
            className={`${config.color} text-white border-0 px-3 py-1`}
          >
            {config.label}
          </Badge>
        </div>

        {/* Meta Information */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Domain</span>
            <span className="font-medium text-foreground">{domain}</span>
          </div>
          {isInWarRoom && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">War Room</span>
              <span className="font-mono text-xs text-blue-600 font-semibold">
                {war_room_id}
              </span>
            </div>
          )}
        </div>

        {/* Footer: Open War Room Button + Time */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <Button
              size="sm"
              variant={isInWarRoom ? "default" : "ghost"}
              disabled={!isInWarRoom}
              onClick={onOpenWarRoom}
              className="text-xs"
            >
              {isInWarRoom ? "Open war room" : "No active war room"}
            </Button>
            {timeSinceChange && (
              <span className="text-xs text-muted-foreground">
                {timeSinceChange}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

