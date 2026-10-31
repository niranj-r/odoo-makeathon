import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Send,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  Calculator
} from 'lucide-react';
import {
  getCustomers,
  getTemplates,
  getTemplate,
  getCatalogProducts,
  getCatalogTaxes,
  createQuotation
} from '../../../services/api';
import { useToast } from '../../../components/common/Toast';
import Button from '../../../components/common/Button';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

export const QuotationBuilder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();

  const preselectedCustomerId = searchParams.get('customer_id') || '';

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Catalog data
  const [customers, setCustomers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [products, setProducts] = useState([]);
  const [taxes, setTaxes] = useState([]);

  // Form State
  const [customerId, setCustomerId] = useState(preselectedCustomerId);
  const [templateId, setTemplateId] = useState('');
  const [quotationDate, setQuotationDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [validityDays, setValidityDays] = useState(30);
  const [paymentTerms, setPaymentTerms] = useState('Due on receipt');
  const [termsAndConditions, setTermsAndConditions] = useState('Standard Brightloop terms and service conditions apply.');
  const [discountAmount, setDiscountAmount] = useState(0);

  // Line Items: [{ product_id, quantity, unit_price, tax_id, tax_percentage }]
  const [lines, setLines] = useState([]);

  // Calculate validity date derived from quotationDate + validityDays
  const validityDate = useMemo(() => {
    if (!quotationDate) return '';
    const d = new Date(quotationDate);
    d.setDate(d.getDate() + (parseInt(validityDays, 10) || 30));
    return d.toISOString().split('T')[0];
  }, [quotationDate, validityDays]);

  // Load catalogs on mount
  useEffect(() => {
    const loadCatalogs = async () => {
      setLoadingInitial(true);
      try {
        const [custRes, tmplRes, prodData, taxData] = await Promise.all([
          getCustomers({ limit: 100, status: 'ACTIVE' }),
          getTemplates(),
          getCatalogProducts(),
          getCatalogTaxes()
        ]);

        setCustomers(custRes.data || []);
        setTemplates(tmplRes.data || []);
        setProducts(prodData || []);
        setTaxes(taxData || []);

        // Initialize with 1 empty line item if products exist
        if (prodData && prodData.length > 0) {
          const firstProd = prodData[0];
          const firstTax = taxData && taxData.length > 0 ? taxData[0] : null;
          setLines([
            {
              product_id: firstProd.id,
              quantity: 1,
              unit_price: parseFloat(firstProd.unit_price || 0),
              tax_id: firstTax ? firstTax.id : null,
              tax_percentage: firstTax ? parseFloat(firstTax.percentage || 0) : 0
            }
          ]);
        }
      } catch (err) {
        console.error('Error loading quotation builder catalogs:', err);
        addToast('Failed to load required catalog data.', 'error');
      } finally {
        setLoadingInitial(false);
      }
    };

    loadCatalogs();
  }, [addToast]);

  // Handle template selection & prefill
  const handleTemplateChange = async (selectedTmplId) => {
    setTemplateId(selectedTmplId);
    if (!selectedTmplId) return;

    try {
      const tmpl = await getTemplate(selectedTmplId);
      if (tmpl.data) {
        if (tmpl.data.validity_days) setValidityDays(tmpl.data.validity_days);
        if (tmpl.data.payment_terms) setPaymentTerms(tmpl.data.payment_terms);
        if (tmpl.data.terms_and_conditions) setTermsAndConditions(tmpl.data.terms_and_conditions);

        // Prefill lines if template contains presets
        if (tmpl.data.lines && tmpl.data.lines.length > 0) {
          const presetLines = tmpl.data.lines.map((l) => {
            const matchedProd = products.find((p) => p.id === l.product_id);
            return {
              product_id: l.product_id,
              quantity: l.quantity || 1,
              unit_price: parseFloat(matchedProd?.unit_price || 0),
              tax_id: taxes[0]?.id || null,
              tax_percentage: taxes[0] ? parseFloat(taxes[0].percentage || 0) : 0
            };
          });
          setLines(presetLines);
        }
        addToast(`Applied template: ${tmpl.data.name}`, 'info');
      }
    } catch (err) {
      console.warn('Failed to load template details:', err);
    }
  };

  // Add line item
  const handleAddLine = () => {
    if (products.length === 0) {
      addToast('No products available to add.', 'warning');
      return;
    }
    const prod = products[0];
    const tax = taxes.length > 0 ? taxes[0] : null;
    setLines((prev) => [
      ...prev,
      {
        product_id: prod.id,
        quantity: 1,
        unit_price: parseFloat(prod.unit_price || 0),
        tax_id: tax ? tax.id : null,
        tax_percentage: tax ? parseFloat(tax.percentage || 0) : 0
      }
    ]);
  };

  // Remove line item
  const handleRemoveLine = (index) => {
    if (lines.length <= 1) {
      addToast('Quotation must contain at least 1 line item.', 'warning');
      return;
    }
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  // Line change
  const handleLineChange = (index, field, value) => {
    setLines((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };

      if (field === 'product_id') {
        item.product_id = value;
        const matched = products.find((p) => p.id === value);
        if (matched) {
          item.unit_price = parseFloat(matched.unit_price || 0);
        }
      } else if (field === 'quantity') {
        item.quantity = Math.max(1, parseInt(value, 10) || 1);
      } else if (field === 'tax_id') {
        item.tax_id = value || null;
        const matchedTax = taxes.find((t) => t.id === value);
        item.tax_percentage = matchedTax ? parseFloat(matchedTax.percentage || 0) : 0;
      }

      updated[index] = item;
      return updated;
    });
  };

  // Real-time preview calculation (Zero trust UI: purely cosmetic preview)
  const previewTotals = useMemo(() => {
    let subtotal = 0;
    let taxAmount = 0;

    lines.forEach((l) => {
      const lineSubtotal = (l.quantity || 1) * (l.unit_price || 0);
      const lineTax = lineSubtotal * ((l.tax_percentage || 0) / 100);
      subtotal += lineSubtotal;
      taxAmount += lineTax;
    });

    const disc = Math.min(subtotal, Math.max(0, parseFloat(discountAmount) || 0));
    const grandTotal = Math.max(0, subtotal - disc + taxAmount);

    return {
      subtotal: subtotal.toFixed(2),
      discount: disc.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      grandTotal: grandTotal.toFixed(2)
    };
  }, [lines, discountAmount]);

  // Submit Handler
  const handleSubmit = async (targetStatus = 'DRAFT') => {
    if (!customerId) {
      addToast('Please select a customer for this quotation.', 'error');
      return;
    }

    if (lines.length === 0) {
      addToast('Please add at least one line item.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customer_id: customerId,
        template_id: templateId || undefined,
        quotation_date: quotationDate,
        validity_date: validityDate,
        payment_terms: paymentTerms,
        terms_and_conditions: termsAndConditions,
        discount_amount: parseFloat(discountAmount) || 0,
        lines: lines.map((l) => ({
          product_id: l.product_id,
          quantity: l.quantity,
          tax_id: l.tax_id || undefined
        }))
      };

      const res = await createQuotation(payload);
      addToast(`Quotation ${res.data?.quotation_number || ''} created successfully!`, 'success');
      navigate(`/staff/quotations/${res.data.id}`);
    } catch (err) {
      console.error('Error creating quotation:', err);
      addToast(err.message || 'Failed to create quotation', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <LoadingSpinner size="large" color="dark" />
        <p style={{ marginTop: '1rem' }}>Loading quotation workspace...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Top Bar */}
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
            <h2>Quotation Builder</h2>
            <p>Generate a compliant quotation with server-calculated taxes and line snapshots.</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            variant="outline"
            icon={Save}
            loading={submitting}
            onClick={() => handleSubmit('DRAFT')}
          >
            Save as Draft
          </Button>
          <Button
            variant="primary"
            icon={Send}
            loading={submitting}
            onClick={() => handleSubmit('SENT')}
          >
            Generate Quotation
          </Button>
        </div>
      </div>

      {/* Main Form Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Left Column: Customer, Details & Lines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Header Card */}
          <div className="content-card" style={{ marginBottom: 0 }}>
            <div className="card-title-row">
              <h4>Proposal Details</h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">
                  Customer <span className="required">*</span>
                </label>
                <select
                  className="form-input"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                >
                  <option value="">-- Select Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company_name ? `(${c.company_name})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Quotation Template</label>
                <select
                  className="form-input"
                  value={templateId}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                >
                  <option value="">-- None (Custom Quote) --</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Quotation Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={quotationDate}
                  onChange={(e) => setQuotationDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Validity Period</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  className="form-input"
                  value={validityDays}
                  onChange={(e) => setValidityDays(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Expiry Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={validityDate}
                  readOnly
                  style={{ backgroundColor: 'var(--bg-card-subtle)', cursor: 'not-allowed' }}
                />
              </div>
            </div>
          </div>

          {/* Line Items Card */}
          <div className="content-card" style={{ marginBottom: 0, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4>Line Items</h4>
              <Button
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={handleAddLine}
              >
                Add Item
              </Button>
            </div>

            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>Product / Service</th>
                    <th style={{ width: '15%' }}>Qty</th>
                    <th style={{ width: '15%' }}>Unit Price</th>
                    <th style={{ width: '20%' }}>Tax</th>
                    <th style={{ width: '10%', textAlign: 'right' }}>Total</th>
                    <th style={{ width: '5%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, idx) => {
                    const lineSub = (line.quantity || 1) * (line.unit_price || 0);
                    const lineTax = lineSub * ((line.tax_percentage || 0) / 100);
                    const lineTotal = lineSub + lineTax;

                    return (
                      <tr key={idx}>
                        <td>
                          <select
                            className="form-input"
                            value={line.product_id}
                            onChange={(e) => handleLineChange(idx, 'product_id', e.target.value)}
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            className="form-input"
                            value={line.quantity}
                            onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                          />
                        </td>
                        <td>
                          <div style={{ padding: '0.65rem 0', fontWeight: 600 }}>
                            ${line.unit_price.toFixed(2)}
                          </div>
                        </td>
                        <td>
                          <select
                            className="form-input"
                            value={line.tax_id || ''}
                            onChange={(e) => handleLineChange(idx, 'tax_id', e.target.value)}
                          >
                            <option value="">0% (No Tax)</option>
                            {taxes.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name} ({parseFloat(t.percentage)}%)
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          ${lineTotal.toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ color: '#DC2626' }}
                            onClick={() => handleRemoveLine(idx)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Terms & Conditions Card */}
          <div className="content-card" style={{ marginBottom: 0 }}>
            <div className="card-title-row">
              <h4>Commercial Terms & Conditions</h4>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Terms</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Net 30, Due on receipt"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Terms and Contractual Conditions</label>
              <textarea
                className="form-input"
                rows={3}
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Financial Summary Card */}
        <div>
          <div className="content-card" style={{ position: 'sticky', top: '1.5rem' }}>
            <div className="card-title-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calculator size={18} style={{ color: 'var(--primary-navy)' }} />
                <h4>Summary Preview</h4>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
                <strong>${previewTotals.subtotal}</strong>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <label className="form-label" style={{ marginBottom: 0, fontSize: '0.85rem' }}>
                    Discount ($)
                  </label>
                  <small style={{ color: 'var(--text-muted)' }}>Capped at Subtotal</small>
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-input"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Applicable Taxes:</span>
                <strong>${previewTotals.taxAmount}</strong>
              </div>

              <div
                style={{
                  borderTop: '2px solid var(--border-light)',
                  paddingTop: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>Estimated Total</span>
                  <strong style={{ fontSize: '1.5rem', color: 'var(--primary-navy)' }}>
                    ${previewTotals.grandTotal}
                  </strong>
                </div>
              </div>
            </div>

            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-card-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', display: 'flex', gap: '0.4rem' }}>
              <HelpCircle size={16} style={{ flexShrink: 0, color: 'var(--primary-navy)' }} />
              <span>
                <strong>Zero-Trust Calculation Engine:</strong> Totals are authoritatively computed server-side upon saving to prevent tampering.
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Button
                variant="primary"
                block
                icon={Send}
                loading={submitting}
                onClick={() => handleSubmit('SENT')}
              >
                Generate & Send Quotation
              </Button>
              <Button
                variant="outline"
                block
                icon={Save}
                loading={submitting}
                onClick={() => handleSubmit('DRAFT')}
              >
                Save as Draft
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationBuilder;

