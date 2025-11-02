"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: string;
    config: Record<string, any>;
  };
  agents: Array<{
    name: string;
    enabled: boolean;
  }>;
  outputs: Array<{
    type: string;
    enabled: boolean;
  }>;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/workflows`);
      if (!response.ok) throw new Error("Failed to fetch workflows");
      const data = await response.json();
      setWorkflows(data.workflows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch workflows");
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkflow = async (workflowId: string) => {
    try {
      const response = await fetch(`${backendUrl}/workflows/${workflowId}/toggle`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to toggle workflow");
      await fetchWorkflows();
    } catch (err) {
      console.error("Failed to toggle workflow:", err);
    }
  };

  const deleteWorkflow = async (workflowId: string) => {
    if (!confirm("Are you sure you want to delete this workflow?")) return;
    
    try {
      const response = await fetch(`${backendUrl}/workflows/${workflowId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete workflow");
      await fetchWorkflows();
    } catch (err) {
      console.error("Failed to delete workflow:", err);
    }
  };

  const getTriggerLabel = (type: string) => {
    const labels: Record<string, string> = {
      github_issue: "GitHub Issue",
      github_pr: "GitHub PR",
      webhook: "Webhook",
      manual: "Manual",
      scheduled: "Scheduled",
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 backdrop-blur-md sticky top-0 z-30 bg-background/80">
        <div className="max-w-[1600px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-2 block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-foreground">Workflows</h1>
              <p className="text-sm text-muted-foreground">
                Create and manage incident response workflows
              </p>
            </div>
            <Link href="/workflows/new">
              <Button size="default">+ New Workflow</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-4 py-8">
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <div className="p-4">
              <p className="text-sm text-red-800">Error: {error}</p>
            </div>
          </Card>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-6"></div>
                <div className="h-2 bg-muted rounded w-full mb-2"></div>
                <div className="h-2 bg-muted rounded w-2/3"></div>
              </Card>
            ))}
          </div>
        ) : workflows.length === 0 ? (
          <Card className="p-12 text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No workflows yet
            </h3>
            <p className="text-muted-foreground mb-6">
              Create your first workflow to automate incident response
            </p>
            <Link href="/workflows/new">
              <Button>Create Workflow</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflows.map((workflow) => (
              <Card key={workflow.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {workflow.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {workflow.description || "No description"}
                    </p>
                  </div>
                  <Badge variant={workflow.active ? "default" : "secondary"}>
                    {workflow.active ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Trigger</p>
                    <Badge variant="outline" className="text-xs">
                      {getTriggerLabel(workflow.trigger.type)}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Agents</p>
                    <div className="flex gap-1">
                      {workflow.agents
                        .filter((a) => a.enabled)
                        .map((agent) => (
                          <div
                            key={agent.name}
                            className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary"
                            title={agent.name}
                          >
                            {agent.name.charAt(0)}
                          </div>
                        ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Outputs</p>
                    <div className="flex flex-wrap gap-1">
                      {workflow.outputs
                        .filter((o) => o.enabled)
                        .map((output) => (
                          <Badge key={output.type} variant="secondary" className="text-xs">
                            {output.type}
                          </Badge>
                        ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-border">
                  <Link href={`/workflows/${workflow.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant={workflow.active ? "ghost" : "default"}
                    size="sm"
                    onClick={() => toggleWorkflow(workflow.id)}
                  >
                    {workflow.active ? "Disable" : "Enable"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteWorkflow(workflow.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

