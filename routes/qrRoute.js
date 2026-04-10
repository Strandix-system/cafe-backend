import express from 'express';

import { tokenVerification } from '../middleware/auth.js';
import { allowRoles } from '../middleware/permission.js';
import qrController from '../src/admin/qr/controller.js';

const router = express.Router();

router.post(
  '/create',
  tokenVerification,
  allowRoles('admin'),
  qrController.createQr,
);
router.get('/scan/:qrId', qrController.scanQr);
router.get(
  '/get-all',
  tokenVerification,
  allowRoles('admin', 'staff'),
  qrController.getAllQr,
);
router.get(
  '/count/:layoutId',
  tokenVerification,
  allowRoles('admin'),
  qrController.getQrCountforLayout,
);

export default router;
