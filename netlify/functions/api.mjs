import { neon } from '@neondatabase/serverless';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async (req, context) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  const sql = neon(process.env.NETLIFY_DATABASE_URL);
  const url = new URL(req.url);
  const path = url.pathname.replace('/api/', '');
  const method = req.method;

  try {
    let body = {};
    if (method === 'POST' || method === 'PUT') {
      body = await req.json();
    }

    // ──────────────────────────────
    // SETTINGS
    // ──────────────────────────────
    if (path === 'settings') {
      if (method === 'GET') {
        const rows = await sql`SELECT key, value FROM store_settings`;
        const settings = {};
        rows.forEach(r => settings[r.key] = r.value);
        return new Response(JSON.stringify(settings), { headers });
      }
      if (method === 'POST') {
        const { key, value } = body;
        await sql`
          INSERT INTO store_settings (key, value, updated_at)
          VALUES (${key}, ${value}, NOW())
          ON CONFLICT (key) DO UPDATE SET value = ${value}, updated_at = NOW()
        `;
        return new Response(JSON.stringify({ success: true }), { headers });
      }
      if (method === 'PUT') {
        // Bulk update multiple settings at once
        for (const [key, value] of Object.entries(body)) {
          await sql`
            INSERT INTO store_settings (key, value, updated_at)
            VALUES (${key}, ${String(value)}, NOW())
            ON CONFLICT (key) DO UPDATE SET value = ${String(value)}, updated_at = NOW()
          `;
        }
        return new Response(JSON.stringify({ success: true }), { headers });
      }
    }

    // ──────────────────────────────
    // CATEGORIES
    // ──────────────────────────────
    if (path === 'categories') {
      if (method === 'GET') {
        const cats = await sql`SELECT * FROM categories ORDER BY sort_order`;
        return new Response(JSON.stringify(cats), { headers });
      }
      if (method === 'POST') {
        const { id, name, icon } = body;
        await sql`
          INSERT INTO categories (id, name, icon, sort_order)
          VALUES (${id}, ${name}, ${icon}, (SELECT COALESCE(MAX(sort_order)+1,0) FROM categories))
          ON CONFLICT (id) DO UPDATE SET name=${name}, icon=${icon}
        `;
        return new Response(JSON.stringify({ success: true }), { headers });
      }
    }

    // DELETE category
    if (path.startsWith('categories/') && method === 'DELETE') {
      const catId = path.split('/')[1];
      await sql`DELETE FROM categories WHERE id = ${catId}`;
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    // ──────────────────────────────
    // PRODUCTS
    // ──────────────────────────────
    if (path === 'products') {
      if (method === 'GET') {
        const prods = await sql`SELECT * FROM products ORDER BY sort_order, id`;
        return new Response(JSON.stringify(prods), { headers });
      }
      if (method === 'POST') {
        const { name, cat, description, price, badge, img } = body;
        const result = await sql`
          INSERT INTO products (name, cat, description, price, badge, img, sort_order)
          VALUES (${name}, ${cat}, ${description||''}, ${price||0}, ${badge||''}, ${img||''},
                  (SELECT COALESCE(MAX(sort_order)+1,0) FROM products))
          RETURNING id
        `;
        return new Response(JSON.stringify({ success: true, id: result[0].id }), { headers });
      }
    }

    // UPDATE / DELETE product by id
    if (path.startsWith('products/')) {
      const prodId = path.split('/')[1];
      if (method === 'PUT') {
        const { name, cat, description, price, badge, img } = body;
        await sql`
          UPDATE products SET
            name=${name}, cat=${cat}, description=${description||''},
            price=${price||0}, badge=${badge||''}, img=${img||''}
          WHERE id=${prodId}
        `;
        return new Response(JSON.stringify({ success: true }), { headers });
      }
      if (method === 'DELETE') {
        await sql`DELETE FROM products WHERE id=${prodId}`;
        return new Response(JSON.stringify({ success: true }), { headers });
      }
    }

    // ──────────────────────────────
    // POLICIES
    // ──────────────────────────────
    if (path === 'policies') {
      if (method === 'GET') {
        const pols = await sql`SELECT * FROM policies ORDER BY sort_order`;
        return new Response(JSON.stringify(pols), { headers });
      }
      if (method === 'PUT') {
        // bulk update policies array
        const polArray = body; // array
        for (const p of polArray) {
          await sql`
            UPDATE policies SET
              icon=${p.icon}, title=${p.title},
              rows=${JSON.stringify(p.rows)}, warn=${p.warn||''},
              warn_type=${p.warnType||p.warn_type||'gold'},
              is_iptv=${p.isIptv||p.is_iptv||false}
            WHERE id=${p.id}
          `;
        }
        return new Response(JSON.stringify({ success: true }), { headers });
      }
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
};

export const config = { path: '/api/*' };
