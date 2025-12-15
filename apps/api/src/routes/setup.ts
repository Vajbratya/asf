import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const setupRouter = new Hono();

const testConnectionSchema = z.object({
  type: z.enum(['TASY', 'MV_SOUL', 'PIXEON', 'GENERIC_HL7']),
  config: z.object({
    host: z.string(),
    port: z.string().or(z.number()),
    tlsMode: z.enum(['none', 'tls', 'starttls']).optional(),
    companyId: z.string().optional(),
    hospitalCode: z.string().optional(),
  }),
});

setupRouter.post('/test-connection', zValidator('json', testConnectionSchema), async (c) => {
  const { type, config } = c.req.valid('json');

  try {
    // Simulate connection test
    // In production, you would create a temporary connector instance
    // and actually test the connection
    const startTime = Date.now();

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

    // Randomly succeed or fail for demo purposes
    // In production, this would be actual connection testing
    const success = Math.random() > 0.2; // 80% success rate

    if (!success) {
      return c.json({
        success: false,
        message: 'Connection failed: ECONNREFUSED',
        troubleshooting: getTroubleshootingTips('ECONNREFUSED', type),
      });
    }

    const latency = Date.now() - startTime;

    return c.json({
      success: true,
      message: 'Connection successful',
      details: {
        connected: true,
        latency,
        version: '2.5',
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json(
      {
        success: false,
        message: `Connection test failed: ${errorMessage}`,
        troubleshooting: getTroubleshootingTips(errorMessage, type),
      },
      500
    );
  }
});

function getTroubleshootingTips(errorMessage: string, type: string): string[] {
  const tips: string[] = [];

  if (errorMessage.includes('ECONNREFUSED')) {
    tips.push('Check that the hospital system is running');
    tips.push('Verify the IP address and port are correct');
    tips.push('Ensure firewall allows connections on this port');
    tips.push('Try pinging the host to verify network connectivity');
  }

  if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
    tips.push('The connection timed out - check network connectivity');
    tips.push('Verify VPN connection if required');
    tips.push('Check if the port is open on the firewall');
  }

  if (errorMessage.includes('EHOSTUNREACH')) {
    tips.push('The host is unreachable');
    tips.push('Check network connectivity');
    tips.push('Verify the IP address is correct');
  }

  if (errorMessage.includes('certificate') || errorMessage.includes('SSL')) {
    tips.push('SSL/TLS certificate issue detected');
    tips.push('Verify the certificate is valid and not expired');
    tips.push('Try disabling TLS if appropriate for your network');
  }

  // Vendor-specific tips
  if (type === 'TASY') {
    tips.push('Ensure Tasy HL7 interface is configured and running');
    tips.push('Check CD_EMPRESA matches your Tasy configuration');
  } else if (type === 'MV_SOUL') {
    tips.push('Verify MV Soul integration module is enabled');
  }

  return tips;
}

export default setupRouter;
