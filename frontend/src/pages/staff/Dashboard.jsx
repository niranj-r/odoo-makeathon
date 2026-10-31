import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Users,
  FileSpreadsheet,
  Layers,
  Receipt,
  CreditCard,
  AlertTriangle,
  Clock,
  ArrowRight,
  LogOut,
  RefreshCw,
  BellRing,
  Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const StaffDashboard = () => {
  const { user, profile, session, logout } = useAuth();

  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeSubscriptions: 0,
    pendingQuotations: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
    upcomingRenewals: 0,
    totalPayments: 0
  });
  const [activities, setActivities] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    if (!session?.access_token) return;

    try {
      setLoading(true);

      const [overviewRes, actRes, alertsRes] = await Promise.all([
        fetch('http://localhost:5000/api/staff/dashboard/overview', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        }),
        fetch('http://localhost:5000/api/staff/dashboard/activities', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        }),
        fetch('http://localhost:5000/api/staff/dashboard/alerts', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })
      ]);

      const [overviewData, actData, alertsData] = await Promise.all([
        overviewRes.json(),
        actRes.json(),
        alertsRes.json()
      ]);

      if (overviewData.success && overviewData.stats) setStats(overviewData.stats);
      if (actData.success && actData.activities) setActivities(actData.activities);
      if (alertsData.success && alertsData.alerts) setAlerts(alertsData.alerts);
    } catch (err) {
      console.warn('Staff dashboard data fetch warning:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [session?.access_token]);

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Staff Member';

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Hero Welcome Banner */}
      <div className="dashboard-hero" style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #102A43 100%)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
            <span className="badge badge-staff">
              <Briefcase size={14} /> Operational Command
            </span>
            <span className="badge badge-active">ACTIVE STATUS</span>
          </div>
          <h1>Welcome, {displayName}</h1>
          <p>
            Logged in as <strong>{user?.email}</strong>. Live operational overview of customer accounts, quotes, subscriptions, and billing.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'flex-start' }}>
          <button onClick={fetchDashboardData} className="btn btn-secondary btn-sm" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spinner' : ''} /> Refresh
          </button>
          <button onClick={logout} className="btn btn-secondary btn-sm">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>

      {/* Operational Highlights Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
        {/* Total Customers */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Customers</span>
            <Users size={18} color="var(--primary-navy)" />
          </div>
          <div className="stat-value">{loading ? '—' : stats.totalCustomers}</div>
          <p style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Permitted client directory</p>
          <Link to="/staff/customers" style={{ marginTop: 'auto', paddingTop: '0.5rem', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
            View Customers <ArrowRight size={12} />
          </Link>
        </div>

        {/* Active Subscriptions */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Active Subscriptions</span>
            <Layers size={18} color="var(--primary-navy)" />
          </div>
          <div className="stat-value">{loading ? '—' : stats.activeSubscriptions}</div>
          <p style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Recurring active services</p>
          <Link to="/staff/subscriptions" style={{ marginTop: 'auto', paddingTop: '0.5rem', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
            Manage Subscriptions <ArrowRight size={12} />
          </Link>
        </div>

        {/* Pending Quotations */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Pending Quotes</span>
            <FileSpreadsheet size={18} color="var(--primary-navy)" />
          </div>
          <div className="stat-value">{loading ? '—' : stats.pendingQuotations}</div>
          <p style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Drafts & sent quotations</p>
          <Link to="/staff/quotations" style={{ marginTop: 'auto', paddingTop: '0.5rem', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
            Review Quotations <ArrowRight size={12} />
          </Link>
        </div>

        {/* Pending Invoices */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Unpaid Invoices</span>
            <Receipt size={18} color="var(--primary-navy)" />
          </div>
          <div className="stat-value">{loading ? '—' : stats.pendingInvoices}</div>
          <p style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Awaiting client settlement</p>
          <Link to="/staff/invoices" style={{ marginTop: 'auto', paddingTop: '0.5rem', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
            Track Invoices <ArrowRight size={12} />
          </Link>
        </div>

        {/* Overdue Invoices */}
        <div className="stat-card" style={{ borderColor: stats.overdueInvoices > 0 ? '#E53E3E' : 'var(--border-light)' }}>
          <div className="stat-header">
            <span className="stat-title" style={{ color: stats.overdueInvoices > 0 ? '#E53E3E' : 'inherit' }}>Overdue Invoices</span>
            <AlertTriangle size={18} color={stats.overdueInvoices > 0 ? '#E53E3E' : 'var(--primary-navy)'} />
          </div>
          <div className="stat-value" style={{ color: stats.overdueInvoices > 0 ? '#E53E3E' : 'inherit' }}>
            {loading ? '—' : stats.overdueInvoices}
          </div>
          <p style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Requires collection outreach</p>
          <Link to="/staff/invoices" style={{ marginTop: 'auto', paddingTop: '0.5rem', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
            Inspect Overdue <ArrowRight size={12} />
          </Link>
        </div>

        {/* Upcoming Renewals */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Renewals</span>
            <Clock size={18} color="var(--primary-navy)" />
          </div>
          <div className="stat-value">{loading ? '—' : stats.upcomingRenewals}</div>
          <p style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Auto-renewing cadences</p>
          <Link to="/staff/subscriptions" style={{ marginTop: 'auto', paddingTop: '0.5rem', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
            View Renewals <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* Two Column Layout: Alerts and Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Alerts & Action Items */}
        <div className="content-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
            <BellRing size={18} color="var(--primary-navy)" />
            <h3 style={{ fontSize: '1.1rem', color: 'var(--primary-navy)', margin: 0 }}>Operational Alerts</h3>
          </div>

          {alerts.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              ✓ All operational workflows are currently healthy. No pending alerts.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    borderLeft: alert.type === 'danger' ? '4px solid #E53E3E' : '4px solid #DD6B20',
                    backgroundColor: alert.type === 'danger' ? '#FFF5F5' : '#FFFAF0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: alert.type === 'danger' ? '#9B2C2C' : '#9C4221' }}>
                      {alert.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {alert.description}
                    </div>
                  </div>
                  {alert.link && (
                    <Link to={alert.link} className="btn btn-outline btn-sm" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                      Resolve
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Activity Stream */}
        <div className="content-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
            <Activity size={18} color="var(--primary-navy)" />
            <h3 style={{ fontSize: '1.1rem', color: 'var(--primary-navy)', margin: 0 }}>Recent Operational Events</h3>
          </div>

          {activities.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No operational events recorded yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {activities.map((act) => (
                <div
                  key={act.id}
                  style={{
                    padding: '0.65rem 0.75rem',
                    borderBottom: '1px solid var(--border-light)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.85rem'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{act.action}</div>
                    <small style={{ color: 'var(--text-muted)' }}>
                      Entity: <code>{act.entity_type}</code>
                    </small>
                  </div>
                  <small style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </small>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
