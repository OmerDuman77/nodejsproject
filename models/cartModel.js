const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  items: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CartItem'
    }
  ],
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  total: {
    type: Number,
    default: 0
  }
});

cartSchema.pre(/^find/, function(next) {
  this.populate('items');
  next();
});

cartSchema.pre('save', function(next) {
  if (this.items.length > 10) {
    return next(new Error('Numbers of items exceeds the limit of 10'));
  }
  next();
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
