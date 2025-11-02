"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import AgentCard from "@/components/agent-card";
import TimelineFeed from "@/components/timeline-feed";
import WarRoomModal from "@/components/war-room-modal";

interface AgentState {
  name: string;
  status: "stable" | "active" | "incident";
  domain: string;
  war_room_id: string | null;
}

interface WarRoom {
  id: string;
  participants: string[];
  status: "active" | "closed";
  incident_id: string | null;
  created_at: string;
  closed_at: string | null;
}

interface SystemState {
  agents: AgentState[];
  war_rooms: WarRoom[];
}

interface TimelineEvent {
  agent: string;
  domain: string;
  role: string;
  action: string;
  message: string;
  timestamp: string;
  data?: Record<string, any>;
}

interface WebSocketMessage {
  type: string;
  timestamp: string;
  data: any;
}

// Alert icon component
const AlertIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
      clipRule="evenodd"
    />
  </svg>
);

export default function Home() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";
  const wsUrl = backendUrl.replace("http://", "ws://").replace("https://", "wss://") + "/events";
  
  const [systemState, setSystemState] = useState<SystemState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [timelineFilter, setTimelineFilter] = useState<string>("all");
  const [demoMode, setDemoMode] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [selectedWarRoom, setSelectedWarRoom] = useState<WarRoom | null>(null);
  const [isWarRoomModalOpen, setIsWarRoomModalOpen] = useState(false);
  
  const demoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { connected, messages, error: wsError, send } = useWebSocket(wsUrl);

  const showNotification = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const fetchState = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/state`);
      if (!response.ok) throw new Error("Failed to fetch state");
      const data = await response.json();
      setSystemState(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch state");
      showNotification("Failed to fetch state", "error");
    } finally {
      setLoading(false);
    }
  }, [backendUrl, showNotification]);

  const triggerSimulation = useCallback(async () => {
    try {
      setTriggering(true);
      setError(null);
      const response = await fetch(`${backendUrl}/trigger`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to trigger simulation");
      const data = await response.json();
      showNotification("Simulation triggered successfully", "success");
      setTimeout(() => fetchState(), 1000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to trigger simulation";
      setError(errorMsg);
      showNotification(errorMsg, "error");
    } finally {
      setTriggering(false);
    }
  }, [backendUrl, showNotification, fetchState]);

  const resetSystem = useCallback(async () => {
    try {
      setResetting(true);
      setError(null);
      const response = await fetch(`${backendUrl}/reset`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to reset system");
      showNotification("System reset complete", "success");
      setSelectedWarRoom(null);
      setIsWarRoomModalOpen(false);
      setTimeout(() => fetchState(), 500);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to reset system";
      setError(errorMsg);
      showNotification(errorMsg, "error");
    } finally {
      setResetting(false);
    }
  }, [backendUrl, showNotification, fetchState]);

  // Handle WebSocket messages
  useEffect(() => {
    messages.forEach((msg: WebSocketMessage) => {
      switch (msg.type) {
        case "status_update":
          setSystemState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              agents: prev.agents.map((agent) =>
                agent.name === msg.data.name
                  ? {
                      ...agent,
                      status: msg.data.status,
                      war_room_id: msg.data.war_room_id || null,
                    }
                  : agent
              ),
            };
          });
          break;

        case "war_room_update":
          setSystemState((prev) => {
            if (!prev) return prev;
            const existingIndex = prev.war_rooms.findIndex((wr) => wr.id === msg.data.id);
            const updatedWarRooms = [...prev.war_rooms];
            
            if (existingIndex >= 0) {
              updatedWarRooms[existingIndex] = {
                id: msg.data.id,
                participants: msg.data.participants || [],
                status: msg.data.status,
                incident_id: msg.data.incident_id || null,
                created_at: msg.data.created_at,
                closed_at: msg.data.closed_at || null,
              };
            } else {
              updatedWarRooms.push({
                id: msg.data.id,
                participants: msg.data.participants || [],
                status: msg.data.status,
                incident_id: msg.data.incident_id || null,
                created_at: msg.data.created_at,
                closed_at: msg.data.closed_at || null,
              });
            }
            
            return {
              ...prev,
              war_rooms: updatedWarRooms.filter((wr) => wr.status === "active"),
            };
          });
          break;

        case "timeline_event":
          setTimelineEvents((prev) => {
            const newEvents = [...prev, msg.data as TimelineEvent];
            return newEvents.slice(-50);
          });
          break;

        case "system_reset":
          setTimelineEvents([]);
          setSystemState((prev) => {
            if (!prev) return prev;
            return {
              agents: prev.agents.map((agent) => ({
                ...agent,
                status: "stable" as const,
                war_room_id: null,
              })),
              war_rooms: [],
            };
          });
          setSelectedWarRoom(null);
          setIsWarRoomModalOpen(false);
          showNotification("System reset detected", "info");
          break;
      }
    });
  }, [messages, showNotification]);


  // Demo mode auto-trigger
  useEffect(() => {
    if (demoMode) {
      demoIntervalRef.current = setInterval(() => {
        triggerSimulation();
      }, 30000);
    } else {
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current);
      }
    }
    return () => {
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current);
      }
    };
  }, [demoMode, triggerSimulation]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.code === "Space" && !triggering && !resetting) {
        e.preventDefault();
        triggerSimulation();
      } else if (e.code === "KeyR" && !resetting && !triggering) {
        e.preventDefault();
        resetSystem();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [triggering, resetting, triggerSimulation, resetSystem]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const hasActiveIncident = systemState?.agents.some((agent) => agent.status === "incident") || false;

  const handleWarRoomClick = (warRoom: WarRoom) => {
    setSelectedWarRoom(warRoom);
    setIsWarRoomModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="border-b border-border/50 backdrop-blur-md sticky top-0 z-30 bg-background/80 animate-in fade-in duration-300">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">PulseOS</h1>
            <p className="text-sm text-muted-foreground">Operational Brain for Incident Management</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Connection Status */}
            <div className="flex items-center gap-2 text-sm">
              <div
                className={`w-2 h-2 rounded-full ${
                  connected ? "bg-green-500 animate-pulse" : "bg-red-500"
                }`}
              />
              <span className="text-muted-foreground">
                {connected ? "Connected" : "Disconnected"}
              </span>
        </div>

            {/* Demo Mode Toggle */}
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={demoMode}
                onChange={(e) => setDemoMode(e.target.checked)}
                className="w-4 h-4 rounded border-input"
              />
              <span className="text-muted-foreground">Demo</span>
            </label>

            {/* Trigger Button */}
            <div className={hasActiveIncident ? "animate-pulse" : ""}>
              <Button
              onClick={triggerSimulation}
                disabled={triggering || resetting || hasActiveIncident}
                size="lg"
                variant={hasActiveIncident ? "destructive" : "default"}
                className="gap-2"
              >
                {hasActiveIncident && <AlertIcon />}
                {triggering ? "Triggering..." : hasActiveIncident ? "Incident Active" : "Trigger Incident"}
              </Button>
            </div>

            {/* Reset Button */}
            <Button
              onClick={resetSystem}
              disabled={resetting || triggering}
              variant="outline"
              size="lg"
            >
              {resetting ? "Resetting..." : "Reset"}
            </Button>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-in fade-in duration-300">
          <Card
            className={`p-4 shadow-lg ${
              notification.type === "error"
                ? "bg-red-50 border-red-200 text-red-800"
                : notification.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-blue-50 border-blue-200 text-blue-800"
            }`}
          >
            <p className="text-sm font-medium">{notification.message}</p>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <div className="p-4">
              <p className="text-sm text-red-800">Error: {error}</p>
          </div>
          </Card>
        )}

        {/* Agent Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 animate-in fade-in">
          {loading ? (
            // Skeleton loaders
            [1, 2, 3].map((i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                <div className="h-3 bg-muted rounded w-32"></div>
              </Card>
            ))
          ) : systemState ? (
            systemState.agents.map((agent) => (
              <div key={agent.name} className="animate-in fade-in duration-300">
                <AgentCard
                  name={agent.name as "Phill" | "Carl" | "Gary"}
                  status={agent.status}
                  domain={agent.domain}
                  war_room_id={agent.war_room_id}
                />
                  </div>
            ))
          ) : null}
        </div>

        {/* War Rooms Section */}
        {systemState && systemState.war_rooms.length > 0 && (
          <Card className="mb-8 animate-in fade-in duration-500 delay-100">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-foreground">Active War Rooms</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {systemState.war_rooms.map((wr) => (
                  <button
                    key={wr.id}
                    onClick={() => handleWarRoomClick(wr)}
                    className="text-left p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                  >
                  <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-foreground">{wr.id}</h3>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {wr.participants.length} participant{wr.participants.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                    <p className="text-sm text-muted-foreground">
                      Participants: {wr.participants.join(", ") || "None"}
                  </p>
                  {wr.incident_id && (
                      <p className="text-xs text-muted-foreground mt-1 font-mono">
                      Incident: {wr.incident_id}
                    </p>
                  )}
                  </button>
                ))}
                </div>
            </div>
          </Card>
        )}

        {/* Timeline Feed */}
        <div className="h-[600px] animate-in fade-in duration-500 delay-200">
          <TimelineFeed
            events={timelineEvents}
            filter={timelineFilter}
            onFilterChange={setTimelineFilter}
            onClear={() => setTimelineEvents([])}
          />
        </div>
      </div>

      {/* War Room Modal */}
      <WarRoomModal
        isOpen={isWarRoomModalOpen}
        onClose={() => {
          setIsWarRoomModalOpen(false);
          setSelectedWarRoom(null);
        }}
        warRoom={selectedWarRoom}
        agents={systemState?.agents || []}
      />
    </div>
  );
}
