import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../config/s3.js";
import dotenv from "dotenv";
dotenv.config();

export const getS3Key = (url) => {
  if (!url) return null;
  
  try {
    const u = new URL(url);
    const bucketName = process.env.S3_BUCKET_NAME;
    
    // Handle different S3 URL formats:
    // Format 1: https://bucket-name.s3.region.amazonaws.com/folder/file.jpg
    if (u.hostname.startsWith(`${bucketName}.s3`)) {
      return u.pathname.substring(1); // Remove leading '/'
    }
    
    // Format 2: https://s3.region.amazonaws.com/bucket-name/folder/file.jpg
    if (u.hostname.includes('s3') && u.pathname.includes(bucketName)) {
      const pathParts = u.pathname.split('/').filter(Boolean);
      const bucketIndex = pathParts.indexOf(bucketName);
      if (bucketIndex !== -1) {
        return pathParts.slice(bucketIndex + 1).join('/');
      }
    }
    
    // Fallback: assume everything after first '/' is the key
    return u.pathname.substring(1);
  } catch (error) {
    console.error('❌ Error parsing S3 URL:', url, error.message);
    return null;
  }
};

export const deleteUploadedFiles = async (files) => {
  if (!files?.length) return;

  await Promise.all(
    files.map((file) => {
      const key = getS3Key(file.location);
      if (!key) {
        console.warn('⚠️ Could not extract S3 key from:', file.location);
        return Promise.resolve(); // Return resolved promise instead of undefined
      }

      return s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: key,
        })
      ).catch(error => {
        console.error('❌ Failed to delete file from S3:', key, error.message);
        // Don't throw - continue with other deletions
      });
    })
  );
};

// New utility function to delete a single file
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