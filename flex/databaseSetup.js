const moment = require('moment');
const AppointmentDate = require('../models/appointmentDateModel');

exports.insertDays = async function(startDate, daysNumber) {
  const appointments = Array.from({ length: daysNumber }, (_, index) => {
    const currentDate = moment(startDate).add(index, 'days');
    return { appointmentDate: currentDate.toDate() };
  });

  await Promise.all(
    appointments.map(async appointment => {
      await AppointmentDate.create(appointment);
    })
  );
};
