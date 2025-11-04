import "dotenv/config";

import prisma from "@database";

import { login as loginTelegram } from "./telegram";

(async () => {
  await prisma.$connect();
  console.log("Database connected");
  
  await loginTelegram();
})();
