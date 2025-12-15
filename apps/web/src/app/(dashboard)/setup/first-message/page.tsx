'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, Copy, Check } from 'lucide-react';

type Status = 'waiting' | 'received' | 'processed';

export default function FirstMessagePage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('waiting');
  const [copied, setCopied] = useState(false);
  const [messageData, setMessageData] = useState<any>(null);

  const sampleMessage = `MSH|^~\\&|TASY|HOSPITAL|INTEGRASAUDE|LAUDOS|${new Date()
    .toISOString()
    .replace(/[-:T]/g, '')
    .slice(0, 14)}||ADT^A01|MSG001|P|2.5
PID|1||12345^^^TASY||DA SILVA^MARIA||19900101|F|||Rua das Flores, 123^^Sao Paulo^SP^01234-567^BR
PV1|1|I|UTI^101^01|||||||||||||||12345`;

  // Poll for first message
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/v1/messages?limit=1');
        const data = await response.json();

        if (data.messages && data.messages.length > 0) {
          setMessageData(data.messages[0]);
          setStatus('received');
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Error polling for messages:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sampleMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (status === 'received') {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <div className="text-center space-y-8">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 p-6">
              <CheckCircle2 className="h-24 w-24 text-green-600" />
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-green-600">First Message Received!</h1>
            <p className="text-muted-foreground mt-2">
              Your integration is working perfectly. Let's continue setting up your workflows.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Message Details</CardTitle>
            </CardHeader>
            <CardContent className="text-left">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Message ID:</span>
                  <span className="font-mono">{messageData?.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Direction:</span>
                  <span>{messageData?.direction}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span>{messageData?.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Received:</span>
                  <span>{new Date(messageData?.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
            <Button asChild size="lg">
              <Link href="/dashboard/webhooks">Configure Webhooks</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <div className="text-center space-y-8">
        <h1 className="text-3xl font-bold">Waiting for First Message...</h1>

        <div className="flex justify-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>

        <p className="text-muted-foreground">
          Send a test ADT message from your hospital system to verify the connection
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Sample HL7 Message</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              You can send this sample message to test your connection:
            </p>
            <div className="relative">
              <pre className="text-xs bg-muted p-4 rounded overflow-x-auto font-mono">
                {sampleMessage}
              </pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How to Send</CardTitle>
          </CardHeader>
          <CardContent className="text-left space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Using Tasy:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Go to Administration → Integration → HL7 Messages</li>
                <li>Click "Send Test Message"</li>
                <li>Select ADT^A01 message type</li>
                <li>Choose a patient record</li>
                <li>Click "Send"</li>
              </ol>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-2">Using Command Line:</h4>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                {`echo "${sampleMessage.replace(/\n/g, '\\r')}" | nc your-ip 2575`}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          I'll do this later
        </Button>
      </div>
    </div>
  );
}
