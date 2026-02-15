import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/client";

import env from "@env";

const ADAPTER =
  process.env.NODE_ENV === "development"
    ? new PrismaPg({ connectionString: env.DATABASE_URL })
    : undefined;

const ACCELERATE_URL =
  process.env.NODE_ENV === "development" ? undefined : env.DATABASE_URL;

const OPTIONS = {
  adapter: ADAPTER,
  accelerateUrl: ACCELERATE_URL,
} as
  | {
      adapter: PrismaPg;
      accelerateUrl: undefined;
    }
  | {
      adapter: undefined;
      accelerateUrl: string;
    };

export const prisma: PrismaClient = new (class extends PrismaClient {
  public constructor() {
    super(OPTIONS);
  }
})();

export default prisma;
