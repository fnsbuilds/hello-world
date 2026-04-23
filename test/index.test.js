import { test, describe, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';

describe('API endpoints', () => {
  let server;

  beforeAll(async () => {
    server = Fastify({ logger: false });
    server.get('/', async (request, reply) => {
      return { message: 'Hello, Felipe' };
    });
    await server.listen({ port: 3001 });
  });

  afterAll(async () => {
    await server.close();
  });

  test('GET / returns Hello, Felipe', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/',
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toEqual({ message: 'Hello, Felipe' });
  });
});