import express from "express";
import cors from "cors";
import { pdfQueue, connection } from "./queue.js";
import { QueueEvents } from "bullmq";

const app = express();

// CORS MUST COME FIRST
app.use(cors({
  origin: "*", // demo only
  methods: ["GET", "POST"],
}));

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

  res.json({
    jobId: job.id,
    status: state.toUpperCase(),
    progress: job.progress,
    result: job.returnvalue || null,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
