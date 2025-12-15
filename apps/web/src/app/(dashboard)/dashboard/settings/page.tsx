"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    organizationName: "Default Organization",
    ssoEnabled: false,
    ssoProvider: "",
    ssoClientId: "",
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    alert("Settings saved successfully!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure your organization settings
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Organization Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name</Label>
              <Input
                id="orgName"
                value={settings.organizationName}
                onChange={(e) =>
                  setSettings({ ...settings, organizationName: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* SSO Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Single Sign-On (SSO)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ssoEnabled"
                checked={settings.ssoEnabled}
                onChange={(e) =>
                  setSettings({ ...settings, ssoEnabled: e.target.checked })
                }
                className="h-4 w-4"
              />
              <Label htmlFor="ssoEnabled">Enable SSO</Label>
            </div>

            {settings.ssoEnabled && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="ssoProvider">SSO Provider</Label>
                  <select
                    id="ssoProvider"
                    value={settings.ssoProvider}
                    onChange={(e) =>
                      setSettings({ ...settings, ssoProvider: e.target.value })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select Provider</option>
                    <option value="okta">Okta</option>
                    <option value="auth0">Auth0</option>
                    <option value="azure">Azure AD</option>
                    <option value="google">Google Workspace</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ssoClientId">Client ID</Label>
                  <Input
                    id="ssoClientId"
                    value={settings.ssoClientId}
                    onChange={(e) =>
                      setSettings({ ...settings, ssoClientId: e.target.value })
                    }
                    placeholder="Your SSO client ID"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* API Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>API Base URL</Label>
              <Input value="http://localhost:3001" disabled />
              <p className="text-sm text-muted-foreground">
                The base URL for API requests
              </p>
            </div>

            <div className="space-y-2">
              <Label>Organization ID</Label>
              <Input value="default" disabled />
              <p className="text-sm text-muted-foreground">
                Your organization identifier
              </p>
            </div>
          </CardContent>
        </Card>

        <Button type="submit">
          <Save className="mr-2 h-4 w-4" />
          Save Settings
        </Button>
      </form>
    </div>
  );
}
