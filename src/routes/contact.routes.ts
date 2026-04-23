import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ContactService } from '../services/contact.service';
import { CreateContactInput, UpdateContactInput } from '../types/contact';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{11}$/;

function validateContact(data: CreateContactInput | UpdateContactInput): string | null {
  if ('name' in data) {
    if (!data.name || data.name.trim() === '') {
      return 'Nome é obrigatório';
    }
  }

  if ('email' in data) {
    if (!data.email || data.email.trim() === '') {
      return 'Email é obrigatório';
    }
    if (!EMAIL_REGEX.test(data.email)) {
      return 'Email inválido';
    }
  }

  if ('phone' in data) {
    if (!data.phone || data.phone.trim() === '') {
      return 'Telefone é obrigatório';
    }
    if (!PHONE_REGEX.test(data.phone)) {
      return 'Telefone inválido (deve ter 11 dígitos numéricos)';
    }
  }

  return null;
}

const contactSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    email: { type: 'string', format: 'email' },
    phone: { type: 'string', pattern: '^\\d{11}$' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const createContactSchema = {
  body: {
    type: 'object',
    required: ['name', 'email', 'phone'],
    properties: {
      name: { type: 'string' },
      email: { type: 'string' },
      phone: { type: 'string' },
    },
    additionalProperties: false,
  },
  response: {
    201: contactSchema,
    400: { type: 'object', properties: { error: { type: 'string' } } },
    409: { type: 'object', properties: { error: { type: 'string' } } },
  },
};

const updateContactSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
    },
  },
  body: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      email: { type: 'string' },
      phone: { type: 'string' },
    },
    additionalProperties: false,
  },
  response: {
    200: contactSchema,
    400: { type: 'object', properties: { error: { type: 'string' } } },
    404: { type: 'object', properties: { error: { type: 'string' } } },
    409: { type: 'object', properties: { error: { type: 'string' } } },
  },
};

export async function contactRoutes(fastify: FastifyInstance) {
  fastify.get('/contacts', {
    schema: {
      tags: ['Contatos'],
      response: {
        200: {
          type: 'array',
          items: contactSchema,
        },
      },
    },
    async handler(request: FastifyRequest, reply: FastifyReply) {
      const contacts = await ContactService.findAll();
      return reply.send(contacts);
    },
  });

  fastify.get('/contacts/:id', {
    schema: {
      tags: ['Contatos'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      response: {
        200: contactSchema,
        404: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
    async handler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
      const { id } = request.params;
      const contact = await ContactService.findById(id);
      if (!contact) {
        return reply.status(404).send({ error: 'Contato não encontrado' });
      }
      return reply.send(contact);
    },
  });

  fastify.post('/contacts', {
    schema: createContactSchema,
    async handler(request: FastifyRequest<{ Body: CreateContactInput }>, reply: FastifyReply) {
      const validationError = validateContact(request.body);
      if (validationError) {
        return reply.status(400).send({ error: validationError });
      }

      try {
        const contact = await ContactService.create(request.body);
        return reply.status(201).send(contact);
      } catch (error) {
        if ((error as any).code === 'P2002') {
          const field = (error as any).meta?.target?.includes('email') ? 'Email' : 'Telefone';
          return reply.status(409).send({ error: `${field} já cadastrado` });
        }
        throw error;
      }
    },
  });

  fastify.put('/contacts/:id', {
    schema: updateContactSchema,
    async handler(request: FastifyRequest<{ Params: { id: string }; Body: UpdateContactInput }>, reply: FastifyReply) {
      const validationError = validateContact(request.body);
      if (validationError) {
        return reply.status(400).send({ error: validationError });
      }

      try {
        const { id } = request.params;
        const contact = await ContactService.update(id, request.body);
        return reply.send(contact);
      } catch (error) {
        if ((error as any).code === 'P2025') {
          return reply.status(404).send({ error: 'Contato não encontrado' });
        }
        if ((error as any).code === 'P2002') {
          const field = (error as any).meta?.target?.includes('email') ? 'Email' : 'Telefone';
          return reply.status(409).send({ error: `${field} já cadastrado` });
        }
        throw error;
      }
    },
  });

  fastify.delete('/contacts/:id', {
    schema: {
      tags: ['Contatos'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      response: {
        204: { type: 'null' },
        404: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
    async handler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
      try {
        const { id } = request.params;
        await ContactService.delete(id);
        return reply.status(204).send();
      } catch (error) {
        if ((error as any).code === 'P2025') {
          return reply.status(404).send({ error: 'Contato não encontrado' });
        }
        throw error;
      }
    },
  });
}