const express = require("express");

const router = express.Router();
const { register } = require("../controllers/userController");
const { logon } = require("../controllers/userController");
const { logoff } = require("../controllers/userController");

router.route("/register").post(register);
router.route("/logon").post(logon);
router.route("/logoff").post(logoff);

module.exports = router;