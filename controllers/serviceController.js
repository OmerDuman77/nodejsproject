/* eslint-disable no-restricted-syntax */
const multer = require('multer');
const sharp = require('sharp');
const Service = require('../models/serviceModel');
const Worker = require('../models/workerModel');
const WorkersAndServiceBinding = require('../models/workersAndServiceBindingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');
const CartItem = require('../models/cartItemModel');
const Cart = require('../models/cartModel');
const Appointment = require('../models/appointmentModel');

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

exports.uploadServiceImage = upload.single('image');

exports.resizeServiceImage = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.body.image = `service-${req.params.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/services/${req.file.filename}`);

  next();
});

exports.setMerchantId = (req, res, next) => {
  // Allow nested routes
  if (!req.body.merchant) req.body.merchant = req.params.merchantId;
  next();
};

//merchants/:merchantId/services/:serviceId/getWorkersOfMerchant
exports.getWorkersOfMerchant = catchAsync(async (req, res, next) => {
  if (!req.body.merchant) {
    req.body.merchant = req.params.merchantId;
  }
  if (req.params.serviceId) {
    req.body.service = req.params.serviceId;
  }
  const workers = await Worker.find({
    merchant: req.body.merchant
  });
  const exactService = await Service.findById(req.params.serviceId).populate({
    path: 'workersAndServiceBinding'
  });
  if (!exactService.workersAndServiceBinding) {
    const workersAndServiceBindingToBeCreated = new WorkersAndServiceBinding({
      service: req.body.service,
      workers: null
    });
    const bindingObject = await workersAndServiceBindingToBeCreated.save();

    exactService.workersAndServiceBinding = bindingObject;
  }

  const workersAlreadyGivingThisService = [];
  const workersNotGivingThisService = [];

  for (const worker of workers) {
    if (exactService.workersAndServiceBinding.workers.includes(worker._id)) {
      workersAlreadyGivingThisService.push(worker);
    } else workersNotGivingThisService.push(worker);
  }

  res.status(200).json({
    status: 'success',
    data: {
      workersAlreadyGivingThisService: workersAlreadyGivingThisService,
      workersNotGivingThisService: workersNotGivingThisService
    }
  });
});
//merchants/:merchantId/services/:serviceId/setWorkersOfMerchant
exports.setWorkersOfMerchant = catchAsync(async (req, res, next) => {
  if (!req.body.merchant) {
    req.body.merchant = req.params.merchantId;
  }
  if (!req.body.service) {
    req.body.service = req.params.serviceId;
  }

  let workersAndServiceBinding = await WorkersAndServiceBinding.findOneAndUpdate(
    {
      service: req.params.serviceId
    },
    { workers: req.body.workersProvidingService }
  );

  if (workersAndServiceBinding) {
    const workersOld = await Worker.find({
      _id: { $in: workersAndServiceBinding.workers }
    });
    await Promise.all(
      workersOld.map(async workerOld => {
        workerOld.workersAndServiceBinding = null;
        await workerOld.save();
      })
    );

    const workersAndServiceBindingAgain = await WorkersAndServiceBinding.findById(
      workersAndServiceBinding._id
    );
    const workersNew = await Worker.find({
      _id: { $in: workersAndServiceBindingAgain.workers }
    });
    await Promise.all(
      workersNew.map(async workerNew => {
        workerNew.workersAndServiceBinding = workersAndServiceBindingAgain._id;
        await workerNew.save();
      })
    );
    workersAndServiceBinding = workersAndServiceBindingAgain;
  }

  if (!workersAndServiceBinding) {
    workersAndServiceBinding = new WorkersAndServiceBinding({
      workers: req.body.workersProvidingService,
      service: req.params.serviceId
    });
    await workersAndServiceBinding.save();
  }

  res.status(200).json({
    status: 'success',
    data: {
      workersAndServiceBinding: workersAndServiceBinding
    }
  });
});
//merchants/:merchantId/services/createServiceForMerchants
exports.createServiceForMerchants = catchAsync(async (req, res, next) => {
  if (!req.body.merchant) {
    req.body.merchant = req.params.merchantId;
  }
  const service = await Service.create(req.body);

  res.status(200).json({
    data: {
      service: service
    }
  });
});

///merchants/:merchantId/services/:serviceId/deleteServiceForMerchants
exports.deleteServiceForMerchants = catchAsync(async (req, res, next) => {
  const service = await Service.findByIdAndUpdate(
    req.params.serviceId,
    {
      isDeleted: true
    },
    {
      new: true
    }
  );

  if (!service) {
    return next(new AppError('No service found with that ID', 404));
  }
  const appointments = await Appointment.find({
    services: {
      $in: [req.params.serviceId]
    }
  });

  await Promise.all(
    appointments.map(async appointment => {
      if (
        appointment.status === 'approved' &&
        (!appointment.isCancelled || !appointment.isItInHistory)
      ) {
        return next(
          new AppError(
            'There is an appointment detected with associated with that service'
          )
        );
      }
    })
  );

  const cartItems = await CartItem.find({ service: req.params.serviceId });

  await Promise.all(
    cartItems.map(async cartItem => {
      await CartItem.findByIdAndUpdate(cartItem._id, { isDeleted: true });
      const cart = await Cart.findOne({
        'items._id': cartItem._id
      });
      cart.items = cart.items.filter(
        item => !item.service.equals(req.params.serviceId)
      );
      cart.total = cart.items.reduce(
        (total, item) => total + item.service.price
      );
      await cart.save();
    })
  );

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.getAllServices = factory.getAll(Service);
exports.getService = factory.getOne(Service);
exports.createService = factory.createOne(Service);
exports.updateService = factory.updateOne(Service);
exports.deleteService = factory.deleteOne(Service);
