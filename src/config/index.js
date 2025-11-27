const dotenv = require("dotenv");
dotenv.config();

const config = {
  version: "1.0.0",
  PORT: process.env.PORT || 3000,
  host: process.env.HOST || "localhost",
};

module.exports = config;
