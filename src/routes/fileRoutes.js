const fileRouter = require("express").Router();

fileRouter.get("/", async (req, res) => {
  res.status(200).json({ message: "File route is working" });
});

module.exports = { fileRouter };
