import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts';

const MedicalReports = () => {
  const { backendUrl, token } = useContext(AppContext);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/reports/user`, {
          headers: { token },
        });
        setReports(res.data.reports);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Could not fetch reports');
      }
    };
    if (token) fetchReports();
  }, [token]);

  const downloadPDF = async (id, reportName) => {
    const input = document.getElementById(`report-container-${id}`);
    if (!input) return;

    const canvas = await html2canvas(input, { scale: 1 });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${reportName || 'medical-report'}.pdf`);
  };

  const renderTable = (headers, rows, keys) => (
    <table className="w-full mt-2 text-sm border">
      <thead>
        <tr className="bg-gray-100">
          {headers.map((header, idx) => (
            <th key={idx} className="border px-2 py-1 text-left">{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr key={idx}>
            {keys.map((key, i) => (
              <td key={i} className="border px-2 py-1">{row[key]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="m-5 p-5 bg-white rounded shadow max-w-4xl">
      <h2 className="text-xl font-semibold mb-4">My Medical Reports</h2>
      {reports.length === 0 ? (
        <p>No reports available.</p>
      ) : (
        <ul className="space-y-6">
          {reports.map((report, idx) => (
            <li key={idx} className="border p-4 rounded bg-white">
              <div id={`report-container-${idx}`} style={{ padding: '10px', backgroundColor: 'white' }}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{report.reportName}</span>
                  <a
                    href={report.fileUrl}
                    download
                    className="text-blue-600 hover:underline"
                  >
                    Download File
                  </a>
                </div>

                {/* 🩸 Blood Pressure */}
                {report.chartData?.bloodPressure?.length > 0 && (
                  <>
                    <h4 className="mt-4 font-semibold">Blood Pressure Chart</h4>
                    <div id="bp-chart">
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={report.chartData.bloodPressure}>
                          <CartesianGrid stroke="#ccc" />
                          <XAxis dataKey="date" interval={0} />
                          <YAxis />
                          <Tooltip isAnimationActive={false} />
                          <Legend />
                          <Line type="monotone" dataKey="systolic" stroke="#8884d8" />
                          <Line type="monotone" dataKey="diastolic" stroke="#82ca9d" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    {renderTable(["Date", "Systolic", "Diastolic"], report.chartData.bloodPressure, ["date", "systolic", "diastolic"])}
                  </>
                )}

                {/* 🍬 Glucose Levels */}
                {report.chartData?.glucoseLevels?.length > 0 && (
                  <>
                    <h4 className="mt-4 font-semibold">Glucose Levels</h4>
                    <div id="glucose-chart">
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={report.chartData.glucoseLevels}>
                          <CartesianGrid stroke="#ccc" />
                          <XAxis dataKey="date" interval={0} />
                          <YAxis />
                          <Tooltip isAnimationActive={false} />
                          <Legend />
                          <Line type="monotone" dataKey="value" stroke="#ff7300" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    {renderTable(["Date", "Glucose (mg/dL)"], report.chartData.glucoseLevels, ["date", "value"])}
                  </>
                )}

                {/* ❤️ Heart Rate */}
                {report.chartData?.heartRate?.length > 0 && (
                  <>
                    <h4 className="mt-4 font-semibold">Heart Rate</h4>
                    <div id="heart-chart">
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={report.chartData.heartRate}>
                          <CartesianGrid stroke="#ccc" />
                          <XAxis dataKey="date" interval={0} />
                          <YAxis />
                          <Tooltip isAnimationActive={false} />
                          <Legend />
                          <Line type="monotone" dataKey="bpm" stroke="#dc2626" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    {renderTable(["Date", "BPM"], report.chartData.heartRate, ["date", "bpm"])}
                  </>
                )}

                {/* 🧠 Thyroid TSH */}
                {report.chartData?.thyroidLevels?.length > 0 && (
                  <>
                    <h4 className="mt-4 font-semibold">Thyroid TSH Levels</h4>
                    <div id="thyroid-chart">
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={report.chartData.thyroidLevels}>
                          <CartesianGrid stroke="#ccc" />
                          <XAxis dataKey="date" interval={0} />
                          <YAxis />
                          <Tooltip isAnimationActive={false} />
                          <Legend />
                          <Line type="monotone" dataKey="tsh" stroke="#8e44ad" dot />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    {renderTable(["Date", "TSH (mIU/L)"], report.chartData.thyroidLevels, ["date", "tsh"])}
                  </>
                )}
              </div>

              {/* 📄 PDF Download Button */}
              <div className="mt-3">
                <button
                  onClick={() => downloadPDF(idx, report.reportName)}
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                >
                  📄 Download PDF
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MedicalReports;
