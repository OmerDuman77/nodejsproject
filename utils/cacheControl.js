const catchAsync = require('../utils/catchAsync');

exports.cacheControl = catchAsync(async (req, res, next) => {
  res.header('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
  next();
});
