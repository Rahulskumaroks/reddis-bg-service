import express from "express";
import { pdfQueue, connection } from "./queue.js";
import { QueueEvents } from "bullmq";

const app = express();
app.use(express.json());

const queueEvents = new QueueEvents("pdf-queue", { connection });

app.post("/generate-pdf", async (req, res) => {
  const { pages = 10 } = req.body;

  const estimatedTime = pages * 1000;

  const job = await pdfQueue.add("generate-pdf", {
    pages,
    estimatedTime,
  });

  res.json({
    jobId: job.id,
    status: "QUEUED",
    estimatedTime,
  });
});

app.get("/generate-pdf/:id", async (req, res) => {
  const job = await pdfQueue.getJob(req.params.id);

  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  const state = await job.getState();

  let nextPollIn = 3000;
  if (job.progress < 30) nextPollIn = 2000;
  else if (job.progress < 80) nextPollIn = 5000;
  else nextPollIn = 8000;

  res.json({
    jobId: job.id,
    status: state.toUpperCase(),
    progress: job.progress,
    nextPollIn,
    result: job.returnvalue || null,
  });
});

app.listen(3000, () => {
  console.log("API running on http://localhost:3000");
});
