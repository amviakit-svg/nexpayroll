import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { APP_NAME } from './brand';

type LineItem = { name: string; type: string; amount: number; isVariableAdjustment: boolean };

type PayslipData = {
  // Company
  companyName?: string;
  companyAddress?: string;
  companyPan?: string;
  companyLogoUrl?: string;
  watermarkEnabled?: boolean;
  watermarkText?: string;

  // Employee
  employeeName: string;
  employeeEmail: string;
  employeeCode?: string;
  department?: string;
  designation?: string;
  dateOfJoining?: string;

  // Financial IDs
  employeePan?: string;
  pfNumber?: string;
  esiNumber?: string;
  bankName?: string;
  accountNumber?: string;

  // Time
  month: number;
  year: number;
  leaves: number;
  workingDays: number;

  // Figures
  fixedEarnings: number;
  variableEarnings: number;
  fixedDeductions: number;
  variableDeductions: number;
  grossEarnings: number;
  totalDeductions: number;
  netMonthlySalary: number;
  finalPayable: number;

  // Tax Projection (Optional)
  annualGross?: number;
  standardDeduction?: number;
  total80C?: number;
  total80D?: number;
  taxableIncome?: number;
  taxPayable?: number;

  items: LineItem[];
};

export async function generatePayslipPdf(filePath: string, data: PayslipData) {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });

  return new Promise<void>((resolve, reject) => {
    const possibleFontPaths = [
      path.join(process.cwd(), 'public/fonts/Roboto-Regular.ttf'),
      path.resolve(process.cwd(), 'public', 'fonts', 'Roboto-Regular.ttf')
    ];

    let fontBuffer: Buffer | null = null;
    let boldBuffer: Buffer | null = null;

    for (const fontPath of possibleFontPaths) {
      if (fs.existsSync(fontPath)) {
        try { fontBuffer = fs.readFileSync(fontPath); break; } catch (e) { }
      }
    }

    // Try to load bold
    const boldPaths = possibleFontPaths.map(p => p.replace('Roboto-Regular', 'Roboto-Bold'));
    for (const boldPath of boldPaths) {
      if (fs.existsSync(boldPath)) {
        try { boldBuffer = fs.readFileSync(boldPath); break; } catch (e) { }
      }
    }

    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      font: fontBuffer as any,
      bufferPages: true
    });

    if (fontBuffer) doc.registerFont('Roboto', fontBuffer);
    if (boldBuffer) doc.registerFont('Roboto-Bold', boldBuffer);
    else if (fontBuffer) doc.registerFont('Roboto-Bold', fontBuffer);

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const margin = 40;
    const pageWidth = 595.28 - (2 * margin);
    const colWidth = pageWidth / 2;
    let currentY = 40;

    const COLORS = {
      PRIMARY: '#0f172a', // Slate 900
      SECONDARY: '#475569', // Slate 600
      ACCENT: '#334155', // Slate 700
      TEXT: '#1e293b', // Slate 800
      MUTED: '#64748b', // Slate 500
      BORDER: '#cbd5e1', // Slate 300 (slighly darker for clarity)
      BORDER_LIGHT: '#e2e8f0', // Slate 200
      FILL: '#f8fafc', // Slate 50
      HEADER_BG: '#f1f5f9', // Slate 100
    };

    // --- Helper: Indian Rupees in Words ---
    const toIndianWords = (num: number) => {
      const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
      const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

      const convert = (n: number): string => {
        if (n < 20) return ones[n];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
        if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convert(n % 100) : '');
        if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
        if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '');
        return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '');
      };

      const parts = num.toFixed(2).split('.');
      const rupees = parseInt(parts[0]);
      const paise = parseInt(parts[1]);

      let result = convert(rupees) + ' Rupees';
      if (paise > 0) result += ' and ' + convert(paise) + ' Paise';
      return result + ' Only';
    };

    const drawSectionTitle = (title: string, y: number) => {
      doc.rect(margin, y, pageWidth, 26).fill(COLORS.HEADER_BG);
      doc.fillColor(COLORS.PRIMARY).fontSize(9).font('Roboto-Bold').text(title.toUpperCase(), margin + 12, y + 9, { characterSpacing: 1 });
      return y + 36;
    };

    const run = async () => {
      let currentY = margin;

      // --- Watermark ---
      if (data.watermarkEnabled) {
        doc.save();
        doc.fillColor('#000000');
        doc.fillOpacity(0.05); // Very subtle
        doc.fontSize(80).font('Roboto-Bold');
        doc.rotate(-45, { origin: [pageWidth / 2 + margin, 420] });
        doc.text(data.watermarkText || 'NexPayroll', margin, 400, { align: 'center', width: pageWidth });
        doc.restore();
      }

      // --- Header Area ---
      let headerY = 40;

      // 1. Logo (Top Center) - DISABLED AS PER USER REQUEST
      /*
      if (data.companyLogoUrl) {
        try {
          let logoBuffer: Buffer;
          if (data.companyLogoUrl.startsWith('/')) {
            const logoPath = path.join(process.cwd(), 'public', data.companyLogoUrl);
            logoBuffer = fs.readFileSync(logoPath);
          } else {
            const response = await fetch(data.companyLogoUrl);
            const arrayBuffer = await response.arrayBuffer();
            logoBuffer = Buffer.from(arrayBuffer);
          }
          // Center the logo
          const logoHeight = 50;
          const logoWidth = 150; // Approximated
          doc.image(logoBuffer, (pageWidth / 2) + margin - (logoWidth / 4), headerY, { height: logoHeight });
          headerY += logoHeight + 10;
        } catch (e) {
          console.error('[PDF] Logo load failed:', e);
        }
      }
      */

      // 2. Centered "PAYSLIP" Title (Below Logo)
      doc.fillColor(COLORS.PRIMARY).fontSize(22).font('Roboto-Bold').text('PAYSLIP', margin, headerY, { align: 'center', width: pageWidth });

      // Period
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      doc.fontSize(11).font('Roboto').text(`${months[data.month - 1]} ${data.year}`, margin, headerY + 28, { align: 'center', width: pageWidth });

      // 3. Company Details (Left Aligned, below Title)
      let companyY = headerY + 55;
      if (data.companyName) {
        doc.fontSize(14).font('Roboto-Bold').text(data.companyName.toUpperCase(), margin, companyY);
        companyY += 18;
      }
      if (data.companyAddress) {
        doc.fontSize(9).font('Roboto').fillColor(COLORS.SECONDARY).text(data.companyAddress, margin, companyY, { width: 350, lineGap: 2 });
        // Calculate dynamic height for address to prevent overlapping
        const addressHeight = doc.heightOfString(data.companyAddress, { width: 350, lineGap: 2 });
        companyY += addressHeight + 10;
      }

      currentY = Math.max(companyY, headerY + 110); // Ensure minimum height for top section

      doc.moveTo(margin, currentY).lineTo(margin + pageWidth, currentY).strokeColor(COLORS.BORDER_LIGHT).lineWidth(0.5).stroke();
      currentY += 20;

      // --- Personal Information ---
      currentY = drawSectionTitle('Personal Information', currentY);

      const personalInfo = [
        [
          { label: 'Employee Name', value: data.employeeName },
          { label: 'Designation', value: data.designation || '-' },
        ],
        [
          { label: 'Employee Code', value: data.employeeCode || '-' },
          { label: 'Department', value: data.department || '-' },
        ],
        [
          { label: 'Date of Joining', value: data.dateOfJoining || '-' },
          { label: 'PAN Number', value: data.employeePan || '-' },
        ],
        [
          { label: 'Bank Name', value: data.bankName || '-' },
          { label: 'Account Number', value: data.accountNumber || '-' },
        ],
        [
          { label: 'PF Number', value: data.pfNumber || '-' },
          { label: 'Worked Days', value: String(data.workingDays) },
        ]
      ];

      personalInfo.forEach(row => {
        const y = currentY;
        doc.fillColor(COLORS.MUTED).fontSize(8).font('Roboto').text(row[0].label, margin + 10, y);
        doc.fillColor(COLORS.TEXT).fontSize(9).font('Roboto-Bold').text(row[0].value, margin + 110, y);

        doc.fillColor(COLORS.MUTED).fontSize(8).font('Roboto').text(row[1].label, margin + (pageWidth / 2) + 10, y);
        doc.fillColor(COLORS.TEXT).fontSize(9).font('Roboto-Bold').text(row[1].value, margin + (pageWidth / 2) + 110, y);
        currentY += 22;
      });

      currentY += 15;

      // --- Salary Details ---
      currentY = drawSectionTitle('Salary Details', currentY);

      // Table Header
      doc.rect(margin, currentY, pageWidth / 2, 22).fill(COLORS.HEADER_BG);
      doc.rect(margin + (pageWidth / 2), currentY, pageWidth / 2, 22).fill(COLORS.HEADER_BG);

      doc.fillColor(COLORS.PRIMARY).fontSize(8).font('Roboto-Bold').text('EARNINGS', margin + 12, currentY + 7, { characterSpacing: 0.5 });
      doc.text('AMOUNT (INR)', margin + (pageWidth / 2) - 85, currentY + 7, { width: 75, align: 'right' });

      doc.text('DEDUCTIONS', margin + (pageWidth / 2) + 12, currentY + 7, { characterSpacing: 0.5 });
      doc.text('AMOUNT (INR)', margin + pageWidth - 85, currentY + 7, { width: 75, align: 'right' });

      currentY += 22;

      const earnings = data.items.filter(i => i.type === 'EARNING');
      const deductions = data.items.filter(i => i.type === 'DEDUCTION');
      const maxRows = Math.max(earnings.length, deductions.length);

      for (let i = 0; i < maxRows; i++) {
        const y = currentY + (i * 20);

        // Earning
        if (earnings[i]) {
          doc.fillColor(COLORS.TEXT).fontSize(9).font('Roboto').text(earnings[i].name, margin + 10, y + 5);
          doc.font('Roboto-Bold').text(Number(earnings[i].amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }), margin + (pageWidth / 2) - 80, y + 5, { width: 70, align: 'right' });
        }

        // Deduction
        if (deductions[i]) {
          doc.fillColor(COLORS.TEXT).fontSize(9).font('Roboto').text(deductions[i].name, margin + (pageWidth / 2) + 10, y + 5);
          doc.font('Roboto-Bold').text(Number(deductions[i].amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }), margin + pageWidth - 80, y + 5, { width: 70, align: 'right' });
        }

        // Horizontal line
        doc.moveTo(margin, y + 20).lineTo(margin + pageWidth, y + 20).strokeColor(COLORS.BORDER).lineWidth(0.5).stroke();
      }

      currentY += (maxRows * 20);

      // Totals Row
      doc.rect(margin, currentY, pageWidth, 26).fill(COLORS.FILL);
      doc.fillColor(COLORS.PRIMARY).font('Roboto-Bold').fontSize(9).text('TOTAL EARNINGS', margin + 12, currentY + 9);
      doc.text(data.grossEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 }), margin + (pageWidth / 2) - 85, currentY + 9, { width: 75, align: 'right' });

      doc.text('TOTAL DEDUCTIONS', margin + (pageWidth / 2) + 12, currentY + 9);
      doc.text(data.totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2 }), margin + pageWidth - 85, currentY + 9, { width: 75, align: 'right' });
      currentY += 40; // More space before Net Pay

      // --- Net Pay ---
      currentY += 15;
      doc.rect(margin, currentY, pageWidth, 75).fill(COLORS.PRIMARY);
      doc.fillColor('#FFFFFF').fontSize(11).font('Roboto-Bold').text('NET PAYABLE', margin + 18, currentY + 16, { characterSpacing: 1 });
      doc.fontSize(18).text(`INR ${data.finalPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, margin, currentY + 16, { align: 'right', width: pageWidth - 18 });

      // Amount in words (Basic implementation)
      const amountInWords = (amount: number) => {
        return toIndianWords(amount);
      };

      // Wrap text for amount in words with increased vertical offset to avoid overlap
      doc.fontSize(8).font('Roboto').text(
        `IN WORDS: ${amountInWords(data.finalPayable).toUpperCase()}`,
        margin + 18,
        currentY + 44,
        {
          width: pageWidth - 36,
          align: 'left',
          characterSpacing: 0.5,
          lineGap: 3
        }
      );

      currentY += 100;

      // --- Tax Calculation (Structured Table) ---
      // Uses Dynamic Projection if available, otherwise falls back to static fields
      const taxRows = data.taxProjection || (data.annualGross ? [
        { label: 'Annual Gross Income', value: data.annualGross },
        { label: 'Standard Deduction', value: data.standardDeduction || 0 },
        { label: 'Exemptions (80C, 80D, etc.)', value: (data.total80C || 0) + (data.total80D || 0) },
        { label: 'Net Taxable Income', value: data.taxableIncome || 0 }, // Using a simple boolean check for bold is brittle here, so we default to plain
      ] : []);

      if (taxRows.length > 0) {
        // STRICTLY Force page break for Tax Projection as per user request
        doc.addPage();
        currentY = margin + 10;

        currentY = drawSectionTitle('Annual Tax Projection (Estimated)', currentY);

        // Table Header
        doc.rect(margin, currentY, pageWidth, 22).fill(COLORS.HEADER_BG);
        doc.fillColor(COLORS.PRIMARY).fontSize(8).font('Roboto-Bold').text('PROJECTION COMPONENT', margin + 12, currentY + 7, { characterSpacing: 0.5 });
        doc.text('ANNUAL AMOUNT (INR)', margin + pageWidth - 140, currentY + 7, { width: 130, align: 'right' });
        currentY += 22;

        taxRows.forEach((row, idx) => {
          doc.moveTo(margin, currentY).lineTo(margin + pageWidth, currentY).strokeColor(COLORS.BORDER).lineWidth(0.5).stroke();

          // Simple heuristic: Bold if it looks like a "Net" or "Total" line
          const isBold = row.label.toLowerCase().includes('net') || row.label.toLowerCase().includes('taxable');

          doc.fillColor(isBold ? COLORS.PRIMARY : COLORS.TEXT)
            .fontSize(9).font(isBold ? 'Roboto-Bold' : 'Roboto')
            .text(row.label, margin + 10, currentY + 8);

          doc.text(Number(row.value).toLocaleString('en-IN', { minimumFractionDigits: 2 }), margin + pageWidth - 100, currentY + 8, { width: 90, align: 'right' });

          currentY += 24;
        });

        // Bottom border
        doc.moveTo(margin, currentY).lineTo(margin + pageWidth, currentY).strokeColor(COLORS.BORDER).lineWidth(0.5).stroke();
      }

      // --- Footer ---
      const footerY = 780;
      doc.moveTo(margin, footerY).lineTo(margin + pageWidth, footerY).strokeColor(COLORS.BORDER).lineWidth(0.5).stroke();
      doc.fillColor(COLORS.MUTED).fontSize(7).font('Roboto').text('This is a computer-generated document and does not require a physical signature.', margin, footerY + 10, { align: 'center' });

      doc.end();
    };

    run()
      .then(() => {
        stream.on('finish', () => resolve());
      })
      .catch((err) => {
        console.error('[PDF] Generation error:', err);
        reject(err);
      });

    stream.on('error', (err) => reject(err));
  });
}
