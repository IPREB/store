import { neon } from '@netlify/neon';

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  // @netlify/neon يتصل تلقائياً بدون أي config
  const sql = neon();

  try {
    await sql`CREATE TABLE IF NOT EXISTS store_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      sort_order INT DEFAULT 0
    )`;

    await sql`CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      cat TEXT NOT NULL,
      description TEXT DEFAULT '',
      price NUMERIC DEFAULT 0,
      badge TEXT DEFAULT '',
      img TEXT DEFAULT '',
      sort_order INT DEFAULT 0
    )`;

    await sql`CREATE TABLE IF NOT EXISTS policies (
      id TEXT PRIMARY KEY,
      icon TEXT DEFAULT '',
      title TEXT NOT NULL,
      rows JSONB DEFAULT '[]',
      warn TEXT DEFAULT '',
      warn_type TEXT DEFAULT 'gold',
      is_iptv BOOLEAN DEFAULT FALSE,
      sort_order INT DEFAULT 0
    )`;

    // Default settings
    for (const [k, v] of [
      ['mtv_name','MOON TV'],
      ['mtv_tag','عالمك الرقمي الذكي'],
      ['mtv_wa','966541982458'],
      ['mtv_hours','4:00 م — 10:00 م'],
      ['mtv_wa_msg','السلام عليكم، أريد الاستفسار عن منتجاتكم'],
      ['mtv_pass','Moon@2025'],
      ['mtv_logo',''],
    ]) {
      await sql`INSERT INTO store_settings(key,value) VALUES(${k},${v}) ON CONFLICT(key) DO NOTHING`;
    }

    // Default categories
    const cc = await sql`SELECT COUNT(*) as c FROM categories`;
    if (parseInt(cc[0].c) === 0) {
      await sql`INSERT INTO categories(id,name,icon,sort_order) VALUES
        ('smart','سمارت برو','📺',0),
        ('ai','ذكاء اصطناعي','🤖',1)`;
    }

    // Default products
    const pc = await sql`SELECT COUNT(*) as c FROM products`;
    if (parseInt(pc[0].c) === 0) {
      await sql`INSERT INTO products(name,cat,description,price,badge,img,sort_order) VALUES
        ('IPTV سمارت برو — شهر','smart','باقة سمارت برو شهر كامل بجودة 4K.',29,'h','https://images.unsplash.com/photo-1593359677879-a4bb92f829e1?w=400&q=80',0),
        ('IPTV سمارت برو — 3 أشهر','smart','باقة سمارت برو 3 أشهر. وفّر أكثر.',75,'b','https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=400&q=80',1),
        ('IPTV سمارت برو — سنة','smart','الباقة السنوية الأفضل قيمة.',250,'s','https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=400&q=80',2),
        ('Gemini AI Pro','ai','اشتراك Gemini المتقدم.',49,'n','https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&q=80',3),
        ('Canva Pro','ai','اشتراك Canva Pro كامل المميزات.',39,'b','https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&q=80',4)`;
    }

    // Default policies
    const polc = await sql`SELECT COUNT(*) as c FROM policies`;
    if (parseInt(polc[0].c) === 0) {
      const p1rows = JSON.stringify([{bold:'ضمان التفعيل:',text:'نلتزم بعمل الكود من اللحظة الأولى.'},{bold:'الدعم الفني:',text:'فريقنا معك عبر الواتساب ضمن أوقات العمل.'},{bold:'الاستخدام العادل:',text:'لا يشمل الضمان الحظر من جهاز إضافي.'}]);
      const p2rows = JSON.stringify([{bold:'قبل التسليم:',text:'استرجاع كامل إذا لم يُرسل الكود.'},{bold:'بعد التفعيل:',text:'لا استرجاع إلا في حال خلل فني غير قابل للحل.'}]);
      const p3rows = JSON.stringify([{bold:'رسالتان:',text:'ستصلك رسالة التفعيل + كود التفعيل.'},{bold:'مسؤولية العميل:',text:'الحفاظ على بيانات التفعيل مسؤوليتك.'}]);
      const p4rows = JSON.stringify([{bold:'',text:'4 عصراً - 10 مساءً يومياً.'},{bold:'',text:'الطلبات خارج الدوام تُنفَّذ في الدوام التالي.'}]);

      await sql`INSERT INTO policies(id,icon,title,rows,warn,warn_type,is_iptv,sort_order) VALUES
        ('p1','🛡️','سياسة الضمان والتشغيل',${p1rows},'تأكد من الجهاز المخصص فقط.','gold',false,0),
        ('p2','🔄','سياسة الاستبدال والاسترجاع',${p2rows},'تأكد من جودة اتصالك.','gold',false,1),
        ('p3','📺','ملاحظة هامة — IPTV',${p3rows},'','red',true,2),
        ('p4','🕒','أوقات العمل والدعم',${p4rows},'','gold',false,3)`;
    }

    return new Response(JSON.stringify({ success: true, message: '✅ قاعدة البيانات جاهزة!' }), { headers: CORS });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: CORS });
  }
};

export const config = { path: '/api/init-db' };
