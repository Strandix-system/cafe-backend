// import { createRequire } from "module";
// const require = createRequire(import.meta.url);

// // Try common candidate files for the upload middleware
// const candidates = [
//   "./uploadAdminImages.js",
//   "./upload.js",
//   "./uploads.js",
//   "./multer.js",
//   "./imageUpload.js",
//   "./fileUpload.js",
// ];

// let uploadAdminImages;

// for (const p of candidates) {
//   try {
//     const mod = require(p);
//     if (!mod) continue;
//     if (mod.uploadAdminImages) {
//       uploadAdminImages = mod.uploadAdminImages;
//       break;
//     }
//     if (mod.default && mod.default.uploadAdminImages) {
//       uploadAdminImages = mod.default.uploadAdminImages;
//       break;
//     }
//     if (mod.default && typeof mod.default === "function") {
//       uploadAdminImages = mod.default;
//       break;
//     }
//   } catch (e) {
//     // ignore and try next candidate
//   }
// }

// if (!uploadAdminImages) {
//   throw new Error(
//     "Could not find 'uploadAdminImages' in the middleware directory. Create a file that exports it (e.g. uploadAdminImages.js) or update this index.js to point to the correct file."
//   );
// }

// export { uploadAdminImages };
