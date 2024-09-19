const mongoose = require('mongoose');

const serviceTypeSchema = new mongoose.Schema({
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
    ref: 'ServiceType',
    required: [false]
  }
});

const ServiceType = mongoose.model('ServiceType', serviceTypeSchema);

module.exports = ServiceType;
