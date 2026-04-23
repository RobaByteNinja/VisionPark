const { TransactionService } = require("./transaction.service");

const transactionService = new TransactionService();

const createPendingTransaction = async (req, res, next) => {
  try {
    const transaction = await transactionService.createPendingTransaction(req.body);
    return res.status(201).json(transaction);
  } catch (error) {
    return next(error);
  }
};

const completeTransaction = async (req, res, next) => {
  try {
    const transaction = await transactionService.completeTransaction({
      transactionId: req.params.transactionId,
      status: req.body.status,
      providerRef: req.body.providerRef,
      metadata: req.body.metadata,
    });
    return res.status(200).json(transaction);
  } catch (error) {
    return next(error);
  }
};

const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await transactionService.getById(req.params.transactionId);
    return res.status(200).json(transaction);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createPendingTransaction,
  completeTransaction,
  getTransactionById,
};
