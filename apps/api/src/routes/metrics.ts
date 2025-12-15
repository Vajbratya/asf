/**
 * S36 - Metrics Endpoint
 * Provides message counts, success rates, and connector health
 */

import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";
import { IngestionService } from "../services/ingestion.js";
import { RouterService } from "../services/router.js";

const prisma = new PrismaClient();
const ingestionService = new IngestionService();
const routerService = new RouterService();

const metricsRouter = new Hono();

// Get dashboard metrics
metricsRouter.get("/", async (c) => {
  const organizationId = c.req.header("X-Organization-ID") || "default";
  const period = c.req.query("period") || "24h";

  // Calculate time range
  const since = new Date();
  switch (period) {
    case "1h":
      since.setHours(since.getHours() - 1);
      break;
    case "24h":
      since.setHours(since.getHours() - 24);
      break;
    case "7d":
      since.setDate(since.getDate() - 7);
      break;
    case "30d":
      since.setDate(since.getDate() - 30);
      break;
  }

  // Get ingestion stats
  const ingestionStats = await ingestionService.getStats(organizationId, since);

  // Get routing stats
  const routingStats = await routerService.getRoutingStats(
    organizationId,
    since,
  );

  // Get connector health
  const connectors = await prisma.connector.findMany({
    where: { organizationId },
    select: {
      id: true,
      name: true,
      type: true,
      status: true,
      lastHealthAt: true,
    },
  });

  // Calculate success rate
  const processedCount = ingestionStats.byStatus["processed"] || 0;
  const failedCount = ingestionStats.byStatus["failed"] || 0;
  const successRate =
    ingestionStats.total > 0
      ? ((processedCount / (processedCount + failedCount)) * 100).toFixed(2)
      : "0.00";

  return c.json({
    period,
    messages: {
      total: ingestionStats.total,
      byStatus: ingestionStats.byStatus,
      byProtocol: ingestionStats.byProtocol,
      successRate: `${successRate}%`,
    },
    deliveries: {
      total: routingStats.totalDeliveries,
      byWebhook: routingStats.byWebhook,
    },
    connectors: connectors.map((conn) => ({
      id: conn.id,
      name: conn.name,
      type: conn.type,
      status: conn.status,
      lastHealthCheck: conn.lastHealthAt,
      isHealthy:
        conn.status === "active" && conn.lastHealthAt
          ? Date.now() - conn.lastHealthAt.getTime() < 5 * 60 * 1000 // 5 minutes
          : false,
    })),
  });
});

// Get recent messages
metricsRouter.get("/recent-messages", async (c) => {
  const organizationId = c.req.header("X-Organization-ID") || "default";
  const limit = parseInt(c.req.query("limit") || "10");

  const messages = await prisma.message.findMany({
    where: { organizationId },
    include: {
      connector: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return c.json({
    messages: messages.map((msg) => ({
      id: msg.id,
      type: msg.messageType,
      protocol: msg.protocol,
      status: msg.status,
      connector: msg.connector.name,
      createdAt: msg.createdAt,
      processingTime: msg.processingTime,
    })),
  });
});

export { metricsRouter };
