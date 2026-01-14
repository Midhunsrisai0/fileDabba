const express = require("express");

const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const { fileRouter } = require("./routes/fileRoutes");
const { healthCheckRouter } = require("./routes/healthCheckRoutes");
const config = require("./config");

app.use("/health-check", healthCheckRouter);
app.use("/ping", (req, res) => res.send("pong"));
app.use("/files/v1", fileRouter);

app.listen(config.PORT, config.HOST, () => {
  console.log(`Server is running at http://${config.HOST}:${config.PORT}`);
});
