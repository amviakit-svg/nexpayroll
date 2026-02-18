const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

try {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const stream = fs.createWriteStream('test-payslip.pdf');

  // Try to load custom font
  const fontPath = path.join(process.cwd(), 'public/fonts/Roboto-Regular.ttf');
  console.log('Checking font at:', fontPath);
  
  if (fs.existsSync(fontPath)) {
    console.log('Font found, using custom font.');
    doc.font(fontPath);
  } else {
    console.error('Custom font NOT found, falling back to default (will likely crash in bundle).');
  }

  doc.pipe(stream);
  doc.fontSize(18).text('Test Payslip', { align: 'center' });
  doc.end();
  
  stream.on('finish', () => console.log('PDF generated successfully.'));
  stream.on('error', (err) => console.error('Stream error:', err));
} catch (err) {
  console.error('Caught error during PDF generation:', err);
}
