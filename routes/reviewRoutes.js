const express = require('express');
const Review = require('../models/reviewModel');
const reviewController = require('./../controllers/reviewController');
const authForCustomerController = require('../controllers/auth/authForCustomerController');

const router = express.Router({ mergeParams: true });

// merchants/:merchantId/reviews

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authForCustomerController.protect,
    authForCustomerController.onlyForCustomers,
    authForCustomerController.restrictTo('customer', 'admin'),
    reviewController.setMerchantCustomerIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authForCustomerController.protect,
    authForCustomerController.onlyForCustomers,
    (req, res, next) => {
      authForCustomerController.checkCustomerAuthorization(
        req,
        res,
        next,
        Review
      );
    },
    authForCustomerController.restrictTo('customer', 'admin'),
    reviewController.setMerchantCustomerIds,
    reviewController.updateReview
  )
  .delete(
    authForCustomerController.protect,
    authForCustomerController.onlyForCustomers,
    (req, res, next) => {
      authForCustomerController.checkCustomerAuthorization(
        req,
        res,
        next,
        Review
      );
    },
    authForCustomerController.restrictTo('customer', 'admin'),
    reviewController.setMerchantCustomerIds,
    reviewController.deleteReview
  );

router.route(':serviceId/deleteReviewForMerchants').patch(
  authForCustomerController.protect,
  authForCustomerController.onlyForCustomers,
  (req, res, next) => {
    authForCustomerController.checkCustomerAuthorization(
      req,
      res,
      next,
      Review
    );
  },
  authForCustomerController.restrictTo('customer', 'admin'),
  reviewController.setMerchantCustomerIds,
  reviewController.deleteReviewForCustomers
);

module.exports = router;
