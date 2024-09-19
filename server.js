const mongoose = require('mongoose');
const dotenv = require('dotenv');
// eslint-disable-next-line import/no-extraneous-dependencies
const cron = require('node-cron');
const cronJobs = require('./flex/cronJobs');
const databaseSetup = require('./flex/databaseSetup');

process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB)
  .then(() => {
    console.log('DB connection successful!');

    if (process.env.DATABASE_SETUP === 'yapılmadı') {
      const startDate = new Date();
      databaseSetup.insertDays(startDate, 365);
    }

    cron.schedule('0 21 * * *', () => {
      const startDate = new Date();
      cronJobs.changeIsDormant(startDate);
    });

    cron.schedule('0 21 * * *', () => {
      const startDate = new Date();
      cronJobs.insertSingleDay(startDate);
    });
    /////////////////////////////////////////////////
    cron.schedule('0 21 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '00:00', endTime: '00:30' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('30 21 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '00:30', endTime: '01:00' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('0 22 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '01:00', endTime: '01:30' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('30 22 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '01:30', endTime: '02:00' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('0 23 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '02:00', endTime: '02:30' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('30 23 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '02:30', endTime: '03:00' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('0 0 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '03:00', endTime: '03:30' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('30 0 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '03:30', endTime: '04:00' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('0 1 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '04:00', endTime: '04:30' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('30 1 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '04:30', endTime: '05:00' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('0 2 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '05:00', endTime: '05:30' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('30 2 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '05:30', endTime: '06:00' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('0 3 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '06:00', endTime: '06:30' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('30 3 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '06:30', endTime: '07:00' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('0 4 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '07:00', endTime: '07:30' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('30 4 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '07:30', endTime: '08:00' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('0 5 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '08:00', endTime: '08:30' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('30 5 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '08:30', endTime: '09:00' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('0 6 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '09:00', endTime: '09:30' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('30 6 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '09:30', endTime: '10:00' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('0 7 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '10:00', endTime: '10:30' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('30 7 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '10:30', endTime: '11:00' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('0 8 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '11:00', endTime: '11:30' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('30 8 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '11:30', endTime: '12:00' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('0 9 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '12:00', endTime: '12:30' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('30 9 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '12:30', endTime: '13:00' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('0 10 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '13:00', endTime: '13:30' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('30 10 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '13:30', endTime: '14:00' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('0 11 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '14:00', endTime: '14:30' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('30 11 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '14:30', endTime: '15:00' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('0 12 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '15:00', endTime: '15:30' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('30 12 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '15:30', endTime: '16:00' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('0 13 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '16:00', endTime: '16:30' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('30 13 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '16:30', endTime: '17:00' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('0 14 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '17:00', endTime: '17:30' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('30 14 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '17:30', endTime: '18:00' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('0 15 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '18:00', endTime: '18:30' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('30 15 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '18:30', endTime: '19:00' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('0 16 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '19:00', endTime: '19:30' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('30 16 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '19:30', endTime: '20:00' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('0 17 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '20:00', endTime: '20:30' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('30 17 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '20:30', endTime: '21:00' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('0 18 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '21:00', endTime: '21:30' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('30 18 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '21:30', endTime: '22:00' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('0 19 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '22:00', endTime: '22:30' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('30 19 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '22:30', endTime: '23:00' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('0 20 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '23:00', endTime: '23:30' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('30 20 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '23:30', endTime: '23:59' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('0 21 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '00:00', endTime: '00:30' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('30 21 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '00:30', endTime: '01:00' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('0 22 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '01:00', endTime: '01:30' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
    cron.schedule('30 22 * * *', () => {
      /*const startDate = new Date();
      const timeSlot = { startTime: '01:30', endTime: '02:00' };
      cronJobs.updatePastTimeCalendars(startDate, timeSlot);*/
    });
  })
  .catch(err => console.error('DB connection error', err));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
