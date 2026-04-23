const express = require("express");
const controller = require("./user.controller");

const router = express.Router();

router.post("/", controller.createUser);
router.get("/:id", controller.getUserById);

module.exports = router;
