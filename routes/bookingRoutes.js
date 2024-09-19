const express = require('express');
const bookingController = require('./../controllers/bookingController');
const authForCustomerController = require('./../controllers/auth/authForCustomerController');

const router = express.Router();

router.use(authForCustomerController.protect);

// eslint-disable-next-line prettier/prettier
router.get('/checkout-session/:serviceId', bookingController.getCheckoutSession);

router.use(authForCustomerController.restrictTo('admin'));

router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;
