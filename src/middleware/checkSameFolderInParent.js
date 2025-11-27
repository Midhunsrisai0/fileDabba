const { prisma } = require("../../prisma/prisma");
const config = require("../config");

const checkSameFolderInParent = async (req, res, next) => {
  try {
    const { folderName, parentFolderId } = req.body;

    const existingFolder = await prisma.folder.findFirst({
      where: {
        name: folderName,
        parentId: parentFolderId,
      },
    });
    if (existingFolder) {
      return res.status(400).json({
        code: 400,
        message: `A folder with the name '${folderName}' already exists in the specified parent folder.`,
      });
    }
    next();
  } catch (error) {
    console.error("Check same folder in parent error:", error);
    return res.status(500).json({
      code: 500,
      message: `Internal server error: ${error?.message}`,
    });
  }
};

module.exports = { checkSameFolderInParent };
