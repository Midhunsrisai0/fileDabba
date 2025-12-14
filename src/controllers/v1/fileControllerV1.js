const config = require("../../config");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { prisma } = require("../../../prisma/prisma");
const {
  buildFolderPath,
  deleteFolderRecursive,
} = require("../../utils/commonUtils");
const { releaseLock } = require("../../config/redisClient");

const createFolder = async (req, res) => {
  try {
    const body = req.body;
    const folderName = body.folderName;
    const parentFolderId = req.parentFolderId;
    const parentFolder = req.parentFolder;

    if (!Number.isInteger(parentFolderId) || !parentFolder) {
      return res.status(400).json({
        code: 400,
        message: "Parent folder context missing for folder creation",
      });
    }

    const parentFolderPathResp = await buildFolderPath({
      parentFolderId,
    });

    if (parentFolderPathResp.code !== 200) {
      return res.status(parentFolderPathResp.code).json({
        code: parentFolderPathResp.code,
        message: `Creating folder failed: ${parentFolderPathResp.message}`,
      });
    }

    const parentFolderPath = parentFolderPathResp.data;
    const newFolderPath = path.join(parentFolderPath, folderName);

    // Return immediate response to user
    res.status(202).json({
      code: 202,
      message: "Folder creation initiated",
      data: {
        folderName: folderName,
        status: "processing",
      },
    });

    // Background processing (fire-and-forget)
    // User already got response, now we process internally
    setImmediate(async () => {
      try {
        // Step 1: Create directory first (synchronous to ensure it's done)
        fs.mkdirSync(newFolderPath, { recursive: true });

        // Verify folder was created
        if (!fs.existsSync(newFolderPath)) {
          console.error(
            `Folder creation failed: Directory does not exist after creation - ${newFolderPath}`
          );
          return;
        }

        console.log(`Folder created successfully at: ${newFolderPath}`);

        // Step 2: Only create database record if directory creation succeeded
        const folderRecord = await prisma.folder.create({
          data: {
            name: folderName,
            parentId: parentFolderId || null,
          },
        });

        console.log(
          `Database record created successfully for folder: ${folderRecord.name} (ID: ${folderRecord.id})`
        );
      } catch (error) {
        console.error("Background folder creation error:", error);

        // Check for specific error codes
        if (error.code === "EEXIST") {
          console.error(`Folder already exists: ${folderName}`);
        } else if (error.code === "EACCES" || error.code === "EPERM") {
          console.error(
            `Permission denied: Cannot create folder at ${newFolderPath}`
          );
        } else {
          console.error(`Filesystem error: ${error?.message}`);
        }

        // Optionally: Rollback filesystem if database creation failed
        if (fs.existsSync(newFolderPath)) {
          try {
            fs.rmSync(newFolderPath, { recursive: true, force: true });
            console.log(`Rolled back directory: ${newFolderPath}`);
          } catch (rollbackError) {
            console.error(`Rollback failed: ${rollbackError?.message}`);
          }
        }
      }
    });
  } catch (error) {
    console.error("Create folder error:", error);
    return res.status(500).json({
      code: 500,
      message: `Internal server error: ${error?.message}`,
    });
  }
};

const deleteFolder = async (req, res) => {
  try {
    const folderIdRaw = req.query.folderId;
    const folderId = Number.parseInt(folderIdRaw, 10);

    if (Number.isNaN(folderId)) {
      return res
        .status(400)
        .json({ code: 400, message: "Invalid folder identifier" });
    }

    if (folderId === Number(config.BASE_FOLDER_ID)) {
      return res
        .status(400)
        .json({ code: 400, message: "Root folder cannot be deleted" });
    }
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
    });
    if (!folder) {
      return res.status(404).json({ code: 404, message: "Folder not found" });
    }
    const folderPathResp = await buildFolderPath({ parentFolderId: folderId });
    if (folderPathResp.code !== 200) {
      return res.status(folderPathResp.code).json({
        code: folderPathResp.code,
        message: `Deleting folder failed: ${folderPathResp.message}`,
      });
    }

    const folderPath = folderPathResp.data;
    console.log("Resolved folder path for deletion:", folderPath);
    // Return immediate response to user
    res.status(202).json({
      code: 202,
      message: "Folder deletion initiated",
      data: {
        folderName: folder.name,
        status: "processing",
      },
    });

    // Background processing (fire-and-forget)
    setImmediate(async () => {
      // Step 1: Save data to backup cache
      const backupPath = path.join(
        config.BACKUP_PATH,
        `folder_${folderId}_backup_${Date.now()}`
      );
      try {
        if (!fs.existsSync(folderPath)) {
          throw new Error(`Folder to backup does not exist: ${folderPath}`);
        }
        fs.cpSync(folderPath, backupPath, {
          recursive: true, // Copy all subfolders and files
          force: true,
        });
        console.log(`Backup created at: ${backupPath}`);

        // Step 3: Delete database record only if filesystem deletion succeeded
        const deleteResult = await deleteFolderRecursive({ folderId });
        if (deleteResult.code !== 200) {
          throw new Error(deleteResult.message);
        }
        console.log(`Database record deleted for folder ID: ${folderId}`);

        // Step 2: Delete directory from filesystem
        fs.rmSync(folderPath, { recursive: true, force: true });
        console.log(`Folder deleted from filesystem: ${folderPath}`);

        // step 4: delete backup after successful deletion
        fs.rmSync(backupPath, { recursive: true, force: true });
        console.log(`Backup deleted: ${backupPath}`);
      } catch (error) {
        console.error(
          "Background folder deletion error - restoring all files:",
          error?.message
        );

        // Restore from backup
        try {
          fs.cpSync(backupPath, folderPath, {
            recursive: true,
            force: true,
          });
          console.log(`Folder restored from backup: ${folderPath}`);
        } catch (restoreError) {
          console.error(`Restoration failed: ${restoreError?.message}`);
        }
      }
    });
  } catch (error) {
    console.error("Delete folder error:", error);
    return res.status(500).json({
      code: 500,
      message: `Internal server error: ${error?.message}`,
    });
  }
};

