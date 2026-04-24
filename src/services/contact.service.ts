import prisma from '../lib/prisma.js';
import { CreateContactInput, UpdateContactInput, Contact } from '../types/contact.js';

export const ContactService = {
  async findAll(userId: string): Promise<Contact[]> {
    return prisma.contact.findMany({
      where: { userId },
    });
  },

  async findById(id: string, userId: string): Promise<Contact | null> {
    return prisma.contact.findFirst({
      where: { id, userId },
    });
  },

  async create(data: CreateContactInput, userId: string): Promise<Contact> {
    return prisma.contact.create({
      data: {
        ...data,
        userId,
      },
    });
  },

  async update(id: string, data: UpdateContactInput, userId: string): Promise<Contact> {
    return prisma.contact.update({
      where: { id, userId },
      data,
    });
  },

  async delete(id: string, userId: string): Promise<Contact> {
    return prisma.contact.delete({
      where: { id, userId },
    });
  },
};