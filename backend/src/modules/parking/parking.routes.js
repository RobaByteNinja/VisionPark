const express = require("express");
const controller = require("./parking.controller");

const router = express.Router();

router.post("/lots", controller.createLot);
router.post("/zones", controller.createZone);
router.post("/spots", controller.createSpot);
router.get("/spots/:spotId", controller.getSpotById);
router.patch("/spots/:spotId/block", controller.setSpotBlocked);
router.post("/spots/:spotId/derive-status", controller.deriveSpotStatus);

module.exports = router;
