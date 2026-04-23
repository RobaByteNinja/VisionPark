const express = require("express");
const controller = require("./transaction.controller");

const router = express.Router();

router.post("/", controller.createPendingTransaction);
router.patch("/:transactionId/complete", controller.completeTransaction);
router.get("/:transactionId", controller.getTransactionById);

module.exports = router;
