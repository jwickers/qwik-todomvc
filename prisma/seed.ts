/**
 * Adds seed data to your db
 *
 * @link https://www.prisma.io/docs/guides/database/seed-database
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const main = async () => {
  let id = 1;
  await prisma.todo.upsert({
    where: { id },
    create: { id, text: "Taste JavaScript", done: true },
    update: {},
  });
  id = 2;
  await prisma.todo.upsert({
    where: { id },
    create: { id, text: "Buy a unicorn" },
    update: {},
  });
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
