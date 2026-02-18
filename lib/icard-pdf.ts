import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

type ICardData = {
    user: {
        name: string;
        employeeCode: string | null;
        designation: string | null;
        department: string | null;
        dateOfJoining: Date | null | string;
        photoUrl: string | null;
        pfNumber: string | null;
        pan: string | null;
    };
    company: {
        companyName: string;
        companyAddress: string | null;
        companyLogoUrl: string | null;
    };
};

export async function generateICardPdf(data: ICardData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: [242, 362], // Approx ID Card size (85mm x 127.5mm) - Vertical
            margin: 0
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        const width = 242;
        const height = 362;

        // --- Front Side ---
        // Header (White)
        doc.rect(0, 0, width, 60).fill('#ffffff');

        // Logo
        if (data.company.companyLogoUrl) {
            try {
                // Handle both public URLs and base64
                let logoBuffer: Buffer;
                if (data.company.companyLogoUrl.startsWith('/')) {
                    const logoPath = path.join(process.cwd(), 'public', data.company.companyLogoUrl);
                    logoBuffer = fs.readFileSync(logoPath);
                } else if (data.company.companyLogoUrl.startsWith('data:')) {
                    logoBuffer = Buffer.from(data.company.companyLogoUrl.split(',')[1], 'base64');
                } else {
                    // Remote URL (not handled here for simplicity, fallback to text)
                    throw new Error('Remote URL');
                }
                doc.image(logoBuffer, (width / 2) - 40, 10, { width: 80, height: 40, fit: [80, 40], align: 'center', valign: 'center' });
            } catch (e) {
                doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text(data.company.companyName, 0, 25, { align: 'center', width });
            }
        } else {
            doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text(data.company.companyName, 0, 25, { align: 'center', width });
        }

        doc.moveTo(0, 60).lineTo(width, 60).strokeColor('#f1f5f9').lineWidth(1).stroke();

        // Photo
        const photoY = 80;
        const photoSize = 100;
        const photoX = (width / 2) - (photoSize / 2);

        if (data.user.photoUrl) {
            try {
                let photoBuffer: Buffer;
                if (data.user.photoUrl.startsWith('data:')) {
                    photoBuffer = Buffer.from(data.user.photoUrl.split(',')[1], 'base64');
                } else if (data.user.photoUrl.startsWith('/')) {
                    photoBuffer = fs.readFileSync(path.join(process.cwd(), 'public', data.user.photoUrl));
                } else {
                    throw new Error('Unsupported format');
                }
                doc.image(photoBuffer, photoX, photoY, { width: photoSize, height: photoSize, fit: [photoSize, photoSize] });
            } catch (e) {
                doc.rect(photoX, photoY, photoSize, photoSize).fill('#f8fafc');
                doc.fillColor('#cbd5e1').fontSize(40).text('👤', photoX, photoY + 25, { align: 'center', width: photoSize });
            }
        } else {
            doc.rect(photoX, photoY, photoSize, photoSize).fill('#f8fafc');
            doc.fillColor('#cbd5e1').fontSize(40).text('👤', photoX, photoY + 25, { align: 'center', width: photoSize });
        }

        // Details
        doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text(data.user.name.toUpperCase(), 0, 195, { align: 'center', width });
        doc.fillColor('#2563eb').fontSize(8).font('Helvetica-Bold').text((data.user.designation || 'EMPLOYEE').toUpperCase(), 0, 212, { align: 'center', width, characterSpacing: 1 });

        const detailY = 240;
        const detailX = 20;
        const colWidth = (width - 40) / 2;

        doc.fillColor('#64748b').fontSize(7).font('Helvetica-Bold').text('EMPLOYEE ID', detailX, detailY);
        doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold').text(data.user.employeeCode || 'N/A', detailX, detailY + 10);

        doc.fillColor('#64748b').fontSize(7).font('Helvetica-Bold').text('JOINED', detailX + colWidth, detailY);
        doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold').text(data.user.dateOfJoining ? new Date(data.user.dateOfJoining).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'N/A', detailX + colWidth, detailY + 10);

        doc.fillColor('#64748b').fontSize(7).font('Helvetica-Bold').text('DEPARTMENT', detailX, detailY + 35);
        doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold').text((data.user.department || 'GENERAL').toUpperCase(), detailX, detailY + 45);

        // Footer accent
        doc.rect(0, height - 5, width, 5).fill('#2563eb');

        // --- Back Side ---
        doc.addPage();

        doc.rect(0, 0, width, 5).fill('#2563eb');

        doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('INSTRUCTIONS', 0, 40, { align: 'center', width });
        doc.fillColor('#64748b').fontSize(7).font('Helvetica').text(`This identity card is the property of ${data.company.companyName}. It must be produced on demand by authorized personnel. Unauthorized use is strictly prohibited. If found, please return to the office address below.`, 30, 60, { align: 'center', width: width - 60, lineGap: 2 });

        doc.rect(10, 130, width - 20, 120).fill('#ffffff');
        doc.rect(10, 130, width - 20, 120).strokeColor('#e2e8f0').lineWidth(0.5).stroke();

        const backDetailY = 145;
        doc.fillColor('#64748b').fontSize(7).font('Helvetica-Bold').text('OFFICE ADDRESS', 20, backDetailY);
        doc.fillColor('#475569').fontSize(8).font('Helvetica-Bold').text(data.company.companyAddress || 'N/A', 20, backDetailY + 10, { width: width - 40 });

        doc.fillColor('#64748b').fontSize(7).font('Helvetica-Bold').text('PF NO.', 20, backDetailY + 50);
        doc.fillColor('#475569').fontSize(8).font('Helvetica-Bold').text(data.user.pfNumber || '-', 20, backDetailY + 60);

        doc.fillColor('#64748b').fontSize(7).font('Helvetica-Bold').text('PAN NO.', detailX + colWidth, backDetailY + 50);
        doc.fillColor('#475569').fontSize(8).font('Helvetica-Bold').text(data.user.pan || '-', detailX + colWidth, backDetailY + 60);

        // Footer
        doc.fillColor('#cbd5e1').fontSize(6).font('Helvetica').text('© NEXPAYROLL SECURED SYSTEM', 0, height - 35, { align: 'center', width });
        doc.rect(0, height - 20, width, 20).fill('#0f172a');

        doc.end();
    });
}
