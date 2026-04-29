const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const dogsRouter = require('./routes/dogs');
const { error } = require('console');
const taskRouter = require("./routers/taskRoutes");

const app = express(); 


// Middleware:
const requestIdMiddleware = (req, res, next) => {
    req.requestId = uuidv4();
    res.setHeader('X-Request-Id', req.requestId);
    next();
};

const logger = (req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const requestID = req.requestId;
    console.log(`[${timestamp}]: ${method} ${req.path} (${requestID})`);
    next();
};

const secureHeaders = (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
};

const validateJSON = (req, res, next) => {
    if (req.method === 'POST' && !req.headers['content-type']?.includes('application/json')) {
            return res.status(400).json({
                error: "Content-Type must be application/json",
                requestId: req.requestId
            });
    }
    next();
};



// 1. Request ID middleware (adds req.requestId)
    app.use(requestIdMiddleware);

// 2. Logging middleware (logs requests with requestId)
    app.use(logger);

// 3. Security headers middleware (sets security headers)
    app.use(secureHeaders);

// 4. Body parsing middleware (express.json() with size limit)
    app.use(express.json({limit: '1mb'})); 
 
// 5. Content-Type validation middleware (for POST requests)
    app.use(validateJSON);

    app.use('/images', express.static(path.join(__dirname, 'public/images'))); 

// 6. Routes (your route handlers)

app.use('/', dogsRouter); // Do not remove this line

// 7. Error handling middleware (catches thrown errors)
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  if (statusCode >= 400 && statusCode < 500) {
    console.warn(`WARN: ${err.name} ${err.message}`);
  } else {
    console.error(`ERROR: Error ${err.message}`);
  }

  res.status(statusCode).json({
    error: err.message || "Internal Server Error",
    requestId: req.requestId
  });
});

// 8. 404 handler (catches unmatched routes)
app.use((req, res, next) => {
    res.status(404).json({
        error: "Route not found",
        requestId: req.requestId
    });
});


const server =	app.listen(3000, () => console.log("Server listening on port 3000"));
module.exports = server;
