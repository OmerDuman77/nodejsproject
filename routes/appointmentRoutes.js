const express = require('express');
const appointmentController = require('../controllers/appointmentController');
const authForCustomerController = require('../controllers/auth/authForCustomerController');
const authForMerchantController = require('../controllers/auth/authForMerchantController');
const Appointment = require('../models/appointmentModel');
const jointAuth = require('../controllers/auth/jointAuth');
const AppError = require('../utils/appError');
const cacheControl = require('../utils/cacheControl');

const router = express.Router({ mergeParams: true });

router.route('/my-appointments').get(
  jointAuth.protectForWhich,
  (req, res, next) => {
    if (req.params.customerId) {
      if (req.params.customerId !== req.customer.id) {
        return next(new AppError('Does not match', 409));
      }
    } else if (req.params.merchantId) {
      if (req.params.merchantId !== req.merchant.id) {
        return next(new AppError('Does not match', 409));
      }
    }
    next();
  },
  cacheControl.cacheControl,
  appointmentController.viewAllAppointments
);

router.route('/appointment/:appointmentId').get(
  jointAuth.protectForWhich,
  (req, res, next) => {
    jointAuth.checkUserAuthorization(req, res, next, Appointment);
  },
  appointmentController.viewSpecificAppointment
);

router
  .route('/appointment/:appointmentId/approveAppointment')
  .patch(
    authForMerchantController.protect,
    authForMerchantController.onlyForMerchants,
    authForMerchantController.checkMerchantAuthorization,
    authForMerchantController.restrictTo('admin', 'merchant'),
    appointmentController.approveAppointment
  );

router
  .route('/appointment/:appointmentId/rejectAppointment')
  .patch(
    authForMerchantController.protect,
    authForMerchantController.onlyForMerchants,
    authForMerchantController.checkMerchantAuthorization,
    authForMerchantController.restrictTo('admin', 'merchant'),
    appointmentController.rejectAppointment
  );

router.route('/appointment/:appointmentId/cancelAppointment').patch(
  authForCustomerController.protect,
  authForCustomerController.onlyForCustomers,
  (req, res, next) => {
    authForCustomerController.checkCustomerAuthorization(
      req,
      res,
      next,
      Appointment
    );
  },
  authForCustomerController.restrictTo('customer', 'admin'),
  appointmentController.cancelAppointment
);

router
  .route('/appointment/:appointmentId/buckAppointment')
  .get(
    authForMerchantController.protect,
    authForMerchantController.onlyForMerchants,
    authForMerchantController.checkMerchantAuthorization,
    authForMerchantController.restrictTo('admin', 'merchant'),
    appointmentController.getBuckAppointment
  );

router
  .route('/appointment/:appointmentId/buckAppointment/:workerId')
  .patch(
    authForMerchantController.protect,
    authForMerchantController.onlyForMerchants,
    authForMerchantController.checkMerchantAuthorization,
    authForMerchantController.restrictTo('admin', 'merchant'),
    appointmentController.postBuckAppointment
  );

router
  .route('/appointment/:appointmentId/getSendClaimToChangeForAppointment')
  .get(
    authForMerchantController.protect,
    authForMerchantController.onlyForMerchants,
    authForMerchantController.checkMerchantAuthorization,
    authForMerchantController.restrictTo('admin', 'merchant'),
    appointmentController.getSendClaimToChangeTimeForAppointment
  );

router
  .route(
    '/appointment/:appointmentId/postSendClaimToChangeForAppointment/:appointmentWorkerAvailabilityId'
  )
  .patch(
    authForMerchantController.protect,
    authForMerchantController.onlyForMerchants,
    authForMerchantController.checkMerchantAuthorization,
    authForMerchantController.restrictTo('admin', 'merchant'),
    appointmentController.postSendClaimToChangeTimeForAppointment
  );

router
  .route('/appointment/:appointmentId/acceptClaimToChangeTimeForAppointment')
  .patch(
    authForCustomerController.protect,
    authForCustomerController.onlyForCustomers,
    (req, res, next) => {
      authForCustomerController.checkCustomerAuthorization(
        req,
        res,
        next,
        Appointment
      );
    },
    authForCustomerController.restrictTo('customer', 'admin'),
    appointmentController.acceptClaimToChangeTimeForAppointment
  );

router
  .route('/appointment/:appointmentId/denyClaimToChangeTimeForAppointment')
  .patch(
    authForCustomerController.protect,
    authForCustomerController.onlyForCustomers,
    (req, res, next) => {
      authForCustomerController.checkCustomerAuthorization(
        req,
        res,
        next,
        Appointment
      );
    },
    authForCustomerController.restrictTo('customer', 'admin'),
    appointmentController.denyClaimToChangeTimeForAppointment
  );

module.exports = router;
