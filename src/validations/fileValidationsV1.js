const { z } = require("zod");

const fileUploadSchemaV1 = z.object({
  body: z.object({
    folderId: z.string(),
    fileNames: z.array(z.string()).optional(),
  }),
});

module.exports = { fileUploadSchemaV1 };
