const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
prisma.article.findFirst({where:{title:{contains:"React / Next.js"}}}).then(a => {
  console.log("CONTENT:\n", a?.content);
  prisma.$disconnect();
});
