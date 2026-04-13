import express from 'express';

import { tokenVerification } from '../middleware/auth.js';
import { allowRoles } from '../middleware/permission.js';
import customerController from '../src/admin/customer/customerController.js';
const router = express.Router();

router.post('/create', customerController.createCustomer);
router.get(
  '/get-all',
  tokenVerification,
  allowRoles('admin', 'outlet_manager', 'superadmin'),
  customerController.getCustomers,
);
router.get('/:id', customerController.getCustomerById);
router.patch('/update/:id', customerController.updateCustomer);
router.delete('/delete/:id', customerController.deleteCustomer);

export default router;
