"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import AgentCard from "./agent-card"

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
}

interface WarRoomModalProps {
  isOpen: boolean
  onClose: () => void
  warRoom: WarRoom | null
  agents: AgentState[]
}

export default function WarRoomModal({ isOpen, onClose, warRoom, agents }: WarRoomModalProps) {
  if (!isOpen || !warRoom) return null

  const participantsInRoom = agents.filter((agent) => agent.war_room_id === warRoom.id)

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div
        className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl z-50 animate-in zoom-in-95 fade-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="w-full max-h-[80vh] overflow-hidden border-2 border-blue-500/50">
          <div className="p-6 bg-gradient-to-b from-blue-500/10 to-background">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">War Room</h2>
                <p className="text-sm text-muted-foreground mt-1">ID: {warRoom.id}</p>
                {warRoom.incident_id && (
                  <p className="text-xs text-muted-foreground mt-1">Incident: {warRoom.incident_id}</p>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-background/60">
                <CloseIcon />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">Active Collaboration</p>
                <span className="text-xs text-muted-foreground">
                  {warRoom.participants.length} participant{warRoom.participants.length !== 1 ? "s" : ""}
                </span>
              </div>

              {participantsInRoom.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 max-h-[50vh] overflow-y-auto">
                  {participantsInRoom.map((agent) => (
                    <div key={agent.name}>
                      <AgentCard
                        name={agent.name as "Phill" | "Carl" | "Gary"}
                        status={agent.status}
                        domain={agent.domain}
                        war_room_id={agent.war_room_id}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <p className="text-sm">No active participants</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </>
  )
}

