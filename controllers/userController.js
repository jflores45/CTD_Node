const {StatusCodes} = require("http-status-codes");
const { userSchema } = require("../validation/userSchema"); 
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
const register = async (req, res) => {
    
    if (!req.body) req.body = {};
    
    const { error, value } = userSchema.validate(req.body, {
        abortEarly: false
    });

    if (error) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: error.message
        });
    }
    const { name, email, password } = value;

    const hashedPassword = await hashPassword(password);
    const newUser = { name, email, hashedPassword };

    global.users.push(newUser);

    const userResponse = {
        name: newUser.name,
        email: newUser.email
    };

     res.status(StatusCodes.CREATED).json(userResponse);
}

// LOGON
const logon = async (req, res) => {

    if (!req.body) req.body = {};

    const { email, password } = req.body;

    const user = global.users.find(u => u.email === email);
    const match = user && await comparePassword(password, user.hashedPassword);

    if (!user || !match) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ 
            message: "Invalid email or password" 
        });
    }
    // log user in 
    global.user_id = user.email;

    res.status(StatusCodes.OK).json({ 
        name: user.name, 
        email: user.email 
    });
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