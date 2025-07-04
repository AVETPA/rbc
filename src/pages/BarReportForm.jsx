// BarReportForm.jsx
import React, { useState } from 'react';
import { Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import { supabase } from '../utils/supabase';
import jsPDF from 'jspdf';

const initialEvent = { event_type: '', sales: '', cost: '' };
const initialCategorySales = {
  Beer: '',
  Wine: '',
  Spirits: '',
  'Non-Alcoholic': ''
};

export default function BarReportForm() {
  const [completedBy, setCompletedBy] = useState('');
  const [stocktakeDate, setStocktakeDate] = useState('');
  const [stocktakeTotal, setStocktakeTotal] = useState('');
  const [events, setEvents] = useState([initialEvent]);
  const [categorySales, setCategorySales] = useState(initialCategorySales);
  const [notes, setNotes] = useState('');

  const handleEventChange = (index, field, value) => {
    const updated = [...events];
    updated[index][field] = value;
    setEvents(updated);
  };

  const addEvent = () => setEvents([...events, initialEvent]);

  const handleCategoryChange = (category, value) => {
    setCategorySales(prev => ({ ...prev, [category]: value }));
  };

  const totalCategorySales = Object.values(categorySales).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

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

      const eventInserts = events.map(e => ({
        report_id: report.id,
        event_type: e.event_type,
        sales: parseFloat(e.sales) || 0,
        cost_of_sales: parseFloat(e.cost) || 0
      }));

      await supabase.from('bar_events').insert(eventInserts);

      const categoryInserts = Object.entries(categorySales).map(([name, val]) => ({
        report_id: report.id,
        category_name: name,
        sales: parseFloat(val) || 0
      }));

      await supabase.from('bar_categories').insert(categoryInserts);

      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('Bar Management Report', 10, 15);
      doc.setFontSize(12);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 10, 25);
      doc.text(`Completed By: ${completedBy}`, 10, 32);
      doc.text(`Stocktake As At: ${stocktakeDate}`, 10, 39);
      doc.text(`Stocktake Total: $${stocktakeTotal}`, 10, 46);

      doc.text('Events:', 10, 56);
      events.forEach((e, i) => {
        doc.text(`- ${e.event_type}: Sales $${e.sales}, Cost $${e.cost}`, 14, 63 + i * 7);
      });

      const notesStart = 70 + events.length * 7;
      doc.text('Notes:', 10, notesStart);
      doc.text(notes || 'None', 14, notesStart + 7);

      const pdfBlob = doc.output('blob');
      const fileName = `bar_report_${reportMonth}_${completedBy.replace(/\s+/g, '_')}.pdf`;

      const { data: storageUpload, error: uploadError } = await supabase.storage
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

      alert('Report submitted and PDF saved successfully!');
    } catch (err) {
      console.error('Error submitting report:', err);
      alert('Failed to submit report. Check console for details.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Bar Management Report</h2>
        <p>Date: {new Date().toLocaleDateString()}</p>
        <input type="text" placeholder="Completed by" value={completedBy} onChange={e => setCompletedBy(e.target.value)} className="border p-2 w-full" />
      </div>

      <div className="space-y-2">
        <label>Stocktake As At:</label>
        <input type="date" value={stocktakeDate} onChange={e => setStocktakeDate(e.target.value)} className="border p-2 w-full" />
        <label>Stocktake Total ($):</label>
        <input type="number" value={stocktakeTotal} onChange={e => setStocktakeTotal(e.target.value)} className="border p-2 w-full" />
      </div>

      <div>
        <h3 className="font-bold">Event Entries</h3>
        {events.map((event, index) => (
          <div key={index} className="border p-2 my-2">
            <input type="text" placeholder="Event Type" value={event.event_type} onChange={e => handleEventChange(index, 'event_type', e.target.value)} className="border p-1 w-full mb-2" />
            <input type="number" placeholder="Sales ($)" value={event.sales} onChange={e => handleEventChange(index, 'sales', e.target.value)} className="border p-1 w-full mb-2" />
            <input type="number" placeholder="Cost of Sales ($)" value={event.cost} onChange={e => handleEventChange(index, 'cost', e.target.value)} className="border p-1 w-full" />
          </div>
        ))}
        <button type="button" onClick={addEvent} className="bg-blue-500 text-white px-4 py-2 mt-2">Add Event</button>
      </div>

      <div>
        <h3 className="font-bold">Sales by Category ($)</h3>
        {Object.entries(categorySales).map(([category, value]) => (
          <div key={category} className="my-2">
            <label>{category}</label>
            <input type="number" value={value} onChange={e => handleCategoryChange(category, e.target.value)} className="border p-1 w-full" />
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <h3 className="font-bold">Monthly Notes</h3>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} className="border p-2 w-full h-32" />
      </div>

      <div>
        <h3 className="font-bold mb-2">Pie Chart: Event Sales vs Cost of Sales</h3>
        <Pie data={pieEventData} />
      </div>

      <div>
        <h3 className="font-bold mb-2">Pie Chart: Sales Breakdown by Category</h3>
        <Pie data={pieCategoryData} />
      </div>

      <button type="submit" className="bg-green-600 text-white px-6 py-2 mt-6">Submit Report</button>
    </form>
  );
}
