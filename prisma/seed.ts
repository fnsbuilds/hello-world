import { PrismaClient } from '@prisma/client';
import prisma from '../src/lib/prisma.js';

const contacts = [
  { name: 'Felipe Silva', email: 'felipe@email.com', phone: '(11) 99999-9999' },
  { name: 'Maria Santos', email: 'maria@email.com', phone: '(21) 98888-8888' },
  { name: 'João Pereira', email: 'joao@email.com', phone: '(31) 97777-7777' },
];

async function seed() {
  console.log('Seeding database...');
  
  await prisma.contact.deleteMany();
  
  for (const contact of contacts) {
    await prisma.contact.create({ data: contact });
    console.log(`Created: ${contact.name}`);
  }
  
  console.log('Done!');
  await prisma.$disconnect();
}

seed();