"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface AgentCardProps {
  name: "Phill" | "Carl" | "Gary"
  status: "stable" | "active" | "incident"
  domain: string
  war_room_id?: string | null
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

const agentDescriptions = {
  Phill: "Detection Agent",
  Carl: "Investigation Agent",
  Gary: "Resolution Agent",
}

export default function AgentCard({ name, status, domain, war_room_id }: AgentCardProps) {
  const config = statusConfig[status]
  const description = agentDescriptions[name]
  const isInWarRoom = !!war_room_id

  return (
    <div className="animate-in zoom-in duration-300">
      <Card
        className={`relative overflow-hidden transition-all duration-300 ${
          isInWarRoom ? "ring-2 ring-blue-500 shadow-lg shadow-blue-500/20" : ""
        } ${status === "incident" ? "ring-2 ring-red-500 shadow-lg shadow-red-500/20" : ""}`}
      >
        <div
          className={`absolute inset-0 ${
            status === "incident" ? "bg-gradient-to-br from-red-500/10 to-transparent" : ""
          } pointer-events-none`}
        />

        <div className="relative p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-foreground">{name}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <div
              className={`w-3 h-3 rounded-full ${config.color} ring-4 ${config.ring} ${
                status === "active" || status === "incident" ? "animate-pulse" : ""
              }`}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant="outline" className={`${config.color} text-white border-0`}>
                {config.label}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Domain</span>
              <Badge variant="secondary">{domain}</Badge>
            </div>
          </div>

          {isInWarRoom && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs font-medium text-blue-500">In War Room: {war_room_id}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

