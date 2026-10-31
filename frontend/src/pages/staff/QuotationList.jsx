import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileSpreadsheet,
  Search,
  Filter,
  PlusCircle,
  Eye,
  RefreshCw,
  Send,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';

export const QuotationList = () => {
  const { session } = useAuth();
  const { addToast } = useToast();

  const [quotations, setQuotations] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // New Quote Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const fetchQuotations = async () => {
    if (!session?.access_token) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const res = await fetch(`http://localhost:5000/api/staff/quotations?${params.toString()}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setQuotations(data.quotations || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.warn('Quotations list error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = async () => {
    setIsModalOpen(true);
    try {
      const [custRes, prodRes] = await Promise.all([
        fetch('http://localhost:5000/api/staff/customers?limit=100', {
          headers: { Authorization: `Bearer ${session?.access_token}` }
        }),
        fetch('http://localhost:5000/api/products?is_active=true&limit=100', {
          headers: { Authorization: `Bearer ${session?.access_token}` }
        })
      ]);
      const custData = await custRes.json();
      const prodData = await prodRes.json();
      if (custData.customers) setCustomers(custData.customers);
      if (prodData.products) setProducts(prodData.products);
    } catch (err) {
      console.warn('Modal preload error:', err.message);
    }
  };

  const handleCreateQuotation = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedProductId) {
      addToast('Please select both a customer and a product.', 'error');
      return;
    }

    try {
      setCreateLoading(true);
      const res = await fetch('http://localhost:5000/api/staff/quotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          customer_id: selectedCustomerId,
          items: [{ product_id: selectedProductId, quantity: parseInt(quantity, 10) || 1 }],
          discount_code: discountCode.trim() || null,
          notes
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create quotation.');

      addToast(data.message || 'Quotation created successfully.', 'success');
      setIsModalOpen(false);
      setSelectedCustomerId('');
      setSelectedProductId('');
      setQuantity(1);
      setDiscountCode('');
      setNotes('');
      fetchQuotations();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [session?.access_token, page, statusFilter]);

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--primary-navy)' }}>Staff Quotations Desk</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Draft proposals, configure product pricing & cadence plans, and dispatch to customers.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchQuotations} className="btn btn-outline btn-sm" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spinner' : ''} /> Refresh
          </button>
          <Button variant="primary" size="sm" icon={PlusCircle} onClick={openCreateModal}>
            Draft New Quotation
          </Button>
        </div>
      </div>

      <div className="content-card" style={{ padding: '1.5rem' }}>
        {/* Toolbar */}
        <div className="table-toolbar">
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
            <div className="input-wrapper" style={{ minWidth: '240px', flex: 1 }}>
              <span className="input-icon">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Search by quote number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input has-icon"
                style={{ padding: '0.55rem 0.85rem 0.55rem 2.3rem' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Filter size={15} color="var(--text-muted)" />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="filter-select"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="SENT">Sent</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Total <strong>{total}</strong> quotations
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem 0', textAlign: 'center' }}>
            <LoadingSpinner message="Loading quotation records..." />
          </div>
        ) : quotations.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No quotations found matching the query.
          </div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Quote #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Grand Total</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {quotations.map(q => (
                  <tr key={q.id}>
                    <td><code>{q.quotation_number}</code></td>
                    <td>
                      <strong>{q.customers?.name || 'Customer'}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{q.customers?.email}</div>
                    </td>
                    <td>{q.order_date || '—'}</td>
                    <td>
                      <span className={`badge badge-${q.status?.toLowerCase()}`}>
                        {q.status}
                      </span>
                    </td>
                    <td><strong style={{ color: 'var(--primary-navy)' }}>₹{q.grand_total}</strong></td>
                    <td style={{ textAlign: 'right' }}>
                      <Link to={`/staff/quotations/${q.id}`} className="action-btn" style={{ textDecoration: 'none' }}>
                        <Eye size={14} /> <span>Inspect</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-outline btn-sm">
              <ChevronLeft size={16} /> Previous
            </button>
            <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.875rem' }}>
              Page {page} of {totalPages}
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn btn-outline btn-sm">
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Draft New Quotation Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '580px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, color: 'var(--primary-navy)' }}>Generate New Customer Quotation</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateQuotation}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  Target Customer *
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="form-input"
                  required
                >
                  <option value="">-- Choose Customer Account --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  Selected Product *
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="form-input"
                  required
                >
                  <option value="">-- Choose Active Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (₹{p.sales_price})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    Discount Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. WELCOME10"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  Terms & Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Payment terms, validity remarks, or custom instructions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={createLoading} className="btn btn-primary">
                  {createLoading ? 'Generating...' : 'Create Draft Quotation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationList;

