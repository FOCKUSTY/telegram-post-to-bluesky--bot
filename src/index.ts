import "dotenv/config";

import prisma from "@database";

import { login as loginTelegram } from "./telegram";
import { login as loginBluesky } from "./bluesky";

(async () => {
  await prisma.$connect();

  await loginBluesky();
  await loginTelegram();
})();
