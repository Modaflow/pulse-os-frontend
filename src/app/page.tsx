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
  last_change?: string;
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
  severity?: "high" | "medium" | "low";
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
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [demoMode, setDemoMode] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [selectedWarRoom, setSelectedWarRoom] = useState<WarRoom | null>(null);
  const [isWarRoomModalOpen, setIsWarRoomModalOpen] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  
  const demoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPingRef = useRef<number>(0);
  
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
                      last_change: new Date().toISOString(),
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
                last_change: new Date().toISOString(),
              })),
              war_rooms: [],
            };
          });
          setSelectedWarRoom(null);
          setIsWarRoomModalOpen(false);
          showNotification("System reset detected", "info");
          break;

        case "pong":
          // Calculate latency
          const now = Date.now();
          const pingTime = lastPingRef.current;
          if (pingTime) {
            const latencyMs = now - pingTime;
            setLatency(latencyMs);
          }
          break;
      }
    });
  }, [messages, showNotification]);

  // Ping interval for latency tracking
  useEffect(() => {
    if (!connected) {
      setLatency(null);
      return;
    }

    pingIntervalRef.current = setInterval(() => {
      lastPingRef.current = Date.now();
      send(JSON.stringify({ type: "ping", timestamp: new Date().toISOString() }));
    }, 5000); // Ping every 5 seconds

    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
    };
  }, [connected, send]);

  // Track reconnection state
  useEffect(() => {
    if (!connected && wsError) {
      setIsReconnecting(true);
    } else if (connected) {
      setIsReconnecting(false);
    }
  }, [connected, wsError]);


  // Demo mode auto-trigger
  useEffect(() => {
    if (demoMode) {
      // Trigger immediately when demo mode is enabled
      triggerSimulation();
      
      // Then set up interval for subsequent triggers
      demoIntervalRef.current = setInterval(() => {
        // Only auto-trigger if no active incident
        if (!systemState?.agents.some((agent) => agent.status === "incident")) {
          triggerSimulation();
        }
      }, 15000); // Reduced to 15 seconds for better demo experience
      
      showNotification("Demo mode enabled - auto-triggering incidents every 15s", "info");
    } else {
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current);
        demoIntervalRef.current = null;
      }
    }
    return () => {
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current);
      }
    };
  }, [demoMode]); // Removed triggerSimulation from deps to avoid interval resets

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
      <div className="border-b border-border/50 backdrop-blur-md sticky top-0 z-30 bg-background/80">
        <div className="max-w-[1600px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Brand */}
            <div>
              <h1 className="text-2xl font-bold text-foreground">PulseOS</h1>
              <p className="text-xs text-muted-foreground">Incident control</p>
            </div>

            {/* Center: Connection Status */}
            <div className="hidden md:flex items-center gap-2">
              <div className="relative group">
                <div className="flex items-center gap-2 text-sm cursor-help">
                  <div
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      connected && !isReconnecting
                        ? "bg-green-500 shadow-lg shadow-green-500/50"
                        : "bg-amber-500 animate-pulse"
                    }`}
                  />
                  <span className="text-muted-foreground font-medium">
                    {connected && !isReconnecting ? "Connected" : "Reconnecting…"}
                  </span>
                </div>
                {/* Latency Tooltip */}
                {latency !== null && (
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-popover text-popover-foreground text-xs rounded-md shadow-lg border border-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    Latency: {latency}ms
                  </div>
                )}
              </div>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-3">
              {/* Demo Mode Toggle */}
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={demoMode}
                  onChange={(e) => setDemoMode(e.target.checked)}
                  className="w-4 h-4 rounded border-input"
                />
                <span className="text-muted-foreground hidden sm:inline">Demo Mode</span>
              </label>

              {/* Trigger Button */}
              <Button
                onClick={triggerSimulation}
                disabled={triggering || resetting || hasActiveIncident}
                size="default"
                variant={hasActiveIncident ? "destructive" : "default"}
                className="gap-2"
              >
                {hasActiveIncident && <AlertIcon />}
                {triggering ? "Triggering..." : hasActiveIncident ? "Incident Active" : "Trigger Incident"}
              </Button>

              {/* Reset Button */}
              <Button
                onClick={resetSystem}
                disabled={resetting || triggering}
                variant="ghost"
                size="default"
              >
                {resetting ? "Resetting..." : "Reset"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Row */}
      <div className="border-b border-border/50 bg-muted/30">
        <div className="max-w-[1600px] mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center gap-4">
            {/* Agent Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground font-medium">Agent:</span>
              <div className="flex items-center gap-1 bg-background rounded-lg p-1 border border-border">
                {["all", "Phill", "Carl", "Gary"].map((agent) => (
                  <button
                    key={agent}
                    onClick={() => setAgentFilter(agent.toLowerCase())}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      agentFilter === agent.toLowerCase()
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {agent}
                  </button>
                ))}
              </div>
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground font-medium">Severity:</span>
              <div className="flex items-center gap-1 bg-background rounded-lg p-1 border border-border">
                {["all", "high", "medium", "low"].map((severity) => (
                  <button
                    key={severity}
                    onClick={() => setSeverityFilter(severity)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      severityFilter === severity
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {severity.charAt(0).toUpperCase() + severity.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="flex-1 min-w-[200px] max-w-md">
              <input
                type="text"
                placeholder="Search timeline..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
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
      <div className="max-w-[1600px] mx-auto px-4 py-6">
        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <div className="p-4">
              <p className="text-sm text-red-800">Error: {error}</p>
            </div>
          </Card>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content Area */}
          <div className="flex-1 space-y-6">
            {/* Agent Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <AgentCard
                    key={agent.name}
                    name={agent.name as "Phill" | "Carl" | "Gary"}
                    status={agent.status}
                    domain={agent.domain}
                    war_room_id={agent.war_room_id}
                    last_change={agent.last_change}
                    onOpenWarRoom={() => {
                      if (agent.war_room_id) {
                        const warRoom = systemState.war_rooms.find(wr => wr.id === agent.war_room_id);
                        if (warRoom) handleWarRoomClick(warRoom);
                      }
                    }}
                  />
                ))
              ) : null}
            </div>

            {/* Active War Rooms */}
            {systemState && systemState.war_rooms.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground">Active War Rooms</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {systemState.war_rooms.map((wr) => {
                    const participantAgents = systemState.agents.filter(
                      (agent) => wr.participants.includes(agent.name)
                    );
                    
                    return (
                      <Card key={wr.id} className="p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-foreground">{wr.id}</h3>
                            {wr.incident_id && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Incident {wr.incident_id}
                              </p>
                            )}
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            wr.status === "active"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}>
                            {wr.status === "active" ? "Active" : "Resolved"}
                          </span>
                        </div>

                        {/* Participants with avatars */}
                        <div className="flex items-center gap-2 mb-3">
                          {participantAgents.map((agent) => (
                            <div
                              key={agent.name}
                              className="relative w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary"
                              title={agent.name}
                            >
                              {agent.name.charAt(0)}
                              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background ${
                                agent.status === "incident" ? "bg-red-500" :
                                agent.status === "active" ? "bg-amber-500" :
                                "bg-green-500"
                              }`} />
                            </div>
                          ))}
                          <span className="text-xs text-muted-foreground ml-1">
                            {wr.participants.length} participant{wr.participants.length !== 1 ? "s" : ""}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleWarRoomClick(wr)}
                            className="flex-1"
                          >
                            Open
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(wr.id);
                              showNotification("War room ID copied", "success");
                            }}
                          >
                            Copy invite
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Rail: Timeline Feed (Desktop) */}
          <div className="lg:w-[400px] xl:w-[450px]">
            <div className="lg:sticky lg:top-[180px]">
              <TimelineFeed
                events={timelineEvents}
                agentFilter={agentFilter}
                severityFilter={severityFilter}
                searchQuery={searchQuery}
                onClear={() => setTimelineEvents([])}
              />
            </div>
          </div>
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
        timelineEvents={timelineEvents}
      />
    </div>
  );
}
