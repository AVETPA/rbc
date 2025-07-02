// generateStocktakeReport.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { uploadReportToSupabase } from './uploadReportToSupabase.js';

/**
 * Generates a Stocktake Report PDF
 * @param {Object} data - Stocktake summary data
 * @param {string} preparedBy - Preparer's name
 * @param {string} monthYear - e.g. 'June 2025'
 * @returns {Promise<string>} - Public URL of uploaded PDF
 */
export async function generateStocktakeReport(data, preparedBy, monthYear) {
  const { stockEntries = [], notes = [] } = data;

  const totalValue = stockEntries.reduce((sum, p) => sum + p.value, 0);

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('Redlands Boat Club - Stocktake Report', 105, 15, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`Month: ${monthYear}`, 105, 23, { align: 'center' });
  doc.text(`Prepared by: ${preparedBy}`, 105, 30, { align: 'center' });

  doc.setFontSize(14);
  doc.text('Stock on Hand', 14, 45);

  autoTable(doc, {
    startY: 50,
    head: [['Product', 'Coolroom Cartons', 'Coolroom Singles', 'Bar Fridge', 'Total Units', 'Value']],
    body: stockEntries.map(item => [
      item.name,
      item.coolroom_cartons,
      item.coolroom_singles,
      item.bar_fridge,
      item.total_quantity,
      `$${item.value.toFixed(2)}`
    ])
  });

  doc.setFontSize(12);
  doc.text(`Total Stock Value: $${totalValue.toFixed(2)}`, 14, doc.lastAutoTable.finalY + 10);

  if (notes.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Notes / Discrepancies', 14, 20);
    doc.setFontSize(12);
    notes.forEach((note, i) => {
      doc.text(`- ${note}`, 14, 30 + i * 8);
    });
  }

  const fileName = `Stocktake_Report_${monthYear.replace(/\s+/g, '_')}.pdf`;
  const blob = doc.output('blob');
  const file = new Blob([blob], { type: 'application/pdf' });

  const publicUrl = await uploadReportToSupabase(file, monthYear, 'Stocktake Report');
  return publicUrl;
}
