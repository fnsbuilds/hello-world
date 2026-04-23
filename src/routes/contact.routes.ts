import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ContactService } from '../services/contact.service';
import { CreateContactInput, UpdateContactInput } from '../types/contact';

export async function contactRoutes(fastify: FastifyInstance) {
  fastify.get('/contacts', async (request: FastifyRequest, reply: FastifyReply) => {
    const contacts = await ContactService.findAll();
    return reply.send(contacts);
  });

  fastify.get('/contacts/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const contact = await ContactService.findById(id);
    if (!contact) {
      return reply.status(404).send({ error: 'Contact not found' });
    }
    return reply.send(contact);
  });

  fastify.post<{ Body: CreateContactInput }>('/contacts', async (request: FastifyRequest<{ Body: CreateContactInput }>, reply: FastifyReply) => {
    try {
      const contact = await ContactService.create(request.body);
      return reply.status(201).send(contact);
    } catch (error) {
      if ((error as any).code === 'P2002') {
        return reply.status(409).send({ error: 'Email already exists' });
      }
      throw error;
    }
  });

  fastify.put<{ Params: { id: string }; Body: UpdateContactInput }>('/contacts/:id', async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateContactInput }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const contact = await ContactService.update(id, request.body);
      return reply.send(contact);
    } catch (error) {
      if ((error as any).code === 'P2025') {
        return reply.status(404).send({ error: 'Contact not found' });
      }
      if ((error as any).code === 'P2002') {
        return reply.status(409).send({ error: 'Email already exists' });
      }
      throw error;
    }
  });

  fastify.delete('/contacts/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      await ContactService.delete(id);
      return reply.status(204).send();
    } catch (error) {
      if ((error as any).code === 'P2025') {
        return reply.status(404).send({ error: 'Contact not found' });
      }
      throw error;
    }
  });
}