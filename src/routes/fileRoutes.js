const fileRouter = require("express").Router();
const multer = require("multer");
const {
  // uploadController,
  // downloadFileController,
  createFolder,
  deleteFolder,
} = require("../controllers/v1/fileControllerV1");
const { validateRequest } = require("../middleware/validator");
const { fileUploadSchemaV1 } = require("../validations/fileValidationsV1");
const { prisma } = require("../../prisma/prisma");
const {
  folderCreateSchema,
  folderDeleteSchema,
} = require("../validations/foldervalidationsV1");
const { checkParentExists } = require("../middleware/checkParentExists");
const {
  checkSameFolderInParent,
} = require("../middleware/checkSameFolderInParent");
const { buildFolderPath } = require("../utils/commonUtils");

const upload = multer(); // Files stored in memory

fileRouter.get("/", async (req, res) => {
  res.status(200).json({ message: "File route is working" });
});

fileRouter.post(
  "/createFolder",
  validateRequest(folderCreateSchema),
  checkParentExists,
  checkSameFolderInParent,
  createFolder
);

fileRouter.delete(
  "/deleteFolder",
  validateRequest(folderDeleteSchema),
  deleteFolder
);

// const fs = require("fs");
// const path = require("path");
// const config = require("../config");

// fileRouter.post("/temp", async (req, res) => {
//   try {
//     const createResult = await prisma.folder.create({
//       data: {
//         name: "uploads",
//         parentId: null,
//       },
//     });
//     return res.json({ data: createResult });
//   } catch (error) {
//     console.error("Temp folder creation error:", error);
//     return res
//       .status(500)
//       .json({ code: 500, message: `Internal server error: ${error?.message}` });
//   }
// });

// fileRouter.post("/testDelete", async (req, res) => {
//   try {
//     const basePath = path.resolve(config.BASE_FILE_PATH);
//     const folderPath = path.join(basePath, "subofUploads");
//     fs.rmSync(folderPath, { recursive: true, force: true });
//     return res.json({ message: "Folder deleted successfully" });
//   } catch (error) {
//     console.error("Temp folder deletion error:", error);
//     return res
//       .status(500)
//       .json({ code: 500, message: `Internal server error: ${error?.message}` });
//   }
// });

// fileRouter.get("/fullPath", async (req, res) => {
//   try {
//     const id = req.body.id;
// const fullPath = await buildFolderPath({
//       parentFolderId: id,
//     });
//     return res.json({ data: fullPath });
//   } catch (error) {
//     console.error("Get full path error:", error);
//     return res
//       .status(500)
//       .json({ code: 500, message: `Internal server error: ${error?.message}` });
//   }
// });

// fileRouter.post(
//   "/upload",
//   upload.array("files"),
//   validateRequest(fileUploadSchemaV1),
//   uploadController
// );

// fileRouter.get("/download", downloadFileController);
module.exports = { fileRouter };
