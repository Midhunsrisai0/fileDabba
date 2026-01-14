const { prisma } = require("../prisma/prisma");

async function main() {
  await prisma.folder.upsert({
    where: { id: 7 },
    update: {},
    create: {
      id: 7,
      name: "uploads",
    },
  });
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
