const mongoose = require('mongoose');
const AppointmentDate = require('../models/appointmentDateModel');
const AppointmentTimeSlot = require('../models/appointmentTimeSlotModel');
const Worker = require('../models/workerModel');
const timeMap = require('../utils/timeMap');

const appointmentWorkerAvailabilitySchema = new mongoose.Schema({
  date: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AppointmentDate',
    required: [true, 'Please provide the date for the appointment']
  },
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker',
    required: [true, 'Please provide the worker for the appointment']
  },
  timeSlot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AppointmentTimeSlotModel',
    required: [true, 'Please provide the time slot for the appointment']
  },
  status: {
    type: String,
    enum: ['available', 'booked', 'unavailable'],
    default: 'available'
  },
  isDormant: {
    type: Boolean,
    default: true
  },
  isItStillThereForWorkerAvailability: {
    type: Boolean,
    default: true
  },
  isEmbowered: {
    type: Boolean,
    default: false
  }
  // available: müsait , booked: rezerve edilmiş, unavailable: müsait değil, embowered: kullanıma kapalı, dormant: henüz aktif değil
});

/*appointmentWorkerAvailabilitySchema.pre(/^find/, function(next) {
  // this points to the current query
  this.find({ isDormant: { $ne: true }, isEmbowered: { $ne: true } });
  next();
});  Bunu duruma göre kullanmak lazım*/

const AppointmentWorkerAvailability = mongoose.model(
  'AppointmentWorkerAvailability',
  appointmentWorkerAvailabilitySchema
);

appointmentWorkerAvailabilitySchema.post('save', async function(doc, next) {
  if (!doc.isNew) {
    return next();
  }
  const findKeyByValue = value => {
    const keyArray = Object.keys(timeMap);
    const foundKey = keyArray.find(key => timeMap[key] === value);
    return foundKey !== undefined ? parseInt(foundKey, 10) : null;
  };
  const dateForHere = await AppointmentDate.findById(doc.date);
  const timeSlotForHere = await AppointmentTimeSlot.findById(doc.timeSlot);
  const worker = await Worker.findById(doc.worker);
  switch (dateForHere.dayOfWeek) {
    case 'Sunday':
      if (worker.workingHours.sunday.isWorking === false) {
        doc.isEmbowered = true;
      } else if (
        findKeyByValue(timeSlotForHere.startTime) <
          findKeyByValue(worker.workingHours.sunday.startTime) ||
        findKeyByValue(timeSlotForHere.endTime) >
          findKeyByValue(worker.workingHours.sunday.endTime)
      ) {
        doc.isEmbowered = true;
      } else {
        doc.isEmbowered = false;
      }
      break;

    case 'Monday':
      if (worker.workingHours.monday.isWorking === false) {
        doc.isEmbowered = true;
      } else if (
        findKeyByValue(timeSlotForHere.startTime) <
          findKeyByValue(worker.workingHours.monday.startTime) ||
        findKeyByValue(timeSlotForHere.endTime) >
          findKeyByValue(worker.workingHours.monday.endTime)
      ) {
        doc.isEmbowered = true;
      } else {
        doc.isEmbowered = false;
      }
      break;

    case 'Tuesday':
      if (worker.workingHours.tuesday.isWorking === false) {
        doc.isEmbowered = true;
      } else if (
        findKeyByValue(timeSlotForHere.startTime) <
          findKeyByValue(worker.workingHours.tuesday.startTime) ||
        findKeyByValue(timeSlotForHere.endTime) >
          findKeyByValue(worker.workingHours.tuesday.endTime)
      ) {
        doc.isEmbowered = true;
      } else {
        doc.isEmbowered = false;
      }
      break;

    case 'Wednesday':
      if (worker.workingHours.wednesday.isWorking === false) {
        doc.isEmbowered = true;
      } else if (
        findKeyByValue(timeSlotForHere.startTime) <
          findKeyByValue(worker.workingHours.wednesday.startTime) ||
        findKeyByValue(timeSlotForHere.endTime) >
          findKeyByValue(worker.workingHours.wednesday.endTime)
      ) {
        doc.isEmbowered = true;
      } else {
        doc.isEmbowered = false;
      }
      break;

    case 'Thursday':
      if (worker.workingHours.thursday.isWorking === false) {
        doc.isEmbowered = true;
      } else if (
        findKeyByValue(timeSlotForHere.startTime) <
          findKeyByValue(worker.workingHours.thursday.startTime) ||
        findKeyByValue(timeSlotForHere.endTime) >
          findKeyByValue(worker.workingHours.thursday.endTime)
      ) {
        doc.isEmbowered = true;
      } else {
        doc.isEmbowered = false;
      }
      break;

    case 'Friday':
      if (worker.workingHours.friday.isWorking === false) {
        doc.isEmbowered = true;
      } else if (
        findKeyByValue(timeSlotForHere.startTime) <
          findKeyByValue(worker.workingHours.friday.startTime) ||
        findKeyByValue(timeSlotForHere.endTime) >
          findKeyByValue(worker.workingHours.friday.endTime)
      ) {
        doc.isEmbowered = true;
      } else {
        doc.isEmbowered = false;
      }
      break;

    case 'Saturday':
      if (worker.workingHours.saturday.isWorking === false) {
        doc.isEmbowered = true;
      } else if (
        findKeyByValue(timeSlotForHere.startTime) <
          findKeyByValue(worker.workingHours.saturday.startTime) ||
        findKeyByValue(timeSlotForHere.endTime) >
          findKeyByValue(worker.workingHours.saturday.endTime)
      ) {
        doc.isEmbowered = true;
      } else {
        doc.isEmbowered = false;
      }
      break;

    default:
  }
});

module.exports = AppointmentWorkerAvailability;
