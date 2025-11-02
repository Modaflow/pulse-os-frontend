"use client";

import { useEffect, useState } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";

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

export default function Home() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";
  const wsUrl = backendUrl.replace("http://", "ws://").replace("https://", "wss://") + "/events";
  
  const [systemState, setSystemState] = useState<SystemState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [resetting, setResetting] = useState(false);
  
  const { connected, messages, error: wsError, send } = useWebSocket(wsUrl);

  const fetchState = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/state`);
      if (!response.ok) throw new Error("Failed to fetch state");
      const data = await response.json();
      setSystemState(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch state");
    } finally {
      setLoading(false);
    }
  };

  const triggerSimulation = async () => {
    try {
      setTriggering(true);
      setError(null);
      const response = await fetch(`${backendUrl}/trigger`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to trigger simulation");
      const data = await response.json();
      // Refresh state after simulation
      setTimeout(() => fetchState(), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to trigger simulation");
    } finally {
      setTriggering(false);
    }
  };

  const resetSystem = async () => {
    try {
      setResetting(true);
      setError(null);
      const response = await fetch(`${backendUrl}/reset`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to reset system");
      // Refresh state after reset
      setTimeout(() => fetchState(), 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset system");
    } finally {
      setResetting(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "stable":
        return "bg-green-100 text-green-800";
      case "active":
        return "bg-blue-100 text-blue-800";
      case "incident":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">PulseOS Dashboard</h1>

        {/* Backend Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Backend Status</h2>
          <div className="flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-sm">
              {connected ? "WebSocket Connected" : "WebSocket Disconnected"}
            </span>
            {wsError && <span className="text-sm text-red-600">({wsError})</span>}
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Backend URL: {backendUrl}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="flex gap-4">
            <button
              onClick={triggerSimulation}
              disabled={triggering}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {triggering ? "Triggering..." : "Trigger Simulation"}
            </button>
            <button
              onClick={resetSystem}
              disabled={resetting}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resetting ? "Resetting..." : "Reset System"}
            </button>
            <button
              onClick={fetchState}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Loading..." : "Refresh State"}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">Error: {error}</p>
          </div>
        )}

        {/* Agent States */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Agent States</h2>
          {loading ? (
            <div>Loading...</div>
          ) : systemState ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {systemState.agents.map((agent) => (
                <div
                  key={agent.name}
                  className="border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{agent.name}</h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                        agent.status
                      )}`}
                    >
                      {agent.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{agent.domain}</p>
                  {agent.war_room_id && (
                    <p className="text-xs text-gray-500 mt-1">
                      War Room: {agent.war_room_id}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div>No agent data available</div>
          )}
        </div>

        {/* War Rooms */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">War Rooms</h2>
          {loading ? (
            <div>Loading...</div>
          ) : systemState && systemState.war_rooms.length > 0 ? (
            <div className="space-y-4">
              {systemState.war_rooms.map((wr) => (
                <div key={wr.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{wr.id}</h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        wr.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {wr.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Participants: {wr.participants.join(", ")}
                  </p>
                  {wr.incident_id && (
                    <p className="text-xs text-gray-500 mt-1">
                      Incident: {wr.incident_id}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">No active war rooms</div>
          )}
        </div>

        {/* WebSocket Events */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            WebSocket Events ({messages.length})
          </h2>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {messages.length === 0 ? (
              <div className="text-gray-500">No events received yet</div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className="border rounded p-3 text-sm font-mono bg-gray-50"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-blue-600">{msg.type}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(msg.data, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
