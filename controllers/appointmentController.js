/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const AppointmentWorkerAvailability = require('../models/appointmentWorkerAvailabilityModel');
const WorkersAndServiceBinding = require('../models/workersAndServiceBindingModel');
const AppointmentWorkerAvailabilityAndCustomer = require('../models/appointmentWorkerAvailabilityAndCustomer');
const Appointment = require('../models/appointmentModel');

//appointments/appointmentC/:appointmentId

exports.viewAllAppointments = catchAsync(async (req, res, next) => {
  const { merchantId, customerId } = req.params;
  let userType = '';
  if (req.merchant || req.customer) {
    if (req.merchant && merchantId) {
      userType = 'merchant';
    } else if (req.customer && customerId) {
      userType = 'customer';
    }
  }
  let appointments = [];
  if (userType === 'merchant') {
    appointments = await Appointment.find({
      merchant: req.params.merchantId
    })
      .populate({
        path: 'services'
      })
      .populate({
        path: 'worker'
      })
      .populate({
        path: 'appointmentWorkerAvailability',
        populate: {
          path: 'timeSlot',
          model: 'AppointmentTimeSlotModel'
        }
      })
      .populate({
        path: 'merchant'
      })
      .populate({
        path: 'customer'
      })
      .populate({
        path: 'exactDay'
      })
      .populate({
        path: 'claimToChangeTime.appointmentWorkerAvailability'
      });
  } else if (userType === 'customer') {
    appointments = await Appointment.find({
      customer: req.params.customerId
    })
      .populate({
        path: 'services'
      })
      .populate({
        path: 'worker'
      })
      .populate({
        path: 'appointmentWorkerAvailability',
        populate: {
          path: 'timeSlot',
          model: 'AppointmentTimeSlotModel'
        }
      })
      .populate({
        path: 'merchant'
      })
      .populate({
        path: 'customer'
      })
      .populate({
        path: 'exactDay'
      })
      .populate({
        path: 'claimToChangeTime.appointmentWorkerAvailability'
      });
  } else return next(new AppError('There are no userType', 404));
  res.status(200).json({
    status: 'success',
    data: {
      appointments: appointments
    }
  });
});

exports.viewSpecificAppointment = catchAsync(async (req, res, next) => {
  const { appointmentId } = req.params;
  const appointment = await Appointment.findById(appointmentId);

  res.status(200).json({
    status: 'success',
    data: {
      appointment: appointment
    }
  });
});

//appointments/appointmentC/:appointmentId/approveAppointment

exports.approveAppointment = catchAsync(async (req, res, next) => {
  let userType = '';
  if (req.body.merchant || req.body.customer) {
    if (req.merchant.id) {
      req.body.merchant = req.merchant.id;
      userType = 'merchant';
    } else {
      req.body.customer = req.customer.id;
      userType = 'customer';
    }
  }
  if (userType === 'customer') {
    return next(new AppError('Customers can not reach that action', 403));
  }

  if (!req.body.appointment) {
    req.body.appointment = req.params.appointmentId;
  }
  const appointment = await Appointment.findById(req.body.appointment);

  const appointmentOfBeClaimedToChangeTime = await Appointment.findOne({
    'claimToChangeTime.isTimeWantedToBeChanged': true,
    'claimToChangeTime.appointmentWorkerAvailability':
      appointment.appointmentWorkerAvailability
  });

  if (!appointmentOfBeClaimedToChangeTime) {
    return next(
      new AppError('There is an appointment claim waiting for customer', 409)
    );
  }

  const appointmentWorkerAvailability = await AppointmentWorkerAvailability.findById(
    appointment.appointmentWorkerAvailability
  );
  if (appointmentWorkerAvailability.status === 'booked') {
    const relation = await AppointmentWorkerAvailabilityAndCustomer.findOne({
      appointmentWorkerAvailability: appointmentWorkerAvailability._id
    });
    if (!relation.customer === appointment.customer) {
      return next(
        new AppError('AppointmentWorkerAvailability is already booked', 409)
      );
    }
  }
  if (!appointmentWorkerAvailability.status === 'booked') {
    appointmentWorkerAvailability.status = 'booked';
    const appointmentWorkerAvailabilityAndCustomer = new AppointmentWorkerAvailabilityAndCustomer(
      {
        customer: appointment.customer,
        appointmentWorkerAvailability: appointmentWorkerAvailability._id
      }
    );
    await appointmentWorkerAvailabilityAndCustomer.save();
  }
  appointment.status = 'approved';
  await appointmentWorkerAvailability.save();
  await appointment.save();

  res.status(200).json({
    status: 'success',
    data: {
      appointment: appointment
    }
  });
});

