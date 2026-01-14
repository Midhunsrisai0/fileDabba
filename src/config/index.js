const dotenv = require("dotenv");
dotenv.config();

const config = {
  version: "2.0.0",
  PORT: process.env.PORT || 1729,
  HOST: process.env.HOST || "0.0.0.0",
  BASE_FILE_PATH: process.env.BASE_FILE_PATH,
  BASE_FOLDER_ID: process.env.BASE_FOLDER_ID,
  BACKUP_PATH: process.env.BACKUP_PATH || "./backups",

  JWT_SECRET: process.env.JWT_SECRET || "pGuPqY4K7L1o9Vw3zNX8Bq5T2JMfHs0a",
};

module.exports = config;
