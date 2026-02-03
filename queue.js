import { Queue } from "bullmq";
import IORedis from "ioredis";

export const connection = new IORedis({
  host: process.env.UPSTASH_REDIS_HOST,
  port: Number(process.env.UPSTASH_REDIS_PORT),
  username: "default",
  password: process.env.UPSTASH_REDIS_PASSWORD,
  tls: {},

  // REQUIRED for BullMQ + Upstash
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// 🔴 YOU WERE MISSING THIS
export const pdfQueue = new Queue("pdf-queue", {
  connection,
});
