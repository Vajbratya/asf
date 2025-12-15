'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Activity, CheckCircle2, XCircle, Clock, TrendingUp } from 'lucide-react';
import { apiGet } from '@/lib/api';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsData, messagesData] = await Promise.all([
          apiGet<any>('/api/metrics?period=24h'),
          apiGet<{ messages: any[] }>('/api/metrics/recent-messages?limit=10'),
        ]);

        setMetrics(metricsData);
        setRecentMessages(messagesData.messages);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Messages Today',
      value: metrics?.messages?.total || 0,
      icon: Activity,
      description: 'Last 24 hours',
    },
    {
      title: 'Success Rate',
      value: metrics?.messages?.successRate || '0%',
      icon: TrendingUp,
      description: 'Processing accuracy',
    },
    {
      title: 'Processed',
      value: metrics?.messages?.byStatus?.processed || 0,
      icon: CheckCircle2,
      description: 'Successfully handled',
    },
    {
      title: 'Failed',
      value: metrics?.messages?.byStatus?.failed || 0,
      icon: XCircle,
      description: 'Requires attention',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processed':
        return <Badge variant="success">Processed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'processing':
        return <Badge variant="warning">Processing</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your healthcare integration platform</p>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Messages */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Protocol</TableHead>
                <TableHead>Connector</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Processing</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentMessages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No messages yet
                  </TableCell>
                </TableRow>
              ) : (
                recentMessages.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell className="font-mono text-xs">
                      {message.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>{message.type}</TableCell>
                    <TableCell>{message.protocol}</TableCell>
                    <TableCell>{message.connector}</TableCell>
                    <TableCell>{getStatusBadge(message.status)}</TableCell>
                    <TableCell>{new Date(message.createdAt).toLocaleTimeString()}</TableCell>
                    <TableCell className="text-right">
                      {message.processingTime ? `${message.processingTime}ms` : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Connector Status */}
      <Card>
        <CardHeader>
          <CardTitle>Connector Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {metrics?.connectors?.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">No connectors configured</div>
            ) : (
              metrics?.connectors?.map((connector: any) => (
                <div
                  key={connector.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        connector.isHealthy ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                    <div>
                      <p className="font-medium">{connector.name}</p>
                      <p className="text-xs text-muted-foreground">{connector.type}</p>
                    </div>
                  </div>
                  <Badge variant={connector.status === 'active' ? 'success' : 'destructive'}>
                    {connector.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
