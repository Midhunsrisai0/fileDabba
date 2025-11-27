const { prisma } = require("../../prisma/prisma");

const checkParentExists = async (req, res, next) => {
  try {
    const parentFolderId = req.body.parentFolderId;

    const parentFolder = await prisma.folder.findUnique({
      where: { id: parentFolderId },
    });

    if (!parentFolder) {
      return res
        .status(400)
        .json({ code: 400, message: "Parent folder does not exist" });
    }

    next();
  } catch (error) {
    console.error("Check parent folder error:", error);
    return res.status(500).json({
      code: 500,
      message: `Internal server error: ${error?.message}`,
    });
  }
};

module.exports = { checkParentExists };
