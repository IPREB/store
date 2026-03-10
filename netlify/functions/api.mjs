import { neon } from '@netlify/neon';

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  const sql = neon();
  const url = new URL(req.url);
  // يقرأ من query params: ?r=products&id=5
  const resource = url.searchParams.get('r') || '';
  const resourceId = url.searchParams.get('id') || '';
  const method = req.method;

  let body = {};
  if (['POST','PUT','PATCH'].includes(method)) {
    try { body = await req.json(); } catch {}
  }

  const ok  = (d) => new Response(JSON.stringify(d), { headers: CORS });
  const fail = (m, c=500) => new Response(JSON.stringify({ error: m }), { status: c, headers: CORS });

  try {

    // ── SETTINGS ──
    if (resource === 'settings') {
      if (method === 'GET') {
        const rows = await sql`SELECT key, value FROM store_settings`;
        const s = {};
        rows.forEach(r => s[r.key] = r.value);
        return ok(s);
      }
      if (method === 'PUT') {
        for (const [k, v] of Object.entries(body)) {
          await sql`INSERT INTO store_settings(key,value,updated_at)
            VALUES(${k},${String(v)},NOW())
            ON CONFLICT(key) DO UPDATE SET value=${String(v)}, updated_at=NOW()`;
        }
        return ok({ success: true });
      }
    }

    // ── CATEGORIES ──
    if (resource === 'categories') {
      if (!resourceId) {
        if (method === 'GET') {
          const rows = await sql`SELECT * FROM categories ORDER BY sort_order`;
          return ok(rows);
        }
        if (method === 'POST') {
          const { id, name, icon } = body;
          await sql`INSERT INTO categories(id,name,icon,sort_order)
            VALUES(${id},${name},${icon},(SELECT COALESCE(MAX(sort_order)+1,0) FROM categories))
            ON CONFLICT(id) DO UPDATE SET name=${name}, icon=${icon}`;
          return ok({ success: true });
        }
      } else {
        if (method === 'DELETE') {
          await sql`DELETE FROM categories WHERE id=${resourceId}`;
          return ok({ success: true });
        }
      }
    }

    // ── PRODUCTS ──
    if (resource === 'products') {
      if (!resourceId) {
        if (method === 'GET') {
          const rows = await sql`SELECT * FROM products ORDER BY sort_order, id`;
          return ok(rows);
        }
        if (method === 'POST') {
          const { name, cat, description, price, badge, img } = body;
          const res = await sql`INSERT INTO products(name,cat,description,price,badge,img,sort_order)
            VALUES(${name},${cat},${description||''},${price||0},${badge||''},${img||''},
              (SELECT COALESCE(MAX(sort_order)+1,0) FROM products))
            RETURNING id`;
          return ok({ success: true, id: res[0].id });
        }
      } else {
        if (method === 'PUT') {
          const { name, cat, description, price, badge, img } = body;
          await sql`UPDATE products
            SET name=${name}, cat=${cat}, description=${description||''},
                price=${price||0}, badge=${badge||''}, img=${img||''}
            WHERE id=${resourceId}`;
          return ok({ success: true });
        }
        if (method === 'DELETE') {
          await sql`DELETE FROM products WHERE id=${resourceId}`;
          return ok({ success: true });
        }
      }
    }

    // ── POLICIES ──
    if (resource === 'policies') {
      if (method === 'GET') {
        const rows = await sql`SELECT * FROM policies ORDER BY sort_order`;
        return ok(rows);
      }
      if (method === 'PUT') {
        for (const p of body) {
          const rowsJson = JSON.stringify(p.rows || []);
          await sql`UPDATE policies
            SET icon=${p.icon||''}, title=${p.title},
                rows=${rowsJson}::jsonb,
                warn=${p.warn||''},
                warn_type=${p.warnType || p.warn_type || 'gold'},
                is_iptv=${p.isIptv || p.is_iptv || false}
            WHERE id=${p.id}`;
        }
        return ok({ success: true });
      }
    }

    return fail(`Unknown resource: "${resource}"`, 404);
  } catch (e) {
    console.error('API Error:', e.message);
    return fail(e.message);
  }
};
