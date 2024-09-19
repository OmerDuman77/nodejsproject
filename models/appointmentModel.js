const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  services: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service'
    }
  ],
  appointmentWorkerAvailability: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AppointmentWorkerAvailability'
  },
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker'
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Please provide the customer for the appointment']
  },
  merchant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'deniedClaim', 'unanswered'],
    default: 'pending'
  },
  appointmentBasket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AppointmentBasket'
  },
  isCancelled: {
    type: Boolean,
    default: false
  },
  isItInHistory: {
    type: Boolean,
    default: false
  },
  exactDay: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AppointmentDate'
  },
  totalPrice: {
    type: Number
  },
  claimToChangeTime: {
    isTimeWantedToBeChanged: {
      type: Boolean,
      default: false
    },
    appointmentWorkerAvailability: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AppointmentWorkerAvailability'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

appointmentSchema.pre(/^find/, function(next) {
  this.find({
    createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
  });
  next();
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;
