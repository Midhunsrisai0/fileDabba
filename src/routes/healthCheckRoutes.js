const { healthController } = require("../controllers/healthController");

const healthCheckRouter = require("express").Router();

healthCheckRouter.get("/health", healthController);

module.exports = { healthCheckRouter };
