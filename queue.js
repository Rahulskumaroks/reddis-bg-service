import IORedis from "ioredis";

export const connection = new IORedis({
  host: process.env.UPSTASH_REDIS_HOST,
  port: Number(process.env.UPSTASH_REDIS_PORT),
  username: "default",
  password: process.env.UPSTASH_REDIS_PASSWORD,

  tls: {},

  // 🔴 REQUIRED BY BULLMQ
  maxRetriesPerRequest: null,

  // 🟡 Recommended for managed Redis
  enableReadyCheck: false,
});
