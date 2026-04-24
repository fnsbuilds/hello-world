import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import { sendPasswordResetEmail } from '../lib/email.js';
import { RegisterInput, LoginInput, AuthResponse, JwtPayload, ForgotPasswordInput, ResetPasswordInput } from '../types/auth.js';

const SALT_ROUNDS = 10;
const JWT_EXPIRES_IN = '24h';
const PASSWORD_RESET_EXPIRES_MINUTES = 30;

const registerSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 6 },
    },
    additionalProperties: false,
  },
  response: {
    201: {
      type: 'object',
      properties: {
        token: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
          },
        },
      },
    },
    400: { type: 'object', properties: { error: { type: 'string' } } },
    409: { type: 'object', properties: { error: { type: 'string' } } },
  },
};

const loginSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string' },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'object',
      properties: {
        token: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
          },
        },
      },
    },
    400: { type: 'object', properties: { error: { type: 'string' } } },
    401: { type: 'object', properties: { error: { type: 'string' } } },
  },
};

const forgotPasswordSchema = {
  body: {
    type: 'object',
    required: ['email'],
    properties: {
      email: { type: 'string', format: 'email' },
    },
    additionalProperties: false,
  },
  response: {
    200: { type: 'object', properties: { message: { type: 'string' } } },
    400: { type: 'object', properties: { error: { type: 'string' } } },
    404: { type: 'object', properties: { error: { type: 'string' } } },
  },
};

const resetPasswordSchema = {
  body: {
    type: 'object',
    required: ['token', 'password'],
    properties: {
      token: { type: 'string' },
      password: { type: 'string', minLength: 6 },
    },
    additionalProperties: false,
  },
  response: {
    200: { type: 'object', properties: { message: { type: 'string' } } },
    400: { type: 'object', properties: { error: { type: 'string' } } },
    401: { type: 'object', properties: { error: { type: 'string' } } },
    404: { type: 'object', properties: { error: { type: 'string' } } },
  },
};

function generateToken(user: { id: string; email: string }): string {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
  };
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: JWT_EXPIRES_IN });
}

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/auth/register', {
    schema: registerSchema,
    async handler(request: FastifyRequest<{ Body: RegisterInput }>, reply: FastifyReply) {
      const { email, password } = request.body;

      if (!email || !password) {
        return reply.status(400).send({ error: 'Email e senha são obrigatórios' });
      }

      if (password.length < 6) {
        return reply.status(400).send({ error: 'Senha deve ter pelo menos 6 caracteres' });
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return reply.status(409).send({ error: 'Email já cadastrado' });
      }

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
        },
        select: {
          id: true,
          email: true,
        },
      });

      const token = generateToken(user);

      return reply.status(201).send({ token, user });
    },
  });

  fastify.post('/auth/login', {
    schema: loginSchema,
    async handler(request: FastifyRequest<{ Body: LoginInput }>, reply: FastifyReply) {
      const { email, password } = request.body;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return reply.status(401).send({ error: 'Email ou senha incorretos' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return reply.status(401).send({ error: 'Email ou senha incorretos' });
      }

      const token = generateToken({ id: user.id, email: user.email });

      return reply.send({ token, user: { id: user.id, email: user.email } });
    },
  });

  fastify.post('/auth/forgot-password', {
    schema: forgotPasswordSchema,
    async handler(request: FastifyRequest<{ Body: ForgotPasswordInput }>, reply: FastifyReply) {
      const { email } = request.body;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return reply.status(404).send({ error: 'Email não encontrado' });
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRES_MINUTES * 60 * 1000);

      await prisma.passwordReset.create({
        data: {
          token: resetToken,
          userId: user.id,
          expiresAt,
        },
      });

      try {
        await sendPasswordResetEmail(user.email, resetToken);
      } catch (error) {
        console.error('Erro ao enviar email:', error);
        return reply.status(500).send({ error: 'Erro ao enviar email de recuperação' });
      }

      return reply.send({ message: 'Email de recuperação enviado' });
    },
  });

  fastify.post('/auth/reset-password', {
    schema: resetPasswordSchema,
    async handler(request: FastifyRequest<{ Body: ResetPasswordInput }>, reply: FastifyReply) {
      const { token, password } = request.body;

      if (!token || !password) {
        return reply.status(400).send({ error: 'Token e nova senha são obrigatórios' });
      }

      if (password.length < 6) {
        return reply.status(400).send({ error: 'Senha deve ter pelo menos 6 caracteres' });
      }

      const passwordReset = await prisma.passwordReset.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!passwordReset) {
        return reply.status(404).send({ error: 'Token inválido' });
      }

      if (passwordReset.used) {
        return reply.status(400).send({ error: 'Token já utilizado' });
      }

      if (new Date() > passwordReset.expiresAt) {
        return reply.status(400).send({ error: 'Token expirado' });
      }

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      await prisma.user.update({
        where: { id: passwordReset.userId },
        data: { password: hashedPassword },
      });

      await prisma.passwordReset.update({
        where: { id: passwordReset.id },
        data: { used: true },
      });

      return reply.send({ message: 'Senha alterada com sucesso' });
    },
  });
}