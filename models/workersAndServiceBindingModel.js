const mongoose = require('mongoose');
const Service = require('../models/serviceModel');
const Worker = require('../models/workerModel');

const workersAndServiceBindingModelSchema = new mongoose.Schema({
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  },
  workers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worker'
    }
  ]
});

workersAndServiceBindingModelSchema.post('save', async function(doc, next) {
  await Service.updateOne(
    { _id: doc.service },
    { $set: { workersAndServiceBinding: doc._id } }
  );

  const workers = await Worker.find({
    _id: { $in: doc.workers }
  });
  await Promise.all(
    workers.map(async worker => {
      worker.workersAndServiceBinding = doc._id;
      await worker.save();
    })
  );
  next();
});

const WorkersAndServiceBindingModel = mongoose.model(
  'WorkersAndServiceBindingModel',
  workersAndServiceBindingModelSchema
);

module.exports = WorkersAndServiceBindingModel;