const uploadController = async (req, res) => {
  try {
    //check if single or multiple files
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(401).json({ code: 401, message: "No files uploaded" });
    }

    const parentFolderId = req.parentFolderId;
    const parentFolder = req.parentFolder;

    if (!Number.isInteger(parentFolderId) || !parentFolder) {
      return res.status(400).json({
        code: 400,
        message: "Parent folder context missing for upload",
      });
    }

    const targetFolderResp = await buildFolderPath({
      parentFolderId,
    });

    if (targetFolderResp.code !== 200) {
      return res.status(targetFolderResp.code).json({
        code: targetFolderResp.code,
        message: `Uploading file failed: ${targetFolderResp.message}`,
      });
    }

    const targetFolderPath = targetFolderResp.data;

    if (!fs.existsSync(targetFolderPath)) {
      return res.status(404).json({
        code: 404,
        message: "Destination folder does not exist on filesystem",
      });
    }

    const thumbsDir = path.join(targetFolderPath, ".thumbs");
    if (!fs.existsSync(thumbsDir)) {
      await fs.promises.mkdir(thumbsDir, { recursive: true });
    }

    const userId = req.user?.id ?? null;
    const responseData = files.map((file) => ({
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      status: "processing",
    }));

    res.status(202).json({
      code: 202,
      message: "File upload initiated",
      data: responseData,
    });

    setImmediate(async () => {
      for (const file of files) {
        // use locks prepared by middleware (if present)
        const lockEntry = (req.uploadLocks || []).find((l) => l.originalName === file.originalname);
        if (!lockEntry) {
          console.log(`Upload skipped for ${file.originalname}: lock not acquired by middleware`);
          continue;
        }

        const extension = path.extname(file.originalname) || "";
        const normalizedExtension = extension.replace(".", "").toLowerCase();
        const internalName = `${crypto.randomUUID()}${extension}`;
        const fileDiskPath = path.join(targetFolderPath, internalName);
        const thumbnailDiskPath = path.join(thumbsDir, internalName);
        let thumbnailGenerated = false;

        try {
          await fs.promises.writeFile(fileDiskPath, file.buffer);

          if (file.mimetype && file.mimetype.startsWith("image/")) {
            await sharp(file.buffer)
              .resize({ width: 256, height: 256, fit: "inside" })
              .toFile(thumbnailDiskPath);
            thumbnailGenerated = true;
          }

          await prisma.file.create({
            data: {
              originalName: file.originalname,
              internalName,
              extension: normalizedExtension,
              mimeType: file.mimetype,
              size: file.size,
              folderId: parentFolderId,
              userId,
            },
          });

          console.log(
            `Uploaded file '${file.originalname}' to '${fileDiskPath}'${
              thumbnailGenerated ? " with thumbnail." : "."
            }`
          );
        } catch (fileError) {
          console.error(
            `Upload processing failed for file '${file.originalname}':`,
            fileError.message
          );
          await fs.promises.rm(fileDiskPath, { force: true }).catch(() => {});
          if (thumbnailGenerated) {
            await fs.promises
              .rm(thumbnailDiskPath, { force: true })
              .catch(() => {});
          }
        } finally {
          try {
            await releaseLock(lockEntry.keys, lockEntry.value).catch(() => {});
          } catch (e) {}
        }
      }
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({
      code: 500,
      message: `Internal server error: ${error?.message}`,
    });
  }
};

const getFileController = async (req, res) => {
  try {
    const fileData = req.fileObject;

    if (!fileData) {
      return res.status(500).json({
        code: 500,
        message: "File context unavailable in request",
      });
    }

    const folderPathResp = await buildFolderPath({
      parentFolderId: fileData.folderId,
    });

    if (folderPathResp.code !== 200) {
      return res.status(folderPathResp.code).json({
        code: folderPathResp.code,
        message: `Retrieving file failed: ${folderPathResp.message}`,
      });
    }

    const folderPath = folderPathResp.data;
    const filePath = path.join(folderPath, fileData.internalName);
      // Read-lock header is applied by middleware `markReadLockMiddleware`.

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found on disk" });
    }

    const fileStat = fs.statSync(filePath);
    const fileSize = fileStat.size;
    const rangeHeader = req.headers.range;
    const contentType = fileData.mimeType || "application/octet-stream";

    if (rangeHeader && contentType.startsWith("video/")) {
      const bytesPrefix = "bytes=";
      if (!rangeHeader.startsWith(bytesPrefix)) {
        return res
          .status(416)
          .set("Content-Range", `bytes */${fileSize}`)
          .json({ code: 416, message: "Invalid range header" });
      }

      const [rangeStart, rangeEnd] = rangeHeader
        .substring(bytesPrefix.length)
        .split("-");

      let start = Number.parseInt(rangeStart, 10);
      let end = rangeEnd ? Number.parseInt(rangeEnd, 10) : fileSize - 1;

      if (
        Number.isNaN(start) ||
        Number.isNaN(end) ||
        start > end ||
        start < 0 ||
        end >= fileSize
      ) {
        return res
          .status(416)
          .set("Content-Range", `bytes */${fileSize}`)
          .json({ code: 416, message: "Requested range not satisfiable" });
      }

      const chunkSize = end - start + 1;
      res.status(206);
      res.set({
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": contentType,
      });

      const fileStream = fs.createReadStream(filePath, { start, end });
      fileStream.on("open", () => fileStream.pipe(res));
      fileStream.on("error", (streamErr) => {
        console.error("File streaming error:", streamErr);
        res.destroy(streamErr);
      });
      return;
    }

    res.status(200);
    res.set({
      "Content-Length": fileSize,
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
      "Content-Disposition": `attachment; filename="${fileData.originalName}"`,
    });

    const fileReadStream = fs.createReadStream(filePath);
    fileReadStream.on("error", (streamErr) => {
      console.error("File streaming error:", streamErr);
      res.destroy(streamErr);
    });
    fileReadStream.pipe(res);
  } catch (error) {
    console.error("Get file error:", error);
    return res.status(500).json({
      code: 500,
      message: `Internal server error: ${error?.message}`,
    });
  }
};

