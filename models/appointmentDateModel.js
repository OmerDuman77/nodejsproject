const mongoose = require('mongoose');
// eslint-disable-next-line import/no-extraneous-dependencies
const moment = require('moment');
const Worker = require('../models/workerModel');
const AppointmentWorkerAvailability = require('./appointmentWorkerAvailabilityModel');
const AppointmentTimeSlotModel = require('./appointmentTimeSlotModel');

const appointmentDateSchema = new mongoose.Schema({
  appointmentDate: {
    type: Date,
    required: [true, 'Please provide the date'],
    unique: true
  },
  dayOfWeek: {
    type: String
  }
});

appointmentDateSchema.pre('save', function(next) {
  // pre-save hook kullanarak tarih alanına day of week değerini atama
  const daysOfWeek = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ];
  this.dayOfWeek = daysOfWeek[new Date(this.appointmentDate).getDay()];
  next();
});

appointmentDateSchema.post('save', async function(doc, next) {
  const isDormant = !(moment(doc.appointmentDate).diff(moment(), 'days') < 28);

  const allWorkers = await Worker.find();
  const timeSlots = await AppointmentTimeSlotModel.find();
  await Promise.all(
    allWorkers.map(async worker => {
      await Promise.all(
        timeSlots.map(async timeSlot => {
          await AppointmentWorkerAvailability.create({
            date: doc._id,
            worker: worker._id,
            timeSlot: timeSlot._id,
            isDormant: isDormant
          });
        })
      );
    })
  );
});

const AppointmentDate = mongoose.model(
  'AppointmentDate',
  appointmentDateSchema
);

module.exports = AppointmentDate;
