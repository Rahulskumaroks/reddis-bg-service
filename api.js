import express from "express";
import cors from "cors";
import { pdfQueue, connection } from "./queue.js";
import { QueueEvents } from "bullmq";
import Razorpay from "razorpay";
import express from "express";
import crypto from "crypto";

const app = express();

// CORS MUST COME FIRST
app.use(cors({
  origin: "*", // demo only
  methods: ["GET", "POST"],
}));



const razorpay = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.KEY_SECRET,
});

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


app.post("/order", async (req, res) => {
  try {
    const { amount, currency = "INR" } = req.body;

    // 1️⃣ Basic validation
    if (!amount) {
      return res.status(400).json({ error: "Amount is required" });
    }

    // 2️⃣ Create order on Razorpay
    const order = await razorpay.orders.create({
      amount: amount * 100, // convert ₹ to paise
      currency,
      receipt: `rcpt_${Date.now()}`,
    });
    // 3️⃣ Send order details to client
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.KEY_ID, 
    });
  } catch (error) {
    console.error("Order creation failed:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
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




app.post(
  "/webhook/razorpay",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const razorpaySignature = req.headers["x-razorpay-signature"];
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(req.body)
      .digest("hex");
    // 1️⃣ Verify webhook authenticity
    if (expectedSignature !== razorpaySignature) {
      return res.status(400).send("Invalid signature");
    }
    // 2️⃣ Parse event
    const event = JSON.parse(req.body.toString());
    // 3️⃣ Handle events
    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;
      console.log("✅ Payment confirmed:", payment.id);

      // 👉 Update DB
      // 👉 Mark order as PAID
      // 👉 Unlock product / service
    }
    // Razorpay expects 200 OK
    res.json({ status: "ok" });
  }
);




const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
