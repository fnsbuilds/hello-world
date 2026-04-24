import { test, describe, beforeAll, afterAll, expect, beforeEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { contactRoutes } from '../src/routes/contact.routes';
import prisma from '../src/lib/prisma';

describe('Contact API', () => {
  let app: FastifyInstance;
  let token: string;
  let testUserId: string;

  beforeAll(async () => {
    app = Fastify({ logger: false });
    app.register(contactRoutes);
    await app.ready();

    const hashedPassword = await bcrypt.hash('testpassword', 10);
    const user = await prisma.user.create({
      data: {
        email: 'test@test.com',
        password: hashedPassword,
      },
    });
    testUserId = user.id;
    token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: '1h' });
  });

  afterAll(async () => {
    await app.close();
    await prisma.contact.deleteMany();
    await prisma.user.deleteMany();
  });

  beforeEach(async () => {
    await prisma.contact.deleteMany();
  });

  describe('GET /contacts', () => {
    test('should return empty array', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/contacts',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual([]);
    });

    test('should return contacts', async () => {
      await prisma.contact.create({
        data: { name: 'John', email: 'john@test.com', phone: '11999999999', userId: testUserId },
      });
      const response = await app.inject({
        method: 'GET',
        url: '/contacts',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(response.statusCode).toBe(200);
      const contacts = JSON.parse(response.payload);
      expect(contacts).toHaveLength(1);
      expect(contacts[0].name).toBe('John');
    });

    test('should return 401 without token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/contacts',
      });
      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /contacts', () => {
    test('should create contact', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/contacts',
        headers: { authorization: `Bearer ${token}` },
        payload: { name: 'Jane', email: 'jane@test.com', phone: '21988888888' },
      });
      expect(response.statusCode).toBe(201);
      const contact = JSON.parse(response.payload);
      expect(contact.name).toBe('Jane');
      expect(contact.email).toBe('jane@test.com');
    });

    test('should return 409 for duplicate email', async () => {
      await prisma.contact.create({
        data: { name: 'John', email: 'john@test.com', phone: '11999999999', userId: testUserId },
      });
      const response = await app.inject({
        method: 'POST',
        url: '/contacts',
        headers: { authorization: `Bearer ${token}` },
        payload: { name: 'Jane', email: 'john@test.com', phone: '21988888888' },
      });
      expect(response.statusCode).toBe(409);
      expect(JSON.parse(response.payload).error).toBe('Email já cadastrado');
    });

    test('should return 409 for duplicate phone', async () => {
      await prisma.contact.create({
        data: { name: 'John', email: 'john@test.com', phone: '11999999999', userId: testUserId },
      });
      const response = await app.inject({
        method: 'POST',
        url: '/contacts',
        headers: { authorization: `Bearer ${token}` },
        payload: { name: 'Jane', email: 'jane@test.com', phone: '11999999999' },
      });
      expect(response.statusCode).toBe(409);
      expect(JSON.parse(response.payload).error).toBe('Telefone já cadastrado');
    });

    test('should return 400 for invalid phone', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/contacts',
        headers: { authorization: `Bearer ${token}` },
        payload: { name: 'Jane', email: 'jane@test.com', phone: '123' },
      });
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.payload).error).toBe('Telefone inválido (deve ter 11 dígitos numéricos)');
    });

    test('should return 400 for invalid email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/contacts',
        headers: { authorization: `Bearer ${token}` },
        payload: { name: 'Jane', email: 'invalid-email', phone: '11999999999' },
      });
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.payload).error).toBe('Email inválido');
    });

    test('should return 400 for empty name', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/contacts',
        headers: { authorization: `Bearer ${token}` },
        payload: { name: '   ', email: 'jane@test.com', phone: '11999999999' },
      });
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.payload).error).toBe('Nome é obrigatório');
    });
  });

  describe('GET /contacts/:id', () => {
    test('should return 404 for non-existent contact', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/contacts/non-existent-id',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(response.statusCode).toBe(404);
    });

    test('should return contact by id', async () => {
      const contact = await prisma.contact.create({
        data: { name: 'John', email: 'john@test.com', phone: '11999999999', userId: testUserId },
      });
      const response = await app.inject({
        method: 'GET',
        url: `/contacts/${contact.id}`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload).name).toBe('John');
    });
  });

  describe('PUT /contacts/:id', () => {
    test('should update contact', async () => {
      const contact = await prisma.contact.create({
        data: { name: 'John', email: 'john@test.com', phone: '11999999999', userId: testUserId },
      });
      const response = await app.inject({
        method: 'PUT',
        url: `/contacts/${contact.id}`,
        headers: { authorization: `Bearer ${token}` },
        payload: { name: 'John Updated' },
      });
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload).name).toBe('John Updated');
    });
  });

  describe('DELETE /contacts/:id', () => {
    test('should delete contact', async () => {
      const contact = await prisma.contact.create({
        data: { name: 'John', email: 'john@test.com', phone: '11999999999', userId: testUserId },
      });
      const response = await app.inject({
        method: 'DELETE',
        url: `/contacts/${contact.id}`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(response.statusCode).toBe(204);
      const contacts = await prisma.contact.findMany();
      expect(contacts).toHaveLength(0);
    });
  });
});