import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types/auth.js';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Token não fornecido' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    request.user = decoded;
  } catch (error) {
    return reply.status(401).send({ error: 'Token inválido ou expirado' });
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    user: JwtPayload;
  }
}