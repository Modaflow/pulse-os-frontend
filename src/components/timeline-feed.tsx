"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface TimelineEvent {
  agent: string
  domain: string
  role: string
  action: string
  message: string
  timestamp: string
  severity?: "high" | "medium" | "low"
  data?: Record<string, any>
}

interface TimelineFeedProps {
  events: TimelineEvent[]
  agentFilter: string
  severityFilter: string
  searchQuery: string
  onClear: () => void
}

const agentColors: Record<string, { bg: string; text: string; dot: string }> = {
  Phill: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  Carl: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  Gary: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
}

const severityColors = {
  high: "bg-red-100 text-red-700 border-red-300",
  medium: "bg-amber-100 text-amber-700 border-amber-300",
  low: "bg-blue-100 text-blue-700 border-blue-300",
}

export default function TimelineFeed({ 
  events, 
  agentFilter, 
  severityFilter, 
  searchQuery, 
  onClear 
}: TimelineFeedProps) {
  const timelineEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)

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

  const filteredEvents = events.filter((event) => {
    // Agent filter
    if (agentFilter !== "all" && event.agent.toLowerCase() !== agentFilter) {
      return false
    }

    // Severity filter
    if (severityFilter !== "all" && event.severity !== severityFilter) {
      return false
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        event.message.toLowerCase().includes(query) ||
        event.action.toLowerCase().includes(query) ||
        event.agent.toLowerCase().includes(query) ||
        event.domain.toLowerCase().includes(query)
      )
    }

    return true
  })

  // Detect if user has scrolled up
  const handleScroll = () => {
    if (!scrollContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
    setAutoScroll(isAtBottom)
  }

  // Auto-scroll to bottom when new events arrive (only if user hasn't scrolled up)
  useEffect(() => {
    if (autoScroll) {
      timelineEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [filteredEvents, autoScroll])

  return (
    <Card className="flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Timeline ({filteredEvents.length})
            </h2>
          </div>
          <Button
            onClick={onClear}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Events List */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-2"
      >
        {filteredEvents.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <p className="text-sm">No events</p>
            <p className="text-xs mt-1">
              {agentFilter !== "all" || severityFilter !== "all" || searchQuery
                ? "Try adjusting your filters"
                : "Events will appear here as agents act"}
            </p>
          </div>
        ) : (
          filteredEvents.map((event, idx) => {
            const agentColor = agentColors[event.agent] || agentColors.Phill
            return (
              <div
                key={idx}
                className="relative pl-4 pb-4 border-l-2 last:pb-0"
                style={{ borderColor: agentColor.dot.replace("bg-", "").replace("500", "300") }}
              >
                {/* Dot */}
                <div 
                  className={`absolute left-0 top-1 -translate-x-1/2 w-3 h-3 rounded-full ${agentColor.dot} ring-4 ring-background`}
                />
                
                {/* Content */}
                <div className="space-y-1.5">
                  {/* Title Line */}
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${agentColor.text}`}>
                      {event.agent}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(event.timestamp)}
                    </span>
                  </div>

                  {/* Message */}
                  <div className="text-sm text-foreground">
                    {event.message}
                  </div>

                  {/* Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {event.severity && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs px-2 py-0 ${severityColors[event.severity]}`}
                      >
                        severity: {event.severity}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs px-2 py-0">
                      domain: {event.domain}
                    </Badge>
                    {event.data && Object.entries(event.data).map(([key, value]) => (
                      <Badge key={key} variant="outline" className="text-xs px-2 py-0">
                        {key}: {String(value)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={timelineEndRef} />
      </div>

      {/* Scroll to bottom button (when user scrolled up) */}
      {!autoScroll && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <Button
            size="sm"
            onClick={() => {
              setAutoScroll(true)
              timelineEndRef.current?.scrollIntoView({ behavior: "smooth" })
            }}
            className="shadow-lg"
          >
            ↓ New events
          </Button>
        </div>
      )}
    </Card>
  )
}

