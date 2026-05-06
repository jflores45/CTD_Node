const express = require("express");
const app = express();
const pool = require("./db/pg-pool");

const userRouter = require("./routes/userRoutes");
const taskRouter = require("./routes/taskRoutes");
const authMiddleware = require("./middleware/auth");


app.use(express.json({ limit: "1kb" }));

// 1. Routes 
app.get("/", (req, res) => {
    res.status(200).json({ message: "Hello, World!" });
});

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(500).json({ message: `db not connected, error: ${ err.message }` });
  }
});

app.post("/testpost", (req, res) => {
    res.status(200).json({ message: "POST request received!" });
});

// User routes
app.use("/api/users", userRouter);

// Task routes (protected)
app.use("/api/tasks", authMiddleware, taskRouter);
 
// 404 handler: middleware 
const notFound = require("./middleware/not-found");
app.use(notFound);

// Error handler: middleware
const errorHandler = require("./middleware/error-handler");
app.use(errorHandler);

const port = process.env.PORT || 3000;
const server = app.listen(port);


const shutdown = async () => {
  console.log("Shutting down server...");

  try {
    await pool.end(); // close DB connections
    console.log("Database connections closed");
  } catch (err) {
    console.error("Error closing database pool:", err);
  }

  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
};

// listen for termination signals
process.on("SIGINT", shutdown);   // Ctrl + C
process.on("SIGTERM", shutdown);  // system shutdown

module.exports = { app, server };