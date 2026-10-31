import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building,
  Mail,
  Phone,
  FileSpreadsheet,
  RefreshCw,
  Edit2,
  Plus,
  MapPin,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { getCustomer } from '../../../services/api';
import { useToast } from '../../../components/common/Toast';
import Button from '../../../components/common/Button';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import CustomerModal from './CustomerModal';

export const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [customer, setCustomer] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const fetchCustomerData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCustomer(id);
      if (res.data) {
        setCustomer(res.data);
        setQuotations(res.data.quotations || []);
        setSubscriptions(res.data.subscriptions || []);
      }
    } catch (err) {
      console.error('Error loading customer:', err);
      addToast(err.message || 'Customer not found', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, addToast]);

  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData]);

  if (loading) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <LoadingSpinner size="large" color="dark" />
        <p style={{ marginTop: '1rem' }}>Loading customer profile...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="content-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <h3>Customer Not Found</h3>
        <p style={{ margin: '1rem 0' }}>The requested customer could not be found or has been removed.</p>
        <Button variant="primary" icon={ArrowLeft} onClick={() => navigate('/staff/customers')}>
          Back to Directory
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Top Breadcrumb & Action Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => navigate('/staff/customers')}
            className="btn btn-ghost btn-sm"
            style={{ padding: '0.4rem' }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2>{customer.name}</h2>
              {customer.status === 'ACTIVE' ? (
                <span className="badge badge-active">
                  <CheckCircle size={10} /> Active
                </span>
              ) : (
                <span className="badge badge-inactive">
                  <XCircle size={10} /> Inactive
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.875rem' }}>Customer ID: {customer.customer_number || customer.id}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            variant="outline"
            icon={Edit2}
            onClick={() => setEditModalOpen(true)}
          >
            Edit Profile
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => navigate(`/staff/quotations/new?customer_id=${customer.id}`)}
          >
            New Quotation
          </Button>
        </div>
      </div>

      {/* Profile Overview Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Contact Info Card */}
        <div className="content-card" style={{ marginBottom: 0 }}>
          <div className="card-title-row">
            <h4>Contact Details</h4>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={16} style={{ color: 'var(--text-muted)' }} />
              <div>
                <small style={{ color: 'var(--text-muted)', display: 'block' }}>Email Address</small>
                <strong>{customer.email}</strong>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Phone size={16} style={{ color: 'var(--text-muted)' }} />
              <div>
                <small style={{ color: 'var(--text-muted)', display: 'block' }}>Phone</small>
                <span>{customer.phone || 'Not provided'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building size={16} style={{ color: 'var(--text-muted)' }} />
              <div>
                <small style={{ color: 'var(--text-muted)', display: 'block' }}>Company</small>
                <span>{customer.company_name || 'Individual / None'}</span>
              </div>
            </div>
            {customer.tax_id && (
              <div>
                <small style={{ color: 'var(--text-muted)', display: 'block' }}>Tax Identification / GST</small>
                <code>{customer.tax_id}</code>
              </div>
            )}
          </div>
        </div>

        {/* Billing & Shipping Card */}
        <div className="content-card" style={{ marginBottom: 0 }}>
          <div className="card-title-row">
            <h4>Addresses & Timestamps</h4>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <MapPin size={16} style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }} />
              <div>
                <small style={{ color: 'var(--text-muted)', display: 'block' }}>Billing Address</small>
                <span>{customer.billing_address || 'No billing address specified.'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <MapPin size={16} style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }} />
              <div>
                <small style={{ color: 'var(--text-muted)', display: 'block' }}>Shipping Address</small>
                <span>{customer.shipping_address || 'Same as billing address.'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <Clock size={16} style={{ color: 'var(--text-muted)' }} />
              <div>
                <small style={{ color: 'var(--text-muted)', display: 'block' }}>Customer Since</small>
                <span>{customer.created_at ? new Date(customer.created_at).toLocaleDateString() : '—'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Associated Subscriptions Section */}
      <div className="content-card" style={{ marginBottom: '1.5rem', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4>Active & Past Subscriptions ({subscriptions.length})</h4>
          <Link to={`/staff/subscriptions?customer_id=${customer.id}`} className="btn btn-ghost btn-sm">
            View All Subscriptions
          </Link>
        </div>

        {subscriptions.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={28} style={{ margin: '0 auto 0.5rem', display: 'block' }} />
            No subscriptions linked to this customer yet.
          </div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subscription #</th>
                  <th>Plan Name</th>
                  <th>Frequency</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>End Date</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => navigate(`/staff/subscriptions/${s.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <strong style={{ color: 'var(--primary-navy)' }}>{s.subscription_number}</strong>
                    </td>
                    <td>{s.plan_name_snapshot || 'Custom Plan'}</td>
                    <td>
                      <span style={{ textTransform: 'capitalize' }}>{s.billing_frequency}</span>
                    </td>
                    <td>
                      <strong>${parseFloat(s.grand_total || 0).toFixed(2)}</strong>
                    </td>
                    <td>
                      <span className={`badge ${s.status === 'ACTIVE' ? 'badge-active' : s.status === 'CLOSED' ? 'badge-inactive' : 'badge-staff'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td>{s.end_date || 'Open-ended'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Associated Quotations Section */}
      <div className="content-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4>Quotations ({quotations.length})</h4>
          <Button
            variant="ghost"
            size="sm"
            icon={Plus}
            onClick={() => navigate(`/staff/quotations/new?customer_id=${customer.id}`)}
          >
            Create Quote
          </Button>
        </div>

        {quotations.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileSpreadsheet size={28} style={{ margin: '0 auto 0.5rem', display: 'block' }} />
            No quotations created for this customer yet.
          </div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Quotation #</th>
                  <th>Date</th>
                  <th>Validity Date</th>
                  <th>Grand Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {quotations.map((q) => (
                  <tr
                    key={q.id}
                    onClick={() => navigate(`/staff/quotations/${q.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <strong style={{ color: 'var(--primary-navy)' }}>{q.quotation_number}</strong>
                    </td>
                    <td>{q.quotation_date}</td>
                    <td>{q.validity_date}</td>
                    <td>
                      <strong>${parseFloat(q.grand_total || 0).toFixed(2)}</strong>
                    </td>
                    <td>
                      <span className={`badge ${q.status === 'ACCEPTED' ? 'badge-active' : q.status === 'EXPIRED' || q.status === 'REJECTED' ? 'badge-inactive' : 'badge-staff'}`}>
                        {q.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Edit Modal */}
      <CustomerModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        customer={customer}
        onSuccess={fetchCustomerData}
      />
    </div>
  );
};

export default CustomerDetail;

