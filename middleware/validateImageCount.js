import multer from "multer";
import multerS3 from "multer-s3-v3";
import { s3 } from "../config/s3.js";
import LayoutTemplate from "../model/layout.model.js";
import { ApiError } from "../utils/apiError.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { createTemplateValidator } from "../validations/createTemplate.js";
import dotenv from "dotenv";

dotenv.config();

// Memory storage to hold files temporarily for validation
const memoryStorage = multer.memoryStorage();

// Create multer instance with memory storage
const memoryUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Middleware: parse template form to memory, validate image count BEFORE uploading to S3
// Only uploads to S3 if noOfImage === images.length
export const validateTemplateImageCountBeforeUpload = async (req, res, next) => {
  memoryUpload.array("images", 10)(req, res, async (err) => {
    if (err) {
      return next(new ApiError(400, err.message));
    }

    try {
      // Validate body first (no upload yet)
      const { value, error } = createTemplateValidator.body.validate(req.body, {
        abortEarly: false,
      });
      if (error) {
        const msg = error.details.map((d) => d.message).join(", ");
        return next(new ApiError(400, msg));
      }
      req.body = value;

      const noOfImage = value.noOfImage;
      const files = req.files || [];

      // Validate image count BEFORE uploading - stop here if mismatch
      if (files.length !== noOfImage) {
        return next(
          new ApiError(
            400,
            `Upload exactly ${noOfImage} image(s) for this template. Received ${files.length}.`
          )
        );
      }

      // Validation passed - now upload to S3
      const uploadedFiles = [];
      for (const file of files) {
        const key = `template/${Date.now()}-${Math.random().toString(36).slice(2, 9)}-${file.originalname}`;

        await s3.send(
          new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
          })
        );

        const location = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_BUCKET_REGION}.amazonaws.com/${key}`;

        uploadedFiles.push({
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          location,
        });
      }

      req.files = uploadedFiles;
      next();
    } catch (error) {
      next(new ApiError(500, error.message || "Error validating and uploading images"));
    }
  });
};

// Middleware to validate image count before uploading to S3
export const validateImageCountBeforeUpload = async (req, res, next) => {
  // First, parse files into memory (not uploaded to S3 yet)
  memoryUpload.array("images")(req, res, async (err) => {
    if (err) {
      return next(new ApiError(400, err.message));
    }

    try {
      const { layoutTemplateId } = req.body;

      if (!layoutTemplateId) {
        return next(new ApiError(400, "layoutTemplateId is required"));
      }

      // Fetch template to get required image count
      const template = await LayoutTemplate.findById(layoutTemplateId);
      if (!template) {
        return next(new ApiError(404, "Template not found"));
      }

      const files = req.files || [];
      const requiredCount = template.noOfImage;

      // Validate image count
      if (!files || files.length !== requiredCount) {
        return next(
          new ApiError(
            400,
            `Upload exactly ${requiredCount} images. Received ${files.length} images.`
          )
        );
      }

      // If validation passes, upload files to S3
      const uploadedFiles = [];
      for (const file of files) {
        const key = `layout${Date.now()}-${file.originalname}`;

        await s3.send(
          new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
          })
        );

        // Construct S3 URL
        const location = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_BUCKET_REGION}.amazonaws.com/${key}`;

        uploadedFiles.push({
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          location: location,
        });
      }

      // Attach uploaded files to request object (similar to multer-s3 format)
      req.files = uploadedFiles;
      next();
    } catch (error) {
      next(new ApiError(500, error.message || "Error validating and uploading images"));
    }
  });
};
