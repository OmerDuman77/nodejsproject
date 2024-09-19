const express = require('express');
const authForCustomerController = require('../controllers/auth/authForCustomerController');
const cartController = require('../controllers/cartController');

const router = express.Router({ mergeParams: true });

router
  .route('/viewCart')
  .get(
    authForCustomerController.protect,
    authForCustomerController.onlyForCustomers,
    authForCustomerController.restrictTo('customer', 'admin'),
    cartController.viewCart
  );

router
  .route('/sendCart')
  .post(
    authForCustomerController.protect,
    authForCustomerController.onlyForCustomers,
    authForCustomerController.restrictTo('customer', 'admin'),
    cartController.sendCart
  );

router
  .route('/addService/:serviceId')
  .post(
    authForCustomerController.protect,
    authForCustomerController.onlyForCustomers,
    authForCustomerController.restrictTo('customer', 'admin'),
    cartController.addServicesToCartItem
  );

router
  .route('/removeItem/:cartItemId')
  .patch(
    authForCustomerController.protect,
    authForCustomerController.onlyForCustomers,
    authForCustomerController.restrictTo('customer', 'admin'),
    cartController.removeItemFromCart
  );

router
  .route('/:cartItemId/getWorkers')
  .get(
    authForCustomerController.protect,
    authForCustomerController.onlyForCustomers,
    authForCustomerController.restrictTo('customer', 'admin'),
    cartController.getWorkersToCartItem
  );

router
  .route('/:cartItemId/addWorker/:workerId')
  .patch(
    authForCustomerController.protect,
    authForCustomerController.onlyForCustomers,
    authForCustomerController.restrictTo('customer', 'admin'),
    cartController.addWorkerToCartItem
  );

router
  .route('/:cartItemId/getCalendar')
  .get(
    authForCustomerController.protect,
    authForCustomerController.onlyForCustomers,
    authForCustomerController.restrictTo('customer', 'admin'),
    cartController.getAppointmentWorkerAvailabilitiesToCartItem
  );

router
  .route('/:cartItemId/addCalendar/:appointmentWorkerAvailabilityId')
  .patch(
    authForCustomerController.protect,
    authForCustomerController.onlyForCustomers,
    authForCustomerController.restrictTo('customer', 'admin'),
    cartController.addAppointmentWorkerAvailabilitiesToCartItem
  );

router
  .route('/clearCart')
  .patch(
    authForCustomerController.protect,
    authForCustomerController.onlyForCustomers,
    authForCustomerController.restrictTo('customer', 'admin'),
    cartController.clearCart
  );

router
  .route('/refreshService/:cartItemId')
  .patch(
    authForCustomerController.protect,
    authForCustomerController.onlyForCustomers,
    authForCustomerController.restrictTo('customer', 'admin'),
    cartController.refreshCartItem
  );

module.exports = router;
