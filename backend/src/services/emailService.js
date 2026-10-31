import nodemailer from 'nodemailer';
import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';

/**
 * Responsive HTML Email Templates for Brightloop
 */
const renderEmailWrapper = (contentHtml, previewText = '') => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Brightloop Notification</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F9F3EF; margin: 0; padding: 24px 0; color: #1B242C; }
    .email-container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background-color: #1B3C53; padding: 24px; text-align: center; }
    .header h1 { margin: 0; color: #FFFFFF; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
    .header p { margin: 4px 0 0; color: #D2C1B6; font-size: 12px; }
    .body-content { padding: 32px 28px; }
    .badge { display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: 700; border-radius: 4px; text-transform: uppercase; }
    .badge-paid { background-color: #DEF7EC; color: #03543F; }
    .badge-due { background-color: #FEF3C7; color: #92400E; }
    .table-details { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
    .table-details th { text-align: left; padding: 8px; background-color: #F8FAFC; border-bottom: 2px solid #E2E8F0; color: #5F6C7B; font-weight: 600; }
    .table-details td { padding: 10px 8px; border-bottom: 1px solid #EDF2F7; }
    .totals-box { background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 16px; margin: 20px 0; font-size: 13px; }
    .totals-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .totals-grand { font-size: 16px; font-weight: 700; color: #1B3C53; border-top: 1px solid #CBD5E1; padding-top: 8px; margin-top: 8px; }
    .footer { background-color: #F8FAFC; padding: 20px; text-align: center; font-size: 11px; color: #64748B; border-top: 1px solid #E2E8F0; }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${previewText}
  </div>
  <div class="email-container">
    <div class="header">
      <h1>BRIGHTLOOP</h1>
      <p>Subscription Billing & Financial Engine</p>
    </div>
    <div class="body-content">
      ${contentHtml}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Brightloop Software Inc. All rights reserved.</p>
      <p>Questions? Contact us at <a href="mailto:support@brightloop.io" style="color: #1B3C53; text-decoration: none;">support@brightloop.io</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();
};

/**
 * Configure Nodemailer transport (if credentials exist)
 */
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

/**
 * Dispatches an email, saves audit log in Supabase, and handles mock fallbacks
 */
export const dispatchEmail = async ({
  recipientEmail,
  recipientName = '',
  subject,
  type,
  invoiceId = null,
  paymentId = null,
  bodyHtml,
  metadata = {}
}) => {
  let deliveryStatus = 'SENT';
  let errorMessage = null;

  try {
    if (transporter) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Brightloop Billing" <billing@brightloop.io>',
        to: recipientEmail,
        subject,
        html: bodyHtml
      });
      console.log(`✉️  [Email] Live email sent to ${recipientEmail}: "${subject}"`);
    } else {
      console.log(`✉️  [Email Simulation] Sent to: ${recipientEmail} | Subject: "${subject}" | Type: ${type}`);
    }
  } catch (err) {
    console.error(`❌ [Email] Failed delivery to ${recipientEmail}:`, err.message);
    deliveryStatus = 'FAILED';
    errorMessage = err.message;
  }

  // Persist record to email_notifications table if Supabase is connected
  let notificationRecord = null;
  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('email_notifications')
        .insert({
          recipient_email: recipientEmail,
          recipient_name: recipientName,
          subject,
          type,
          invoice_id: invoiceId,
          payment_id: paymentId,
          body_html: bodyHtml,
          status: deliveryStatus,
          metadata: { ...metadata, error: errorMessage }
        })
        .select()
        .single();

      if (!error && data) {
        notificationRecord = data;
      }
    } catch (dbErr) {
      console.warn('Could not persist email notification to database:', dbErr.message);
    }
  }

  return {
    success: deliveryStatus === 'SENT',
    status: deliveryStatus,
    recipientEmail,
    subject,
    type,
    record: notificationRecord
  };
};

/**
 * 1. Send Invoice Issued Email
 */
export const sendInvoiceEmail = async (invoice, customer = {}, lines = []) => {
  const recipientEmail = customer.email || invoice.customer_email;
  const recipientName = customer.name || 'Valued Customer';
  const invoiceNum = invoice.invoice_number;

  const content = `
    <h2 style="color: #1B3C53; margin-top: 0;">New Invoice Issued</h2>
    <p>Dear ${recipientName},</p>
    <p>Your invoice <strong>${invoiceNum}</strong> has been generated for the billing period 
       <strong>${invoice.billing_period_start || invoice.invoice_date}</strong> to 
       <strong>${invoice.billing_period_end || invoice.due_date}</strong>.
    </p>

    <div class="totals-box">
      <div class="totals-row"><span>Invoice Number:</span><strong>${invoiceNum}</strong></div>
      <div class="totals-row"><span>Invoice Date:</span><span>${invoice.invoice_date}</span></div>
      <div class="totals-row"><span>Payment Due Date:</span><span>${invoice.due_date}</span></div>
      <div class="totals-row totals-grand">
        <span>Grand Total Due:</span>
        <span>$${Number(invoice.grand_total || 0).toFixed(2)} ${invoice.currency || 'USD'}</span>
      </div>
    </div>

    <p style="font-size: 13px; color: #5F6C7B;">
      Please find your invoice details above. You can view or download the complete PDF breakdown directly from your Customer Portal.
    </p>
  `;

  const html = renderEmailWrapper(content, `Invoice ${invoiceNum} from Brightloop`);

  return dispatchEmail({
    recipientEmail,
    recipientName,
    subject: `Invoice ${invoiceNum} from Brightloop Software`,
    type: 'INVOICE_SENT',
    invoiceId: invoice.id,
    bodyHtml: html,
    metadata: {
      invoice_number: invoiceNum,
      grand_total: invoice.grand_total,
      due_date: invoice.due_date
    }
  });
};

/**
 * 2. Send Payment Receipt Email
 */
export const sendPaymentReceiptEmail = async (payment, invoice, customer = {}) => {
  const recipientEmail = customer.email || invoice?.customer_email;
  const recipientName = customer.name || 'Valued Customer';
  const payNum = payment.payment_number;
  const invNum = invoice?.invoice_number || 'N/A';

  const isFull = (invoice?.outstanding_amount <= 0.009 || invoice?.payment_status === 'PAID');

  const content = `
    <h2 style="color: #0D9488; margin-top: 0;">Payment Confirmation</h2>
    <p>Dear ${recipientName},</p>
    <p>We have successfully received and recorded your payment of 
       <strong>$${Number(payment.amount || 0).toFixed(2)}</strong> for invoice <strong>${invNum}</strong>.
    </p>

    <div class="totals-box">
      <div class="totals-row"><span>Receipt / Ref:</span><strong>${payNum}</strong></div>
      <div class="totals-row"><span>Payment Date:</span><span>${payment.payment_date}</span></div>
      <div class="totals-row"><span>Payment Method:</span><span>${payment.payment_method}</span></div>
      <div class="totals-row"><span>Amount Paid:</span><strong>$${Number(payment.amount || 0).toFixed(2)}</strong></div>
      <div class="totals-row"><span>Invoice Total:</span><span>$${Number(invoice?.grand_total || 0).toFixed(2)}</span></div>
      <div class="totals-row totals-grand">
        <span>Remaining Balance:</span>
        <span style="color: ${isFull ? '#0D9488' : '#D97706'}">
          $${Number(invoice?.outstanding_amount || 0).toFixed(2)} ${isFull ? '(PAID IN FULL)' : ''}
        </span>
      </div>
    </div>

    <p style="font-size: 13px; color: #5F6C7B;">
      ${isFull ? 'This invoice has been settled in full. Thank you for your business!' : 'Please remit the remaining balance on or before the due date.'}
    </p>
  `;

  const html = renderEmailWrapper(content, `Payment Receipt ${payNum} for Invoice ${invNum}`);

  return dispatchEmail({
    recipientEmail,
    recipientName,
    subject: `Payment Receipt: ${payNum} for Invoice ${invNum}`,
    type: 'PAYMENT_RECEIPT',
    invoiceId: invoice?.id,
    paymentId: payment.id,
    bodyHtml: html,
    metadata: {
      payment_number: payNum,
      invoice_number: invNum,
      amount: payment.amount,
      outstanding: invoice?.outstanding_amount
    }
  });
};

