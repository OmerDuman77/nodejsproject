const express = require('express');
const customerController = require('../controllers/customerController');
const authForCustomerController = require('../controllers/auth/authForCustomerController');
const appointmentRouter = require('../routes/appointmentRoutes');

const router = express.Router();

router.use('/:customerId/appointments', appointmentRouter);

router.post('/signup', authForCustomerController.signup);
router.post('/login', authForCustomerController.login);
router.get('/logout', authForCustomerController.logout);
router.post('/refreshToken', authForCustomerController.refreshToken);

router.post('/forgotPassword', authForCustomerController.forgotPassword);
router.patch('/resetPassword/:token', authForCustomerController.resetPassword);

// Protect all routes after this middleware
router.use(authForCustomerController.protect);

router.patch('/updateMyPassword', authForCustomerController.updatePassword);
router.get('/me', customerController.getMe, customerController.getCustomer);
router.patch(
  '/updateMe',
  customerController.uploadCustomerPhoto,
  customerController.resizeCustomerPhoto,
  customerController.updateMe
);
router.delete('/deleteMe', customerController.deleteMe);

router.use(authForCustomerController.restrictTo('admin'));

router
  .route('/')
  .get(customerController.getAllCustomers)
  .post(customerController.createCustomer);

router
  .route('/:id')
  .get(customerController.getCustomer)
  .patch(customerController.updateCustomer)
  .delete(customerController.deleteCustomer);

module.exports = router;
