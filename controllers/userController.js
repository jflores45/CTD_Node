const {StatusCodes} = require("http-status-codes");
const pool = require("../db/pg-pool");

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

// REGISTER
const register = async (req, res, next) => {
  if (!req.body) req.body = {};

    // validate user input
  const { error, value } = userSchema.validate(req.body, {
    abortEarly: false
  });

  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: error.message
    });
  }

  const { name, email, password } = value;

  const hashed_password = await hashPassword(password);

  try {
    const result = await pool.query(
      `INSERT INTO users (email, name, hashed_password)
       VALUES ($1, $2, $3)
       RETURNING id, email, name`,
      [email, name, hashed_password]
    );

    const user = result.rows[0];

    global.user_id = user.id;

    res.status(StatusCodes.CREATED).json({
      name: user.name,
      email: user.email
    });

  } catch (e) {
    if (e.code === "23505") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Email already registered"
      });
    }

    return next(e); // pass other errors
  }
};

// LOGON
const logon = async (req, res, next) => {
  if (!req.body) req.body = {};

  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "Invalid email or password"
      });
    }

    const user = result.rows[0];

    const match = await comparePassword(password, user.hashed_password);

    if (!match) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "Invalid email or password"
      });
    }

    global.user_id = user.id;

    res.status(StatusCodes.OK).json({
      name: user.name,
      email: user.email
    });

  } catch (e) {
    return next(e);
  }
};

// LOGOFF (SKELETON)
const logoff = (req, res) => {
    global.user_id = null;
    res.status(StatusCodes.OK).json({ message: "Logout successful" });
};

// EXPORTS
module.exports = {
    register,
    logon,
    logoff
};