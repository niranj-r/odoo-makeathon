import React, { useState, useEffect, useCallback } from 'react';
import {
  Copy,
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  Clock,
  CreditCard,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { getTemplates, deleteTemplate } from '../../../services/api';
import { useToast } from '../../../components/common/Toast';
import Button from '../../../components/common/Button';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import TemplateModal from './TemplateModal';

export const TemplateList = () => {
  const { addToast } = useToast();

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const fetchTemplatesList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTemplates({
        search: search.trim() || undefined
      });
      setTemplates(res.data || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
      addToast(err.message || 'Failed to load templates', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, addToast]);

  useEffect(() => {
    fetchTemplatesList();
  }, [fetchTemplatesList]);

  const handleOpenAdd = () => {
    setEditingTemplate(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (tmpl) => {
    setEditingTemplate(tmpl);
    setModalOpen(true);
  };

  const handleArchive = async (tmpl) => {
    const confirmMsg = `Are you sure you want to archive template '${tmpl.name}'? Existing quotations will remain unaffected.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await deleteTemplate(tmpl.id);
      addToast('Template archived successfully.', 'success');
      fetchTemplatesList();
    } catch (err) {
      console.error('Delete template error:', err);
      addToast(err.message || 'Failed to archive template', 'error');
    }
  };

  return (
    <div>
      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Quotation Templates</h2>
          <p>Create and customize reusable commercial quotation templates with preset payment terms and line items.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            variant="outline"
            icon={RefreshCw}
            onClick={fetchTemplatesList}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={handleOpenAdd}
          >
            New Template
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="content-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
        <div className="input-wrapper" style={{ maxWidth: '400px' }}>
          <span className="input-icon">
            <Search size={18} />
          </span>
          <input
            type="text"
            className="form-input has-icon"
            placeholder="Search templates by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Templates Grid / Cards */}
      {loading ? (
        <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <LoadingSpinner size="large" color="dark" />
          <p style={{ marginTop: '1rem' }}>Loading templates...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="content-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <Copy size={48} style={{ color: 'var(--secondary-sand-dark)', margin: '0 auto 1rem' }} />
          <h3>No Quotation Templates Found</h3>
          <p style={{ maxWidth: '420px', margin: '0.5rem auto 1.5rem' }}>
            {search
              ? 'No templates match your search string.'
              : 'Templates streamline your quoting workflow with standardized pricing, preset lines, and payment terms.'}
          </p>
          <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
            Create First Template
          </Button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {templates.map((tmpl) => (
            <div key={tmpl.id} className="content-card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
              <div className="card-title-row" style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Copy size={18} style={{ color: 'var(--primary-navy)' }} />
                  <h4 style={{ margin: 0 }}>{tmpl.name}</h4>
                </div>
                {tmpl.is_active ? (
                  <span className="badge badge-active" style={{ fontSize: '0.7rem' }}>Active</span>
                ) : (
                  <span className="badge badge-inactive" style={{ fontSize: '0.7rem' }}>Archived</span>
                )}
              </div>

              <p style={{ fontSize: '0.85rem', flex: 1, marginBottom: '1rem' }}>
                {tmpl.description || 'No description provided.'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                  <span>Validity: <strong>{tmpl.validity_days} days</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CreditCard size={14} style={{ color: 'var(--text-muted)' }} />
                  <span>Terms: <strong>{tmpl.payment_terms || 'Due on receipt'}</strong></span>
                </div>
                <div>
                  Preset Items: <strong>{tmpl.lines?.length || 0} items</strong>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Edit2}
                  onClick={() => handleOpenEdit(tmpl)}
                >
                  Edit
                </Button>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ color: '#DC2626' }}
                  title="Archive Template"
                  onClick={() => handleArchive(tmpl)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <TemplateModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        template={editingTemplate}
        onSuccess={fetchTemplatesList}
      />
    </div>
  );
};

export default TemplateList;