const deleteFileController = async (req, res) => {
  try {
    const fileData = req.fileObject;

    if (!fileData) {
      return res.status(500).json({
        code: 500,
        message: "File context unavailable in request",
      });
    }

    const folderPathResp = await buildFolderPath({
      parentFolderId: fileData.folderId,
    });
    if (folderPathResp.code !== 200) {
      return res.status(folderPathResp.code).json({
        code: folderPathResp.code,
        message: `Deleting file failed: ${folderPathResp.message}`,
      });
    }
    const folderPath = folderPathResp.data;
    const fileId = fileData.id;
    const filePath = path.join(folderPath, fileData.internalName);
    const thumbnailPath = path.join(
      folderPath,
      ".thumbs",
      fileData.internalName
    );
    res.status(200).json({ message: "File deletion initiated" });

    setImmediate(async () => {

        const lockResp = req.deleteLock;
        if (!lockResp) {
          console.log(`Delete skipped for file ${fileId}: no lock info in request`);
          return;
        }

      const backupPath = path.join(
        config.BACKUP_PATH,
        `file_${fileId}_backup_${Date.now()}`
      );
      try {
        if (!fs.existsSync(filePath)) {
          throw new Error(`File to backup does not exist: ${filePath}`);
        }
        fs.copyFileSync(filePath, backupPath);
        console.log(`File backup created at: ${backupPath}`);

        const deleteResult = await prisma.file.delete({
          where: { id: fileId },
        });

        if (fs.existsSync(thumbnailPath)) {
          fs.unlinkSync(thumbnailPath);
          console.log(`Thumbnail deleted from filesystem: ${thumbnailPath}`);
        }
        fs.unlinkSync(filePath);
        console.log(`File deleted from database and filesystem: ${fileId}`);
        fs.unlinkSync(backupPath);
        console.log(`File deleted from filesystem: ${filePath}`);
      } catch (error) {
        console.error(
          "Background file deletion error - restoring file:",
          error?.message
        );
        try {
          fs.copyFileSync(backupPath, filePath);
          console.log(`File restored from backup: ${filePath}`);
        } catch (restoreError) {
          console.error(`Restoration failed: ${restoreError?.message}`);
        }
      }
        try {
          await releaseLock(lockResp.keys, lockResp.value).catch(() => {});
        } catch (e) {}
    });
  } catch (error) {
    console.error("Delete file error:", error);
    return res.status(500).json({
      code: 500,
      message: `Internal server error: ${error?.message}`,
    });
  }
};

module.exports = {
  uploadController,
  getFileController,
  createFolder,
  deleteFileController,
  deleteFolder,
};
