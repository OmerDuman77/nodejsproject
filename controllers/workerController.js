const multer = require('multer');
const sharp = require('sharp');
const Worker = require('../models/workerModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');
//const AppointmentDate = require('../models/appointmentDateModel');
const AppointmentWorkerAvailability = require('../models/appointmentWorkerAvailabilityModel');
const CartItem = require('../models/cartItemModel');
const Cart = require('../models/cartItemModel');

const timeMap = require('../utils/timeMap');
const Appointment = require('../models/appointmentModel');

//merchants/:merchantId/

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

exports.uploadWorkerImage = upload.single('image');

exports.resizeWorkerImage = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.body.image = `worker-${req.params.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/workers/${req.file.filename}`);

  next();
});

exports.setMerchantId = (req, res, next) => {
  // Allow nested routes
  if (!req.body.merchant) req.body.merchant = req.params.merchantId;
  next();
};
//merchants/:merchantId/workers/:workerId/getUnavailabilityScreen
exports.getUnavailabilityScreen = catchAsync(async (req, res, next) => {
  const appointmentWorkerAvailabilities = await AppointmentWorkerAvailability.find(
    {
      worker: req.params.workerId,
      isDormant: false,
      isItStillThereForWorkerAvailability: true,
      isEmbowered: false
    }
  ).select('date status');

  const uniqueAvailableDatesSet = new Set();
  const uniqueUnavailableDatesSet = new Set();

  appointmentWorkerAvailabilities.forEach(workerAvailability => {
    const { date, status } = workerAvailability;
    const dateString = date.toString(); // Eğer date ObjectId ise string'e çevirme

    if (status === 'available') {
      uniqueAvailableDatesSet.add(dateString);
    } else if (status === 'unavailable') {
      uniqueUnavailableDatesSet.add(dateString);
    }
  });

  const availableDays = Array.from(uniqueAvailableDatesSet);
  const unavailableDays = Array.from(uniqueUnavailableDatesSet);

  res.status(200).json({
    status: 'success',
    data: {
      availableDays: availableDays,
      unavailableDays: unavailableDays
    }
  });
});

exports.setUnavailabilityScreen = catchAsync(async (req, res, next) => {
  const unavailableDaysByRequest = req.body.days;
  const appointmentWorkerAvailabilities = await AppointmentWorkerAvailability.find(
    {
      worker: req.params.workerId,
      isDormant: false,
      isItStillThereForWorkerAvailability: true,
      isEmbowered: false
    }
  );
  appointmentWorkerAvailabilities.forEach(async workerAvailability => {
    const { date } = workerAvailability;
    const dateString = date.toString(); // Eğer date ObjectId ise string'e çevirme

    workerAvailability.status = unavailableDaysByRequest.includes(dateString)
      ? 'unavailable'
      : 'available';

    await workerAvailability.save();
  });

  res.redirect(`/merchants/${req.params.merchantId}`);
});
//React Native tarafında map ve workingHours Dto oluşturulacak,bunlar stateler yardımı ile tutulacak
exports.getWorkingHoursScreen = catchAsync(async (req, res, next) => {
  const worker = await Worker.findById(req.params.workerId);
  res.status(200).json({
    status: 'success',
    data: {
      worker: worker
    }
  });
});

