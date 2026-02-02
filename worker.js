import { Worker } from "bullmq";
import { connection } from "./queue.js";

const worker = new Worker(
  "pdf-queue",
  async (job) => {
    const { pages } = job.data;

    console.log(`Started PDF job ${job.id}`);

    for (let i = 1; i <= pages; i++) {
      await new Promise((r) => setTimeout(r, 1000));

      const progress = Math.round((i / pages) * 100);
      await job.updateProgress(progress);

      console.log(`Job ${job.id} progress: ${progress}%`);
    }

    return {
      message: "PDF generated successfully",
      fileUrl: `/fake-files/${job.id}.pdf`,
    };
  },
  {
    connection,
    concurrency: 2, // IMPORTANT for Upstash limits
  }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed`, err);
});
