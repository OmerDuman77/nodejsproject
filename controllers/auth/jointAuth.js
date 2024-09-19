const AppError = require('../../utils/appError');
const catchAsync = require('../../utils/catchAsync');
const authForMerchantController = require('../../controllers/auth/authForMerchantController');
const authForCustomerController = require('../../controllers/auth/authForCustomerController');

exports.canNotBothCustomerAndMerchant = catchAsync(async (req, res, next) => {
  if (req.customer && req.merchant) {
    return next(
      new AppError('There can not exist a user being both types', 409)
    );
  }
});

exports.protectForWhich = catchAsync(async (req, res, next) => {
  if (req.params.merchantId && req.params.customerId) {
    return next(new AppError('There can not be both params', 409));
  }

  if (req.params.merchantId) {
    authForMerchantController.protect(req, res, next);
  } else if (req.params.customerId) {
    authForCustomerController.protect(req, res, next);
  }
});

exports.checkUserAuthorization = catchAsync(async (req, res, next, Model) => {
  if (req.merchant) {
    authForMerchantController.checkMerchantAuthorization(req, res, next);
  } else if (req.customer) {
    authForCustomerController.checkCustomerAuthorization(req, res, next, Model);
  }
});

// protect,check authorization,restrictTo
