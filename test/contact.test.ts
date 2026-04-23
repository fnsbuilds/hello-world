import { test, describe, beforeAll, afterAll, expect, beforeEach, afterEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { contactRoutes } from '../src/routes/contact.routes';
import prisma from '../src/lib/prisma';

describe('Contact API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify({ logger: false });
    app.register(contactRoutes);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await prisma.contact.deleteMany();
  });

  beforeEach(async () => {
    await prisma.contact.deleteMany();
  });

  describe('GET /contacts', () => {
    test('should return empty array', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/contacts',
      });
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual([]);
    });

    test('should return contacts', async () => {
      await prisma.contact.create({
        data: { name: 'John', email: 'john@test.com', phone: '123456' },
      });
      const response = await app.inject({
        method: 'GET',
        url: '/contacts',
      });
      expect(response.statusCode).toBe(200);
      const contacts = JSON.parse(response.payload);
      expect(contacts).toHaveLength(1);
      expect(contacts[0].name).toBe('John');
    });
  });

  describe('POST /contacts', () => {
    test('should create contact', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/contacts',
        payload: { name: 'Jane', email: 'jane@test.com', phone: '654321' },
      });
      expect(response.statusCode).toBe(201);
      const contact = JSON.parse(response.payload);
      expect(contact.name).toBe('Jane');
      expect(contact.email).toBe('jane@test.com');
    });

    test('should return 409 for duplicate email', async () => {
      await prisma.contact.create({
        data: { name: 'John', email: 'john@test.com', phone: '123' },
      });
      const response = await app.inject({
        method: 'POST',
        url: '/contacts',
        payload: { name: 'Jane', email: 'john@test.com', phone: '456' },
      });
      expect(response.statusCode).toBe(409);
    });
  });

  describe('GET /contacts/:id', () => {
    test('should return 404 for non-existent contact', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/contacts/non-existent-id',
      });
      expect(response.statusCode).toBe(404);
    });

    test('should return contact by id', async () => {
      const contact = await prisma.contact.create({
        data: { name: 'John', email: 'john@test.com', phone: '123' },
      });
      const response = await app.inject({
        method: 'GET',
        url: `/contacts/${contact.id}`,
      });
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload).name).toBe('John');
    });
  });

  describe('PUT /contacts/:id', () => {
    test('should update contact', async () => {
      const contact = await prisma.contact.create({
        data: { name: 'John', email: 'john@test.com', phone: '123' },
      });
      const response = await app.inject({
        method: 'PUT',
        url: `/contacts/${contact.id}`,
        payload: { name: 'John Updated' },
      });
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload).name).toBe('John Updated');
    });
  });

  describe('DELETE /contacts/:id', () => {
    test('should delete contact', async () => {
      const contact = await prisma.contact.create({
        data: { name: 'John', email: 'john@test.com', phone: '123' },
      });
      const response = await app.inject({
        method: 'DELETE',
        url: `/contacts/${contact.id}`,
      });
      expect(response.statusCode).toBe(204);
      const contacts = await prisma.contact.findMany();
      expect(contacts).toHaveLength(0);
    });
  });
});