import "dotenv/config";

import { login as loginTelegram } from "./telegram";
import { login as loginBluesky } from "./bluesky";

loginTelegram();
loginBluesky();