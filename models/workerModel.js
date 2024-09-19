const mongoose = require('mongoose');
const timeMap = require('../utils/timeMap');

const workerSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Please tell us your name']
  },
  surname: {
    type: String,
    required: [true, 'Please tell us your surname']
  },
  photo: {
    type: String,
    default: 'siradaninsan.jpg'
  },
  merchant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant', // Merchant modeline referans
    required: [true, 'Please provide the associated merchant']
  },
  workersAndServiceBinding: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant'
  },
  appointmentWorkerAvailability: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AppointmentWorkerAvailability'
    }
  ],
  isDeleted: {
    type: Boolean,
    default: false,
    select: false
  },
  workingHours: {
    sunday: {
      isWorking: {
        type: Boolean,
        default: true
      },
      startTime: {
        type: String,
        default: timeMap[0]
      },
      endTime: {
        type: String,
        default: timeMap[48]
      }
    },
    monday: {
      isWorking: {
        type: Boolean,
        default: true
      },
      startTime: {
        type: String,
        default: timeMap[0]
      },
      endTime: {
        type: String,
        default: timeMap[48]
      }
    },
    tuesday: {
      isWorking: {
        type: Boolean,
        default: true
      },
      startTime: {
        type: String,
        default: timeMap[0]
      },
      endTime: {
        type: String,
        default: timeMap[48]
      }
    },
    wednesday: {
      isWorking: {
        type: Boolean,
        default: true
      },
      startTime: {
        type: String,
        default: timeMap[0]
      },
      endTime: {
        type: String,
        default: timeMap[48]
      }
    },
    thursday: {
      isWorking: {
        type: Boolean,
        default: true
      },
      startTime: {
        type: String,
        default: timeMap[0]
      },
      endTime: {
        type: String,
        default: timeMap[48]
      }
    },
    friday: {
      isWorking: {
        type: Boolean,
        default: true
      },
      startTime: {
        type: String,
        default: timeMap[0]
      },
      endTime: {
        type: String,
        default: timeMap[48]
      }
    },
    saturday: {
      isWorking: {
        type: Boolean,
        default: true
      },
      startTime: {
        type: String,
        default: timeMap[0]
      },
      endTime: {
        type: String,
        default: timeMap[48]
      }
    }
  }
});

const Worker = mongoose.model('Worker', workerSchema);

module.exports = Worker;
