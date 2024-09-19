const mongoose = require('mongoose');

const workerTypeSchema = new mongoose.Schema({
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
    ref: 'WorkerType',
    required: [false]
  }
});

const WorkerType = mongoose.model('WorkerType', workerTypeSchema);

module.exports = WorkerType;
