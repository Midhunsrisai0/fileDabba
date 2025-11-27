const { prisma } = require("../../prisma/prisma");
const config = require("../config");

const checkSameFileInParent = async (req, res, next) => {
  try {
    const { filename, parentFolderId } = req.body;

    const existingFile = await prisma.file.findFirst({
      where: {
        filename: filename,
        parentId: parentFolderId,
      },
    });
    if (existingFile) {
      return res.status(400).json({
        code: 400,
        message: `A file with the name '${filename}' already exists in the specified parent folder.`,
      });
    }
    next();
  } catch (error) {
    console.error("Check same file in parent error:", error);
    return res.status(500).json({
      code: 500,
      message: `Internal server error: ${error?.message}`,
    });
  }
};

module.exports = { checkSameFileInParent };
