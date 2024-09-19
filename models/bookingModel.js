const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  services: [
    {
      service: {
        type: mongoose.Schema.ObjectId,
        ref: 'Service',
        required: [true, 'Booking must belong to a Service!']
      }
    }
  ],
  customer: {
    type: mongoose.Schema.ObjectId,
    ref: 'Customer',
    required: [true, 'Booking must belong to a Customer!']
  },
  totalPrice: {
    type: Number,
    require: [true, 'Booking must have a price.']
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  paid: {
    type: Boolean,
    default: true
  }
});

bookingSchema.pre(/^find/, function(next) {
  this.populate('customer').populate({
    path: 'services.service',
    select: 'serviceName'
  });
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
