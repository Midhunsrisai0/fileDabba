const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

prisma
  .$connect()
  .then(() => {
    console.log("Connected to database successfully");
  })
  .catch((err) => {
    console.log("Failed to connect to database:", err.message);
  });

module.exports = { prisma };
