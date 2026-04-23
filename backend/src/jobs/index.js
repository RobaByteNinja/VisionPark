const { ReservationExpiryJob } = require("./reservation-expiry.job");
const { ReconciliationJob } = require("./reconciliation.job");
const { logger } = require("../common/logger");
const { env } = require("../config/env");
const { markJobsInitialized, markJobHeartbeat } = require("../app/runtime-state");

const reservationExpiryJob = new ReservationExpiryJob();
const reconciliationJob = new ReconciliationJob();

const startJobs = (options = {}) => {
  const reservationIntervalMs = Number(
    options.reservationIntervalMs || env.reservationExpiryJobMs
  );
  const reconciliationIntervalMs = Number(
    options.reconciliationIntervalMs || env.reconciliationJobMs
  );

  markJobsInitialized();

  reservationExpiryJob.runOnce().catch((error) => {
    logger.error("Initial reservation expiry job run failed", {
      module: "jobs.index",
      error,
    });
  });
  reconciliationJob.runOnce().catch((error) => {
    logger.error("Initial reconciliation job run failed", {
      module: "jobs.index",
      error,
    });
  });

  const reservationTimer = setInterval(() => {
    markJobHeartbeat();
    reservationExpiryJob.runOnce().catch((error) => {
      logger.error("Reservation expiry job run failed", {
        module: "jobs.index",
        error,
      });
    });
  }, reservationIntervalMs);

  const reconciliationTimer = setInterval(() => {
    markJobHeartbeat();
    reconciliationJob.runOnce().catch((error) => {
      logger.error("Reconciliation job run failed", {
        module: "jobs.index",
        error,
      });
    });
  }, reconciliationIntervalMs);

  return {
    stop() {
      clearInterval(reservationTimer);
      clearInterval(reconciliationTimer);
    },
    reservationExpiryJob,
    reconciliationJob,
  };
};

module.exports = {
  startJobs,
  reservationExpiryJob,
  reconciliationJob,
};
