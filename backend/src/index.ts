import "dotenv/config";
import express from "express";
import helmet from "helmet";
import { config } from "./config.js";
import tasksRouter from "./routes/tasks.js";

const app = express();

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "32kb" }));

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});
app.use("/api/tasks", tasksRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "指定されたAPIは存在しません。" });
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("API request failed:", error);
  if (res.headersSent) {
    return;
  }
  res.status(500).json({ error: "サーバーでエラーが発生しました。" });
});

app.listen(config.port, "0.0.0.0", () => {
  console.log(`API server listening on port ${config.port}`);
});
