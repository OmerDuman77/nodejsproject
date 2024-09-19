const express = require('express');
const merchantController = require('../controllers/merchantController');
const authForMerchantController = require('../controllers/auth/authForMerchantController');
const reviewRouter = require('../routes/reviewRoutes');
const serviceRouter = require('../routes/serviceRoutes');
const workerRouter = require('../routes/workerRoutes');
const appointmentRouter = require('../routes/appointmentRoutes');
const cartRouter = require('../routes/cartRoutes');

const router = express.Router();

router.use('/:merchantId/reviews', reviewRouter);
router.use('/:merchantId/services', serviceRouter);
router.use('/:merchantId/workers', workerRouter);
router.use('/:merchantId/appointments', appointmentRouter);
router.use('/:merchantId/cart', cartRouter);

router
  .route('/merchants-within/:distance/center/:latlng/unit/:unit')
  .get(merchantController.getMerchantsWithin);

router
  .route('/distances/:latlng/unit/:unit')
  .get(merchantController.getDistances);

router.route('/search').get(merchantController.search);
router.route('/search/:merchantId').get(merchantController.exploration);

router.post('/signup', authForMerchantController.signup);
router.post('/login', authForMerchantController.login);
router.get('/logout', authForMerchantController.logout);
router.post('/refreshToken', authForMerchantController.refreshToken);

router.post('/forgotPassword', authForMerchantController.forgotPassword);
router.patch('/resetPassword/:token', authForMerchantController.resetPassword);

// Protect all routes after this middleware
router.use(authForMerchantController.protect);
router.use(authForMerchantController.onlyForMerchants);

router.patch('/updateMyPassword', authForMerchantController.updatePassword);
router.get('/me', merchantController.getMe, merchantController.getMerchant);
router.patch(
  '/updateMe',
  merchantController.uploadMerchantImages,
  merchantController.resizeMerchantImages,
  merchantController.updateMe
);
router.delete('/deleteMe', merchantController.deleteMe);

router.use(authForMerchantController.restrictTo('admin'));

router
  .route('/')
  .get(merchantController.getAllMerchants)
  .post(merchantController.createMerchant);

router
  .route('/:id')
  .get(merchantController.getMerchant)
  .patch(merchantController.updateMerchant)
  .delete(merchantController.deleteMerchant);

module.exports = router;
