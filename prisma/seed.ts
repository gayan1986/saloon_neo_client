import { PrismaClient, Prisma } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

const userData: Prisma.UserCreateInput[] = [
{
    email : "admin@saloonneo.lk",
    fristName : "Admin",
    LastName : "Neo",
    password : "$2a$12$IjnzRZIao2h82O745GQjQe8rplubL.wAf6E7knQDQcwmkKKprZnGS",
    role : "ADMIN",
    privileges : []
}
];

export async function main() {
  for (const u of userData) {
    await prisma.user.create({ data: u });
  }
}

main();