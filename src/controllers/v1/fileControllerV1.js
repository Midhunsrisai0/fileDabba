const config = require("../../config");
const fs = require("fs");
const path = require("path");
const { prisma } = require("../../../prisma/prisma");
const {
  buildFolderPath,
  deleteFolderRecursive,
} = require("../../utils/commonUtils");

const createFolder = async (req, res) => {
  try {
    const body = req.body;
    const folderName = body.folderName;
    const parentFolderId = body.parentFolderId;

    const parentFullPathResp = await buildFolderPath({
      parentFolderId: parentFolderId,
    });

    if (parentFullPathResp.code != 200) {
      return res.status(parentFullPathResp.code).json({
        code: parentFullPathResp.code,
        message: `Creating folder failed: ${parentFullPathResp.message}`,
      });
    }

    const fullFolderCreatepath = parentFullPathResp?.data;
    const newFolderPath = path.join(fullFolderCreatepath, folderName);

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
    const folderId = parseInt(req.query.folderId);

    if (folderId == config.BASE_FOLDER_ID) {
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
    if (folderPathResp.code != 200) {
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
      try {
        // Step 1: Save data to backup cache
        const backupPath = path.join(
          config.BACKUP_PATH,
          `folder_${folderId}_backup_${Date.now()}`
        );
        fs.cpSync(folderPath, backupPath, {
          recursive: true, // Copy all subfolders and files
          force: true,
        });
        console.log(`Backup created at: ${backupPath}`);

        // Step 3: Delete database record only if filesystem deletion succeeded
        const deleteResult = await deleteFolderRecursive({ folderId });
        if (deleteResult.code != 200) {
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

// const uploadController = (req, res) => {
//   try {
//     //check if single or multiple files
//     const files = req.files;
//     if (!files || files.length === 0) {
//       return res.status(400).json({ code: 401, message: "No files uploaded" });
//     }

//     const metadataMap = files.map((file) => ({
//       filename: file.originalname,
//       size: file.size,
//       mimetype: file.mimetype,
//     }));
//     return res.json({
//       code: 200,
//       message: "File uploaded successfully",
//       data: metadataMap,
//     });
//   } catch (error) {
//     console.error("Upload error:", error);
//     return res.status(500).json({
//       code: 500,
//       message: `Internal server error: ${error?.message}`,
//     });
//   }
// };

// const downloadFileController = (req, res) => {
//     const filename = req.query.filename;

//     if (!filename) {
//         return res.status(400).json({ message: "Filename is required" });
//   }

//   // Resolve absolute path and sanitize filename
//   const basePath = path.resolve(config.BASE_FILE_PATH);
//   const sanitizedFilename = path.basename(filename);
//   const filepath = path.join(basePath, sanitizedFilename);
//   console.log("Resolved filepath:", filepath);
//   console.log("Base path:", basePath);
//   // Security: Prevent path traversal attacks
//   if (!filepath.startsWith(basePath)) {
//       return res.status(403).json({ message: "Access denied" });
//     }

//   if (!fs.existsSync(filepath)) {
//     return res.status(404).json({ message: "File not found" });
//   }

//   console.log(`Downloading file from path: ${filepath}`);
//   const readStream = fs.createReadStream(filepath);

//   // Handle stream errors
//   readStream.on("error", (err) => {
//     console.error("Stream error:", err);
//     return res.status(500).json({ message: "Error reading file" });
//   });

//   res.setHeader(
//     "Content-Disposition",
//     `attachment; filename="${sanitizedFilename}"`
//   );
//   readStream.pipe(res);
// };

module.exports = {
  //   uploadController,
  //   downloadFileController,
  createFolder,
  deleteFolder,
};
