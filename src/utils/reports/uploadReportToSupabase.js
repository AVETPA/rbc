// uploadReportToSupabase.js
import { supabase } from '../../supabaseClient.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Uploads a PDF report to Supabase Storage and saves metadata to 'reports' table
 * @param {File|Blob} file - The PDF file to upload (must be a Blob or File)
 * @param {string} monthYear - e.g. 'June 2025'
 * @param {string} reportType - e.g. 'Stocktake Report', 'Profit & Loss Statement', 'Bar Management Report'
 * @returns {Promise<string>} - Public URL to access the uploaded file
 */
export async function uploadReportToSupabase(file, monthYear, reportType) {
  if (!file || !(file instanceof Blob)) {
    throw new Error('Invalid file: expected a File or Blob object.');
  }

  // Use a default name if not provided (for Blob objects)
  const originalName = file.name || `${reportType.toLowerCase().replace(/\s+/g, '-')}.pdf`;
  const fileExt = originalName.split('.').pop() || 'pdf';
  const fileName = `${uuidv4()}.${fileExt}`;
  const filePath = `${monthYear.replace(/\s+/g, '_')}/${fileName}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('reports')
    .upload(filePath, file, { contentType: 'application/pdf' });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    throw uploadError;
  }

  // Get public URL
  const { data, error: urlError } = supabase.storage.from('reports').getPublicUrl(filePath);
  if (urlError || !data?.publicUrl) {
    console.error('URL generation error:', urlError);
    throw new Error('Failed to generate public URL for uploaded file.');
  }

  const publicUrl = data.publicUrl;

  // Insert metadata into 'reports' table
  const { error: dbError } = await supabase.from('reports').insert([
    {
      report_type: reportType,
      month_year: monthYear,
      file_url: publicUrl,
      created_at: new Date().toISOString()
    }
  ]);

  if (dbError) {
    console.error('DB insert error:', dbError);
    throw dbError;
  }

  return publicUrl;
}
