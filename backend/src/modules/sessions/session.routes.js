const express = require("express");
const controller = require("./session.controller");

const router = express.Router();

router.post("/reservations", controller.createReservation);
router.post("/:sessionId/secure", controller.secureSession);
router.post("/:sessionId/expire", controller.expireSession);
router.post("/:sessionId/close", controller.closeSession);
router.get("/:sessionId", controller.getSessionById);

module.exports = router;
