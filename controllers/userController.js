const {StatusCodes} = require("http-status-codes");
const prisma = require("../db/prisma");

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

    const { name, email, password } = req.body;

    try {
        const hashedPassword = await hashPassword(password);
        let user = null;

        try {
            user = await prisma.user.create({
            data: {
                    name,
                    email: email.toLowerCase(),
                    hashedPassword
                },
            select: {
                    name: true,
                    email: true,
                    id: true
                }
            });

        } catch (e) {

            if (e.name === "PrismaClientKnownRequestError" && e.code === "P2002") {

                return res.status(StatusCodes.BAD_REQUEST).json({
                    message: "Email already registered"
                });
            }

            return next(e); // the error handler takes care of other errors
        }
        global.user_id = user.id;

        return res.status(StatusCodes.CREATED).json({
            name: user.name,
            email: user.email
        });
    } catch (e) {
        return next(e);
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

    const  match = await comparePassword(password, user.hashedPassword);

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