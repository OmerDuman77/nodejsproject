const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const Customer = require('../../models/customerModel');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const Email = require('../../utils/email');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (customer, statusCode, res) => {
  const token = signToken(customer._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  customer.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      customer
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newCustomer = await Customer.create({
    firstname: req.body.firstname,
    surname: req.body.surname,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  //await new Email(newCustomer, url).sendWelcome();
  createSendToken(newCustomer, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  // 2) Check if customer exists && password is correct
  const customer = await Customer.findOne({ email }).select('+password');

  if (
    !customer ||
    !(await customer.correctPassword(password, customer.password))
  ) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If everything ok, send token to client
  createSendToken(customer, 200, res);
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

  const currentCustomer = await Customer.findById(decoded.id);
  if (!currentCustomer) {
    return next(
      new AppError(
        'The customer belonging to this token does no longer exist.',
        401
      )
    );
  }

  if (currentCustomer.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'Customer recently changed password! Please log in again.',
        401
      )
    );
  }

  createSendToken(currentCustomer, 200, res);
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

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if customer still exists
  const currentCustomer = await Customer.findById(decoded.id);
  if (!currentCustomer) {
    return next(
      new AppError(
        'The customer belonging to this token does no longer exist.',
        401
      )
    );
  }

  // 4) Check if customer changed password after the token was issued
  if (currentCustomer.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'Customer recently changed password! Please log in again.',
        401
      )
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.customer = currentCustomer;
  res.locals.customer = currentCustomer;
  next();
});

exports.checkCustomerAuthorization = catchAsync(
  async (req, res, next, Model) => {
    // Adminse kontrolü geç
    if (req.customer.role === 'admin') {
      next();
    }
    const modelName = `${Model.toString()
      .charAt(0)
      .toLowerCase() + Model.toString().slice(1)}Id`;
    let modelId = '';
    if (req.params.id) {
      modelId = req.params.id;
    } else if (!req.params.id && req.params[modelName]) {
      modelId = req.params[modelName];
    }

    const customerId = req.customer.id;

    const model = await Model.findById(modelId);

    if (!model) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    if (model.customer.toString() !== customerId) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  }
);

exports.onlyForCustomers = catchAsync(async (req, res, next) => {
  const onlyForCustomer = req.customer || req.merchant;
  if (onlyForCustomer === req.customer) {
    next();
  } else {
    return next(
      new AppError('You do not have permission to access this resource.', 403)
    );
  }
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'lead-guide']. role='customer'
    if (!roles.includes(req.customer.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get customer based on POSTed email
  const customer = await Customer.findOne({ email: req.body.email });
  if (!customer) {
    return next(new AppError('There is no customer with email address.', 404));
  }

  // 2) Generate the random reset token
  const resetToken = customer.createPasswordResetToken();
  await customer.save({ validateBeforeSave: false });

  // 3) Send it to customer's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/customers/resetPassword/${resetToken}`;
    await new Email(customer, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
  } catch (err) {
    customer.passwordResetToken = undefined;
    customer.passwordResetExpires = undefined;
    await customer.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get customer based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const customer = await Customer.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // 2) If token has not expired, and there is customer, set the new password
  if (!customer) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  customer.password = req.body.password;
  customer.passwordConfirm = req.body.passwordConfirm;
  customer.passwordResetToken = undefined;
  customer.passwordResetExpires = undefined;
  await customer.save();

  // 3) Update changedPasswordAt property for the customer
  // 4) Log the customer in, send JWT
  createSendToken(customer, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get customer from collection
  const customer = await Customer.findById(req.customer.id).select('+password');

  // 2) Check if POSTed current password is correct
  if (
    !(await customer.correctPassword(
      req.body.passwordCurrent,
      customer.password
    ))
  ) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // 3) If so, update password
  customer.password = req.body.password;
  customer.passwordConfirm = req.body.passwordConfirm;
  await customer.save();
  // Customer.findByIdAndUpdate will NOT work as intended!

  // 4) Log customer in, send JWT
  createSendToken(customer, 200, res);
});
