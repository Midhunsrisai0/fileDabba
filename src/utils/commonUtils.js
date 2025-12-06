const path = require("path");
const { prisma } = require("../../prisma/prisma");

const buildFolderPath = async ({ parentFolderId }) => {
  try {
    const segments = [];
    let currentFolderID = parentFolderId;
    while (currentFolderID) {
      console.log("Building path, currentFolderID:", currentFolderID);
      const folder = await prisma.folder.findUnique({
        where: { id: currentFolderID },
      });

      if (!folder) break;
      if (folder.id in segments) {
        console.error(
          "Detected circular reference in folder hierarchy at folder ID:",
          folder.id
        );
        return {
          code: 444,
          message: `Error in building folder path: Folder corrupted.`,
        };
      }
      segments.unshift(folder.name);
      currentFolderID = folder.parentId;
    }

    const resolvedPath = path.resolve(...segments);
    return {
      code: 200,
      message: "Folder path built successfully",
      data: resolvedPath,
    };
  } catch (error) {
    console.error("Build folder path error:", error);
    return {
      code: 500,
      message: `Error in building folder path: ${error?.message}`,
    };
  }
};

// sontha kastam
// const deleteFolderRecursive = async ({ folderId }) => {
//   try {
//     // 1. Find all subfolders (direct children)
//     const subfolders = await prisma.folder.findMany({
//       where: { parentId: folderId },
//     });

//     // 2. Recursively delete each subfolder first
//     for (const subfolder of subfolders) {
//       await deleteFolderRecursive({ folderId: subfolder.id });
//     }

//     // 3. Delete all files in this folder
//     await prisma.file.deleteMany({
//       where: { folderId: folderId },
//     });

//     // 4. Finally delete the folder itself
//     await prisma.folder.delete({
//       where: { id: folderId },
//     });

//     console.log(`Deleted folder ID: ${folderId}`);

//     return {
//       code: 200,
//       message: "Folder deleted successfully",
//     };
//   } catch (error) {
//     console.error("Delete folder error:", error);
//     return {
//       code: 500,
//       message: `Error in deleting folder: ${error?.message}`,
//     };
//   }
// };

// copilot sottu
const deleteFolderRecursive = async ({ folderId }) => {
  try {
    await prisma.folder.delete({
      where: { id: folderId },
    });

    return {
      code: 200,
      message: "Folder deleted successfully",
    };
  } catch (error) {
    console.error("Delete folder error:", error);
    return {
      code: 500,
      message: `Error in deleting folder: ${error?.message}`,
    };
  }
};

module.exports = { buildFolderPath, deleteFolderRecursive };
