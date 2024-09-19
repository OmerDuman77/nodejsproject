const mongoose = require('mongoose');
const validator = require('validator');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const merchantSchema = new mongoose.Schema({
  merchantName: {
    type: String,
    required: [true, 'Please tell us your name of merchant']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  phoneNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  role: {
    type: String,
    enum: ['merchant', 'admin'],
    default: 'merchant'
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This only works on CREATE and SAVE!!!
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  isDeleted: {
    type: Boolean,
    default: false,
    select: false
  },
  imageCover: {
    type: String,
    required: [true, 'A service must have a cover image'],
    default: 'mrcondom.jpeg'
  },
  images: [String],
  ratingsAverage: {
    type: Number,
    default: 4.5,
    min: [1, 'Rating must be above 1.0'],
    max: [5, 'Rating must be below 5.0'],
    set: val => Math.round(val * 10) / 10 // 4.666666, 46.6666, 47, 4.7
  },
  ratingsQuantity: {
    type: Number,
    default: 0
  },
  saloonLocation: {
    // GeoJSON
    type: {
      type: String,
      default: 'Point',
      enum: ['Point']
    },
    coordinates: [Number],
    address: String,
    description: String
  },
  businessHours: [
    {
      day: {
        type: String,
        enum: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday'
        ]
      },
      open: String,
      close: String
    }
  ],
  address: {
    street: String,
    neighbourhood: String,
    district: String,
    city: String,
    country: String,
    apartment: String
  },
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
  services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
  workers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Worker' }],
  merchantType: { type: mongoose.Schema.Types.ObjectId, ref: 'MerchantType' },
  secretAreaCode: String
});

merchantSchema.pre('save', async function(next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

merchantSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

merchantSchema.pre(/^find/, function(next) {
  // this points to the current query
  this.find({ isDeleted: { $ne: true } });
  next();
});

merchantSchema.methods.correctPassword = async function(
  candidatePassword,
  merchantPassword
) {
  return await bcrypt.compare(candidatePassword, merchantPassword);
};

merchantSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

merchantSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const Merchant = mongoose.model('Merchant', merchantSchema);

module.exports = Merchant;
