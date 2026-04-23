import prisma from '../src/lib/prisma.js';

const contacts = [
  { name: 'Felipe Silva', email: 'felipe@email.com', phone: '11999999999' },
  { name: 'Maria Santos', email: 'maria@email.com', phone: '21988888888' },
  { name: 'João Pereira', email: 'joao@email.com', phone: '31977777777' },
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