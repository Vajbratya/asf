import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { WebhookService } from "../services/webhooks.js";

const prisma = new PrismaClient();
const webhookService = new WebhookService();
const webhooksRouter = new Hono();

const WebhookSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  secret: z.string(),
  events: z.array(z.string()),
  filters: z.record(z.any()).optional(),
  active: z.boolean().optional(),
});

// List webhooks
webhooksRouter.get("/", async (c) => {
  const organizationId = c.req.header("X-Organization-ID") || "default";
  const webhooks = await prisma.webhook.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });
  return c.json({ webhooks });
});

// Create webhook
webhooksRouter.post("/", async (c) => {
  const organizationId = c.req.header("X-Organization-ID") || "default";
  const body = await c.req.json();
  const validated = WebhookSchema.parse(body);

  const webhook = await prisma.webhook.create({
    data: {
      ...validated,
      organizationId,
    },
  });

  return c.json(webhook, 201);
});

// Update webhook
webhooksRouter.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const validated = WebhookSchema.partial().parse(body);

  const webhook = await prisma.webhook.update({
    where: { id },
    data: validated,
  });

  return c.json(webhook);
});

// Delete webhook
webhooksRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  await prisma.webhook.delete({ where: { id } });
  return c.json({ success: true });
});

// Manually trigger delivery
webhooksRouter.post("/deliveries/:id/retry", async (c) => {
  const id = c.req.param("id");
  const result = await webhookService.deliverToWebhook(id);
  return c.json(result);
});

export { webhooksRouter };
