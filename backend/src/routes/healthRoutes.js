import { Router } from 'express';
import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';

const router = Router();

router.get(['/', '/health'], async (req, res) => {
  let supabaseConnected = false;
  let dbMessage = 'Supabase unconfigured';

  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('count', { count: 'exact', head: true });

      if (!error) {
        supabaseConnected = true;
        dbMessage = 'Connected and verified';
      } else {
        dbMessage = `Error querying profiles table: ${error.message}`;
      }
    } catch (err) {
      dbMessage = `Connection exception: ${err.message}`;
    }
  }

  res.status(200).json({
    status: 'ok',
    service: 'Brightloop API',
    timestamp: new Date().toISOString(),
    supabaseConfigured: isSupabaseConfigured(),
    supabaseConnected,
    databaseStatus: dbMessage
  });
});

export default router;
