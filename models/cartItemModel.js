const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  },
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker'
  },
  appointmentWorkerAvailability: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AppointmentWorkerAvailability'
  },
  price: {
    type: Number
  },
  isDeleted: {
    type: Boolean,
    default: false,
    select: false
  }
});

cartItemSchema.pre(/^find/, function(next) {
  // this points to the current query
  this.find({ isDeleted: { $ne: true } });
  next();
});

const CartItem = mongoose.model('CartItem', cartItemSchema);

module.exports = CartItem;
