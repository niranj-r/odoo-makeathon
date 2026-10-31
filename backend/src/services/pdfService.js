import PDFDocument from 'pdfkit';

/**
 * PDF Generation Service for Brightloop Invoices
 * Uses PDFKit to construct vector-rendered, high-fidelity PDF invoice documents.
 */
export const generateInvoicePdfBuffer = (invoice, lines = [], customer = {}, payments = []) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Invoice ${invoice.invoice_number}`,
          Author: 'Brightloop Software',
          Subject: `Billing Invoice for ${customer.name || 'Customer'}`
        }
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // Brand Colors
      const navy = '#1B3C53';
      const textDark = '#1B242C';
      const textMuted = '#5F6C7B';
      const borderGray = '#E5E7EB';
      const lightBg = '#F8FAFC';
      const greenPaid = '#0D9488';
      const orangeDue = '#D97706';

      // 1. Company Header
      doc.rect(50, 45, 495, 4).fill(navy);

      doc.fillColor(navy)
        .font('Helvetica-Bold')
        .fontSize(22)
        .text('BRIGHTLOOP', 50, 60);

      doc.fillColor(textMuted)
        .font('Helvetica')
        .fontSize(9)
        .text('Subscription Management & Financial Operations', 50, 85)
        .text('100 Innovation Way, Suite 400', 50, 98)
        .text('support@brightloop.io | +1 (800) 555-0199', 50, 111);

      // Invoice Top-Right Info
      doc.fillColor(navy)
        .font('Helvetica-Bold')
        .fontSize(18)
        .text('INVOICE', 350, 60, { align: 'right' });

      doc.fillColor(textDark)
        .font('Helvetica-Bold')
        .fontSize(11)
        .text(invoice.invoice_number, 350, 83, { align: 'right' });

      // Status Tag
      const isPaid = (invoice.payment_status === 'PAID' || invoice.status === 'PAID');
      const statusColor = isPaid ? greenPaid : (invoice.status === 'CANCELLED' ? '#EF4444' : orangeDue);
      const statusText = isPaid ? 'PAID IN FULL' : (invoice.payment_status === 'PARTIALLY_PAID' ? 'PARTIALLY PAID' : invoice.status);

      doc.rect(445, 102, 100, 18).fillAndStroke(statusColor, statusColor);
      doc.fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .text(statusText, 445, 107, { width: 100, align: 'center' });

      // Horizontal Divider
      doc.moveTo(50, 135).lineTo(545, 135).strokeColor(borderGray).stroke();

      // 2. Metadata Columns (Billed To vs Invoice Details)
      const metaY = 150;

      // Customer Info
      doc.fillColor(textMuted).font('Helvetica-Bold').fontSize(8.5).text('BILLED TO', 50, metaY);
      doc.fillColor(textDark).font('Helvetica-Bold').fontSize(11).text(customer.name || customer.company_name || 'Customer', 50, metaY + 14);

      let custY = metaY + 28;
      doc.font('Helvetica').fontSize(9).fillColor(textDark);
      if (customer.company_name && customer.name !== customer.company_name) {
        doc.text(customer.company_name, 50, custY);
        custY += 13;
      }
      if (customer.email) {
        doc.text(customer.email, 50, custY);
        custY += 13;
      }
      if (customer.billing_address) {
        doc.text(customer.billing_address, 50, custY, { width: 220 });
        custY += 13;
      }
      if (customer.tax_id) {
        doc.fillColor(textMuted).text(`Tax ID / GST: ${customer.tax_id}`, 50, custY);
      }

      // Invoice Details (Right Column)
      const rightMetaX = 340;
      doc.fillColor(textMuted).font('Helvetica-Bold').fontSize(8.5).text('INVOICE DETAILS', rightMetaX, metaY);

      const renderMetaRow = (label, value, y) => {
        doc.font('Helvetica').fontSize(9).fillColor(textMuted).text(label, rightMetaX, y);
        doc.font('Helvetica-Bold').fontSize(9).fillColor(textDark).text(value, rightMetaX + 110, y, { align: 'right' });
      };

      let rightY = metaY + 16;
      renderMetaRow('Invoice Date:', invoice.invoice_date || 'N/A', rightY);
      rightY += 14;
      renderMetaRow('Due Date:', invoice.due_date || 'N/A', rightY);
      rightY += 14;
      if (invoice.billing_period_start && invoice.billing_period_end) {
        renderMetaRow('Billing Period:', `${invoice.billing_period_start} to ${invoice.billing_period_end}`, rightY);
        rightY += 14;
      }
      if (invoice.payment_terms) {
        renderMetaRow('Payment Terms:', invoice.payment_terms, rightY);
        rightY += 14;
      }
      if (invoice.currency) {
        renderMetaRow('Currency:', invoice.currency, rightY);
      }

      // 3. Line Items Table
      const tableTop = 250;
      doc.rect(50, tableTop, 495, 22).fill(lightBg);
      doc.rect(50, tableTop, 495, 22).strokeColor(borderGray).stroke();

      doc.fillColor(navy).font('Helvetica-Bold').fontSize(8.5);
      doc.text('DESCRIPTION / PRODUCT', 60, tableTop + 7);
      doc.text('QTY', 290, tableTop + 7, { width: 35, align: 'center' });
      doc.text('UNIT PRICE', 335, tableTop + 7, { width: 65, align: 'right' });
      doc.text('TAX %', 410, tableTop + 7, { width: 45, align: 'right' });
      doc.text('AMOUNT', 465, tableTop + 7, { width: 70, align: 'right' });

      let currentY = tableTop + 24;

      if (!lines || lines.length === 0) {
        doc.font('Helvetica').fontSize(9).fillColor(textMuted).text('No line items recorded for this invoice.', 60, currentY + 10);
        currentY += 30;
      } else {
        lines.forEach((line) => {
          doc.rect(50, currentY, 495, 24).strokeColor(borderGray).stroke();

          doc.font('Helvetica-Bold').fontSize(8.5).fillColor(textDark);
          doc.text(line.product_name_snapshot || 'Product Item', 60, currentY + 7, { width: 220 });

          doc.font('Helvetica').fontSize(8.5).fillColor(textDark);
          doc.text(String(line.quantity || 1), 290, currentY + 7, { width: 35, align: 'center' });
          doc.text(`$${Number(line.unit_price || 0).toFixed(2)}`, 335, currentY + 7, { width: 65, align: 'right' });
          doc.text(`${Number(line.tax_percentage_snapshot || 0).toFixed(1)}%`, 410, currentY + 7, { width: 45, align: 'right' });
          doc.font('Helvetica-Bold').text(`$${Number(line.line_total || 0).toFixed(2)}`, 465, currentY + 7, { width: 70, align: 'right' });

          currentY += 24;
        });
      }

      // 4. Financial Totals Section
      const totalsY = currentY + 15;
      const totalsBoxX = 320;
      const totalsBoxWidth = 225;

      doc.rect(totalsBoxX, totalsY, totalsBoxWidth, 120).fill(lightBg);
      doc.rect(totalsBoxX, totalsY, totalsBoxWidth, 120).strokeColor(borderGray).stroke();

      const renderTotalLine = (label, val, y, isBold = false, isAccent = false) => {
        doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(isAccent ? 11 : 9)
          .fillColor(isAccent ? navy : textDark)
          .text(label, totalsBoxX + 15, y);

        doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(isAccent ? 11 : 9)
          .fillColor(isAccent ? navy : textDark)
          .text(val, totalsBoxX + 100, y, { width: totalsBoxWidth - 115, align: 'right' });
      };

      let ty = totalsY + 10;
      renderTotalLine('Subtotal:', `$${Number(invoice.subtotal || 0).toFixed(2)}`, ty);
      ty += 16;
      if (Number(invoice.discount_amount || 0) > 0) {
        renderTotalLine('Discount:', `-$${Number(invoice.discount_amount || 0).toFixed(2)}`, ty);
        ty += 16;
      }
      renderTotalLine('Taxes:', `$${Number(invoice.tax_amount || 0).toFixed(2)}`, ty);
      ty += 18;

      doc.moveTo(totalsBoxX + 10, ty - 2).lineTo(totalsBoxX + totalsBoxWidth - 10, ty - 2).strokeColor(borderGray).stroke();

      renderTotalLine('Grand Total:', `$${Number(invoice.grand_total || 0).toFixed(2)}`, ty, true, true);
      ty += 20;

      renderTotalLine('Amount Paid:', `$${Number(invoice.amount_paid || 0).toFixed(2)}`, ty);
      ty += 16;

      const outstandingColor = Number(invoice.outstanding_amount || 0) > 0.001 ? orangeDue : greenPaid;
      doc.font('Helvetica-Bold').fontSize(10).fillColor(outstandingColor).text('Balance Due:', totalsBoxX + 15, ty);
      doc.font('Helvetica-Bold').fontSize(10).fillColor(outstandingColor).text(`$${Number(invoice.outstanding_amount || 0).toFixed(2)}`, totalsBoxX + 100, ty, { width: totalsBoxWidth - 115, align: 'right' });

      // Notes & Payment Instructions (Left of totals)
      const notesY = totalsY;
      doc.fillColor(navy).font('Helvetica-Bold').fontSize(9).text('PAYMENT TERMS & INSTRUCTIONS', 50, notesY);
      doc.fillColor(textMuted).font('Helvetica').fontSize(8.5)
        .text('Payment is due upon receipt. Please reference the invoice number on your wire transfer or cheque.', 50, notesY + 14, { width: 250 })
        .text('Wire Transfer Details:', 50, notesY + 40)
        .text('Bank: First Global SaaS Bank', 50, notesY + 52)
        .text('Account: 8839-4402-1194 | SWIFT: BRIGHTSXX', 50, notesY + 64);

      if (invoice.notes) {
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor(textDark).text('Notes:', 50, notesY + 82);
        doc.font('Helvetica').fontSize(8.5).fillColor(textMuted).text(invoice.notes, 50, notesY + 95, { width: 250 });
      }

      // 5. Payment Transaction History (if any recorded)
      if (payments && payments.length > 0) {
        const payY = totalsY + 140;
        doc.fillColor(navy).font('Helvetica-Bold').fontSize(9).text('PAYMENT TRANSACTIONS RECEIVED', 50, payY);

        let py = payY + 14;
        payments.forEach((p) => {
          doc.rect(50, py, 495, 18).fill(lightBg);
          doc.font('Helvetica').fontSize(8).fillColor(textDark);
          doc.text(`${p.payment_date} | ${p.payment_number} | Method: ${p.payment_method} ${p.reference_id ? `(Ref: ${p.reference_id})` : ''}`, 60, py + 5);
          doc.font('Helvetica-Bold').fontSize(8).fillColor(greenPaid);
          doc.text(`+$${Number(p.amount || 0).toFixed(2)}`, 450, py + 5, { width: 85, align: 'right' });
          py += 20;
        });
      }

      // 6. Footer
      doc.fillColor(textMuted).font('Helvetica').fontSize(8)
        .text('Thank you for choosing Brightloop Software! For questions regarding this invoice, contact billing@brightloop.io', 50, 780, { align: 'center', width: 495 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

