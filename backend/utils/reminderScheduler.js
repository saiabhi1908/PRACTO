import cron from 'node-cron';
import appointmentModel from '../models/appointmentModel.js';
import sendEmail from './emailService.js';

const sendReminderEmail = async (email, name, docName, slotDate, slotTime) => {
  const subject = '⏰ Appointment Reminder - 24 Hours Left';
  const message = `
Hi ${name},

This is a reminder for your appointment with Dr. ${docName}.

🗓 Date: ${slotDate}
⏰ Time: ${slotTime}

Regards,
Prescripta HealthCare
  `;
  try {
    await sendEmail(email, subject, message);
    console.log(`📧 Reminder sent to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${email}:`, error.message);
  }
};

const startReminderScheduler = () => {
  // 🕒 Runs every 10 minutes
  cron.schedule('*/10 * * * *', async () => {
    const now = Date.now();
    const in24Hours = now + 24 * 60 * 60 * 1000;
    const oneHour = 60 * 60 * 1000;

    console.log('🔄 Running real reminder scheduler at', new Date(now).toLocaleString());
    console.log(
      `📌 Searching appointments between ${new Date(in24Hours - oneHour).toLocaleString()} and ${new Date(in24Hours + oneHour).toLocaleString()}`
    );

    try {
      const appointments = await appointmentModel.find({
        cancelled: false,
        payment: true,
        date: {
          $gte: in24Hours - oneHour,
          $lte: in24Hours + oneHour,
        },
      });

      console.log(`🧠 Found ${appointments.length} appointment(s) needing reminders`);

      for (const appt of appointments) {
        const { userData, docData, slotDate, slotTime } = appt;

        console.log(`📋 Checking appointment: ${appt._id} | date: ${new Date(appt.date).toLocaleString()}`);

        if (!userData?.email || !docData?.name) {
          console.log("❌ Missing user or doctor info for appointment:", appt._id);
          continue;
        }

        await sendReminderEmail(
          userData.email,
          userData.name || 'Patient',
          docData.name || 'Doctor',
          slotDate,
          slotTime
        );
      }
    } catch (err) {
      console.error("❌ Scheduler error:", err.message);
    }
  });
};

export default startReminderScheduler;
