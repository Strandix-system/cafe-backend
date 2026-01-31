import multer from "multer";
import multerS3 from "multer-s3-v3";
import { s3 } from "../config/s3.js";
import dotenv from "dotenv";

dotenv.config(); // 
const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      cb(null, `menu/${Date.now()}-${file.originalname}`);
    },
  }),
});

const templateStorage = multerS3({
  s3,
  bucket: process.env.S3_BUCKET_NAME,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req, file, cb) => {
    cb(null, `template/${Date.now()}-${Math.random().toString(36).slice(2, 9)}-${file.originalname}`);
  },
});
const uploadprofile = multer({
  storage: multerS3({
    s3,
    bucket: process.env.S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      cb(null, `profile/${Date.now()}-${file.originalname}`);
    }
  }),
});
const uploadlogo = multer({
  storage: multerS3({
    s3,
    bucket: process.env.S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      cb(null, `logo/${Date.now()}-${file.originalname}`);
    }
  }),
});


export const uploadTemplateImages = multer({ storage: templateStorage });
export { upload,uploadlogo,uploadprofile};
