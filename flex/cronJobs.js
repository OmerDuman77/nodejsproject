const AppointmentDate = require('../models/appointmentDateModel');
const AppointmentWorkerAvailability = require('../models/appointmentWorkerAvailabilityModel');
const AppointmentTimeSlot = require('../models/appointmentTimeSlotModel');
const Appointment = require('../models/appointmentModel');

exports.insertSingleDay = async startDate => {
  try {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + 365);
    await AppointmentDate.create({ appointmentDate: currentDate });
    console.log('Belge başarıyla eklendi:', currentDate);
  } catch (err) {
    console.error('Belge eklenirken bir hata oluştu:', err);
  }
};

exports.changeIsDormant = async startDate => {
  try {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + 28);
    const appointmentDate = await AppointmentDate.find({
      appointmentDate: currentDate
    });
    const calendars = await AppointmentWorkerAvailability.find({
      date: appointmentDate._id
    });
    await Promise.all(
      calendars.map(async calendar => {
        calendar.isDormant = false;
        await calendar.save();
      })
    );
    console.log('Belgeler başarıyla güncellendi:');
  } catch (err) {
    console.error('Belgeler güncellenirken bir hata oluştu:', err);
  }
};

exports.updatePastTimeCalendars = async (startDate, timeSlot) => {
  try {
    const currentDate = new Date(startDate);
    const appointmentDate = await AppointmentDate.find({
      appointmentDate: currentDate
    });
    const specificTimeSlot = await AppointmentTimeSlot.find({
      startTime: timeSlot.startTime,
      endTime: timeSlot.endTime
    });
    const calendars = await AppointmentWorkerAvailability.find({
      date: appointmentDate._id,
      timeSlot: specificTimeSlot._id
    });

    await Promise.all(
      calendars.map(async calendar => {
        calendar.isItStillThereForWorkerAvailability = false;
        const appointments = await Appointment.find({
          exactAppointmentWorkerAvailability: calendar._id
        });
        await Promise.all(
          appointments.map(async appointment => {
            appointment.isItInHistory = true;
            if (appointment.status === 'pending') {
              appointment.status = 'unanswered';
            }
            appointment.save();
          })
        );
        calendar.save();
      })
    );

    console.log('Belgeler başarıyla güncellendi:');
  } catch (err) {
    console.error('Belgeler güncellenirken bir hata oluştu:', err);
  }
};
