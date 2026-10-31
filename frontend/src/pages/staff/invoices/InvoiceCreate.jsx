import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileText,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Building2
} from 'lucide-react';
import {
  getCustomers,
  getCatalogProducts,
  getCatalogTaxes,
  createInvoice
} from '../../../services/api';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

export const InvoiceCreate = () => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form Fields
  const [customerId, setCustomerId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });
  const [paymentTerms, setPaymentTerms] = useState('Due on receipt');
  const [notes, setNotes] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);

  // Line Items
  const [lines, setLines] = useState([
    {
      product_id: '',
      product_name_snapshot: '',
      quantity: 1,
      unit_price: 0,
      tax_percentage_snapshot: 0,
      tax_id: null
    }
  ]);

  useEffect(() => {
    loadPrerequisites();
  }, []);

  const loadPrerequisites = async () => {
    try {
      setLoadingData(true);
      const [custRes, prodList, taxList] = await Promise.all([
        getCustomers({ limit: 100 }),
        getCatalogProducts(),
        getCatalogTaxes()
      ]);

      if (custRes?.data) setCustomers(custRes.data);
      if (prodList) setProducts(prodList);
      if (taxList) setTaxes(taxList);
    } catch (err) {
      setError(err?.message || 'Failed to load customers or products.');
    } finally {
      setLoadingData(false);
    }
  };

  const handleLineProductChange = (index, productId) => {
    const updated = [...lines];
    const selectedProd = products.find((p) => p.id === productId);

    if (selectedProd) {
      updated[index].product_id = selectedProd.id;
      updated[index].product_name_snapshot = selectedProd.name;
      updated[index].unit_price = Number(selectedProd.sales_price || selectedProd.unit_price || 0);
    } else {
      updated[index].product_id = '';
      updated[index].product_name_snapshot = '';
      updated[index].unit_price = 0;
    }

    setLines(updated);
  };

  const handleLineChange = (index, field, value) => {
    const updated = [...lines];
    updated[index][field] = value;
    setLines(updated);
  };

  const addLine = () => {
    setLines([
      ...lines,
      {
        product_id: '',
        product_name_snapshot: '',
        quantity: 1,
        unit_price: 0,
        tax_percentage_snapshot: 0,
        tax_id: null
      }
    ]);
  };

  const removeLine = (index) => {
    if (lines.length === 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  // Live Totals Calculation
  let subtotal = 0;
  let taxTotal = 0;

  lines.forEach((l) => {
    const qty = parseInt(l.quantity, 10) || 0;
    const price = parseFloat(l.unit_price) || 0;
    const taxPct = parseFloat(l.tax_percentage_snapshot) || 0;

    const lineSub = qty * price;
    const lineTax = lineSub * (taxPct / 100);

    subtotal += lineSub;
    taxTotal += lineTax;
  });

  const numDiscount = Math.min(parseFloat(discountAmount) || 0, subtotal);
  const grandTotal = Math.max(0, subtotal - numDiscount) + taxTotal;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerId) {
      setError('Please select a customer.');
      return;
    }

    for (const l of lines) {
      if (!l.product_name_snapshot) {
        setError('Please enter a description/name for all line items.');
        return;
      }
      if (Number(l.quantity) <= 0) {
        setError('Quantity must be at least 1.');
        return;
      }
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        customer_id: customerId,
        invoice_date: invoiceDate,
        due_date: dueDate,
        payment_terms: paymentTerms,
        discount_amount: numDiscount,
        notes,
        lines: lines.map((l) => ({
          product_id: l.product_id || null,
          product_name_snapshot: l.product_name_snapshot,
          quantity: parseInt(l.quantity, 10),
          unit_price: parseFloat(l.unit_price) || 0,
          tax_percentage_snapshot: parseFloat(l.tax_percentage_snapshot) || 0,
          tax_id: l.tax_id || null
        }))
      };

      const res = await createInvoice(payload);
      if (res?.data?.id) {
        navigate(`/staff/invoices/${res.data.id}`);
      } else {
        navigate('/staff/invoices');
      }
    } catch (err) {
      setError(err?.message || 'Failed to create invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="page-container" style={{ padding: '3rem', textAlign: 'center' }}>
        <LoadingSpinner />
        <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)' }}>Preparing invoice builder...</p>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ padding: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button onClick={() => navigate('/staff/invoices')} className="btn btn-outline btn-sm">
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
        <div>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Create New Invoice</h1>
          <small style={{ color: 'var(--text-muted)' }}>Manual commercial invoice generation</small>
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
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
            Invoice Header
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Customer <span className="required">*</span></label>
              <select
                className="form-input"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
              >
                <option value="">Select a Customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company_name ? `(${c.company_name})` : ''} - {c.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Terms</label>
              <select
                className="form-input"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
              >
                <option value="Due on receipt">Due on receipt</option>
                <option value="Net 15">Net 15 Days</option>
                <option value="Net 30">Net 30 Days</option>
                <option value="Net 60">Net 60 Days</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Invoice Date</label>
              <input
                type="date"
                className="form-input"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Payment Due Date</label>
              <input
                type="date"
                className="form-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div style={{ background: '#FFFFFF', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Itemized Line Items</h3>
            <button type="button" onClick={addLine} className="btn btn-outline btn-sm">
              <Plus size={15} />
              <span>Add Item</span>
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Product / Description</th>
                  <th style={{ width: '12%', textAlign: 'center' }}>Qty</th>
                  <th style={{ width: '18%', textAlign: 'right' }}>Unit Price ($)</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>Tax %</th>
                  <th style={{ width: '10%', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={idx}>
                    <td>
                      {products.length > 0 && (
                        <select
                          className="form-input"
                          style={{ marginBottom: '0.35rem', fontSize: '0.85rem' }}
                          value={line.product_id || ''}
                          onChange={(e) => handleLineProductChange(idx, e.target.value)}
                        >
                          <option value="">-- Choose from Catalog or Type Custom --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (${Number(p.sales_price || p.unit_price || 0).toFixed(2)})
                            </option>
                          ))}
                        </select>
                      )}
                      <input
                        type="text"
                        placeholder="Item name / description"
                        className="form-input"
                        value={line.product_name_snapshot}
                        onChange={(e) => handleLineChange(idx, 'product_name_snapshot', e.target.value)}
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        className="form-input"
                        style={{ textAlign: 'center' }}
                        value={line.quantity}
                        onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-input"
                        style={{ textAlign: 'right' }}
                        value={line.unit_price}
                        onChange={(e) => handleLineChange(idx, 'unit_price', e.target.value)}
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        className="form-input"
                        style={{ textAlign: 'right' }}
                        value={line.tax_percentage_snapshot}
                        onChange={(e) => handleLineChange(idx, 'tax_percentage_snapshot', e.target.value)}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        className="btn btn-ghost btn-sm"
                        disabled={lines.length === 1}
                        style={{ color: '#DC2626' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals & Notes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ background: '#FFFFFF', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
            <label className="form-label">Notes & Payment Instructions</label>
            <textarea
              rows="4"
              className="form-input"
              placeholder="e.g. Bank transfer details, project references..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.4rem' }}>
              Totals Summary
            </h3>
            <table style={{ width: '100%', fontSize: '0.9rem' }}>
              <tbody>
                <tr>
                  <td style={{ color: 'var(--text-secondary)', padding: '0.3rem 0' }}>Subtotal:</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>${subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={{ color: 'var(--text-secondary)', padding: '0.3rem 0' }}>Discount ($):</td>
                  <td style={{ textAlign: 'right' }}>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={subtotal}
                      style={{ width: '110px', textAlign: 'right', padding: '0.25rem 0.5rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xs)' }}
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td style={{ color: 'var(--text-secondary)', padding: '0.3rem 0' }}>Taxes:</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>${taxTotal.toFixed(2)}</td>
                </tr>
                <tr style={{ borderTop: '2px solid var(--primary-navy)' }}>
                  <td style={{ padding: '0.6rem 0', fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary-navy)' }}>
                    Grand Total:
                  </td>
                  <td style={{ padding: '0.6rem 0', textAlign: 'right', fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary-navy)' }}>
                    ${grandTotal.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Submit Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => navigate('/staff/invoices')}
            className="btn btn-outline"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Creating Invoice...</span>
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                <span>Save Invoice (Draft)</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceCreate;
