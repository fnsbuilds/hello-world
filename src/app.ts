import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { contactRoutes } from './routes/contact.routes.js';
import { authRoutes } from './routes/auth.routes.js';
import prisma from './lib/prisma';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const fastify = Fastify({ logger: true });

fastify.register(fastifyStatic, {
  root: path.join(__dirname, '../public'),
  prefix: '/',
});

fastify.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'API de Cadastro de Contatos',
      description: 'API RESTful para gerenciamento de contatos',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desenvolvimento',
      },
    ],
    tags: [
      { name: 'Contatos', description: 'Operações com contatos' },
    ],
  },
});

fastify.register(fastifySwaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true,
  },
});

fastify.register(contactRoutes);
fastify.register(authRoutes);

const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
    console.log(`API Docs: http://localhost:3000/docs`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

export { fastify };

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop() || '')) {
  start();
}

const shutdown = async () => {
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);