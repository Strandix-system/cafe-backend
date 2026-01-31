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
