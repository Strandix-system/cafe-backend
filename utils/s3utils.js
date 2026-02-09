import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../config/s3.js";

export const getS3Key = (url) => {
  if (!url) return null;
  const u = new URL(url);
  return u.pathname.substring(1);
};

export const deleteUploadedFiles = async (files) => {
  if (!files?.length) return;

  await Promise.all(
    files.map((file) => {
      const key = getS3Key(file.location);
      if (!key) return;

      return s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: key,
        })
      );
    })
  );
};
export const deleteSingleFile = async (fileUrl) => {
  if (!fileUrl) return;

  const key = getS3Key(fileUrl);
  if (!key) {
    console.warn('⚠️ Could not extract S3 key from:', fileUrl);
    return;
  }

  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
      })
    );
    console.log(`✅ Successfully deleted: ${key}`);
  } catch (error) {
    console.error('❌ Failed to delete file from S3:', key, error.message);
    throw error; // Re-throw if you want the caller to handle it
  }
};
