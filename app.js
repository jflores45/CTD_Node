const express = require("express");
const app = express();

app.use(express.json({ limit: "1kb" }));

// 1. Routes 
app.get("/", (req, res) => {
    res.status(200).json({ message: "Hello, World!" });
});

app.post("/testpost", (req, res) => {
    res.status(200).json({ message: "POST request received!" });
});

const userRouter = require("./routes/userRoutes");
app.use("/api/users", userRouter);

 
// 2. 404 handler: middleware 
const notFound = require("./middleware/not-found");
app.use(notFound);

// 3. Error handler: middleware
const errorHandler = require("./middleware/error-handler");
app.use(errorHandler);

const port = process.env.PORT || 3000;
const server = app.listen(port);

module.exports = { app, server };