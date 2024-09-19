const catchAsync = require('../utils/catchAsync');
const Review = require('./../models/reviewModel');
const factory = require('./handlerFactory');
// const catchAsync = require('./../utils/catchAsync');

exports.setMerchantCustomerIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.merchant) req.body.merchant = req.params.merchantId;
  if (!req.body.customer) req.body.customer = req.customer.id;
  next();
};

//merchants/:merchantId/services/:serviceId/deleteReviewForMerchants
exports.deleteReviewForCustomers = catchAsync(async (req, res, next) => {
  await Review.findByIdAndUpdate(req.params.reviewId, { isDeleted: true });
  res.status(200).json({
    status: 'success',
    data: null
  });
});

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
