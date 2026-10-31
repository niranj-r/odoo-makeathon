import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileSpreadsheet,
  Send,
  CheckCircle,
  XCircle,
  RefreshCw,
  Calendar,
  Clock,
  Building,
  Mail,
  Phone,
  ArrowRight,
  AlertTriangle,
  Download
} from 'lucide-react';
import {
  getQuotation,
  sendQuotation,
  acceptQuotation,
  rejectQuotation,
  convertQuotationToSubscription
} from '../../../services/api';
import { useToast } from '../../../components/common/Toast';
import Button from '../../../components/common/Button';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

export const QuotationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchQuotationData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getQuotation(id);
      if (res.data) {
        setQuotation(res.data);
      }
    } catch (err) {
      console.error('Error fetching quotation:', err);
      addToast(err.message || 'Quotation not found', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, addToast]);

  useEffect(() => {
    fetchQuotationData();
  }, [fetchQuotationData]);

  // Status Action Handlers
  const handleSend = async () => {
    setActionLoading(true);
    try {
      await sendQuotation(quotation.id);
      addToast('Quotation marked as Sent to customer.', 'success');
      fetchQuotationData();
    } catch (err) {
      console.error('Send error:', err);
      addToast(err.message || 'Failed to send quotation', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async () => {
    setActionLoading(true);
    try {
      await acceptQuotation(quotation.id);
      addToast('Quotation accepted successfully!', 'success');
      fetchQuotationData();
    } catch (err) {
      console.error('Accept error:', err);
      addToast(err.message || 'Failed to accept quotation', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = window.prompt('Enter optional rejection reason:');
    if (reason === null) return;

    setActionLoading(true);
    try {
      await rejectQuotation(quotation.id);
      addToast('Quotation rejected.', 'info');
      fetchQuotationData();
    } catch (err) {
      console.error('Reject error:', err);
      addToast(err.message || 'Failed to reject quotation', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertToSubscription = async () => {
    setActionLoading(true);
    try {
      const res = await convertQuotationToSubscription(quotation.id);
      addToast('Quotation successfully converted to Subscription!', 'success');
      if (res.data?.id) {
        navigate(`/staff/subscriptions/${res.data.id}`);
      } else {
        fetchQuotationData();
      }
    } catch (err) {
      console.error('Conversion error:', err);
      addToast(err.message || 'Failed to convert quotation to subscription', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <LoadingSpinner size="large" color="dark" />
        <p style={{ marginTop: '1rem' }}>Loading quotation...</p>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="content-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <h3>Quotation Not Found</h3>
        <p style={{ margin: '1rem 0' }}>The requested quotation could not be found.</p>
        <Button variant="primary" icon={ArrowLeft} onClick={() => navigate('/staff/quotations')}>
          Back to Quotations
        </Button>
      </div>
    );
  }

  const isExpired = quotation.status === 'EXPIRED' || (new Date(quotation.validity_date) < new Date() && ['DRAFT', 'SENT'].includes(quotation.status));

  return (
    <div>
      {/* Top Header & Actions Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => navigate('/staff/quotations')}
            className="btn btn-ghost btn-sm"
            style={{ padding: '0.4rem' }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2>{quotation.quotation_number}</h2>
              <span className={`badge ${quotation.status === 'ACCEPTED' ? 'badge-active' : quotation.status === 'SENT' ? 'badge-customer' : quotation.status === 'EXPIRED' || quotation.status === 'REJECTED' ? 'badge-inactive' : 'badge-staff'}`}>
                {quotation.status}
              </span>
              {isExpired && quotation.status !== 'EXPIRED' && (
                <span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#B45309' }}>
                  <AlertTriangle size={10} /> Expired
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.875rem' }}>Created on {quotation.quotation_date}</p>
          </div>
        </div>

        {/* Dynamic Action Buttons based on status */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {quotation.status === 'DRAFT' && (
            <>
              <Button
                variant="outline"
                icon={Send}
                loading={actionLoading}
                onClick={handleSend}
              >
                Mark as Sent
              </Button>
              <Button
                variant="primary"
                icon={CheckCircle}
                loading={actionLoading}
                onClick={handleAccept}
              >
                Accept Quote
              </Button>
              <Button
                variant="ghost"
                icon={XCircle}
                style={{ color: '#DC2626' }}
                loading={actionLoading}
                onClick={handleReject}
              >
                Reject
              </Button>
            </>
          )}

          {quotation.status === 'SENT' && (
            <>
              <Button
                variant="primary"
                icon={CheckCircle}
                loading={actionLoading}
                onClick={handleAccept}
              >
                Accept Quote
              </Button>
              <Button
                variant="outline"
                icon={XCircle}
                style={{ color: '#DC2626' }}
                loading={actionLoading}
                onClick={handleReject}
              >
                Reject
              </Button>
            </>
          )}

          {quotation.status === 'ACCEPTED' && (
            <Button
              variant="primary"
              icon={ArrowRight}
              loading={actionLoading}
              onClick={handleConvertToSubscription}
            >
              Convert to Subscription
            </Button>
          )}

          <Button
            variant="outline"
            icon={Download}
            onClick={() => window.print()}
          >
            Print / PDF
          </Button>
        </div>
      </div>

      {/* Main Quotation Document Card */}
      <div className="content-card" style={{ padding: '2.5rem', marginBottom: '1.5rem' }}>
        {/* Document Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--border-light)', paddingBottom: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', color: 'var(--primary-navy)', marginBottom: '0.25rem' }}>QUOTATION</h1>
            <strong style={{ fontSize: '1.1rem', color: 'var(--primary-navy-light)' }}>
              {quotation.quotation_number}
            </strong>
          </div>

          <div style={{ textAlign: 'right', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <div><strong>Issue Date:</strong> {quotation.quotation_date}</div>
            <div><strong>Valid Until:</strong> {quotation.validity_date}</div>
            <div><strong>Payment Terms:</strong> {quotation.payment_terms || 'Due on receipt'}</div>
          </div>
        </div>

        {/* Customer and Company Information */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
              Quotation Prepared For:
            </span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-navy)' }}>
              {quotation.customers?.name}
            </div>
            {quotation.customers?.company_name && (
              <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                {quotation.customers.company_name}
              </div>
            )}
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              {quotation.customers?.email}
            </div>
            {quotation.customers?.phone && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {quotation.customers.phone}
              </div>
            )}
            {quotation.customers?.billing_address && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                {quotation.customers.billing_address}
              </div>
            )}
          </div>

          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
              Issued By:
            </span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-navy)' }}>
              Brightloop Platform
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Cloud Billing & Subscription Services
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              billing@brightloop.io
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div style={{ marginBottom: '2rem' }}>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Description</th>
                <th style={{ textAlign: 'center' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Unit Price</th>
                <th style={{ textAlign: 'right' }}>Tax %</th>
                <th style={{ textAlign: 'right' }}>Tax ($)</th>
                <th style={{ textAlign: 'right' }}>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {(quotation.lines || []).map((line) => (
                <tr key={line.id}>
                  <td>
                    <strong>{line.product_name_snapshot}</strong>
                  </td>
                  <td style={{ textAlign: 'center' }}>{line.quantity}</td>
                  <td style={{ textAlign: 'right' }}>
                    ${parseFloat(line.unit_price || 0).toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {parseFloat(line.tax_percentage_snapshot || 0)}%
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    ${parseFloat(line.line_tax || 0).toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>
                    ${parseFloat(line.line_total || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary & Grand Total */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
          <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.95rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
              <span>${parseFloat(quotation.subtotal || 0).toFixed(2)}</span>
            </div>

            {parseFloat(quotation.discount_amount || 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#137333' }}>
                <span>Discount Applied:</span>
                <span>-${parseFloat(quotation.discount_amount).toFixed(2)}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Tax Total:</span>
              <span>${parseFloat(quotation.tax_amount || 0).toFixed(2)}</span>
            </div>

            <div
              style={{
                borderTop: '2px solid var(--border-light)',
                paddingTop: '0.75rem',
                marginTop: '0.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <strong style={{ fontSize: '1.1rem', color: 'var(--primary-navy)' }}>Grand Total:</strong>
              <strong style={{ fontSize: '1.4rem', color: 'var(--primary-navy)' }}>
                ${parseFloat(quotation.grand_total || 0).toFixed(2)}
              </strong>
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        {quotation.terms_and_conditions && (
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--primary-navy)', display: 'block', marginBottom: '0.35rem' }}>
              Terms & Conditions:
            </strong>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{quotation.terms_and_conditions}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuotationDetail;