//appointments/appointmentC/:appointmentId/rejectAppointment
exports.rejectAppointment = catchAsync(async (req, res, next) => {
  let userType = '';
  if (req.body.merchant || req.body.customer) {
    if (req.merchant.id) {
      req.body.merchant = req.merchant.id;
      userType = 'merchant';
    } else {
      req.body.customer = req.customer.id;
      userType = 'customer';
    }
  }
  if (userType === 'customer') {
    return next(new AppError('Customers can not reach that action', 403));
  }
  if (!req.body.appointment) {
    req.body.appointment = req.params.appointmentId;
  }

  const appointment = await Appointment.findById(req.body.appointment);

  appointment.status = 'rejected';
  await appointment.save();

  res.status(200).json({
    status: 'success',
    data: {
      appointment: appointment
    }
  });
});

//appointments/appointmentC/:appointmentId/cancelAppointment
exports.cancelAppointment = catchAsync(async (req, res, next) => {
  let userType = '';
  if (req.body.merchant || req.body.customer) {
    if (req.merchant.id) {
      req.body.merchant = req.merchant.id;
      userType = 'merchant';
    } else {
      req.body.customer = req.customer.id;
      userType = 'customer';
    }
  }
  if (userType === 'merchant') {
    return next(new AppError('Merchants can not reach that action', 403));
  }
  if (!req.body.appointment) {
    req.body.appointment = req.params.appointmentId;
  }

  const appointment = await Appointment.findById(req.body.appointment);

  const appointmentWorkerAvailability = await AppointmentWorkerAvailability.findById(
    appointment.appointmentWorkerAvailability
  );
  appointmentWorkerAvailability.status = 'available';
  await appointmentWorkerAvailability.save();
  const relation = await AppointmentWorkerAvailabilityAndCustomer.findOne({
    appointmentWorkerAvailability: appointmentWorkerAvailability._id
  });
  if (relation.isDeleted === false) {
    relation.isDeleted = true;
    await relation.save();
  }

  appointment.isCancelled = true;
  await appointment.save();

  res.status(200).json({
    status: 'success',
    data: {
      appointment: appointment
    }
  });
});

//appointments/appointmentC/:appointmentId/buckAppointment
exports.getBuckAppointment = catchAsync(async (req, res, next) => {
  const currentAppointment = await Appointment.findById(
    req.params.appointmentId
  ).populate({
    path: 'services'
  });

  const firstService = currentAppointment.services[0];

  const workersAndServiceBindingForFirstService = await WorkersAndServiceBinding.findById(
    firstService.workersAndServiceBinding
  );
  const workersForFirstService =
    workersAndServiceBindingForFirstService.workers;

  const workerRemoved = workersForFirstService.filter(
    worker => worker !== currentAppointment.worker
  );

  let intersectionSet = new Set(workerRemoved);

  for (const service of currentAppointment.services.slice(1)) {
    const workersAndServiceBinding = await WorkersAndServiceBinding.findById(
      service.workersAndServiceBinding
    );

    intersectionSet = new Set(
      [...intersectionSet].filter(workerId =>
        workersAndServiceBinding.workers.includes(workerId.toString())
      )
    );
  }

  const lastWorkerArray = [...intersectionSet];

  res.status(200).json({
    status: 'success',
    data: {
      workers: lastWorkerArray
    }
  });
});

//appointments/appointmentC/:appointmentId/buckAppointment/:workerId
exports.postBuckAppointment = catchAsync(async (req, res, next) => {
  if (!req.body.appointment) {
    req.body.appointment = req.params.appointmentId;
  }

  const appointment = await Appointment.findById(req.body.appointment);

  const workerAvailabilityOfAppointment = await AppointmentWorkerAvailability.findById(
    appointment.appointmentWorkerAvailability
  );
  const workerAvailabilityOfWorker = await AppointmentWorkerAvailability.findOne(
    {
      date: workerAvailabilityOfAppointment.date,
      timeSlot: workerAvailabilityOfAppointment.timeSlot
    }
  );
  if (workerAvailabilityOfWorker.status === 'booked') {
    const relation = await AppointmentWorkerAvailabilityAndCustomer.findOne({
      appointmentWorkerAvailability: workerAvailabilityOfWorker._id
    });
    if (!relation.customer === appointment.customer) {
      return next(
        new AppError('AppointmentWorkerAvailability is already booked', 409)
      );
    }
  }
  if (!workerAvailabilityOfWorker.status === 'booked') {
    workerAvailabilityOfWorker.status = 'booked';
    const appointmentWorkerAvailabilityAndCustomer = new AppointmentWorkerAvailabilityAndCustomer(
      {
        customer: appointment.customer,
        appointmentWorkerAvailability: workerAvailabilityOfWorker._id
      }
    );
    await appointmentWorkerAvailabilityAndCustomer.save();
  }
  if (workerAvailabilityOfWorker.status === 'unavailable') {
    return next(
      new AppError('Worker chosen is unavailable in that time interval', 409)
    );
  }
  if (
    workerAvailabilityOfWorker.isDormant === true ||
    workerAvailabilityOfWorker.isEmbowered === true ||
    workerAvailabilityOfAppointment.isItStillThereForWorkerAvailability ===
      false
  ) {
    return next(new AppError('There is something wrong with choice', 409));
  }
  if (workerAvailabilityOfWorker.status === 'available') {
    appointment.appointmentWorkerAvailability = workerAvailabilityOfWorker._id;
    appointment.status = 'approved';
    workerAvailabilityOfWorker.status = 'booked';
    await appointment.save();
    await workerAvailabilityOfWorker.save();
  }
  appointment.status = 'approved';
  await appointment.save();

  res.redirect('/appoinments/my-appointments');
});

