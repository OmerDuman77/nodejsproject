// review / rating / createdAt / ref to service / ref to customer
const mongoose = require('mongoose');
const Merchant = require('./merchantModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    merchant: {
      type: mongoose.Schema.ObjectId,
      ref: 'Merchant',
      required: [true, 'Review must belong to a merchant.']
    },
    customer: {
      type: mongoose.Schema.ObjectId,
      ref: 'Customer',
      required: [true, 'Review must belong to a customer']
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

reviewSchema.index({ merchant: 1, customer: 1 }, { unique: true });

reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'customer',
    select: 'firstName surname photo'
  });
  next();
});

reviewSchema.pre(/^find/, function(next) {
  // this points to the current query
  this.find({ isDeleted: { $ne: false } });
  next();
});

reviewSchema.statics.calcAverageRatings = async function(merchantid) {
  const stats = await this.aggregate([
    {
      $match: { service: merchantid }
    },
    {
      $group: {
        _id: '$merchant',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  if (stats.length > 0) {
    await Merchant.findByIdAndUpdate(merchantid, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await Merchant.findByIdAndUpdate(merchantid, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};

reviewSchema.post('save', function() {
  // this points to current review
  this.constructor.calcAverageRatings(this.merchant);
});

// findByIdAndUpdate
// findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function(next) {
  this.r = await this.findOne();
  // console.log(this.r);
  next();
});

reviewSchema.post(/^findOneAnd/, async function() {
  // await this.findOne(); does NOT work here, query has already executed
  await this.r.constructor.calcAverageRatings(this.r.merchant);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
