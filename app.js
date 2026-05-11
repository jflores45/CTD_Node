const express = require("express");
const app = express();

const userRouter = require("./routes/userRoutes");
const taskRouter = require("./routes/taskRoutes");
const authMiddleware = require("./middleware/auth");


app.use(express.json({ limit: "1kb" }));

// 1. Routes 
app.get("/", (req, res) => {
    res.status(200).json({ message: "Hello, World!" });
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

module.exports = { app, server };