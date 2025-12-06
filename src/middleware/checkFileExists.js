const { prisma } = require("../../prisma/prisma");

const checkFileExists = async (req, res, next) => {
  try {
    const fileId = Number.parseInt(req.query.fileId, 10);

    if (Number.isNaN(fileId)) {
      return res
        .status(400)
        .json({ code: 400, message: "Invalid file identifier" });
    }

    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return res
        .status(400)
        .json({ code: 400, message: "File does not exist" });
    }

    req.fileId = fileId;
    req.fileObject = file;

    next();
  } catch (error) {
    console.error("Check file error:", error);
    return res.status(500).json({
      code: 500,
      message: `Internal server error: ${error?.message}`,
    });
  }
};

module.exports = { checkFileExists };
