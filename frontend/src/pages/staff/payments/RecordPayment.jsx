import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  CreditCard,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  DollarSign,
  FileText
} from 'lucide-react';
import { getInvoices, recordPayment } from '../../../services/api';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

export const RecordPayment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedInvoiceId = searchParams.get('invoice_id');

  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form Fields
  const [invoiceId, setInvoiceId] = useState(preselectedInvoiceId || '');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CREDIT_CARD');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [referenceId, setReferenceId] = useState('');
  const [notes, setNotes] = useState('');
  const [sendReceipt, setSendReceipt] = useState(true);

  useEffect(() => {
    loadOpenInvoices();
  }, []);

  useEffect(() => {
    if (invoiceId && invoices.length > 0) {
      const found = invoices.find((inv) => inv.id === invoiceId);
      if (found) {
        setSelectedInvoice(found);
        setAmount(String(found.outstanding_amount || ''));
      }
    }
  }, [invoiceId, invoices]);

  const loadOpenInvoices = async () => {
    try {
      setLoadingInvoices(true);
      const res = await getInvoices({ limit: 100 });
      if (res?.data) {
        // Filter invoices that have an unpaid balance
        const openList = res.data.filter(
          (inv) => Number(inv.outstanding_amount || 0) > 0.001 && inv.status !== 'CANCELLED'
        );
        setInvoices(openList);

        if (preselectedInvoiceId) {
          const pre = openList.find((i) => i.id === preselectedInvoiceId);
          if (pre) {
            setSelectedInvoice(pre);
            setAmount(String(pre.outstanding_amount || ''));
          }
        }
      }
    } catch (err) {
      setError(err?.message || 'Failed to load invoices.');
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!invoiceId) {
      setError('Please select an invoice to apply this payment.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Payment amount must be greater than zero.');
      return;
    }

    if (selectedInvoice && numAmount > Number(selectedInvoice.outstanding_amount) + 0.001) {
      setError(`Payment cannot exceed outstanding balance of $${Number(selectedInvoice.outstanding_amount).toFixed(2)}.`);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const res = await recordPayment({
        invoice_id: invoiceId,
        amount: numAmount,
        payment_method: paymentMethod,
        payment_date: paymentDate,
        reference_id: referenceId,
        notes,
        send_receipt: sendReceipt
      });

      navigate(`/staff/invoices/${invoiceId}`);
    } catch (err) {
      setError(err?.message || 'Failed to record payment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInvoices) {
    return (
      <div className="page-container" style={{ padding: '3rem', textAlign: 'center' }}>
        <LoadingSpinner />
        <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)' }}>Loading receivable balances...</p>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ padding: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button onClick={() => navigate(-1)} className="btn btn-outline btn-sm">
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
        <div>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Record Customer Payment</h1>
          <small style={{ color: 'var(--text-muted)' }}>Apply cash, cheque, or electronic funds to open invoices</small>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ background: '#FFFFFF', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <div className="form-group">
            <label className="form-label">Select Open Invoice <span className="required">*</span></label>
            <select
              className="form-input"
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              required
            >
              <option value="">-- Choose an Open Invoice with Outstanding Balance --</option>
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoice_number} - {inv.customers?.name || 'Customer'} (Due: ${Number(inv.outstanding_amount).toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {/* Selected Invoice Details Card */}
          {selectedInvoice && (
            <div style={{ background: 'var(--bg-card-subtle)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '1.25rem', margin: '1rem 0 1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Customer
                  </span>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-navy)' }}>
                    {selectedInvoice.customers?.name}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {selectedInvoice.customers?.email}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Outstanding Balance
                  </span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#D97706' }}>
                    ${Number(selectedInvoice.outstanding_amount).toFixed(2)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Grand Total: </span>
                  <strong>${Number(selectedInvoice.grand_total).toFixed(2)}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Already Paid: </span>
                  <strong style={{ color: '#0D9488' }}>${Number(selectedInvoice.amount_paid).toFixed(2)}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Due Date: </span>
                  <strong>{selectedInvoice.due_date}</strong>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Payment Amount ($) <span className="required">*</span></label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={selectedInvoice ? Number(selectedInvoice.outstanding_amount) : undefined}
                className="form-input"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              {selectedInvoice && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
                  <button
                    type="button"
                    onClick={() => setAmount(String(selectedInvoice.outstanding_amount))}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.1rem 0.4rem', color: '#0D9488' }}
                  >
                    Pay Full (${Number(selectedInvoice.outstanding_amount).toFixed(2)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmount((Number(selectedInvoice.outstanding_amount) / 2).toFixed(2))}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.1rem 0.4rem' }}
                  >
                    Pay 50%
                  </button>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Payment Method <span className="required">*</span></label>
              <select
                className="form-input"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
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
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Reference ID / Cheque #</label>
              <input
                type="text"
                placeholder="e.g. TXN-10024, CHQ-482"
                className="form-input"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '0.5rem' }}>
            <label className="form-label">Notes & Internal Memo</label>
            <textarea
              rows="3"
              placeholder="Optional notes about the transaction..."
              className="form-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1rem 0' }}>
            <input
              type="checkbox"
              id="sendReceiptCheckbox"
              checked={sendReceipt}
              onChange={(e) => setSendReceipt(e.target.checked)}
            />
            <label htmlFor="sendReceiptCheckbox" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>
              Email official payment confirmation receipt to customer
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => navigate('/staff/payments')}
            className="btn btn-outline"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ backgroundColor: '#0D9488', borderColor: '#0D9488' }}
          >
            {submitting ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Recording Payment...</span>
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                <span>Submit & Apply Payment</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RecordPayment;

