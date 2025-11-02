"use client"

import { useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface TimelineEvent {
  agent: string
  domain: string
  role: string
  action: string
  message: string
  timestamp: string
  data?: Record<string, any>
}

interface TimelineFeedProps {
  events: TimelineEvent[]
  filter: string
  onFilterChange: (filter: string) => void
  onClear: () => void
}

const agentColors: Record<string, { bg: string; text: string; dot: string }> = {
  Phill: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  Carl: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  Gary: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
}

export default function TimelineFeed({ events, filter, onFilterChange, onClear }: TimelineFeedProps) {
  const timelineEndRef = useRef<HTMLDivElement>(null)

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" })
    } catch {
      return timestamp
    }
  }

  const filteredEvents = events.filter((event) => {
    if (filter === "all") return true
    return event.agent === filter
  })

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    timelineEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [filteredEvents])

  return (
    <Card className="h-full flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Timeline Feed</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <select
              value={filter}
              onChange={(e) => onFilterChange(e.target.value)}
              className="px-3 py-1.5 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="all">All Agents</option>
              <option value="Phill">Phill</option>
              <option value="Carl">Carl</option>
              <option value="Gary">Gary</option>
            </select>
            <button
              onClick={onClear}
              className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-sm hover:bg-secondary/80 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {filteredEvents.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <p className="text-sm">No timeline events</p>
            <p className="text-xs mt-1">
              {filter === "all" ? "Events will appear here as agents act" : `No events for ${filter}`}
            </p>
          </div>
        ) : (
          filteredEvents.map((event, idx) => {
            const agentColor = agentColors[event.agent] || agentColors.Phill
            return (
              <div
                key={idx}
                className={`p-4 rounded-lg border-l-4 transition-all ${agentColor.bg}`}
                style={{ borderLeftColor: agentColor.dot }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${agentColor.dot}`}></div>
                  <Badge variant="secondary" className={`${agentColor.text} bg-transparent border-0 px-0`}>
                    {event.agent}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{formatTimestamp(event.timestamp)}</span>
                </div>
                <div className="text-sm text-foreground">
                  <span className="font-medium">{event.action}:</span> {event.message}
                </div>
                {event.data && Object.keys(event.data).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(event.data).map(([key, value]) => (
                        <Badge key={key} variant="outline" className="text-xs">
                          <span className="font-medium">{key}:</span> {String(value)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
        <div ref={timelineEndRef} />
      </div>
    </Card>
  )
}