//merchants/:merchantId/workers/:workerId/setWorkingHoursScreen
exports.setWorkingHoursScreen = catchAsync(async (req, res, next) => {
  const findKeyByValue = value => {
    const keyArray = Object.keys(timeMap);
    const foundKey = keyArray.find(key => timeMap[key] === value);
    return foundKey !== undefined ? parseInt(foundKey, 10) : null;
  };
  const worker = await Worker.findById(req.params.workerId);
  const { workingHoursDto } = req.body;
  if (
    findKeyByValue(workingHoursDto.sundayEnd) <
    findKeyByValue(workingHoursDto.sundayStart)
  ) {
    return next(new AppError('Sunday end time is earlier than start time'));
  }
  worker.workingHours.sunday.startTime = workingHoursDto.sundayStart;
  worker.workingHours.sunday.endTime = workingHoursDto.sundayEnd;
  if (
    findKeyByValue(workingHoursDto.mondayEnd) <
    findKeyByValue(workingHoursDto.mondayStart)
  ) {
    return next(new AppError('Monday end time is earlier than start time'));
  }
  worker.workingHours.monday.startTime = workingHoursDto.mondayStart;
  worker.workingHours.monday.endTime = workingHoursDto.mondayEnd;
  if (
    findKeyByValue(workingHoursDto.tuesdayEnd) <
    findKeyByValue(workingHoursDto.tuesdayStart)
  ) {
    return next(new AppError('Tuesday end time is earlier than start time'));
  }
  worker.workingHours.tuesday.startTime = workingHoursDto.tuesdayStart;
  worker.workingHours.tuesday.endTime = workingHoursDto.tuesdayEnd;
  if (
    findKeyByValue(workingHoursDto.wednesdayEnd) <
    findKeyByValue(workingHoursDto.wednesdayStart)
  ) {
    return next(new AppError('Wednesday end time is earlier than start time'));
  }
  worker.workingHours.wednesday.startTime = workingHoursDto.wednesdayStart;
  worker.workingHours.wednesday.endTime = workingHoursDto.wednesdayEnd;
  if (
    findKeyByValue(workingHoursDto.thursdayEnd) <
    findKeyByValue(workingHoursDto.thursdayStart)
  ) {
    return next(new AppError('Thursday end time is earlier than start time'));
  }
  worker.workingHours.thursday.startTime = workingHoursDto.thursdayStart;
  worker.workingHours.thursday.endTime = workingHoursDto.thursdayEnd;
  if (
    findKeyByValue(workingHoursDto.fridayEnd) <
    findKeyByValue(workingHoursDto.fridayStart)
  ) {
    return next(new AppError('Friday end time is earlier than start time'));
  }
  worker.workingHours.friday.startTime = workingHoursDto.fridayStart;
  worker.workingHours.friday.endTime = workingHoursDto.fridayEnd;
  if (
    findKeyByValue(workingHoursDto.saturdayEnd) <
    findKeyByValue(workingHoursDto.saturdayStart)
  ) {
    return next(new AppError('Saturday end time is earlier than start time'));
  }
  worker.workingHours.saturday.startTime = workingHoursDto.saturdayStart;
  worker.workingHours.saturday.endTime = workingHoursDto.saturdayEnd;

  worker.workingHours.sunday.isWorking = workingHoursDto.isWorkingOnSunday;
  worker.workingHours.monday.isWorking = workingHoursDto.isWorkingOnMonday;
  worker.workingHours.tuesday.isWorking = workingHoursDto.isWorkingOnTuesday;
  // eslint-disable-next-line prettier/prettier
  worker.workingHours.wednesday.isWorking = workingHoursDto.isWorkingOnWednesday;
  worker.workingHours.thursday.isWorking = workingHoursDto.isWorkingOnThursday;
  worker.workingHours.friday.isWorking = workingHoursDto.isWorkingOnFriday;
  worker.workingHours.saturday.isWorking = workingHoursDto.isWorkingOnSaturday;

  const appointmentWorkerAvailabilities = await AppointmentWorkerAvailability.find(
    {
      worker: req.params.workerId
    }
  ).populate({ path: 'date timeSlot' });

  const appointmentWorkerAvailabilitiesRefreshed = appointmentWorkerAvailabilities.map(
    appointmentWorkerAvailability => {
      switch (appointmentWorkerAvailability.date.dayOfWeek) {
        case 'Sunday':
          if (worker.workingHours.sunday.isWorking === false) {
            appointmentWorkerAvailability.isEmbowered = true;
          } else if (
            findKeyByValue(appointmentWorkerAvailability.timeSlot.startTime) <
              findKeyByValue(worker.workingHours.sunday.startTime) ||
            findKeyByValue(appointmentWorkerAvailability.timeSlot.endTime) >
              findKeyByValue(worker.workingHours.sunday.endTime)
          ) {
            appointmentWorkerAvailability.isEmbowered = true;
          } else {
            appointmentWorkerAvailability.isEmbowered = false;
          }
          break;

        case 'Monday':
          if (worker.workingHours.monday.isWorking === false) {
            appointmentWorkerAvailability.isEmbowered = true;
          } else if (
            findKeyByValue(appointmentWorkerAvailability.timeSlot.startTime) <
              findKeyByValue(worker.workingHours.monday.startTime) ||
            findKeyByValue(appointmentWorkerAvailability.timeSlot.endTime) >
              findKeyByValue(worker.workingHours.monday.endTime)
          ) {
            appointmentWorkerAvailability.isEmbowered = true;
          } else {
            appointmentWorkerAvailability.isEmbowered = false;
          }
          break;

        case 'Tuesday':
          if (worker.workingHours.tuesday.isWorking === false) {
            appointmentWorkerAvailability.isEmbowered = true;
          } else if (
            findKeyByValue(appointmentWorkerAvailability.timeSlot.startTime) <
              findKeyByValue(worker.workingHours.tuesday.startTime) ||
            findKeyByValue(appointmentWorkerAvailability.timeSlot.endTime) >
              findKeyByValue(worker.workingHours.tuesday.endTime)
          ) {
            appointmentWorkerAvailability.isEmbowered = true;
          } else {
            appointmentWorkerAvailability.isEmbowered = false;
          }
          break;

        case 'Wednesday':
          if (worker.workingHours.wednesday.isWorking === false) {
            appointmentWorkerAvailability.isEmbowered = true;
          } else if (
            findKeyByValue(appointmentWorkerAvailability.timeSlot.startTime) <
              findKeyByValue(worker.workingHours.wednesday.startTime) ||
            findKeyByValue(appointmentWorkerAvailability.timeSlot.endTime) >
              findKeyByValue(worker.workingHours.wednesday.endTime)
          ) {
            appointmentWorkerAvailability.isEmbowered = true;
          } else {
            appointmentWorkerAvailability.isEmbowered = false;
          }
          break;

        case 'Thursday':
          if (worker.workingHours.thursday.isWorking === false) {
            appointmentWorkerAvailability.isEmbowered = true;
          } else if (
            findKeyByValue(appointmentWorkerAvailability.timeSlot.startTime) <
              findKeyByValue(worker.workingHours.thursday.startTime) ||
            findKeyByValue(appointmentWorkerAvailability.timeSlot.endTime) >
              findKeyByValue(worker.workingHours.thursday.endTime)
          ) {
            appointmentWorkerAvailability.isEmbowered = true;
          } else {
            appointmentWorkerAvailability.isEmbowered = false;
          }
          break;

        case 'Friday':
          if (worker.workingHours.friday.isWorking === false) {
            appointmentWorkerAvailability.isEmbowered = true;
          } else if (
            findKeyByValue(appointmentWorkerAvailability.timeSlot.startTime) <
              findKeyByValue(worker.workingHours.friday.startTime) ||
            findKeyByValue(appointmentWorkerAvailability.timeSlot.endTime) >
              findKeyByValue(worker.workingHours.friday.endTime)
          ) {
            appointmentWorkerAvailability.isEmbowered = true;
          } else {
            appointmentWorkerAvailability.isEmbowered = false;
          }
          break;

        case 'Saturday':
          if (worker.workingHours.saturday.isWorking === false) {
            appointmentWorkerAvailability.isEmbowered = true;
          } else if (
            findKeyByValue(appointmentWorkerAvailability.timeSlot.startTime) <
              findKeyByValue(worker.workingHours.saturday.startTime) ||
            findKeyByValue(appointmentWorkerAvailability.timeSlot.endTime) >
              findKeyByValue(worker.workingHours.saturday.endTime)
          ) {
            appointmentWorkerAvailability.isEmbowered = true;
          } else {
            appointmentWorkerAvailability.isEmbowered = false;
          }
          break;

        default:
      }
      return appointmentWorkerAvailability;
    }
  );
  await worker.save();
  await appointmentWorkerAvailabilitiesRefreshed.save();
});

///merchants/:merchantId/workers/:workerId/deleteWorkerForMerchants
exports.deleteWorkerForMerchants = catchAsync(async (req, res, next) => {
  const worker = await Worker.findByIdAndUpdate(
    req.params.workerId,
    {
      isDeleted: true
    },
    {
      new: true
    }
  );

  if (!worker) {
    return next(new AppError('No worker found with that ID', 404));
  }
  const appointments = await Appointment.find({
    services: {
      $in: [req.params.workerId]
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

  const cartItems = await CartItem.find({ worker: req.params.workerId });

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

exports.getAllWorkers = factory.getAll(Worker);
exports.getWorker = factory.getOne(Worker);
exports.createWorker = factory.createOne(Worker);
exports.updateWorker = factory.updateOne(Worker);
exports.deleteWorker = factory.deleteOne(Worker);
