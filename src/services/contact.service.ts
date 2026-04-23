import prisma from '../lib/prisma';
import { CreateContactInput, UpdateContactInput, Contact } from '../types/contact';

export const ContactService = {
  async findAll(): Promise<Contact[]> {
    return prisma.contact.findMany();
  },

  async findById(id: string): Promise<Contact | null> {
    return prisma.contact.findUnique({ where: { id } });
  },

  async create(data: CreateContactInput): Promise<Contact> {
    return prisma.contact.create({ data });
  },

  async update(id: string, data: UpdateContactInput): Promise<Contact> {
    return prisma.contact.update({ where: { id }, data });
  },

  async delete(id: string): Promise<Contact> {
    return prisma.contact.delete({ where: { id } });
  },
};