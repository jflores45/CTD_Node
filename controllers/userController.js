const {StatusCodes} = require("http-status-codes");

global.user_id = null;
global.users = [];
global.tasks = [];

const register = (req, res) => {
    const newUser = { ...req.body }; 

    global.users.push(newUser);
    global.users_id = newUser;

    const userResponse = {
        name: newUser.name,
        email: newUser.email
    };

     res.status(StatusCodes.CREATED).json(userResponse);
}

// LOGON (SKELETON)
const logon = (req, res) => {

    const { email, password } = req.body;

    const user = global.users.find(u => u.email === email);

    if (!user || user.password !== password) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ 
            message: "Invalid email or password" 
        });
    }
    // log user in 
    global.user_id = user;

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