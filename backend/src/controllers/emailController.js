import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';
import { parsePagination, isValidUUID } from '../utils/validators.js';

/**
 * GET /api/emails
 * Lists email notification history with filtering
 */
export const listEmailNotifications = async (req, res, next) => {
  try {
    if (!isSupabaseConfigured() || !supabaseAdmin) {
      return res.json({
        success: true,
        data: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 0 }
      });
    }

    const { page, limit, offset } = parsePagination(req.query);
    const { type, status, recipient, invoice_id, payment_id } = req.query;

    let query = supabaseAdmin
      .from('email_notifications')
      .select('*', { count: 'exact' });

    if (type) query = query.eq('type', type);
    if (status) query = query.eq('status', status);
    if (recipient) query = query.ilike('recipient_email', `%${recipient}%`);
    if (invoice_id) query = query.eq('invoice_id', invoice_id);
    if (payment_id) query = query.eq('payment_id', payment_id);

    query = query.order('sent_at', { ascending: false });
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    return res.json({
      success: true,
      data: data || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/emails/:id
 * Retrieves full email content for audit and verification
 */
export const getEmailNotificationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) {
      return res.status(400).json({ success: false, message: 'Invalid notification ID.' });
    }

    const { data, error } = await supabaseAdmin
      .from('email_notifications')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Email record not found.' });
    }

    return res.json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
};

