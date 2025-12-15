'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface TasyConfig {
  name: string;
  // HL7 Connection
  host: string;
  port: string;
  tlsMode: string;
  // REST API (Optional)
  restUrl: string;
  clientId: string;
  clientSecret: string;
  // Tasy Configuration
  companyId: string;
  hospitalCode: string;
}

export function TasyConfigForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<TasyConfig>({
    name: 'Tasy Connector',
    host: '',
    port: '2575',
    tlsMode: 'none',
    restUrl: '',
    clientId: '',
    clientSecret: '',
    companyId: '',
    hospitalCode: '',
  });

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const handleChange = (field: keyof TasyConfig, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTestResult(null);
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/v1/setup/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'TASY',
          config: formData,
        }),
      });

      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to test connection',
      });
    } finally {
      setTesting(false);
    }
  };

  const saveConnector = async () => {
    try {
      const response = await fetch('/api/v1/connectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          type: 'HL7_V2',
          vendor: 'TASY',
          config: formData,
        }),
      });

      if (response.ok) {
        router.push('/setup/first-message');
      }
    } catch (error) {
      console.error('Failed to save connector:', error);
    }
  };

  return (
    <form className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Connector Name</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="My Tasy Connector"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>HL7 MLLP Connection</CardTitle>
          <CardDescription>Configure the HL7 v2.x connection to Tasy</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="host">Host/IP Address *</Label>
              <Input
                id="host"
                value={formData.host}
                onChange={(e) => handleChange('host', e.target.value)}
                placeholder="192.168.1.100"
                required
              />
            </div>
            <div>
              <Label htmlFor="port">Port *</Label>
              <Input
                id="port"
                type="number"
                value={formData.port}
                onChange={(e) => handleChange('port', e.target.value)}
                placeholder="2575"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="tlsMode">TLS Mode</Label>
            <Select
              value={formData.tlsMode}
              onValueChange={(value) => handleChange('tlsMode', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No TLS</SelectItem>
                <SelectItem value="tls">TLS</SelectItem>
                <SelectItem value="starttls">STARTTLS</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tasy REST API (Optional)</CardTitle>
          <CardDescription>
            Connect to Tasy's REST API for additional data retrieval
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="restUrl">API Base URL</Label>
            <Input
              id="restUrl"
              value={formData.restUrl}
              onChange={(e) => handleChange('restUrl', e.target.value)}
              placeholder="https://tasy.hospital.com/api"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId"
                value={formData.clientId}
                onChange={(e) => handleChange('clientId', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="clientSecret">Client Secret</Label>
              <Input
                id="clientSecret"
                type="password"
                value={formData.clientSecret}
                onChange={(e) => handleChange('clientSecret', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tasy Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="companyId">Company ID (CD_EMPRESA)</Label>
              <Input
                id="companyId"
                value={formData.companyId}
                onChange={(e) => handleChange('companyId', e.target.value)}
                placeholder="1"
              />
            </div>
            <div>
              <Label htmlFor="hospitalCode">Hospital Code (CNES)</Label>
              <Input
                id="hospitalCode"
                value={formData.hospitalCode}
                onChange={(e) => handleChange('hospitalCode', e.target.value)}
                placeholder="1234567"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {testResult && (
        <Alert variant={testResult.success ? 'default' : 'destructive'}>
          <div className="flex items-start gap-2">
            {testResult.success ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            <div className="flex-1">
              <AlertDescription>
                {testResult.message}
                {testResult.details && (
                  <div className="mt-2 text-sm">
                    <div>Latency: {testResult.details.latency}ms</div>
                    {testResult.details.version && <div>Version: {testResult.details.version}</div>}
                  </div>
                )}
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={testConnection}
          disabled={testing || !formData.host || !formData.port}
        >
          {testing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            'Test Connection'
          )}
        </Button>
        <Button type="button" onClick={saveConnector} disabled={!testResult?.success}>
          Save Connector
        </Button>
      </div>
    </form>
  );
}
