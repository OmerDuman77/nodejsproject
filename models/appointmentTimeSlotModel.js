// AppointmentTimeSlotModel.js
const mongoose = require('mongoose');

const appointmentTimeSlotSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: [true, 'Please provide the start time for the time slot']
  },
  endTime: {
    type: String,
    required: [true, 'Please provide the end time for the time slot']
  }
});

const AppointmentTimeSlotModel = mongoose.model(
  'AppointmentTimeSlotModel',
  appointmentTimeSlotSchema
);

module.exports = AppointmentTimeSlotModel;
