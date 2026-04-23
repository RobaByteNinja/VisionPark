const express = require("express");
const controller = require("./incident.controller");

const router = express.Router();

router.post("/", controller.createIncident);
router.patch("/:incidentId/status", controller.transitionIncidentStatus);
router.get("/:incidentId", controller.getIncidentById);

module.exports = router;
