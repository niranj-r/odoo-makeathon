import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users,
  ArrowLeft,
  Layers,
  FileSpreadsheet,
  Receipt,
  CreditCard,
  Edit2,
  Save,
  Mail,
  Phone,
  Building,
  MapPin,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import InputField from '../../components/forms/InputField';

export const CustomerDetail = () => {
  const { id } = useParams();
  const { session } = useAuth();
  const { addToast } = useToast();

  const [customer, setCustomer] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [activeTab, setActiveTab] = useState('subscriptions');
  const [loading, setLoading] = useState(true);

  // Edit details state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  const fetchCustomerDetails = async () => {
    if (!session?.access_token || !id) return;
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/staff/customers/${id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setCustomer(data.customer);
        setSubscriptions(data.subscriptions || []);
        setQuotations(data.quotations || []);
        setInvoices(data.invoices || []);
        setPayments(data.payments || []);

        setEditName(data.customer.name || '');
        setEditPhone(data.customer.phone || '');
        setEditCompany(data.customer.company_name || '');
        setEditAddress(data.customer.billing_address || '');
        setEditNotes(data.customer.notes || '');
      }
    } catch (err) {
      console.warn('Customer detail error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerDetails();
  }, [id, session?.access_token]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSaveLoading(true);
      const res = await fetch(`http://localhost:5000/api/staff/customers/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          name: editName,
          phone: editPhone,
          company_name: editCompany,
          billing_address: editAddress,
          notes: editNotes
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save customer.');

      setCustomer(data.customer);
      setIsEditing(false);
      addToast('Customer details updated successfully.', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem 0', textAlign: 'center' }}>
        <LoadingSpinner message="Loading customer account records..." />
      </div>
    );
  }

  if (!customer) {
    return (
      <div style={{ padding: '2rem' }}>
        <Link to="/staff/customers" className="btn btn-secondary btn-sm">
          <ArrowLeft size={16} /> Back to Customers
        </Link>
        <div className="alert alert-danger" style={{ marginTop: '1rem' }}>
          Customer profile could not be found.
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Top Banner */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/staff/customers" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          <ArrowLeft size={16} /> Back to Customer Directory
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.75rem', color: 'var(--primary-navy)' }}>{customer.name}</h1>
              <span className={`badge badge-${customer.status?.toLowerCase() === 'active' ? 'active' : 'inactive'}`}>
                {customer.status}
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)' }}>
              Client ID: <code>{customer.customer_number || customer.id}</code>
            </p>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="btn btn-outline btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Edit2 size={14} /> {isEditing ? 'Cancel Editing' : 'Edit Customer Info'}
          </button>
        </div>
      </div>

      {/* Editable Profile or Information Grid */}
      {isEditing ? (
        <div className="content-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--primary-navy)' }}>Edit Client Profile</h3>
          <form onSubmit={handleSaveProfile}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <InputField
                id="edit-cust-name"
                name="name"
                label="Full Name / Primary Contact"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
              <InputField
                id="edit-cust-company"
                name="company"
                label="Company / Legal Entity"
                value={editCompany}
                onChange={(e) => setEditCompany(e.target.value)}
              />
              <InputField
                id="edit-cust-phone"
                name="phone"
                label="Telephone / Mobile"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
              />
              <InputField
                id="edit-cust-address"
                name="address"
                label="Billing Address"
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
              />
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                Operational & Account Notes
              </label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="form-input"
                rows={3}
                placeholder="Special customer requests, preferred contact channels, or account remarks..."
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary btn-sm">
                Cancel
              </button>
              <button type="submit" disabled={saveLoading} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <Save size={14} /> {saveLoading ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="content-card" style={{ padding: '1.25rem' }}>
            <small style={{ color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>Email Address</small>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, marginTop: '0.2rem' }}>
              <Mail size={15} color="var(--primary-navy)" /> {customer.email}
            </div>
          </div>
          <div className="content-card" style={{ padding: '1.25rem' }}>
            <small style={{ color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>Phone Number</small>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, marginTop: '0.2rem' }}>
              <Phone size={15} color="var(--primary-navy)" /> {customer.phone || '—'}
            </div>
          </div>
          <div className="content-card" style={{ padding: '1.25rem' }}>
            <small style={{ color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>Company</small>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, marginTop: '0.2rem' }}>
              <Building size={15} color="var(--primary-navy)" /> {customer.company_name || '—'}
            </div>
          </div>
          <div className="content-card" style={{ padding: '1.25rem' }}>
            <small style={{ color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>Billing Address</small>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, marginTop: '0.2rem' }}>
              <MapPin size={15} color="var(--primary-navy)" /> {customer.billing_address || '—'}
            </div>
          </div>
        </div>
      )}

      {/* Linked Relationship Navigation Tabs */}
      <div className="content-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', gap: '1rem', marginBottom: '1.5rem' }}>
          <button
            onClick={() => setActiveTab('subscriptions')}
            style={{
              padding: '0.6rem 1rem',
              fontWeight: 700,
              fontSize: '0.9rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'subscriptions' ? '3px solid var(--primary-navy)' : '3px solid transparent',
              color: activeTab === 'subscriptions' ? 'var(--primary-navy)' : 'var(--text-muted)'
            }}
          >
            Subscriptions ({subscriptions.length})
          </button>
          <button
            onClick={() => setActiveTab('quotations')}
            style={{
              padding: '0.6rem 1rem',
              fontWeight: 700,
              fontSize: '0.9rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'quotations' ? '3px solid var(--primary-navy)' : '3px solid transparent',
              color: activeTab === 'quotations' ? 'var(--primary-navy)' : 'var(--text-muted)'
            }}
          >
            Quotations ({quotations.length})
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            style={{
              padding: '0.6rem 1rem',
              fontWeight: 700,
              fontSize: '0.9rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'invoices' ? '3px solid var(--primary-navy)' : '3px solid transparent',
              color: activeTab === 'invoices' ? 'var(--primary-navy)' : 'var(--text-muted)'
            }}
          >
            Invoices ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            style={{
              padding: '0.6rem 1rem',
              fontWeight: 700,
              fontSize: '0.9rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'payments' ? '3px solid var(--primary-navy)' : '3px solid transparent',
              color: activeTab === 'payments' ? 'var(--primary-navy)' : 'var(--text-muted)'
            }}
          >
            Payments ({payments.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'subscriptions' && (
          <div>
            {subscriptions.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
                No subscription contracts associated with this customer.
              </p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Subscription #</th>
                    <th>Cadence</th>
                    <th>Status</th>
                    <th>Next Billing</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map(s => (
                    <tr key={s.id}>
                      <td><code>{s.subscription_number}</code></td>
                      <td style={{ textTransform: 'capitalize' }}>{s.billing_frequency}</td>
                      <td><span className={`badge badge-${s.status?.toLowerCase()}`}>{s.status}</span></td>
                      <td>{s.next_billing_date || '—'}</td>
                      <td>
                        <Link to={`/staff/subscriptions/${s.id}`} className="action-btn">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'quotations' && (
          <div>
            {quotations.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
                No quotations on file for this customer.
              </p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Quote #</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Grand Total</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {quotations.map(q => (
                    <tr key={q.id}>
                      <td><code>{q.quotation_number}</code></td>
                      <td>{q.order_date}</td>
                      <td><span className={`badge badge-${q.status?.toLowerCase()}`}>{q.status}</span></td>
                      <td>₹{q.grand_total}</td>
                      <td>
                        <Link to={`/staff/quotations/${q.id}`} className="action-btn">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'invoices' && (
          <div>
            {invoices.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
                No invoices generated for this customer.
              </p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Due Date</th>
                    <th>Payment Status</th>
                    <th>Amount</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id}>
                      <td><code>{inv.invoice_number}</code></td>
                      <td>{inv.due_date}</td>
                      <td><span className={`badge badge-${inv.payment_status?.toLowerCase()}`}>{inv.payment_status}</span></td>
                      <td>₹{inv.grand_total}</td>
                      <td>
                        <Link to={`/staff/invoices/${inv.id}`} className="action-btn">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'payments' && (
          <div>
            {payments.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
                No payments recorded for this customer.
              </p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Payment #</th>
                    <th>Date</th>
                    <th>Method</th>
                    <th>Amount</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id}>
                      <td><code>{p.payment_number}</code></td>
                      <td>{p.payment_date}</td>
                      <td>{p.payment_method || 'Online'}</td>
                      <td>₹{p.amount}</td>
                      <td>
                        <Link to={`/staff/payments/${p.id}`} className="action-btn">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDetail;

