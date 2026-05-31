const {StatusCodes} = require("http-status-codes");
const prisma = require("../db/prisma");
const { userSchema } = require("../validation/userSchema");
const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");

global.user_id = null;
global.users = [];
global.tasks = [];

const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePassword(inputPassword, storedHash) {
  const [salt, key] = storedHash.split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = await scrypt(inputPassword, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}
// set cookie flags
const cookieFlags = (req) => {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // only when HTTPS is available
    sameSite: "Strict",
  };
};

const setJwtCookie = (req, res, user) => {
  // Sign JWT
  const payload = { id: user.id, csrfToken: randomUUID() };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" }); // 1 hour expiration
  // Set cookie.  Note that the cookie flags have to be different in production and in test.
  res.cookie("jwt", token, { ...cookieFlags(req), maxAge: 3600000 }); // 1 hour expiration
  return payload.csrfToken; // this is needed in the body returned by logon() or register()
};

// REGISTER
const register = async (req, res, next) => {
    if (!req.body) req.body = {};
    const { error, value } = userSchema.validate(req.body, {
      abortEarly: false
    });

    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: error.message
      });
    }

    value.hashedPassword = await hashPassword(value.password);
    delete value.password;

    const { name, email, hashedPassword } = value;
 
    try {
        const result = await prisma.$transaction(async (tx) => {
            // Create user account (similar to Assignment 6, but using tx instead of prisma)
            const newUser = await tx.user.create({
              data: { email, name, hashedPassword },
              select: { id: true, email: true, name: true }
            });

            // Create 3 welcome tasks using createMany
            const welcomeTaskData = [
              { title: "Complete your profile", userId: newUser.id, priority: "medium" },
              { title: "Add your first task", userId: newUser.id, priority: "high" },
              { title: "Explore the app", userId: newUser.id, priority: "low" }
            ];
            await tx.task.createMany({ data: welcomeTaskData });

            // Fetch the created tasks to return them
            const welcomeTasks = await tx.task.findMany({
              where: {
                userId: newUser.id,
                title: { in: welcomeTaskData.map(t => t.title) }
              },
              select: {
                id: true,
                title: true,
                isCompleted: true,
                userId: true,
                priority: true
              }
            });

          return { user: newUser, welcomeTasks };
        });

      // Sign JWT and set cookie
      const csrfToken = setJwtCookie(req, res, result.user);


      // Store the user ID globally for session management (not secure for production)
      global.user_id = result.user.id;
      
      // Send response with status 201
      res.status(201);
      res.json({
        user: result.user,
        welcomeTasks: result.welcomeTasks,
        csrfToken,
        transactionStatus: "success"
      });
      return; 

    } catch (err) {
        if (err.code === "P2002") {
          // send the appropriate error back -- the email was already registered
          return res.status(400).json({ error: "Email already registered" });
        } else {
          return next(err); // the error handler takes care of other errors
        }
    }
};

// LOGON
const logon = async (req, res, next) => {
  if (!req.body) req.body = {};
  let { email, password } = req.body;

  email = email.toLowerCase();

  try {
      const user = await prisma.user.findUnique({ where: { email }});

      if (!user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          message: "Invalid email or password"
        });
      }

      const match = await comparePassword(password, user.hashedPassword);

      if (!match) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          message: "Invalid email or password"
        });
      }

      global.user_id = user.id;
     
      
      const csrfToken = setJwtCookie(req, res, user);

      res.status(StatusCodes.OK).json({
        name: user.name,
        email: user.email,
        csrfToken
      });

    } catch (e) {
      return next(e);
    }
};

// LOGOFF (SKELETON)
const logoff = (req, res) => {
    global.user_id = null;
    res.clearCookie("jwt", cookieFlags(req));
    res.status(StatusCodes.OK).json({ message: "Logout successful" });
};

// EXPORTS
module.exports = {
    register,
    logon,
    logoff
};