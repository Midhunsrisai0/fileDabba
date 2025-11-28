const dotenv = require("dotenv");
dotenv.config();

const config = {
  version: "2.0.0",
  PORT: process.env.PORT || 3000,
  HOST: process.env.HOST || "localhost",
  BASE_FILE_PATH: process.env.BASE_FILE_PATH,
  BASE_FOLDER_ID: process.env.BASE_FOLDER_ID,
  BACKUP_PATH: process.env.BACKUP_PATH || "./backups",
};

module.exports = config;
