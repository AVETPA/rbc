// Downloads.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient.js';

const Downloads = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reports:', error);
    } else {
      setReports(data);
    }
    setLoading(false);
  };

  const groupByMonthYear = (reports) => {
    return reports.reduce((acc, report) => {
      const key = report.month_year;
      if (!acc[key]) acc[key] = [];
      acc[key].push(report);
      return acc;
    }, {});
  };

  const groupedReports = groupByMonthYear(reports);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Downloads</h1>
      {loading ? (
        <p>Loading reports...</p>
      ) : (
        Object.keys(groupedReports).map((monthYear) => (
          <div key={monthYear} className="mb-6">
            <h2 className="text-xl font-semibold mb-2">{monthYear}</h2>
            <table className="min-w-full bg-white shadow rounded">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 text-left">Report Type</th>
                  <th className="py-2 px-4 text-left">Created</th>
                  <th className="py-2 px-4 text-left">Download</th>
                </tr>
              </thead>
              <tbody>
                {groupedReports[monthYear].map((report) => (
                  <tr key={report.id} className="border-b">
                    <td className="py-2 px-4">{report.report_type}</td>
                    <td className="py-2 px-4">{new Date(report.created_at).toLocaleString()}</td>
                    <td className="py-2 px-4">
                      <a
                        href={report.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Download PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
};

export default Downloads;
