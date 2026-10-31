import React, { useState, useEffect } from 'react';
import {
  CalendarClock,
  Play,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  X,
  FileText
} from 'lucide-react';
import { getDueSubscriptions, runBillingScheduler } from '../../../services/api';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

export const BillingRunModal = ({ isOpen, onClose, onComplete }) => {
  const [referenceDate, setReferenceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueSubscriptions, setDueSubscriptions] = useState([]);
  const [loadingDue, setLoadingDue] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadDueSubscriptions();
      setResults(null);
      setError(null);
    }
  }, [isOpen, referenceDate]);

  const loadDueSubscriptions = async () => {
    try {
      setLoadingDue(true);
      setError(null);
      const res = await getDueSubscriptions(referenceDate);
      if (res?.data) {
        setDueSubscriptions(res.data);
      }
    } catch (err) {
      console.warn('Could not load due subscriptions:', err.message);
      // Fallback empty list
      setDueSubscriptions([]);
    } finally {
      setLoadingDue(false);
    }
  };

  const handleRunScheduler = async () => {
    try {
      setExecuting(true);
      setError(null);
      const res = await runBillingScheduler(referenceDate);
      if (res?.success) {
        setResults(res.data);
        if (onComplete) onComplete();
      } else {
        setError(res?.message || 'Failed to complete billing execution.');
      }
    } catch (err) {
      setError(err?.message || 'Billing run encountered an error.');
    } finally {
      setExecuting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(27, 60, 83, 0.45)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div className="modal-container" style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-md)',
        maxWidth: '720px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: 'var(--shadow-lg)',
        padding: '2rem'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ backgroundColor: 'var(--primary-navy-soft)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', color: 'var(--primary-navy)' }}>
              <CalendarClock size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Automated Billing Scheduler</h2>
              <small style={{ color: 'var(--text-muted)' }}>Generate recurring invoices for active subscriptions due for billing</small>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '0.25rem' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Date Selector */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '1.5rem', background: 'var(--bg-card-subtle)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ flex: 1 }}>
            <label className="form-label" style={{ fontSize: '0.85rem' }}>Billing Cutoff Reference Date</label>
            <input
              type="date"
              className="form-input"
              value={referenceDate}
              onChange={(e) => setReferenceDate(e.target.value)}
              disabled={executing}
            />
          </div>
          <button
            onClick={loadDueSubscriptions}
            className="btn btn-outline"
            disabled={loadingDue || executing}
            title="Refresh due subscriptions"
          >
            <RefreshCw size={16} className={loadingDue ? 'spin' : ''} />
            <span>Check Due</span>
          </button>
        </div>

        {/* Subscriptions Preview */}
        {!results && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1rem', margin: 0 }}>
                Subscriptions Due for Billing ({dueSubscriptions.length})
              </h3>
              <small style={{ color: 'var(--text-muted)' }}>Duplicate prevention enforced automatically</small>
            </div>

            {loadingDue ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <LoadingSpinner />
                <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>Scanning active subscriptions...</p>
              </div>
            ) : dueSubscriptions.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)' }}>
                <CheckCircle size={32} style={{ color: '#0D9488', margin: '0 auto 0.5rem' }} />
                <p style={{ fontWeight: 600 }}>All subscriptions are up to date!</p>
                <small>No active subscriptions are currently due for billing on or before {referenceDate}.</small>
              </div>
            ) : (
              <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', maxHeight: '250px', overflowY: 'auto' }}>
                <table className="data-table" style={{ width: '100%', fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Subscription #</th>
                      <th>Customer</th>
                      <th>Frequency</th>
                      <th>Next Billing</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dueSubscriptions.map((sub) => (
                      <tr key={sub.id}>
                        <td>
                          <strong>{sub.subscription_number}</strong>
                        </td>
                        <td>{sub.customers?.name || sub.customers?.company_name || 'Customer'}</td>
                        <td>
                          <span className="badge badge-staff" style={{ fontSize: '0.7rem' }}>
                            {sub.billing_frequency}
                          </span>
                        </td>
                        <td>{sub.next_billing_date || sub.start_date}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          ${Number(sub.grand_total || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Results Screen */}
        {results && (
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 'var(--radius-sm)', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#166534' }}>
              <CheckCircle size={20} />
              <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#166534' }}>Billing Execution Completed</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', margin: '1rem 0' }}>
              <div style={{ background: '#FFFFFF', padding: '0.75rem', borderRadius: 'var(--radius-xs)', textAlign: 'center', border: '1px solid #BBF7D0' }}>
                <small style={{ color: 'var(--text-muted)' }}>Invoices Generated</small>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#166534' }}>{results.generatedCount}</div>
              </div>
              <div style={{ background: '#FFFFFF', padding: '0.75rem', borderRadius: 'var(--radius-xs)', textAlign: 'center', border: '1px solid #BBF7D0' }}>
                <small style={{ color: 'var(--text-muted)' }}>Duplicates Skipped</small>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#D97706' }}>{results.skippedDuplicateCount}</div>
              </div>
              <div style={{ background: '#FFFFFF', padding: '0.75rem', borderRadius: 'var(--radius-xs)', textAlign: 'center', border: '1px solid #BBF7D0' }}>
                <small style={{ color: 'var(--text-muted)' }}>Errors</small>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: results.errorCount > 0 ? '#DC2626' : '#166534' }}>{results.errorCount}</div>
              </div>
            </div>

            {results.generatedInvoices && results.generatedInvoices.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <small style={{ fontWeight: 600, color: '#166534' }}>Generated Invoices:</small>
                <ul style={{ margin: '0.5rem 0 0 1.25rem', fontSize: '0.85rem', color: '#166534' }}>
                  {results.generatedInvoices.map((inv, idx) => (
                    <li key={idx}>
                      Invoice <strong>{inv.invoiceNumber}</strong> generated for {inv.customer} (${Number(inv.amount).toFixed(2)})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
          <button onClick={onClose} className="btn btn-outline" disabled={executing}>
            {results ? 'Close' : 'Cancel'}
          </button>
          {!results && (
            <button
              onClick={handleRunScheduler}
              className="btn btn-primary"
              disabled={executing || dueSubscriptions.length === 0}
            >
              {executing ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Generating Invoices...</span>
                </>
              ) : (
                <>
                  <Play size={16} />
                  <span>Execute Billing Run ({dueSubscriptions.length})</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillingRunModal;
