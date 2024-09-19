const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const Merchant = require('../../models/merchantModel');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const Email = require('../../utils/email');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (merchant, statusCode, res) => {
  const token = signToken(merchant._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  merchant.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      merchant
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newMerchant = await Merchant.create({
    merchantName: req.body.merchantName,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  // Email gönderme : await new Email(newMerchant, url).sendWelcomeForMerchants();
  createSendToken(newMerchant, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  console.log(req.body);
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  // 2) Check if merchant exists && password is correct
  const merchant = await Merchant.findOne({ email }).select('+password');

  if (
    !merchant ||
    !(await merchant.correctPassword(password, merchant.password))
  ) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If everything ok, send token to client
  createSendToken(merchant, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};

exports.refreshToken = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET, {
    ignoreExpiration: true
  });

  const currentMerchant = await Merchant.findById(decoded.id);
  if (!currentMerchant) {
    return next(
      new AppError(
        'The merchant belonging to this token does no longer exist.',
        401
      )
    );
  }

  if (currentMerchant.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'Merchant recently changed password! Please log in again.',
        401
      )
    );
  }

  createSendToken(currentMerchant, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }
  try {
    // 2) Verification token

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if merchant still exists
    const currentMerchant = await Merchant.findById(decoded.id);
    if (!currentMerchant) {
      return next(
        new AppError(
          'The merchant belonging to this token does no longer exist.',
          401
        )
      );
    }

    // 4) Check if merchant changed password after the token was issued
    if (currentMerchant.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError(
          'Merchant recently changed password! Please log in again.',
          401
        )
      );
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.merchant = currentMerchant;
    res.locals.merchant = currentMerchant;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'TokenExpired' });
    }
    return next(error);
  }
});

exports.checkMerchantAuthorization = catchAsync(async (req, res, next) => {
  // Adminse kontrolü geç
  if (req.merchant.role === 'admin') {
    next();
  }

  if (req.params.merchantId && req.params.merchantId !== req.merchant.id) {
    // O anki sistemde bulunan merchant'ın ID'si ile istek yapılan merchant'ın ID'sini karşılaştırıyoruz
    return next(
      new AppError('You do not have permission to access this resource.', 403)
    );
  }

  // Yetkilendirme başarılı olduysa devam et
  next();
});

exports.onlyForMerchants = catchAsync(async (req, res, next) => {
  const onlyForMerchant = req.merchant || req.customer;
  if (onlyForMerchant === req.merchant) {
    next();
  } else {
    return next(
      new AppError('You do not have permission to access this resource.', 403)
    );
  }
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.merchant.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get merchant based on POSTed email
  const merchant = await Merchant.findOne({ email: req.body.email });
  if (!merchant) {
    return next(new AppError('There is no merchant with email address.', 404));
  }

  // 2) Generate the random reset token
  const resetToken = merchant.createPasswordResetToken();
  await merchant.save({ validateBeforeSave: false });

  // 3) Send it to merchant's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/merchants/resetPassword/${resetToken}`;
    await new Email(merchant, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
  } catch (err) {
    merchant.passwordResetToken = undefined;
    merchant.passwordResetExpires = undefined;
    await merchant.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get merchant based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const merchant = await Merchant.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // 2) If token has not expired, and there is merchant, set the new password
  if (!merchant) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  merchant.password = req.body.password;
  merchant.passwordConfirm = req.body.passwordConfirm;
  merchant.passwordResetToken = undefined;
  merchant.passwordResetExpires = undefined;
  await merchant.save();

  // 3) Update changedPasswordAt property for the merchant
  // 4) Log the merchant in, send JWT
  createSendToken(merchant, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get merchant from collection
  const merchant = await Merchant.findById(req.merchant.id).select('+password');

  // 2) Check if POSTed current password is correct
  if (
    !(await merchant.correctPassword(
      req.body.passwordCurrent,
      merchant.password
    ))
  ) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // 3) If so, update password
  merchant.password = req.body.password;
  merchant.passwordConfirm = req.body.passwordConfirm;
  await merchant.save();
  // Merchant.findByIdAndUpdate will NOT work as intended!

  // 4) Log merchant in, send JWT
  createSendToken(merchant, 200, res);
});
