-- The project's global Storage file-size limit must also allow at least 100 MB.
UPDATE storage.buckets
SET file_size_limit = 104857600
WHERE id = 'base-templates';
