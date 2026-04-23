import Fastify from 'fastify';

const fastify = Fastify({ logger: true });

fastify.get('/', async (request, reply) => {
  return { message: 'Hello, Felipe' };
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

export default fastify;

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  start();
}