//appointments/appointmentC/:appointmentId/SendClaimToChangeForAppointment
exports.getSendClaimToChangeTimeForAppointment = catchAsync(
  async (req, res, next) => {
    const appointment = await Appointment.findById(req.params.appointmentId);

    const appointmentWorkerAvailabilities = await AppointmentWorkerAvailability.find(
      { date: appointment.exactDay }
    );
    const filteredAppointmentWorkerAvailabilities = appointmentWorkerAvailabilities.filter(
      appointmentWorkerAvailabilitiy =>
        appointmentWorkerAvailabilitiy.status !== 'booked' &&
        appointmentWorkerAvailabilitiy.status !== 'unavailable' &&
        appointmentWorkerAvailabilitiy.isDormant === false &&
        appointmentWorkerAvailabilitiy.isItStillThereForWorkerAvailability ===
          true &&
        appointmentWorkerAvailabilitiy.isEmbowered === false &&
        appointmentWorkerAvailabilitiy._id !==
          appointment.appointmentWorkerAvailability
    );

    res.status(200).json({
      status: 'success',
      data: {
        filteredAppointmentWorkerAvailabilities: filteredAppointmentWorkerAvailabilities
      }
    });
  }
);

//appointments/appointmentC/:appointmentId/postSendClaimToChangeForAppointment/:appointmentWorkerAvailabilityId
exports.postSendClaimToChangeTimeForAppointment = catchAsync(
  async (req, res, next) => {
    const isThereAlreadyOneForAppointment = await Appointment.findOne({
      'claimToChangeTime.isTimeWantedToBeChanged': true,
      'claimToChangeTime.appointmentWorkerAvailability':
        req.params.appointmentWorkerAvailabilityId
    });
    if (isThereAlreadyOneForAppointment) {
      return next(
        new AppError(
          'There is already one claim to change time at this appointment worker availability'
        )
      );
    }

    await Appointment.findByIdAndUpdate(req.params.appointmentId, {
      'claimToChangeTime.isTimeWantedToBeChanged': true,
      'claimToChangeTime.appointmentWorkerAvailability':
        req.params.appointmentWorkerAvailabilityId
    });

    res.redirect('/appointments/my-appointments');
  }
);

//appointments/appointmentC/:appointmentId/acceptClaimToChangeTimeForAppointment
exports.acceptClaimToChangeTimeForAppointment = catchAsync(
  async (req, res, next) => {
    const appointment = await Appointment.findById(req.params.appointmentId);

    appointment.claimToChangeTime.isTimeWantedToBeChanged = false;
    appointment.appointmentWorkerAvailability =
      appointment.claimToChangeTime.appointmentWorkerAvailability;
    appointment.claimToChangeTime.appointmentWorkerAvailability = null;
    appointment.status = 'approved';
    await AppointmentWorkerAvailability.findByIdAndUpdate(
      appointment.appointmentWorkerAvailability,
      { status: 'booked' }
    );
    await appointment.save();

    res.redirect('/appointments/my-appointments');
  }
);

//appointments/appointmentC/:appointmentId/denyClaimToChangeTimeForAppointment
exports.denyClaimToChangeTimeForAppointment = catchAsync(
  async (req, res, next) => {
    const appointment = await Appointment.findById(req.params.appointmentId);

    appointment.claimToChangeTime.isTimeWantedToBeChanged = false;
    appointment.claimToChangeTime.appointmentWorkerAvailability = null;
    appointment.status = 'deniedClaim';
    await appointment.save();

    res.redirect('/appointments/my-appointments');
  }
);

exports.getAllAppointments = factory.getAll(Appointment);
exports.getAppointment = factory.getOne(Appointment);
exports.createAppointment = factory.createOne(Appointment);
exports.updateAppointment = factory.updateOne(Appointment);
exports.deleteAppointment = factory.deleteOne(Appointment);
