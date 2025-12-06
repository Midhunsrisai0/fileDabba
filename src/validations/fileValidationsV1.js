const { z } = require("zod");

const fileUploadSchemaV1 = z.object({
  body: z.object({
    parentFolderId: z.string(),
    fileNames: z.array(z.string()).optional(),
  }),
});

const fileGetSchemaV1 = z.object({
  query: z.object({
    fileId: z.string(),
  }),
});

const fileDeleteSchemaV1 = z.object({
  query: z.object({
    fileId: z.string(),
  }),
});

module.exports = { fileUploadSchemaV1, fileGetSchemaV1, fileDeleteSchemaV1 };
