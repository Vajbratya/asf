import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n📊 INTEGRA Database Check\n');

  // Count messages
  const messageCount = await prisma.message.count();
  console.log(`✅ Total mensagens: ${messageCount}`);

  // Count by connector
  const connectors = await prisma.connector.findMany({
    include: {
      _count: {
        select: { messages: true },
      },
    },
  });

  console.log('\n🔗 Mensagens por conector:');
  for (const c of connectors) {
    console.log(`   ${c.name}: ${c._count.messages}`);
  }

  // Recent messages
  const recent = await prisma.message.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      rawMessage: true,
      status: true,
      createdAt: true,
    },
  });

  console.log('\n📨 Últimas 5 mensagens:');
  for (const m of recent) {
    const preview = m.rawMessage.substring(0, 60).replace(/\r/g, '');
    console.log(`   [${m.status}] ${preview}...`);
  }

  // Usage stats
  const usage = await prisma.usageRecord.aggregate({
    _sum: { messagesProcessed: true },
    _count: true,
  });

  console.log(`\n📈 Usage records: ${usage._count}`);
  console.log(`   Total processado: ${usage._sum.messagesProcessed || 0}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
