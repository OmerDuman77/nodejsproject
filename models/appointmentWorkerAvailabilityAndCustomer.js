// AppointmentTimeSlotModel.js
const mongoose = require('mongoose');

const appointmentWorkerAvailabilityAndCustomerSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  appointmentWorkerAvailability: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AppointmentWorkerAvailability'
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
});

appointmentWorkerAvailabilityAndCustomerSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

const AppointmentWorkerAvailabilityAndCustomer = mongoose.model(
  'AppointmentWorkerAvailabilityAndCustomer',
  appointmentWorkerAvailabilityAndCustomerSchema
);

module.exports = AppointmentWorkerAvailabilityAndCustomer;
