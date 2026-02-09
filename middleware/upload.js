import multer from "multer";
import multerS3 from "multer-s3-v3";
import { s3 } from "../config/s3.js";
import dotenv from "dotenv";
dotenv.config();

const uploadMenu = multer({
  storage: multerS3({
    s3,
    bucket: process.env.S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      cb(null, `menu/${Date.now()}-${file.originalname}`);
    },
  }),
});
const uploadAdminImages = multer({
  storage: multerS3({
    s3,
    bucket: process.env.S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      let folder = "misc";

      if (file.fieldname === "logo") folder = "logo";
      if (file.fieldname === "profileImage") folder = "profile";

      cb(null, `${folder}/${Date.now()}-${file.originalname}`);
    },
  }),
});
const uploadLayoutImages = multer({
  storage: multerS3({
    s3,
    bucket: process.env.S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      let folder = "cafe-layout";

      if (file.fieldname === "homeImage") folder = "cafe-layout/home";
      if (file.fieldname === "aboutImage") folder = "cafe-layout/about";

      cb(null, `${folder}/${Date.now()}-${file.originalname}`);
    },
  }),
}).fields([
  { name: "homeImage", maxCount: 1 },
  { name: "aboutImage", maxCount: 1 },
]);

export {
  uploadMenu,
  uploadAdminImages,
  uploadLayoutImages,
};