const mongoose = require('mongoose');

const merchantTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name for the type'],
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a description for the type']
  },
  parentType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MerchantType',
    required: [false]
  }
});

const MerchantType = mongoose.model('MerchantType', merchantTypeSchema);

module.exports = MerchantType;
