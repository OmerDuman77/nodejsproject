const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title for the campaign']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description for the campaign']
  },
  startDate: {
    type: Date,
    required: [true, 'Please provide a start date for the campaign']
  },
  endDate: {
    type: Date,
    required: [true, 'Please provide an end date for the campaign']
  },
  discount: {
    type: Number,
    required: [true, 'Please provide a discount value for the campaign']
  },
  isGlobal: {
    type: Boolean,
    default: false // Local (merchant-specific) by default
  },
  merchant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant'
    // Bu alanı sadece local kampanyalarda kullanacaksınız, global kampanyalarda null olabilir
  }
});

const Campaign = mongoose.model('Campaign', campaignSchema);

module.exports = Campaign;
