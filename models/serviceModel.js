const mongoose = require('mongoose');
const slugify = require('slugify');

const serviceSchema = new mongoose.Schema({
  serviceName: {
    type: String,
    required: [true, 'A service must have a name'],
    trim: true,
    maxlength: [
      50,
      'A service name must have less or equal then 50 characters'
    ],
    minlength: [10, 'A service name must have more or equal then 10 characters']
    // validate: [validator.isAlpha, 'Service name must only contain characters']
  },
  slug: String,
  price: {
    type: Number,
    required: [true, 'A service must have a price']
  },
  summary: {
    type: String,
    trim: true,
    required: [true, 'A service must have a description']
  },
  description: {
    type: String,
    trim: true
  },
  image: String,
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false
  },
  merchant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant',
    required: [true, 'Service must belong to a merchant.']
  },
  workersAndServiceBinding: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkersAndServiceBindingModel'
  },
  isDeleted: {
    type: Boolean,
    default: false,
    select: false
  }
});

serviceSchema.index({ price: 1, ratingsAverage: -1 });
serviceSchema.index({ slug: 1 });

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
serviceSchema.pre('save', function(next) {
  this.slug = slugify(this.serviceName, { lower: true });
  next();
});

serviceSchema.pre(/^find/, function(next) {
  // this points to the current query
  this.find({ isDeleted: { $ne: true } });
  next();
});

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;
