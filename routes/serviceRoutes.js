const express = require('express');
const serviceController = require('./../controllers/serviceController');
const authForMerchantController = require('../controllers/auth/authForMerchantController');

const router = express.Router({ mergeParams: true });

// merchants/:merchantId/services

router
  .route('/')
  .get(serviceController.getAllServices)
  .post(
    authForMerchantController.protect,
    authForMerchantController.onlyForMerchants,
    authForMerchantController.checkMerchantAuthorization,
    authForMerchantController.restrictTo('admin', 'merchant'),
    serviceController.uploadServiceImage,
    serviceController.resizeServiceImage,
    serviceController.setMerchantId,
    serviceController.createService
  );

router
  .route('/:id')
  .get(serviceController.getService)
  .patch(
    authForMerchantController.protect,
    authForMerchantController.onlyForMerchants,
    authForMerchantController.checkMerchantAuthorization,
    authForMerchantController.restrictTo('admin', 'merchant'),
    serviceController.uploadServiceImage,
    serviceController.resizeServiceImage,
    serviceController.setMerchantId,
    serviceController.updateService
  )
  .delete(
    authForMerchantController.protect,
    authForMerchantController.onlyForMerchants,
    authForMerchantController.checkMerchantAuthorization,
    authForMerchantController.restrictTo('admin', 'merchant'),
    serviceController.setMerchantId,
    serviceController.deleteService
  );

router
  .route('/:serviceId/getWorkersOfMerchant')
  .get(
    authForMerchantController.protect,
    authForMerchantController.onlyForMerchants,
    authForMerchantController.checkMerchantAuthorization,
    authForMerchantController.restrictTo('admin', 'merchant'),
    serviceController.getWorkersOfMerchant
  );

router
  .route('/:serviceId/setWorkersOfMerchant')
  .patch(
    authForMerchantController.protect,
    authForMerchantController.onlyForMerchants,
    authForMerchantController.checkMerchantAuthorization,
    authForMerchantController.restrictTo('admin', 'merchant'),
    serviceController.setWorkersOfMerchant
  );

router
  .route('/createServiceForMerchants')
  .post(
    authForMerchantController.protect,
    authForMerchantController.onlyForMerchants,
    authForMerchantController.checkMerchantAuthorization,
    authForMerchantController.restrictTo('admin', 'merchant'),
    serviceController.uploadServiceImage,
    serviceController.resizeServiceImage,
    serviceController.setMerchantId,
    serviceController.createServiceForMerchants
  );

router
  .route('/:serviceId/deleteServiceForMerchants')
  .patch(
    authForMerchantController.protect,
    authForMerchantController.onlyForMerchants,
    authForMerchantController.checkMerchantAuthorization,
    authForMerchantController.restrictTo('admin', 'merchant'),
    serviceController.uploadServiceImage,
    serviceController.resizeServiceImage,
    serviceController.setMerchantId,
    serviceController.deleteServiceForMerchants
  );

module.exports = router;
