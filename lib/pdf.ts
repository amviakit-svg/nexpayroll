import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { APP_NAME } from './brand';

type LineItem = { name: string; type: string; amount: number; isVariableAdjustment: boolean };

type PayslipData = {
  employeeName: string;
  employeeEmail: string;
  month: number;
  year: number;
  leaves: number;
  workingDays: number;
  fixedEarnings: number;
  variableEarnings: number;
  fixedDeductions: number;
  variableDeductions: number;
  grossEarnings: number;
  totalDeductions: number;
  netMonthlySalary: number;
  finalPayable: number;
  items: LineItem[];
};

export async function generatePayslipPdf(filePath: string, data: PayslipData) {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });

  return new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);
    doc.fontSize(18).text(`${APP_NAME} Payslip`, { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Employee: ${data.employeeName}`);
    doc.text(`Email: ${data.employeeEmail}`);
    doc.text(`Month/Year: ${String(data.month).padStart(2, '0')}/${data.year}`);
    doc.text(`Leaves: ${data.leaves}`);
    doc.text(`Working Days: ${data.workingDays}`);
    doc.moveDown();

    doc.fontSize(13).text('Components');
    doc.moveDown(0.5);
    data.items.forEach((item) => {
      const label = item.isVariableAdjustment ? 'Variable pay/adjustment' : 'Fixed';
      doc.fontSize(11).text(`${item.name} (${item.type}) [${label}] : ${item.amount.toFixed(2)}`);
    });

    doc.moveDown();
    doc.text(`Fixed Earnings: ${data.fixedEarnings.toFixed(2)}`);
    doc.text(`Variable Earnings: ${data.variableEarnings.toFixed(2)}`);
    doc.text(`Fixed Deductions: ${data.fixedDeductions.toFixed(2)}`);
    doc.text(`Variable Deductions: ${data.variableDeductions.toFixed(2)}`);
    doc.text(`Net Monthly Salary: ${data.netMonthlySalary.toFixed(2)}`);
    doc.fontSize(13).text(`Final Payable: ${data.finalPayable.toFixed(2)}`);

    doc.end();
    stream.on('finish', () => resolve());
    stream.on('error', reject);
  });
}
