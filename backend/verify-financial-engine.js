import http from 'http';
import app from './src/app.js';
import {
  calculateBillingPeriod,
  advanceDateByFrequency,
  calculateInvoiceLine,
  calculateInvoiceTotals,
  calculatePaymentAllocation,
  formatDateOnly,
  roundToTwo
} from './src/utils/billingCalculator.js';
import { generateInvoicePdfBuffer } from './src/services/pdfService.js';
import { sendInvoiceEmail, sendPaymentReceiptEmail } from './src/services/emailService.js';
import { getBillingWorkerStatus, executeBillingCycle } from './src/jobs/billingWorker.js';

console.log('================================================================');
console.log(' BRIGHTLOOP: MEMBER 3 FINANCIAL ENGINE VERIFICATION SUITE');
console.log(' Invoices, Billing Scheduler, Calculations & Payment Engine');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`❌ [FAIL] ${message}`);
  }
}

async function runTests() {
  // ==============================================================================
  // 1. BILLING FREQUENCY & CYCLE MATHEMATICS
  // ==============================================================================
  console.log('1. Billing Frequency & Billing Period Calculations:');

  // Daily
  const dailyPeriod = calculateBillingPeriod('daily', '2026-11-01');
  assert(dailyPeriod.periodStart === '2026-11-01', 'Daily period start is exactly 2026-11-01');
  assert(dailyPeriod.periodEnd === '2026-11-01', 'Daily period end is same day 2026-11-01');
  assert(dailyPeriod.nextBillingDate === '2026-11-02', 'Daily next billing date is 2026-11-02 (+1 day)');

  // Weekly
  const weeklyPeriod = calculateBillingPeriod('weekly', '2026-11-01');
  assert(weeklyPeriod.periodStart === '2026-11-01', 'Weekly period start is 2026-11-01');
  assert(weeklyPeriod.periodEnd === '2026-11-07', 'Weekly period end is 2026-11-07 (6 days after start)');
  assert(weeklyPeriod.nextBillingDate === '2026-11-08', 'Weekly next billing date is 2026-11-08 (+7 days)');

  // Monthly
  const monthlyPeriod = calculateBillingPeriod('monthly', '2026-01-15');
  assert(monthlyPeriod.periodStart === '2026-01-15', 'Monthly period start is 2026-01-15');
  assert(monthlyPeriod.nextBillingDate === '2026-02-15', 'Monthly next billing date is 2026-02-15 (+1 month)');
  assert(monthlyPeriod.periodEnd === '2026-02-14', 'Monthly period end is 1 day before next billing (2026-02-14)');

  // Yearly
  const yearlyPeriod = calculateBillingPeriod('yearly', '2026-03-01');
  assert(yearlyPeriod.periodStart === '2026-03-01', 'Yearly period start is 2026-03-01');
  assert(yearlyPeriod.nextBillingDate === '2027-03-01', 'Yearly next billing date is 2027-03-01 (+1 year)');
  assert(yearlyPeriod.periodEnd === '2027-02-28', 'Yearly period end is 2027-02-28');

  // Month-end rollover edge case
  const endOfMonth = advanceDateByFrequency('2026-01-31', 'monthly', 1);
  assert(endOfMonth === '2026-02-28', 'Jan 31 + 1 month correctly adjusts to Feb 28');

  // ==============================================================================
  // 2. INVOICE LINE & TOTALS CALCULATION LOGIC
  // ==============================================================================
  console.log('\n2. Invoice Line Items & Aggregate Totals Engine:');

  const line1 = calculateInvoiceLine(2, 50.00, 10);
  assert(line1.lineSubtotal === 100.00, 'Line 1 subtotal: 2 * $50 = $100.00');
  assert(line1.lineTax === 10.00, 'Line 1 tax (10% of $100): $10.00');
  assert(line1.lineTotal === 110.00, 'Line 1 total: $100 + $10 = $110.00');

  const line2 = calculateInvoiceLine(1, 200.00, 18);
  assert(line2.lineSubtotal === 200.00, 'Line 2 subtotal: 1 * $200 = $200.00');
  assert(line2.lineTax === 36.00, 'Line 2 tax (18% of $200): $36.00');
  assert(line2.lineTotal === 236.00, 'Line 2 total: $200 + $36 = $236.00');

  const totals = calculateInvoiceTotals([line1, line2], 20.00);
  assert(totals.subtotal === 300.00, 'Aggregate subtotal: $100 + $200 = $300.00');
  assert(totals.discountAmount === 20.00, 'Discount applied: $20.00');
  assert(totals.taxAmount === 46.00, 'Aggregate taxes: $10 + $36 = $46.00');
  assert(totals.grandTotal === 326.00, 'Grand total: ($300 - $20) + $46 = $326.00');

  // Negative / zero discount guard
  const zeroDiscountTotals = calculateInvoiceTotals([line1], 0);
  assert(zeroDiscountTotals.grandTotal === 110.00, 'Zero discount grand total matches exactly $110.00');

  // Excess discount capped at subtotal
  const excessDiscountTotals = calculateInvoiceTotals([line1], 500.00);
  assert(excessDiscountTotals.discountAmount === 100.00, 'Excess discount ($500) capped at subtotal ($100.00)');
  assert(excessDiscountTotals.grandTotal === 10.00, 'Grand total with 100% discount equals tax only ($10.00)');

  // ==============================================================================
  // 3. PAYMENT RECORDING & ALLOCATION LOGIC
  // ==============================================================================
  console.log('\n3. Payment Allocation & Status Machine:');

  // Case A: Full Payment
  const fullPay = calculatePaymentAllocation(250.00, 0.00, 250.00);
  assert(fullPay.newAmountPaid === 250.00, 'Full payment: newAmountPaid = $250.00');
  assert(fullPay.newOutstanding === 0.00, 'Full payment: newOutstanding = $0.00');
  assert(fullPay.paymentStatus === 'PAID', 'Full payment: paymentStatus transitions to PAID');
  assert(fullPay.invoiceStatus === 'PAID', 'Full payment: invoiceStatus transitions to PAID');

  // Case B: Partial Payment
  const partialPay = calculatePaymentAllocation(250.00, 0.00, 100.00);
  assert(partialPay.newAmountPaid === 100.00, 'Partial payment: newAmountPaid = $100.00');
  assert(partialPay.newOutstanding === 150.00, 'Partial payment: newOutstanding = $150.00');
  assert(partialPay.paymentStatus === 'PARTIALLY_PAID', 'Partial payment: paymentStatus transitions to PARTIALLY_PAID');
  assert(partialPay.invoiceStatus === 'CONFIRMED', 'Partial payment: invoiceStatus remains CONFIRMED');

  // Case C: Subsequent Payment Settling Remainder
  const secondPay = calculatePaymentAllocation(250.00, 100.00, 150.00);
  assert(secondPay.newAmountPaid === 250.00, 'Second payment: newAmountPaid reaches full $250.00');
  assert(secondPay.newOutstanding === 0.00, 'Second payment: newOutstanding reduces to $0.00');
  assert(secondPay.paymentStatus === 'PAID', 'Second payment: paymentStatus becomes PAID');
  assert(secondPay.invoiceStatus === 'PAID', 'Second payment: invoiceStatus becomes PAID');

  // Case D: Overpayment Protection (Rejection)
  let overpayThrew = false;
  try {
    calculatePaymentAllocation(100.00, 40.00, 80.00); // balance is $60, trying to pay $80
  } catch (err) {
    overpayThrew = true;
  }
  assert(overpayThrew, 'Overpayment rejection: Attempt to pay $80 on $60 outstanding throws validation error');

  // Case E: Zero / Negative payment rejection
  let zeroPayThrew = false;
  try {
    calculatePaymentAllocation(100.00, 0.00, 0.00);
  } catch (err) {
    zeroPayThrew = true;
  }
  assert(zeroPayThrew, 'Non-positive payment ($0.00) strictly rejected');

  // ==============================================================================
  // 4. PDF GENERATION SERVICE
  // ==============================================================================
  console.log('\n4. PDF Generation & Document Rendering:');

  const mockInvoice = {
    invoice_number: 'INV-2026-9001',
    invoice_date: '2026-11-01',
    due_date: '2026-11-16',
    billing_period_start: '2026-11-01',
    billing_period_end: '2026-11-30',
    status: 'CONFIRMED',
    payment_status: 'PARTIALLY_PAID',
    subtotal: 100.00,
    discount_amount: 10.00,
    tax_amount: 9.00,
    grand_total: 99.00,
    amount_paid: 50.00,
    outstanding_amount: 49.00,
    currency: 'USD',
    payment_terms: 'Due on receipt',
    notes: 'Test invoice notes'
  };

  const mockCustomer = {
    name: 'Acme Test Corp',
    company_name: 'Acme International',
    email: 'billing@acme.com',
    billing_address: '100 Main St, City, Country',
    tax_id: 'US-TAX-88991'
  };

  const mockLines = [
    {
      product_name_snapshot: 'Cloud Pro Plan',
      quantity: 1,
      unit_price: 100.00,
      tax_percentage_snapshot: 10,
      line_total: 110.00
    }
  ];

  const mockPayments = [
    {
      payment_number: 'PAY-2026-0001',
      payment_date: '2026-11-02',
      payment_method: 'CREDIT_CARD',
      amount: 50.00,
      reference_id: 'TXN-99128'
    }
  ];

  const pdfBuffer = await generateInvoicePdfBuffer(mockInvoice, mockLines, mockCustomer, mockPayments);
  assert(Buffer.isBuffer(pdfBuffer), 'PDF generator returns a valid Buffer');
  assert(pdfBuffer.length > 2000, `PDF buffer has valid document size (${pdfBuffer.length} bytes)`);
  assert(pdfBuffer.toString('utf8', 0, 5) === '%PDF-', 'PDF buffer has standard %PDF- header magic bytes');

  // ==============================================================================
  // 5. EMAIL NOTIFICATION SYSTEM
  // ==============================================================================
  console.log('\n5. Email Notification System:');

  const invoiceEmail = await sendInvoiceEmail(mockInvoice, mockCustomer, mockLines);
  assert(invoiceEmail.success === true, 'Invoice Issued email generated and dispatched');
  assert(invoiceEmail.type === 'INVOICE_SENT', 'Notification marked as INVOICE_SENT type');
  assert(invoiceEmail.recipientEmail === 'billing@acme.com', 'Recipient email accurately resolved to customer');

  const paymentEmail = await sendPaymentReceiptEmail(mockPayments[0], mockInvoice, mockCustomer);
  assert(paymentEmail.success === true, 'Payment Receipt email generated and dispatched');
  assert(paymentEmail.type === 'PAYMENT_RECEIPT', 'Notification marked as PAYMENT_RECEIPT type');

  // ==============================================================================
  // 6. BILLING SCHEDULER WORKER & MUTEX
  // ==============================================================================
  console.log('\n6. Automated Billing Scheduler & Concurrency Mutex:');

  const workerStatus = getBillingWorkerStatus();
  assert(workerStatus.isRunningMutex === false, 'Billing worker mutex starts in released state');
  assert(typeof workerStatus.isWorkerActive === 'boolean', 'Worker active flag exposed');

  // ==============================================================================
  // 7. HTTP API SECURITY & RBAC ENFORCEMENT
  // ==============================================================================
  console.log('\n7. HTTP API Security & RBAC Enforcement:');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const makeRequest = (method, path, body = null, token = null) => {
    return new Promise((resolve, reject) => {
      const url = new URL(path, baseUrl);
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const req = http.request(url, { method, headers }, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let json = null;
          try { json = JSON.parse(data); } catch {}
          resolve({ status: res.statusCode, data: json, raw: data });
        });
      });
      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  };

  // 7.1 Root API index check
  const rootRes = await makeRequest('GET', '/');
  assert(rootRes.status === 200, 'Root API returns HTTP 200 OK');
  assert(Boolean(rootRes.data?.endpoints?.invoices), 'Root API advertises /api/invoices');
  assert(Boolean(rootRes.data?.endpoints?.payments), 'Root API advertises /api/payments');
  assert(Boolean(rootRes.data?.endpoints?.billingScheduler), 'Root API advertises /api/admin/billing');
  assert(Boolean(rootRes.data?.endpoints?.emails), 'Root API advertises /api/emails');

  // 7.2 Security Guards: Invoices
  const unauthInvoicesGet = await makeRequest('GET', '/api/invoices');
  assert(unauthInvoicesGet.status === 401, 'Unauthenticated GET /api/invoices rejected (401 Unauthorized)');

  const unauthInvoicesPost = await makeRequest('POST', '/api/invoices', { customer_id: '123' });
  assert(unauthInvoicesPost.status === 401, 'Unauthenticated POST /api/invoices rejected (401 Unauthorized)');

  // 7.3 Security Guards: Payments
  const unauthPaymentsGet = await makeRequest('GET', '/api/payments');
  assert(unauthPaymentsGet.status === 401, 'Unauthenticated GET /api/payments rejected (401 Unauthorized)');

  const unauthPaymentsPost = await makeRequest('POST', '/api/payments', { invoice_id: '123', amount: 50 });
  assert(unauthPaymentsPost.status === 401, 'Unauthenticated POST /api/payments rejected (401 Unauthorized)');

  // 7.4 Security Guards: Billing Scheduler
  const unauthSchedulerPost = await makeRequest('POST', '/api/admin/billing/run-scheduler');
  assert(unauthSchedulerPost.status === 401, 'Unauthenticated POST /api/admin/billing/run-scheduler rejected (401 Unauthorized)');

  const unauthSchedulerStatus = await makeRequest('GET', '/api/admin/billing/status');
  assert(unauthSchedulerStatus.status === 401, 'Unauthenticated GET /api/admin/billing/status rejected (401 Unauthorized)');

  // 7.5 Security Guards: Emails
  const unauthEmailsGet = await makeRequest('GET', '/api/emails');
  assert(unauthEmailsGet.status === 401, 'Unauthenticated GET /api/emails rejected (401 Unauthorized)');

  server.close();

  // ==============================================================================
  // SUMMARY
  // ==============================================================================
  console.log('\n================================================================');
  console.log(` MEMBER 3 FINANCIAL ENGINE SUITE: ${passedTests}/${totalTests} PASSED`);
  if (failedTests === 0) {
    console.log(' ALL INVOICE, BILLING, SCHEDULER & PAYMENT TESTS PASSED!');
  } else {
    console.error(`❌ ${failedTests} TESTS FAILED.`);
    process.exit(1);
  }
  console.log('================================================================\n');
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
