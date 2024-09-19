const multer = require('multer');
const sharp = require('sharp');
const Merchant = require('./../models/merchantModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');
const APIFeatures = require('../utils/apiFeatures');

const merchantSelectedFields = [
  'merchantName',
  'email',
  'phoneNumber',
  'imageCover',
  'images',
  'ratingsAverage',
  'ratingsQuantity',
  'saloonLocation',
  'businessHours',
  'address',
  'reviews',
  'services',
  'workers',
  'merchantType'
];

const selectMerchantFields = query => {
  return query.select(merchantSelectedFields.join(' '));
};

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadMerchantImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 10 }
]);

exports.resizeMerchantImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  req.body.imageCover = `merchant-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/merchants/${req.body.imageCover}`);

  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `merchant-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/merchants/${filename}`);

      req.body.images.push(filename);
    })
  );

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.merchantId = req.merchant.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if merchant POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;

  // 3) Update merchant document
  const updatedMerchant = await Merchant.findByIdAndUpdate(
    req.merchant.id,
    filteredBody,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    status: 'success',
    data: {
      merchant: updatedMerchant
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await Merchant.findByIdAndUpdate(req.merchant.id, { isDeleted: true });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.createMerchant = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined anymore! Please use /signup instead'
  });
};

exports.getMerchant = factory.getOne(Merchant);
exports.getAllMerchants = factory.getAll(Merchant);

// Do NOT update passwords with this!
exports.updateMerchant = factory.updateOne(Merchant);
exports.deleteMerchant = factory.deleteOne(Merchant);

exports.getMerchantsWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitutr and longitude in the format lat,lng.',
        400
      )
    );
  }

  const merchants = await Merchant.find({
    saloonLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  }).select(selectMerchantFields());

  res.status(200).json({
    status: 'success',
    results: merchants.length,
    data: {
      data: merchants
    }
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitutr and longitude in the format lat,lng.',
        400
      )
    );
  }

  const distances = await Merchant.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  });
});

exports.search = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(
    Merchant.find().select(selectMerchantFields()),
    req.query
  );

  features
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const doc = await features.query;

  res.status(200).json({
    status: 'success',
    results: doc.length,
    data: {
      doc
    }
  });
});

exports.exploration = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(
    Merchant.find(req.params.merchantId)
      .select(selectMerchantFields())
      .populate('reviews services workers'),
    req.query
  );

  features
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const doc = await features.query;

  res.status(200).json({
    status: 'success',
    results: doc.length,
    data: {
      doc
    }
  });
});
