// BarReportForm.jsx
import React, { useState, useRef } from 'react';
import { Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import { supabase } from "../supabaseClient.js";
import jsPDF from 'jspdf';

const initialEvent = { event_type: '', sales: '', cost: '' };
const initialCategorySales = {
  Beer: '',
  Wine: '',
  Spirits: '',
  'Non-Alcoholic': ''
};

const RBC_LOGO_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAABtlBMVEX///+/NCwORoz5wDQAR5FcKynEMyrEwMAAQooAPYjGMyMA';

export default function BarReportForm() {
  const [completedBy, setCompletedBy] = useState('');
  const [stocktakeDate, setStocktakeDate] = useState('');
  const [stocktakeTotal, setStocktakeTotal] = useState('');
  const [events, setEvents] = useState([initialEvent]);
  const [categorySales, setCategorySales] = useState(initialCategorySales);
  const [notes, setNotes] = useState('');
  const chart1Ref = useRef(null);
  const chart2Ref = useRef(null);

  const handleEventChange = (index, field, value) => {
    const updated = [...events];
    updated[index][field] = value;
    setEvents(updated);
  };

  const addEvent = () => {
    const count = events.length + 1;
    const newEvent = { event_type: `Event ${count}`, sales: '', cost: '' };
    setEvents([...events, newEvent]);
  };

  const handleCategoryChange = (category, value) => {
    setCategorySales(prev => ({ ...prev, [category]: value }));
  };

  const totalCategorySales = Object.values(categorySales).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const totalSales = events.reduce((sum, e) => sum + parseFloat(e.sales || 0), 0);
  const totalCost = events.reduce((sum, e) => sum + parseFloat(e.cost || 0), 0);

  const pieEventData = {
    labels: events.map(e => e.event_type || 'Unnamed'),
    datasets: [
      {
        label: 'Sales',
        data: events.map(e => parseFloat(e.sales) || 0),
        backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF']
      },
      {
        label: 'Cost of Sales',
        data: events.map(e => parseFloat(e.cost) || 0),
        backgroundColor: ['#B0C4DE', '#F08080', '#FFFACD', '#B2DFDB', '#D1C4E9']
      }
    ]
  };

  const pieCategoryData = {
    labels: Object.keys(categorySales),
    datasets: [
      {
        label: 'Sales by Category',
        data: Object.values(categorySales).map(val => parseFloat(val) || 0),
        backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0']
      }
    ]
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const reportMonth = stocktakeDate?.slice(0, 7);

      const { data: report, error } = await supabase
        .from('bar_reports')
        .insert({
          completed_by: completedBy,
          stocktake_date: stocktakeDate,
          stocktake_total: parseFloat(stocktakeTotal),
          notes,
          report_month: reportMonth
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('bar_events').insert(events.map(e => ({
        report_id: report.id,
        event_type: e.event_type,
        sales: parseFloat(e.sales) || 0,
        cost_of_sales: parseFloat(e.cost) || 0
      })));

      await supabase.from('bar_categories').insert(
        Object.entries(categorySales).map(([name, val]) => ({
          report_id: report.id,
          category_name: name,
          sales: parseFloat(val) || 0
        }))
      );

      const doc = new jsPDF();
      doc.addImage(`data:image/png;base64,${RBC_LOGO_BASE64}`, 'PNG', 10, 10, 30, 30);
      doc.setTextColor('#003366');
      doc.setFontSize(18);
      doc.text('Bar Management Report', 50, 20);

      doc.setFontSize(12);
      doc.setTextColor('#000000');
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 50, 30);
      doc.setTextColor('#003366');
      doc.text(`Completed By: ${completedBy}`, 10, 50);
      doc.text(`Stocktake As At: ${stocktakeDate}`, 10, 58);
      doc.text(`Stocktake Total: $${stocktakeTotal}`, 10, 66);

      doc.setTextColor('#FDBB30');
      doc.text('Event Summary:', 10, 80);
      events.forEach((e, i) => {
        doc.text(`- ${e.event_type}: Sales $${e.sales}, Cost $${e.cost}`, 14, 88 + i * 7);
      });

      let currentY = 88 + events.length * 7 + 5;
      doc.setTextColor('#003366');
      doc.text(`Total Sales: $${totalSales.toFixed(2)}`, 14, currentY);
      doc.text(`Total Cost of Sales: $${totalCost.toFixed(2)}`, 80, currentY);

      currentY += 10;
      doc.setTextColor('#FDBB30');
      doc.text('Category Sales (%):', 10, currentY);
      Object.entries(categorySales).forEach(([cat, val], i) => {
        const percent = totalCategorySales ? ((parseFloat(val || 0) / totalCategorySales) * 100).toFixed(1) : '0';
        doc.setTextColor('#000000');
        doc.text(`- ${cat}: $${val} (${percent}%)`, 14, currentY + 8 + i * 6);
      });

      currentY += 8 + Object.keys(categorySales).length * 6 + 10;
      doc.setTextColor('#FDBB30');
      doc.text('Notes:', 10, currentY);
      doc.setTextColor('#000000');
      doc.text(notes || 'None', 14, currentY + 7);

      const pdfBlob = doc.output('blob');
      const fileName = `bar_report_${reportMonth}_${completedBy.replace(/\s+/g, '_')}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from('reports')
        .upload(`bar/${fileName}`, pdfBlob, {
          contentType: 'application/pdf'
        });

      if (uploadError) throw uploadError;

      const { data: fileUrlData } = supabase.storage.from('reports').getPublicUrl(`bar/${fileName}`);

      await supabase.from('downloads').insert({
        file_url: fileUrlData.publicUrl,
        report_type: 'bar_report',
        report_month: reportMonth,
        uploaded_by: completedBy
      });

      alert('Report submitted and saved to Downloads page!');
    } catch (err) {
      console.error('Error submitting report:', err);
      alert('Failed to submit report.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-6">
      <h2 className="text-xl font-bold">Bar Management Report</h2>
      <input type="text" placeholder="Completed by" value={completedBy} onChange={e => setCompletedBy(e.target.value)} className="border p-2 w-full" />
      <input type="date" value={stocktakeDate} onChange={e => setStocktakeDate(e.target.value)} className="border p-2 w-full" />
      <input type="number" placeholder="Stocktake Total ($)" value={stocktakeTotal} onChange={e => setStocktakeTotal(e.target.value)} className="border p-2 w-full" />

      <h3 className="font-bold">Event Entries</h3>
      {events.map((event, index) => (
        <div key={index} className="border p-2 my-2">
          <input type="text" value={event.event_type} onChange={e => handleEventChange(index, 'event_type', e.target.value)} className="border p-1 w-full mb-2" />
          <input type="number" value={event.sales} placeholder="Sales ($)" onChange={e => handleEventChange(index, 'sales', e.target.value)} className="border p-1 w-full mb-2" />
          <input type="number" value={event.cost} placeholder="Cost of Sales ($)" onChange={e => handleEventChange(index, 'cost', e.target.value)} className="border p-1 w-full" />
        </div>
      ))}
      <button type="button" onClick={addEvent} className="bg-blue-500 text-white px-4 py-2">Add Event</button>

      <h3 className="font-bold">Sales by Category ($)</h3>
      {Object.entries(categorySales).map(([cat, val]) => (
        <div key={cat} className="my-2">
          <label>{cat}</label>
          <input type="number" value={val} onChange={e => handleCategoryChange(cat, e.target.value)} className="border p-1 w-full" />
        </div>
      ))}

      <h3 className="font-bold">Monthly Notes</h3>
      <textarea value={notes} onChange={e => setNotes(e.target.value)} className="border p-2 w-full h-32" />

      <div style={{ maxWidth: '500px', margin: '2rem auto' }}>
        <h3 className="font-bold mb-2">Pie Chart: Event Sales vs Cost of Sales</h3>
        <Pie ref={chart1Ref} data={pieEventData} />
      </div>

      <div style={{ maxWidth: '500px', margin: '2rem auto' }}>
        <h3 className="font-bold mb-2">Pie Chart: Sales Breakdown by Category</h3>
        <Pie ref={chart2Ref} data={pieCategoryData} />
      </div>

      <button type="submit" className="bg-green-600 text-white px-6 py-2 mt-6">Submit Report</button>
    </form>
  );
}
