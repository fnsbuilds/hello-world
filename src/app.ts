import Fastify from 'fastify';
import { contactRoutes } from './routes/contact.routes';
import prisma from './lib/prisma';

const fastify = Fastify({ logger: true });

fastify.register(contactRoutes);

const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

export { fastify };

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  start();
}

const shutdown = async () => {
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);