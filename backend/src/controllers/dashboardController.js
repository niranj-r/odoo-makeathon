/**
 * BRIGHTLOOP - DASHBOARD CONTROLLER
 * Aggregates live database metrics and counts for the Admin & Staff Dashboards.
 */

import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    if (!isSupabaseConfigured() || !supabaseAdmin) {
      return res.status(503).json({
        success: false,
        message: 'Backend Supabase connection is not configured in .env'
      });
    }

    const db = req.userClient || supabaseAdmin;

    // Parallel head-only exact count queries for instant response
    const [
      { count: productsTotal, error: pErr },
      { count: activeProducts, error: apErr },
      { count: variantsTotal, error: vErr },
      { count: plansTotal, error: plErr },
      { count: activePlans, error: aplErr },
      { count: taxesTotal, error: tErr },
      { count: activeTaxes, error: atErr },
      { count: discountsTotal, error: dErr },
      { count: activeDiscounts, error: adErr },
      { count: staffTotal, error: sErr },
      { count: usersTotal, error: uErr }
    ] = await Promise.all([
      db.from('products').select('*', { count: 'exact', head: true }),
      db.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
      db.from('product_variants').select('*', { count: 'exact', head: true }),
      db.from('subscription_plans').select('*', { count: 'exact', head: true }),
      db.from('subscription_plans').select('*', { count: 'exact', head: true }).eq('is_active', true),
      db.from('taxes').select('*', { count: 'exact', head: true }),
      db.from('taxes').select('*', { count: 'exact', head: true }).eq('is_active', true),
      db.from('discounts').select('*', { count: 'exact', head: true }),
      db.from('discounts').select('*', { count: 'exact', head: true }).eq('is_active', true),
      db.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'STAFF'),
      db.from('profiles').select('*', { count: 'exact', head: true })
    ]);

    if (pErr || vErr || plErr || tErr || dErr || sErr || uErr) {
      console.warn('[getDashboardStats] Warning in count queries:', {
        pErr: pErr?.message,
        vErr: vErr?.message,
        plErr: plErr?.message,
        tErr: tErr?.message,
        dErr: dErr?.message,
        sErr: sErr?.message,
        uErr: uErr?.message
      });
    }

    return res.status(200).json({
      success: true,
      stats: {
        products: {
          total: productsTotal || 0,
          active: activeProducts || 0,
          variants: variantsTotal || 0
        },
        plans: {
          total: plansTotal || 0,
          active: activePlans || 0
        },
        taxes: {
          total: taxesTotal || 0,
          active: activeTaxes || 0
        },
        discounts: {
          total: discountsTotal || 0,
          active: activeDiscounts || 0
        },
        staff: {
          total: staffTotal || 0,
          usersTotal: usersTotal || 0
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

