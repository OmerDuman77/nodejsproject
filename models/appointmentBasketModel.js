const mongoose = require('mongoose');

const appointmentBasketSchema = new mongoose.Schema({
  appointments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment'
    }
  ],
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  merchant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant'
  }
});

const AppointmentBasket = mongoose.model(
  'AppointmentBasket',
  appointmentBasketSchema
);

module.exports = AppointmentBasket;
