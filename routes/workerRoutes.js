const express = require('express');
const workerController = require('./../controllers/workerController');
const authForMerchantController = require('../controllers/auth/authForMerchantController');

const router = express.Router({ mergeParams: true });

// merchants/:merchantId/workers

router
  .route('/')
  .get(workerController.getAllWorkers)
  .post(
    authForMerchantController.protect,
    authForMerchantController.onlyForMerchants,
    authForMerchantController.checkMerchantAuthorization,
    authForMerchantController.restrictTo('admin', 'merchant'),
    workerController.setMerchantId,
    workerController.createWorker
  );

router
  .route('/:id')
  .get(workerController.getWorker)
  .patch(
    authForMerchantController.protect,
    authForMerchantController.onlyForMerchants,
    authForMerchantController.checkMerchantAuthorization,
    authForMerchantController.restrictTo('admin', 'merchant'),
    workerController.uploadWorkerImage,
    workerController.resizeWorkerImage,
    workerController.setMerchantId,
    workerController.updateWorker
  )
  .delete(
    authForMerchantController.protect,
    authForMerchantController.onlyForMerchants,
    authForMerchantController.checkMerchantAuthorization,
    authForMerchantController.restrictTo('admin'),
    workerController.setMerchantId,
    workerController.deleteWorker
  );

router
  .route('/:workerId/getUnavailabilityScreen')
  .get(
    authForMerchantController.protect,
    authForMerchantController.onlyForMerchants,
    authForMerchantController.checkMerchantAuthorization,
    authForMerchantController.restrictTo('admin', 'merchant'),
    workerController.setMerchantId,
    workerController.getUnavailabilityScreen
  );

router
  .route('/:workerId/setUnavailabilityScreen')
  .patch(
    authForMerchantController.protect,
    authForMerchantController.onlyForMerchants,
    authForMerchantController.checkMerchantAuthorization,
    authForMerchantController.restrictTo('admin', 'merchant'),
    workerController.setMerchantId,
    workerController.setUnavailabilityScreen
  );

router
  .route('/:workerId/getWorkingHoursScreen')
  .get(
    authForMerchantController.protect,
    authForMerchantController.onlyForMerchants,
    authForMerchantController.checkMerchantAuthorization,
    authForMerchantController.restrictTo('admin', 'merchant'),
    workerController.setMerchantId,
    workerController.getWorkingHoursScreen
  );

router
  .route('/:workerId/setWorkingHoursScreen')
  .patch(
    authForMerchantController.protect,
    authForMerchantController.onlyForMerchants,
    authForMerchantController.checkMerchantAuthorization,
    authForMerchantController.restrictTo('admin', 'merchant'),
    workerController.setMerchantId,
    workerController.setWorkingHoursScreen
  );

router
  .route('/:workerId/deleteWorkerForMerchants')
  .patch(
    authForMerchantController.protect,
    authForMerchantController.onlyForMerchants,
    authForMerchantController.checkMerchantAuthorization,
    authForMerchantController.restrictTo('admin', 'merchant'),
    workerController.setMerchantId,
    workerController.deleteWorkerForMerchants
  );

module.exports = router;
