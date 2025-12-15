import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";
import { IngestionService } from "../services/ingestion.js";
import { ProcessorService } from "../services/processor.js";
import { RouterService } from "../services/router.js";

const prisma = new PrismaClient();
const ingestionService = new IngestionService();
const processorService = new ProcessorService();
const routerService = new RouterService();

const messagesRouter = new Hono();

// Ingest a new message
messagesRouter.post("/ingest", async (c) => {
  const organizationId = c.req.header("X-Organization-ID") || "default";
  const body = await c.req.json();

  const message = await ingestionService.ingestMessage({
    rawMessage: body.rawMessage,
    protocol: body.protocol,
    connectorId: body.connectorId,
    organizationId,
  });

  return c.json(message, 201);
});

// Process a message (called by QStash)
messagesRouter.post("/process-message", async (c) => {
  const body = await c.req.json();
  const result = await processorService.processMessage(body.messageId);

  // Route to webhooks
  await routerService.routeMessage(body.messageId);

  return c.json(result);
});

// List messages
messagesRouter.get("/", async (c) => {
  const organizationId = c.req.header("X-Organization-ID") || "default";
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "50");
  const status = c.req.query("status");
  const type = c.req.query("type");
  const connectorId = c.req.query("connectorId");

  const where: any = { organizationId };
  if (status) where.status = status;
  if (type) where.messageType = type;
  if (connectorId) where.connectorId = connectorId;

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where,
      include: {
        connector: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.message.count({ where }),
  ]);

  return c.json({
    messages,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// Get single message
messagesRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const message = await prisma.message.findUnique({
    where: { id },
    include: {
      connector: true,
      deliveries: {
        include: {
          webhook: { select: { name: true, url: true } },
        },
      },
    },
  });

  if (!message) {
    return c.json({ error: "Message not found" }, 404);
  }

  return c.json(message);
});

export { messagesRouter };
