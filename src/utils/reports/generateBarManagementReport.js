// generateBarManagementReport.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { uploadReportToSupabase } from './uploadReport';

/**
 * Generates a Bar Management Report PDF
 * @param {Object} data - Includes sales, cogs, stock, and notes
 * @param {string} preparedBy - Name of the preparer
 * @returns {Promise<string>} - Public URL of uploaded PDF
 */
export async function generateBarManagementReport(data, preparedBy) {
  const {
    monthYear,
    events = [],
    totalSales = 0,
    cogs = 0,
    stockOnHand = 0,
    salesByEvent = [],
    categoryBreakdown = [],
    notes = []
  } = data;

  const grossProfit = totalSales - cogs;
  const totalExGST = totalSales / 1.1;
  const gst = totalSales - totalExGST;

  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text('Redlands Boat Club - Bar Management Report', 105, 15, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`Month: ${monthYear}`, 105, 23, { align: 'center' });
  doc.text(`Prepared by: ${preparedBy}`, 105, 30, { align: 'center' });

  doc.setFontSize(14);
  doc.text('Summary', 14, 45);
  autoTable(doc, {
    startY: 50,
    head: [['Item', 'Value']],
    body: [
      ['Total Sales (Incl. GST)', `$${totalSales.toFixed(2)}`],
      ['Total Sales (Ex GST)', `$${totalExGST.toFixed(2)}`],
      ['GST Collected', `$${gst.toFixed(2)}`],
      ['Stock on Hand', `$${stockOnHand.toFixed(2)}`],
      ['Events Held', events.length],
      ['Total COGS', `$${cogs.toFixed(2)}`],
      ['Gross Profit', `$${grossProfit.toFixed(2)}`]
    ]
  });

  doc.addPage();
  doc.setFontSize(14);
  doc.text('Sales by Event', 14, 20);
  autoTable(doc, {
    startY: 25,
    head: [['Event', 'Sales']],
    body: salesByEvent.map(e => [e.name, `$${e.amount.toFixed(2)}`])
  });

  doc.setFontSize(14);
  doc.text('Top Product Categories', 14, doc.lastAutoTable.finalY + 10);
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 15,
    head: [['Category', 'Percentage']],
    body: categoryBreakdown.map(c => [c.name, `${c.percentage.toFixed(1)}%`])
  });

  if (notes.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Recommendations / Notes', 14, 20);
    doc.setFontSize(12);
    notes.forEach((note, i) => {
      doc.text(`- ${note}`, 14, 30 + i * 8);
    });
  }

  const fileName = `Bar_Management_Report_${monthYear.replace(/\s+/g, '_')}.pdf`;
  const blob = doc.output('blob');
  const file = new File([blob], fileName, { type: 'application/pdf' });

  const publicUrl = await uploadReportToSupabase(file, monthYear, 'Bar Management Report');
  return publicUrl;
}
