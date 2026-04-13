import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import puppeteer from 'puppeteer'
import fs from 'fs/promises'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        opportunity: {
          include: {
            organization: true,
            team: true,
          },
        },
      },
    });

    if (!invoice) {
      return new NextResponse('Invoice not found', { status: 404 });
    }

    const templatePath = path.join(process.cwd(), 'src', 'lib', 'invoice-template.html');
    let html = await fs.readFile(templatePath, 'utf-8');

    // Replace placeholders with actual data
    html = html.replace('{{INVOICE_NUMBER}}', String(invoice.invoice_number).padStart(5, '0'));
    html = html.replace('{{INVOICE_DATE}}', new Date(invoice.created_at).toLocaleDateString());
    html = html.replace('{{CUSTOMER_ID}}', invoice.opportunity.organization?.zoho_account_id || 'N/A');
    html = html.replace('{{STORE_TYPE}}', 'Team Store'); // Placeholder
    html = html.replace('{{CUSTOMER_NAME}}', invoice.opportunity.organization?.name || 'N/A');
    html = html.replace('{{TEAM_NAME}}', invoice.opportunity.team?.name || 'N/A');
    html = html.replace('{{CUSTOMER_ADDRESS}}', '-- Client Address --'); // Placeholder
    html = html.replace('{{CUSTOMER_PHONE}}', '-- Client Phone --'); // Placeholder
    html = html.replace('{{SALESPERSON}}', 'AB'); // Placeholder
    html = html.replace('{{JOB_NAME}}', invoice.opportunity.name);
    html = html.replace('{{DUE_DATE}}', invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A');
    
    // For now, we'll use a single line item. This will be expanded when we have product data.
    const lineItemsHtml = `
      <tr class="bg-gray-100">
          <td class="p-2">1</td>
          <td class="p-2">${invoice.opportunity.name}</td>
          <td class="p-2 text-right">${invoice.amount.toFixed(2)}</td>
          <td class="p-2 text-right">${invoice.amount.toFixed(2)}</td>
      </tr>
    `;

    html = html.replace('{{LINE_ITEMS}}', lineItemsHtml);
    html = html.replace('{{SUBTOTAL}}', invoice.amount.toFixed(2));
    html = html.replace('{{TOTAL}}', invoice.amount.toFixed(2));
    html = html.replace('{{PAYMENT_LINK}}', invoice.payment_link || 'N/A');

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    const response = new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=invoice-${invoice.invoice_number}.pdf`,
      },
    });

    return response;

  } catch (error) {
    console.error('Error generating PDF:', error);
    return new NextResponse('Error generating PDF', { status: 500 });
  }
}
