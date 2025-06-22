export const getReportHTML = (user, report, chartData, chartImages = {}) => {
  const formatTable = (title, headers, rows, keys) => `
    <h3>${title}</h3>
    <table border="1" cellspacing="0" cellpadding="5" width="100%" style="border-collapse: collapse; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #f0f0f0;">
          ${headers.map(h => `<th style="padding: 8px; text-align: left;">${h}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rows.map(row => `
          <tr>
            ${keys.map(k => `<td style="padding: 8px;">${row[k]}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  const formatImage = (title, src) => src ? `<h3>${title} Chart</h3><img src="${src}" width="100%" style="margin-bottom: 20px;" />` : '';

  const bpData = chartData.bloodPressure || [];
  const glucoseData = chartData.glucoseLevels || [];
  const heartData = chartData.heartRate || [];
  const thyroidData = chartData.thyroidLevels || [];

  return `
    <html>
      <body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://res.cloudinary.com/djlbnsoho/image/upload/v1750514359/practo_s3k905.png" alt="Practo Logo" style="height: 60px; object-fit: contain;" />
          <h2 style="margin-top: 10px;">Medical Report: ${report.reportName}</h2>
        </div>

        <p><strong>User:</strong> ${user.name}</p>
        <p><strong>Date:</strong> ${new Date(report.uploadedAt).toLocaleString()}</p>
        <hr style="margin: 20px 0;" />

        ${bpData.length > 0 ? `
          ${formatImage("Blood Pressure", chartImages.bpImage)}
          ${formatTable("Blood Pressure", ["Date", "Systolic", "Diastolic"], bpData, ["date", "systolic", "diastolic"])}
        ` : ''}

        ${glucoseData.length > 0 ? `
          ${formatImage("Glucose", chartImages.glucoseImage)}
          ${formatTable("Glucose Levels", ["Date", "Value"], glucoseData, ["date", "value"])}
        ` : ''}

        ${heartData.length > 0 ? `
          ${formatImage("Heart Rate", chartImages.heartImage)}
          ${formatTable("Heart Rate", ["Date", "BPM"], heartData, ["date", "bpm"])}
        ` : ''}

        ${thyroidData.length > 0 ? `
          ${formatImage("Thyroid", chartImages.thyroidImage)}
          ${formatTable("Thyroid TSH", ["Date", "TSH (mIU/L)"], thyroidData, ["date", "tsh"])}
        ` : ''}

        <p style="margin-top: 30px;">Thanks,<br/><strong>Prescripta HealthCare</strong></p>
      </body>
    </html>
  `;
};
