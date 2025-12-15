import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();
const connectorsRouter = new Hono();

const ConnectorSchema = z.object({
  name: z.string(),
  type: z.enum(["HL7", "XML", "FHIR"]),
  host: z.string(),
  port: z.number().optional(),
  endpoint: z.string().optional(),
  auth: z.record(z.any()).optional(),
  config: z.record(z.any()).optional(),
});

// List connectors
connectorsRouter.get("/", async (c) => {
  const organizationId = c.req.header("X-Organization-ID") || "default";
  const connectors = await prisma.connector.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });
  return c.json({ connectors });
});

// Create connector
connectorsRouter.post("/", async (c) => {
  const organizationId = c.req.header("X-Organization-ID") || "default";
  const body = await c.req.json();
  const validated = ConnectorSchema.parse(body);

  const connector = await prisma.connector.create({
    data: {
      ...validated,
      organizationId,
    },
  });

  return c.json(connector, 201);
});

// Update connector
connectorsRouter.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const validated = ConnectorSchema.partial().parse(body);

  const connector = await prisma.connector.update({
    where: { id },
    data: validated,
  });

  return c.json(connector);
});

// Delete connector
connectorsRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  await prisma.connector.delete({ where: { id } });
  return c.json({ success: true });
});

// Test connector connection
connectorsRouter.post("/:id/test", async (c) => {
  const id = c.req.param("id");
  const connector = await prisma.connector.findUnique({ where: { id } });

  if (!connector) {
    return c.json({ error: "Connector not found" }, 404);
  }

  // Simulate connection test
  try {
    // In production, this would actually test the connection
    await prisma.connector.update({
      where: { id },
      data: {
        status: "active",
        lastHealthAt: new Date(),
      },
    });

    return c.json({ success: true, message: "Connection successful" });
  } catch (error) {
    await prisma.connector.update({
      where: { id },
      data: { status: "error" },
    });

    return c.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Connection failed",
      },
      500,
    );
  }
});

export { connectorsRouter };
