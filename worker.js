import express from "express";
import { Worker } from "bullmq";
import { connection } from "./queue.js";

const app = express();

// 🔵 Dummy health endpoint (Render requirement)
app.get("/", (req, res) => {
  res.send("Worker alive");
});

// 🔵 Use Render's PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Worker HTTP alive on port ${PORT}`);
});

// 🔴 Actual BullMQ Worker
const worker = new Worker(
  "pdf-queue",
  async (job) => {
    const { pages } = job.data;

    console.log(`Started job ${job.id}`);

    for (let i = 1; i <= pages; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      await job.updateProgress(Math.round((i / pages) * 100));
    }

    return { message: "PDF generated" };
  },
  {
    connection,
    concurrency: 2,
  }
);

console.log("✅ BullMQ Worker started");
