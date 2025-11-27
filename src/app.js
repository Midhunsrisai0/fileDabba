const express = require("express");

const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();

app.use(cors());
app.use(bodyParser.json());

const { fileRouter } = require("./routes/fileRoutes");
const { healthCheckRouter } = require("./routes/healthCheckRoutes");
const config = require("./config");

app.use("/health-check", healthCheckRouter);

app.use("/files", fileRouter);

app.listen(config.PORT, config.host, () => {
  console.log(`Server is running at http://${config.host}:${config.PORT}`);
});
