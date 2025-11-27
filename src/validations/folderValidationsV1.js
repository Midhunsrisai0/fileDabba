const { z } = require("zod");

const folderCreateSchema = z.object({
  body: z.object({
    folderName: z.string(),
    parentFolderId: z.number().int(),
  }),
});

const folderDeleteSchema = z.object({
  query: z.object({
    folderId: z.string(),
  }),
});

module.exports = { folderCreateSchema, folderDeleteSchema };
