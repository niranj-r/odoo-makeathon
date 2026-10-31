import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Printer,
  Mail,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Building2,
  FileText,
  DollarSign
} from 'lucide-react';
import {
  getInvoice,
  confirmInvoice,
  cancelInvoice,
  sendInvoiceEmail,
  downloadInvoicePdf,
  recordPayment
} from '../../../services/api';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

export const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [processingAction, setProcessingAction] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Quick Payment form states
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('CREDIT_CARD');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [sendReceipt, setSendReceipt] = useState(true);
  const [payError, setPayError] = useState(null);

  useEffect(() => {
    fetchInvoiceData();
  }, [id]);

  const fetchInvoiceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getInvoice(id);
      if (res?.data) {
        setInvoice(res.data);
        setPayAmount(String(res.data.outstanding_amount || ''));
      }
    } catch (err) {
      setError(err?.message || 'Failed to fetch invoice details.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    try {
      setProcessingAction(true);
      setActionSuccess(null);
      await confirmInvoice(id);
      setActionSuccess('Invoice confirmed successfully.');
      fetchInvoiceData();
    } catch (err) {
      setError(err?.message || 'Failed to confirm invoice.');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this invoice? This action cannot be reversed.')) {
      return;
    }
    try {
      setProcessingAction(true);
      setActionSuccess(null);
      await cancelInvoice(id);
      setActionSuccess('Invoice cancelled.');
      fetchInvoiceData();
    } catch (err) {
      setError(err?.message || 'Failed to cancel invoice.');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleSendEmail = async () => {
    try {
      setProcessingAction(true);
      setActionSuccess(null);
      await sendInvoiceEmail(id);
      setActionSuccess(`Invoice email sent to ${invoice.customers?.email || 'customer'}.`);
      fetchInvoiceData();
    } catch (err) {
      setError(err?.message || 'Failed to dispatch email.');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setProcessingAction(true);
      await downloadInvoicePdf(invoice.id, invoice.invoice_number);
    } catch (err) {
      alert(`Could not download PDF: ${err.message}`);
    } finally {
      setProcessingAction(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      setProcessingAction(true);
      setPayError(null);

      const numAmount = parseFloat(payAmount);
      if (isNaN(numAmount) || numAmount <= 0) {
        setPayError('Please enter a valid payment amount greater than 0.');
        setProcessingAction(false);
        return;
      }

      if (numAmount > Number(invoice.outstanding_amount) + 0.001) {
        setPayError(`Payment cannot exceed outstanding balance of $${Number(invoice.outstanding_amount).toFixed(2)}.`);
        setProcessingAction(false);
        return;
      }

      await recordPayment({
        invoice_id: invoice.id,
        amount: numAmount,
        payment_method: payMethod,
        payment_date: payDate,
        reference_id: payRef,
        notes: payNotes,
        send_receipt: sendReceipt
      });

      setIsPaymentModalOpen(false);
      setActionSuccess(`Payment of $${numAmount.toFixed(2)} successfully recorded.`);
      fetchInvoiceData();
    } catch (err) {
      setPayError(err?.message || 'Failed to record payment.');
    } finally {
      setProcessingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ padding: '3rem', textAlign: 'center' }}>
        <LoadingSpinner />
        <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)' }}>Retrieving invoice data...</p>
      </div>
    );
  }

  if (error && !invoice) {
    return (
      <div className="page-container" style={{ padding: '2rem' }}>
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
        <Link to="/staff/invoices" className="btn btn-outline">
          <ArrowLeft size={16} />
          <span>Return to Invoice List</span>
        </Link>
      </div>
    );
  }

  const isOverdue = invoice.due_date < new Date().toISOString().split('T')[0] && invoice.payment_status !== 'PAID' && invoice.status !== 'CANCELLED';
  const hasOutstanding = Number(invoice.outstanding_amount || 0) > 0.001;

  return (
    <div className="page-container" style={{ padding: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Navigation & Action Bar */}
      <div className="action-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate('/staff/invoices')} className="btn btn-outline btn-sm">
            <ArrowLeft size={16} />
            <span>Back to Invoices</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 style={{ fontSize: '1.5rem', margin: 0 }}>{invoice.invoice_number}</h1>
            <span className={`badge badge-${invoice.status.toLowerCase()}`}>{invoice.status}</span>
            <span className={`badge badge-${invoice.payment_status === 'PARTIALLY_PAID' ? 'partial' : invoice.payment_status.toLowerCase()}`}>
              {invoice.payment_status}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {invoice.status === 'DRAFT' && (
            <button
              onClick={handleConfirm}
              className="btn btn-primary btn-sm"
              disabled={processingAction}
            >
              <CheckCircle size={15} />
              <span>Confirm Invoice</span>
            </button>
          )}

          {hasOutstanding && invoice.status !== 'CANCELLED' && (
            <button
              onClick={() => {
                setPayAmount(String(invoice.outstanding_amount));
                setIsPaymentModalOpen(true);
              }}
              className="btn btn-primary btn-sm"
              disabled={processingAction}
              style={{ backgroundColor: '#0D9488', borderColor: '#0D9488' }}
            >
              <CreditCard size={15} />
              <span>Record Payment</span>
            </button>
          )}

          <button
            onClick={handleSendEmail}
            className="btn btn-outline btn-sm"
            disabled={processingAction}
            title="Dispatch invoice email to customer"
          >
            <Mail size={15} />
            <span>Send Email</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            className="btn btn-outline btn-sm"
            disabled={processingAction}
            title="Download PDF"
          >
            <Download size={15} />
            <span>PDF</span>
          </button>

          <button
            onClick={handlePrint}
            className="btn btn-outline btn-sm"
            title="Print invoice"
          >
            <Printer size={15} />
            <span>Print</span>
          </button>

          {invoice.status !== 'CANCELLED' && Number(invoice.amount_paid) === 0 && (
            <button
              onClick={handleCancel}
              className="btn btn-ghost btn-sm"
              style={{ color: '#DC2626' }}
              disabled={processingAction}
            >
              <XCircle size={15} />
              <span>Cancel</span>
            </button>
          )}
        </div>
      </div>

      {actionSuccess && (
        <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>
          <CheckCircle size={18} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Printable Invoice Card */}
      <div className="invoice-preview-card" style={{ marginBottom: '2rem' }}>
        {/* Header Branding & Invoice Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--primary-navy)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <div className="brand-logo-icon" style={{ width: '28px', height: '28px' }}>
                <Building2 size={16} />
              </div>
              <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
                BRIGHTLOOP
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Brightloop Software Inc. &bull; Enterprise Subscription Platform
            </p>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              100 Innovation Way, Suite 400 &bull; support@brightloop.io
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: '1.65rem', color: 'var(--primary-navy)', margin: '0 0 0.25rem' }}>
              INVOICE
            </h2>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {invoice.invoice_number}
            </div>
            <div style={{ marginTop: '0.35rem' }}>
              <span className={`badge badge-${invoice.payment_status === 'PARTIALLY_PAID' ? 'partial' : invoice.payment_status.toLowerCase()}`}>
                {invoice.payment_status}
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Meta: Billed To vs Invoice Details */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Billed To
            </span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-navy)', marginTop: '0.35rem' }}>
              {invoice.customers?.name || 'Customer'}
            </div>
            {invoice.customers?.company_name && (
              <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                {invoice.customers.company_name}
              </div>
            )}
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              {invoice.customers?.email}
            </div>
            {invoice.customers?.billing_address && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'pre-line', marginTop: '0.25rem' }}>
                {invoice.customers.billing_address}
              </div>
            )}
            {invoice.customers?.tax_id && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                Tax / GST ID: <strong>{invoice.customers.tax_id}</strong>
              </div>
            )}
          </div>

          <div style={{ background: 'var(--bg-card-subtle)', padding: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Invoice Information
            </span>
            <table style={{ width: '100%', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              <tbody>
                <tr>
                  <td style={{ color: 'var(--text-secondary)', padding: '0.2rem 0' }}>Invoice Date:</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{invoice.invoice_date}</td>
                </tr>
                <tr>
                  <td style={{ color: 'var(--text-secondary)', padding: '0.2rem 0' }}>Due Date:</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: isOverdue ? '#DC2626' : 'inherit' }}>
                    {invoice.due_date} {isOverdue ? '(OVERDUE)' : ''}
                  </td>
                </tr>
                {invoice.billing_period_start && invoice.billing_period_end && (
                  <tr>
                    <td style={{ color: 'var(--text-secondary)', padding: '0.2rem 0' }}>Billing Period:</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      {invoice.billing_period_start} to {invoice.billing_period_end}
                    </td>
                  </tr>
                )}
                {invoice.subscriptions?.subscription_number && (
                  <tr>
                    <td style={{ color: 'var(--text-secondary)', padding: '0.2rem 0' }}>Subscription:</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      <Link to={`/staff/subscriptions/${invoice.subscription_id}`} style={{ color: 'var(--primary-navy)' }}>
                        {invoice.subscriptions.subscription_number}
                      </Link>
                    </td>
                  </tr>
                )}
                <tr>
                  <td style={{ color: 'var(--text-secondary)', padding: '0.2rem 0' }}>Payment Terms:</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{invoice.payment_terms || 'Due on receipt'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Itemized Lines Table */}
        <div style={{ marginBottom: '2rem' }}>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Description / Product</th>
                <th style={{ textAlign: 'center' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Unit Price</th>
                <th style={{ textAlign: 'right' }}>Tax %</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {(!invoice.invoice_lines || invoice.invoice_lines.length === 0) ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    No line items recorded for this invoice.
                  </td>
                </tr>
              ) : (
                invoice.invoice_lines.map((line) => (
                  <tr key={line.id}>
                    <td>
                      <strong>{line.product_name_snapshot}</strong>
                      {line.description && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{line.description}</div>}
                    </td>
                    <td style={{ textAlign: 'center' }}>{line.quantity}</td>
                    <td style={{ textAlign: 'right' }}>${Number(line.unit_price).toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>{Number(line.tax_percentage_snapshot).toFixed(1)}%</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>${Number(line.line_total).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
          <div style={{ width: '320px', background: 'var(--bg-card-subtle)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
            <table style={{ width: '100%', fontSize: '0.9rem' }}>
              <tbody>
                <tr>
                  <td style={{ color: 'var(--text-secondary)', padding: '0.3rem 0' }}>Subtotal:</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>${Number(invoice.subtotal).toFixed(2)}</td>
                </tr>
                {Number(invoice.discount_amount) > 0 && (
                  <tr>
                    <td style={{ color: 'var(--text-secondary)', padding: '0.3rem 0' }}>Discount:</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#0D9488' }}>
                      -${Number(invoice.discount_amount).toFixed(2)}
                    </td>
                  </tr>
                )}
                <tr>
                  <td style={{ color: 'var(--text-secondary)', padding: '0.3rem 0' }}>Taxes:</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>${Number(invoice.tax_amount).toFixed(2)}</td>
                </tr>
                <tr style={{ borderTop: '2px solid var(--border-light)' }}>
                  <td style={{ padding: '0.6rem 0 0.3rem', fontWeight: 700, fontSize: '1.05rem', color: 'var(--primary-navy)' }}>
                    Grand Total:
                  </td>
                  <td style={{ padding: '0.6rem 0 0.3rem', textAlign: 'right', fontWeight: 700, fontSize: '1.05rem', color: 'var(--primary-navy)' }}>
                    ${Number(invoice.grand_total).toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td style={{ color: 'var(--text-secondary)', padding: '0.3rem 0' }}>Amount Paid:</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: '#0D9488' }}>
                    ${Number(invoice.amount_paid).toFixed(2)}
                  </td>
                </tr>
                <tr style={{ borderTop: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '0.6rem 0 0.2rem', fontWeight: 700, color: hasOutstanding ? '#D97706' : '#0D9488' }}>
                    Balance Due:
                  </td>
                  <td style={{ padding: '0.6rem 0 0.2rem', textAlign: 'right', fontWeight: 700, fontSize: '1.1rem', color: hasOutstanding ? '#D97706' : '#0D9488' }}>
                    ${Number(invoice.outstanding_amount).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Terms & Notes */}
        {invoice.notes && (
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem', marginTop: '1rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Notes
            </span>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem' }}>{invoice.notes}</p>
          </div>
        )}
      </div>

      {/* Payment Transactions Section */}
      <div style={{ background: '#FFFFFF', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginBottom: '2rem', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Payment Transactions</h3>
            <small style={{ color: 'var(--text-muted)' }}>Payments allocated toward this invoice balance</small>
          </div>
          {hasOutstanding && invoice.status !== 'CANCELLED' && (
            <button
              onClick={() => {
                setPayAmount(String(invoice.outstanding_amount));
                setIsPaymentModalOpen(true);
              }}
              className="btn btn-outline btn-sm"
            >
              <CreditCard size={15} />
              <span>Record Payment</span>
            </button>
          )}
        </div>

        {(!invoice.payments || invoice.payments.length === 0) ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--bg-card-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No payments have been recorded for this invoice yet.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Payment #</th>
                  <th>Date</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th>Notes</th>
                  <th style={{ textAlign: 'right' }}>Amount Paid</th>
                </tr>
              </thead>
              <tbody>
                {invoice.payments.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.payment_number}</strong></td>
                    <td>{p.payment_date}</td>
                    <td><span className="badge badge-staff">{p.payment_method}</span></td>
                    <td>{p.reference_id || '—'}</td>
                    <td>{p.notes || '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#0D9488' }}>
                      +${Number(p.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Record Payment Modal */}
      {isPaymentModalOpen && (
        <div className="modal-backdrop" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(27, 60, 83, 0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem'
        }}>
          <div className="modal-container" style={{
            backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)',
            maxWidth: '520px', width: '100%', padding: '2rem', boxShadow: 'var(--shadow-lg)'
          }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Record Payment</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Allocate payment to Invoice {invoice.invoice_number} (Outstanding: ${Number(invoice.outstanding_amount).toFixed(2)})
            </p>

            {payError && (
              <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={16} />
                <span>{payError}</span>
              </div>
            )}

            <form onSubmit={handleRecordPaymentSubmit}>
              <div className="form-group">
                <label className="form-label">Payment Amount ($) <span className="required">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={Number(invoice.outstanding_amount)}
                  className="form-input"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method <span className="required">*</span></label>
                <select
                  className="form-input"
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  required
                >
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="BANK_TRANSFER">Bank Wire Transfer</option>
                  <option value="CASH">Cash</option>
                  <option value="CHECK">Check</option>
                  <option value="PAYPAL">PayPal</option>
                  <option value="STRIPE">Stripe</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Transaction / Reference ID</label>
                <input
                  type="text"
                  placeholder="e.g. TXN-99841 or Cheque #1024"
                  className="form-input"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  rows="2"
                  placeholder="Optional internal remarks"
                  className="form-input"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <input
                  type="checkbox"
                  id="sendReceipt"
                  checked={sendReceipt}
                  onChange={(e) => setSendReceipt(e.target.checked)}
                />
                <label htmlFor="sendReceipt" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
                  Send payment receipt email to customer ({invoice.customers?.email || 'N/A'})
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsPaymentModalOpen(false)}
                  disabled={processingAction}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={processingAction}
                  style={{ backgroundColor: '#0D9488', borderColor: '#0D9488' }}
                >
                  {processingAction ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Recording...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      <span>Confirm Payment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetail;
