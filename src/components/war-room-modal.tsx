"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const CloseIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

interface WarRoom {
  id: string
  participants: string[]
  status: "active" | "closed"
  incident_id: string | null
  created_at: string
  closed_at: string | null
}

interface AgentState {
  name: string
  status: "stable" | "active" | "incident"
  domain: string
  war_room_id: string | null
  last_change?: string
}

interface WarRoomModalProps {
  isOpen: boolean
  onClose: () => void
  warRoom: WarRoom | null
  agents: AgentState[]
  timelineEvents?: Array<{
    agent: string
    message: string
    timestamp: string
    action: string
  }>
}

const agentColors = {
  Phill: "bg-blue-500",
  Carl: "bg-purple-500",
  Gary: "bg-green-500",
}

const agentRoles = {
  Phill: "Detection",
  Carl: "Investigation",
  Gary: "Resolution",
}

export default function WarRoomModal({ 
  isOpen, 
  onClose, 
  warRoom, 
  agents,
  timelineEvents = []
}: WarRoomModalProps) {
  const [activeTab, setActiveTab] = useState<"activity" | "agents">("agents")

  if (!isOpen || !warRoom) return null

  const participantsInRoom = agents.filter((agent) => agent.war_room_id === warRoom.id)
  
  // Filter timeline events for this war room
  const roomEvents = timelineEvents.filter(event => 
    participantsInRoom.some(agent => agent.name === event.agent)
  ).slice(-20) // Last 20 events

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleTimeString("en-US", { 
        hour: "2-digit", 
        minute: "2-digit", 
        second: "2-digit" 
      })
    } catch {
      return timestamp
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-4xl z-50 animate-in zoom-in-95 fade-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="w-full max-h-[85vh] overflow-hidden border-2 border-blue-500/50 shadow-2xl">
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 border-b border-border">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-foreground">War Room: {warRoom.id}</h2>
                  <span className="text-muted-foreground">·</span>
                  {warRoom.incident_id && (
                    <>
                      <span className="text-lg text-muted-foreground">
                        Incident: {warRoom.incident_id}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={warRoom.status === "active" ? "default" : "secondary"}>
                    {warRoom.status === "active" ? "Active" : "Resolved"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {participantsInRoom.length} participant{participantsInRoom.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose} 
                className="rounded-full hover:bg-background/60"
              >
                <CloseIcon />
              </Button>
            </div>

            {/* Participants Row with Presence */}
            <div className="flex items-center gap-2 mt-4">
              {participantsInRoom.map((agent) => {
                const color = agentColors[agent.name as keyof typeof agentColors]
                const isActive = agent.status === "active" || agent.status === "incident"
                
                return (
                  <div
                    key={agent.name}
                    className="relative group"
                  >
                    <div
                      className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white font-bold shadow-md ${
                        isActive ? "ring-2 ring-amber-500 ring-offset-2" : ""
                      }`}
                      title={agent.name}
                    >
                      {agent.name.charAt(0)}
                    </div>
                    {/* Presence dot */}
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${
                      agent.status === "incident" ? "bg-red-500" :
                      agent.status === "active" ? "bg-amber-500 animate-pulse" :
                      "bg-green-500"
                    }`} />
                    
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                      {agent.name} - {agent.status}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-border bg-muted/30">
            <button
              onClick={() => setActiveTab("agents")}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === "agents"
                  ? "text-foreground border-b-2 border-primary bg-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              Agents
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === "activity"
                  ? "text-foreground border-b-2 border-primary bg-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              Activity
            </button>
          </div>

          {/* Panel Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-240px)]">
            {activeTab === "agents" ? (
              /* Agents Panel */
              <div className="space-y-4">
                {participantsInRoom.length > 0 ? (
                  participantsInRoom.map((agent) => {
                    const color = agentColors[agent.name as keyof typeof agentColors]
                    const role = agentRoles[agent.name as keyof typeof agentRoles]
                    
                    return (
                      <Card key={agent.name} className="p-4">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-full ${color} flex items-center justify-center text-white font-bold text-xl shadow-md flex-shrink-0`}
                          >
                            {agent.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-foreground">{agent.name}</h3>
                              <Badge variant="secondary" className="text-xs">{role}</Badge>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span>Domain: {agent.domain}</span>
                              <span>·</span>
                              <span className={`font-medium ${
                                agent.status === "incident" ? "text-red-600" :
                                agent.status === "active" ? "text-amber-600" :
                                "text-green-600"
                              }`}>
                                {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )
                  })
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    <p className="text-sm">No active participants</p>
                  </div>
                )}
              </div>
            ) : (
              /* Activity Panel */
              <div className="space-y-3">
                {roomEvents.length > 0 ? (
                  roomEvents.map((event, idx) => (
                    <div key={idx} className="relative pl-4 pb-3 border-l-2 border-border last:pb-0">
                      <div className="absolute left-0 top-1 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-background" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {event.agent}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(event.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{event.message}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    <p className="text-sm">No activity recorded</p>
                    <p className="text-xs mt-1">Events will appear here as agents collaborate</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  )
}

