import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateCircleSlug, generateTournamentSlug } from '../src/utils/slug';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const user1 = await prisma.user.create({
    data: {
      username: 'alice',
      email: 'alice@example.com',
      password: hashedPassword,
      role: 'USER',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      username: 'bob',
      email: 'bob@example.com',
      password: hashedPassword,
      role: 'USER',
    },
  });

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  // Create test circles
  const publicCircle = await prisma.circle.create({
    data: {
      id: generateCircleSlug('Bridge Enthusiasts'),
      name: 'Bridge Enthusiasts',
      description: 'A public circle for bridge lovers',
      isPublic: true,
      createdBy: user1.id,
    },
  });

  const privateCircle = await prisma.circle.create({
    data: {
      id: generateCircleSlug('Advanced Players'),
      name: 'Advanced Players',
      description: 'Private circle for experienced players',
      isPublic: false,
      createdBy: user2.id,
    },
  });

  // Add circle memberships
  await prisma.circleMember.create({
    data: {
      circleId: publicCircle.id,
      userId: user1.id,
    },
  });

  await prisma.circleMember.create({
    data: {
      circleId: publicCircle.id,
      userId: user2.id,
    },
  });

  await prisma.circleMember.create({
    data: {
      circleId: privateCircle.id,
      userId: user2.id,
    },
  });

  // Create test tournament
  const tournamentDate = new Date('2025-06-24');
  const tournament = await prisma.tournament.create({
    data: {
      id: generateTournamentSlug('24 juni 2025 - Zomerdrive 2', tournamentDate),
      name: '24 juni 2025 - Zomerdrive 2',
      date: tournamentDate,
      venue: 'Jongeren B.V. US Uil',
      filename: 'test.pbn',
      uploadedBy: user1.id,
    },
  });

  // Share tournament with circles
  await prisma.tournamentCircle.create({
    data: {
      tournamentId: tournament.id,
      circleId: publicCircle.id,
      sharedBy: user1.id,
    },
  });

  // Create test comments
  await prisma.comment.create({
    data: {
      content: 'Great hand! I think North should have bid 3NT.',
      tournamentId: tournament.id,
      boardNumber: 1,
      userId: user2.id,
      circleId: publicCircle.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Interesting defense on this board. What do you think about the opening lead?',
      tournamentId: tournament.id,
      boardNumber: 5,
      userId: user1.id,
      circleId: publicCircle.id,
    },
  });

  console.log('Seed completed successfully!');
  console.log('Created:', {
    users: 3,
    circles: 2,
    tournaments: 1,
    comments: 2,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });