const { z } = require("zod");

const validateRequest = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (err) {
    return res.status(400).json({
      code: 400,
      message: "Validation error",
      data: err.message,
    });
  }
};

module.exports = { validateRequest };
