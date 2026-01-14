INSERT INTO public."Folder"
("name", "createdAt", "updatedAt", id, "parentId", "userId")
SELECT
'uploads', NOW(), NOW(), 7, NULL, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public."Folder" WHERE id = 7
);
