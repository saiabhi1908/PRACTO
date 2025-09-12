import cron from 'node-cron';
import appointmentModel from '../models/appointmentModel.js';
import sendEmail from './emailService.js';

// ✅ Helper: Remove duplicate "Dr." prefix
const cleanDoctorName = (name) => {
  return name.replace(/^Dr\.?\s*/i, '').trim();
};

// ✅ Send reminder with Video/In-Clinic mode
const sendReminderEmail = async (email, name, docName, slotDate, slotTime, mode) => {
  const subject = '⏰ Appointment Reminder - 24 Hours Left';
  const message = `
Hi ${name},

This is a reminder for your ${mode.toLowerCase()} appointment with ${docName}.

🗓 Date: ${slotDate}
⏰ Time: ${slotTime}
🏥 Mode: ${mode}

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

    console.log('🔄 Running reminder scheduler at', new Date(now).toLocaleString());
    console.log(
      `📌 Looking for appointments between ${new Date(in24Hours - oneHour).toLocaleString()} and ${new Date(in24Hours + oneHour).toLocaleString()}`
    );

    try {
      const appointments = await appointmentModel.find({
        cancelled: false,
        $or: [
          { videoConsultation: true, payment: true }, // Only paid video appointments
          { videoConsultation: false } // In-clinic is always allowed
        ],
        date: {
          $gte: in24Hours - oneHour,
          $lte: in24Hours + oneHour,
        },
      });

      console.log(`🧠 Found ${appointments.length} appointment(s) needing reminders`);

      for (const appt of appointments) {
        const { userData, docData, slotDate, slotTime, videoConsultation } = appt;

        console.log(`📋 Appointment: ${appt._id} | Date: ${new Date(appt.date).toLocaleString()}`);
        console.log(`💳 Payment status: ${appt.payment ? 'Online Paid' : 'Pay in Clinic'}`);
        console.log(`📡 Mode: ${videoConsultation ? 'Video' : 'In-Clinic'}`);

        if (!userData?.email || !docData?.name) {
          console.log("❌ Missing user or doctor info for appointment:", appt._id);
          continue;
        }

        const mode = videoConsultation ? 'Video Consultation (Online)' : 'In-Clinic Appointment';
        const doctorName = `Dr. ${cleanDoctorName(docData.name)}`;

        await sendReminderEmail(
          userData.email,
          userData.name || 'Patient',
          doctorName,
          slotDate,
          slotTime,
          mode
        );
      }
    } catch (err) {
      console.error("❌ Scheduler error:", err.message);
    }
  });
};

export default startReminderScheduler;
