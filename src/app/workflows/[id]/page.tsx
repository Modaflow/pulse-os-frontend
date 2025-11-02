"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface WorkflowForm {
  name: string;
  description: string;
  trigger: {
    type: string;
    config: Record<string, any>;
  };
  agents: Array<{
    name: string;
    enabled: boolean;
    llm_provider?: string;
    llm_model?: string;
    system_instructions?: string;
  }>;
  outputs: Array<{
    type: string;
    enabled: boolean;
    credentials?: Record<string, string>;
    config?: Record<string, any>;
  }>;
  active: boolean;
}

export default function EditWorkflowPage() {
  const router = useRouter();
  const params = useParams();
  const workflowId = params.id as string;
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

  const [form, setForm] = useState<WorkflowForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkflow();
  }, [workflowId]);

  const fetchWorkflow = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/workflows/${workflowId}`);
      if (!response.ok) throw new Error("Failed to fetch workflow");
      const data = await response.json();
      setForm(data.workflow);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch workflow");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form || !form.name.trim()) {
      alert("Please enter a workflow name");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`${backendUrl}/workflows/${workflowId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) throw new Error("Failed to update workflow");

      router.push("/workflows");
    } catch (err) {
      console.error("Failed to save workflow:", err);
      alert("Failed to save workflow");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      
      // Mock GitHub issue for testing
      const mockTriggerData = {
        issue: {
          number: 999,
          title: "Test Issue: Button not working",
          body: "When I click the submit button in the checkout form, nothing happens. No errors in console.",
          html_url: "https://github.com/test/test/issues/999",
          labels: [{ name: "bug" }],
          user: { login: "test-user" }
        },
        action: "opened"
      };
      
      const response = await fetch(`${backendUrl}/workflows/${workflowId}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mockTriggerData),
      });

      if (!response.ok) throw new Error("Failed to execute workflow");
      
      const result = await response.json();
      
      if (result.success) {
        alert("Workflow test started! Check the dashboard for real-time updates.");
        router.push("/");
      } else {
        alert("Workflow execution failed");
      }
    } catch (err) {
      console.error("Failed to test workflow:", err);
      alert("Failed to test workflow");
    } finally {
      setTesting(false);
    }
  };

  const toggleAgent = (index: number) => {
    if (!form) return;
    const newAgents = [...form.agents];
    newAgents[index].enabled = !newAgents[index].enabled;
    setForm({ ...form, agents: newAgents });
  };

  const toggleOutput = (index: number) => {
    if (!form) return;
    const newOutputs = [...form.outputs];
    newOutputs[index].enabled = !newOutputs[index].enabled;
    setForm({ ...form, outputs: newOutputs });
  };

  const agentColors: Record<string, string> = {
    Phill: "bg-blue-500",
    Carl: "bg-purple-500",
    Gary: "bg-green-500",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading workflow...</p>
        </div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-muted-foreground mb-4">{error || "Workflow not found"}</p>
          <Link href="/workflows">
            <Button>Back to Workflows</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 backdrop-blur-md sticky top-0 z-30 bg-background/80">
        <div className="max-w-[1200px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/workflows" className="text-sm text-muted-foreground hover:text-foreground mb-2 block">
                ← Back to Workflows
              </Link>
              <h1 className="text-2xl font-bold text-foreground">Edit Workflow</h1>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleTest} 
                disabled={testing || saving}
              >
                {testing ? "Testing..." : "Test Workflow"}
              </Button>
              <Link href="/workflows">
                <Button variant="ghost">Cancel</Button>
              </Link>
              <Button onClick={handleSave} disabled={saving || testing}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Basic Info */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Workflow Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., GitHub Issue Response"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe what this workflow does..."
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">
                    {form.active ? "Active (workflow will run automatically)" : "Inactive (workflow is disabled)"}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Trigger */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">1. Trigger</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Trigger Type</label>
                <select
                  value={form.trigger.type}
                  onChange={(e) => setForm({ ...form, trigger: { ...form.trigger, type: e.target.value } })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="github_issue">GitHub Issue Opened</option>
                  <option value="github_pr">GitHub PR Opened</option>
                  <option value="webhook">Webhook</option>
                  <option value="manual">Manual Trigger</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>

              {form.trigger.type === "github_issue" && (
                <div>
                  <label className="block text-sm font-medium mb-2">Repository</label>
                  <input
                    type="text"
                    placeholder="owner/repo"
                    value={form.trigger.config?.repo || ""}
                    onChange={(e) => setForm({
                      ...form,
                      trigger: { ...form.trigger, config: { ...form.trigger.config, repo: e.target.value } }
                    })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Configure GitHub webhook in your repository settings
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Agents */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">2. Agents</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Select which agents participate in this workflow
            </p>
            <div className="space-y-3">
              {form.agents.map((agent, index) => (
                <div
                  key={agent.name}
                  className={`p-4 border rounded-lg transition-all ${
                    agent.enabled ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={agent.enabled}
                      onChange={() => toggleAgent(index)}
                      className="w-4 h-4"
                    />
                    <div
                      className={`w-8 h-8 rounded-full ${agentColors[agent.name]} flex items-center justify-center text-white font-bold text-sm`}
                    >
                      {agent.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{agent.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {agent.system_instructions?.split(".")[0]}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Outputs */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">3. Outputs</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Choose where to send notifications and updates
            </p>
            <div className="space-y-3">
              {form.outputs.map((output, index) => (
                <div
                  key={output.type}
                  className={`p-4 border rounded-lg transition-all ${
                    output.enabled ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={output.enabled}
                      onChange={() => toggleOutput(index)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold capitalize">{output.type}</h3>
                      {output.enabled && (
                        <div className="mt-2">
                          {output.type === "slack" && (
                            <input
                              type="text"
                              placeholder="Channel: #incidents"
                              value={output.config?.channel || ""}
                              onChange={(e) => {
                                const newOutputs = [...form.outputs];
                                newOutputs[index].config = { ...newOutputs[index].config, channel: e.target.value };
                                setForm({ ...form, outputs: newOutputs });
                              }}
                              className="w-full px-3 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          )}
                        </div>
                      )}
                    </div>
                    <Badge variant={output.enabled ? "default" : "secondary"}>
                      {output.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

