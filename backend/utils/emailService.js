import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Sends an email with up to 2 attachments:
 * 1. A PDF buffer (summary)
 * 2. A raw file buffer (original uploaded report)
 */
const sendEmail = async (
  to,
  subject,
  text,
  pdfBuffer = null,
  pdfFilename = null,
  extraAttachment = null // { buffer, filename }
) => {
  const attachments = [];

  if (pdfBuffer && pdfFilename) {
    attachments.push({
      filename: pdfFilename,
      content: pdfBuffer,
      contentType: 'application/pdf'
    });
  }

  if (extraAttachment?.buffer && extraAttachment?.filename) {
    attachments.push({
      filename: extraAttachment.filename,
      content: extraAttachment.buffer,
      contentType: 'application/octet-stream' // general file
    });
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    ...(attachments.length > 0 && { attachments })
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
  }
};

export default sendEmail;
