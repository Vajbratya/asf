"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Play } from "lucide-react";

export default function ConnectorsPage() {
  const [connectors, setConnectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "HL7",
    host: "",
    port: "",
    endpoint: "",
  });

  useEffect(() => {
    fetchConnectors();
  }, []);

  const fetchConnectors = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/connectors");
      const data = await res.json();
      setConnectors(data.connectors);
    } catch (error) {
      console.error("Failed to fetch connectors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:3001/api/connectors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          port: formData.port ? parseInt(formData.port) : undefined,
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setFormData({
          name: "",
          type: "HL7",
          host: "",
          port: "",
          endpoint: "",
        });
        fetchConnectors();
      }
    } catch (error) {
      console.error("Failed to create connector:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this connector?")) return;

    try {
      await fetch(`http://localhost:3001/api/connectors/${id}`, {
        method: "DELETE",
      });
      fetchConnectors();
    } catch (error) {
      console.error("Failed to delete connector:", error);
    }
  };

  const handleTest = async (id: string) => {
    try {
      const res = await fetch(
        `http://localhost:3001/api/connectors/${id}/test`,
        {
          method: "POST",
        },
      );
      const data = await res.json();
      alert(data.message);
      fetchConnectors();
    } catch (error) {
      console.error("Failed to test connector:", error);
    }
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading connectors...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Connectors</h1>
          <p className="text-muted-foreground">
            Manage your healthcare system connections
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Connector
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Connector</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="HL7">HL7</option>
                    <option value="XML">XML</option>
                    <option value="FHIR">FHIR</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="host">Host</Label>
                  <Input
                    id="host"
                    value={formData.host}
                    onChange={(e) =>
                      setFormData({ ...formData, host: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="port">Port</Label>
                  <Input
                    id="port"
                    type="number"
                    value={formData.port}
                    onChange={(e) =>
                      setFormData({ ...formData, port: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="endpoint">Endpoint (optional)</Label>
                  <Input
                    id="endpoint"
                    value={formData.endpoint}
                    onChange={(e) =>
                      setFormData({ ...formData, endpoint: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {connectors.map((connector) => (
          <Card key={connector.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{connector.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {connector.type}
                  </p>
                </div>
                <Badge
                  variant={
                    connector.status === "active" ? "success" : "destructive"
                  }
                >
                  {connector.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Host:</span>{" "}
                  {connector.host}
                </div>
                {connector.port && (
                  <div>
                    <span className="text-muted-foreground">Port:</span>{" "}
                    {connector.port}
                  </div>
                )}
                {connector.lastHealthAt && (
                  <div>
                    <span className="text-muted-foreground">Last check:</span>{" "}
                    {new Date(connector.lastHealthAt).toLocaleString()}
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTest(connector.id)}
                >
                  <Play className="mr-2 h-3 w-3" />
                  Test
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(connector.id)}
                >
                  <Trash2 className="mr-2 h-3 w-3" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {connectors.length === 0 && !showForm && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No connectors configured yet. Click the button above to add one.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
