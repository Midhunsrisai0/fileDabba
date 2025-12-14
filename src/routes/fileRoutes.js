const fileRouter = require("express").Router();
const multer = require("multer");
const {
  // uploadController,
  // downloadFileController,
  createFolder,
  deleteFolder,
  uploadController,
  getFileController,
  deleteFileController,
} = require("../controllers/v1/fileControllerV1");
const { validateRequest } = require("../middleware/validator");
const {
  fileUploadSchemaV1,
  fileGetSchemaV1,
  fileDeleteSchemaV1,
} = require("../validations/fileValidationsV1");
const { prisma } = require("../../prisma/prisma");
const {
  folderCreateSchema,
  folderDeleteSchema,
} = require("../validations/foldervalidationsV1");
const { checkParentExists } = require("../middleware/checkParentExists");
const {
  checkSameFolderInParent,
} = require("../middleware/checkSameFolderInParent");
const { checkFileExists } = require("../middleware/checkFileExists");
const {
  lockUploadMiddleware,
  lockDeleteMiddleware,
  markReadLockMiddleware,
} = require("../middleware/redisLock");

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

fileRouter.post(
  "/upload",
  upload.array("files"),
  validateRequest(fileUploadSchemaV1),
  checkParentExists,
  lockUploadMiddleware,
  uploadController
);

fileRouter.get(
  "/getFile",
  validateRequest(fileGetSchemaV1),
  checkFileExists,
  markReadLockMiddleware,
  getFileController
);

fileRouter.delete(
  "/deleteFile",
  validateRequest(fileDeleteSchemaV1),
  checkFileExists,
  lockDeleteMiddleware,
  deleteFileController
);

module.exports = { fileRouter };
  