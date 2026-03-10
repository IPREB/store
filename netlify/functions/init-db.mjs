import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  const sql = neon(process.env.NETLIFY_DATABASE_URL);

  try {
    // Create all tables
    await sql`
      CREATE TABLE IF NOT EXISTS store_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        cat TEXT NOT NULL,
        description TEXT,
        price NUMERIC,
        badge TEXT,
        img TEXT,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS policies (
        id TEXT PRIMARY KEY,
        icon TEXT,
        title TEXT NOT NULL,
        rows JSONB DEFAULT '[]',
        warn TEXT DEFAULT '',
        warn_type TEXT DEFAULT 'gold',
        is_iptv BOOLEAN DEFAULT FALSE,
        sort_order INT DEFAULT 0
      )
    `;

    // Insert default settings if not exist
    const defaults = [
      ['mtv_name', 'MOON TV'],
      ['mtv_tag', 'عالمك الرقمي الذكي'],
      ['mtv_wa', '966541982458'],
      ['mtv_hours', '4:00 م — 10:00 م'],
      ['mtv_wa_msg', 'السلام عليكم، أريد الاستفسار عن منتجاتكم'],
      ['mtv_pass', 'Moon@2025'],
      ['mtv_logo', ''],
    ];

    for (const [key, value] of defaults) {
      await sql`
        INSERT INTO store_settings (key, value) VALUES (${key}, ${value})
        ON CONFLICT (key) DO NOTHING
      `;
    }

    // Insert default categories if none exist
    const existingCats = await sql`SELECT COUNT(*) as c FROM categories`;
    if (parseInt(existingCats[0].c) === 0) {
      await sql`INSERT INTO categories (id, name, icon, sort_order) VALUES ('smart', 'سمارت برو', '📺', 0)`;
      await sql`INSERT INTO categories (id, name, icon, sort_order) VALUES ('ai', 'ذكاء اصطناعي', '🤖', 1)`;
    }

    // Insert default products if none exist
    const existingProds = await sql`SELECT COUNT(*) as c FROM products`;
    if (parseInt(existingProds[0].c) === 0) {
      await sql`
        INSERT INTO products (name, cat, description, price, badge, img, sort_order) VALUES
        ('IPTV سمارت برو — شهر', 'smart', 'باقة سمارت برو شهر كامل: أفلام، مسلسلات، ومباريات رياضية بجودة 4K بلا انقطاع.', 29, 'h', 'https://images.unsplash.com/photo-1593359677879-a4bb92f829e1?w=400&q=80', 0),
        ('IPTV سمارت برو — 3 أشهر', 'smart', 'باقة سمارت برو لمدة 3 أشهر. وفّر أكثر واستمتع بكل المحتوى الرياضي والترفيهي.', 75, 'b', 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=400&q=80', 1),
        ('IPTV سمارت برو — سنة', 'smart', 'الباقة السنوية: أفضل قيمة مقابل السعر. محتوى لا ينتهي طوال العام كاملاً.', 250, 's', 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=400&q=80', 2),
        ('Gemini AI Pro', 'ai', 'اشتراك Gemini المتقدم بكامل مزاياه: كتابة، تحليل، برمجة، وإنتاجية بلا حدود.', 49, 'n', 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&q=80', 3),
        ('Canva Pro', 'ai', 'اشتراك Canva Pro كامل المميزات: آلاف القوالب، أدوات AI للتصميم، وتصدير بدون خلفية.', 39, 'b', 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&q=80', 4)
      `;
    }

    // Insert default policies if none exist
    const existingPols = await sql`SELECT COUNT(*) as c FROM policies`;
    if (parseInt(existingPols[0].c) === 0) {
      const defaultPolicies = [
        {
          id: 'p1', icon: '🛡️', title: 'سياسة الضمان والتشغيل',
          rows: [
            {bold:'ضمان التفعيل:',text:'نلتزم بعمل الكود أو الحساب من اللحظة الأولى — بدون استثناء.'},
            {bold:'مدة الاشتراك:',text:'الضمان يسري طوال فترة الاشتراك ضد أي توقف ناتج عن المصدر.'},
            {bold:'الدعم الفني:',text:'فريقنا معك عبر الواتساب خلال 24 ساعة (ضمن أوقات العمل).'},
            {bold:'الاستخدام العادل:',text:'لا يشمل الضمان الحظر الناتج عن تشغيل الاشتراك على أكثر من جهاز مسموح.'},
          ],
          warn: 'تأكد من استخدام الاشتراك على الجهاز المخصص فقط.', warn_type: 'gold', is_iptv: false, sort_order: 0
        },
        {
          id: 'p2', icon: '🔄', title: 'سياسة الاستبدال والاسترجاع',
          rows: [
            {bold:'قبل التسليم:',text:'يحق لك استرجاع المبلغ كاملاً إذا لم يتم إرسال الكود.'},
            {bold:'مدة التفعيل:',text:'الحد الأقصى 48 ساعة من وقت الطلب.'},
            {bold:'بعد التفعيل:',text:'لا يمكن الاسترجاع إلا في حال خلل فني تعذر إصلاحه خلال 48 ساعة.'},
            {bold:'مسؤولية العميل:',text:'المتجر غير مسؤول عن ضعف الأداء الناتج عن جودة إنترنت العميل.'},
          ],
          warn: 'تأكد من جودة اتصالك قبل الشراء.', warn_type: 'gold', is_iptv: false, sort_order: 1
        },
        {
          id: 'p3', icon: '📺', title: 'ملاحظة هامة — باقات IPTV السمارت برو',
          rows: [
            {bold:'رسالتان:',text:'بعد الاشتراك ستصلك رسالتان: طريقة التفعيل + كود التفعيل.'},
            {bold:'احفظهما فوراً:',text:'لا نضمن بقاء الرسائل في محادثات الواتساب طوال مدة الاشتراك.'},
            {bold:'مسؤولية العميل:',text:'الحفاظ على بيانات التفعيل مسؤولية العميل — قم بتصويرها أو حفظها.'},
          ],
          warn: '', warn_type: 'red', is_iptv: true, sort_order: 2
        },
        {
          id: 'p4', icon: '🕒', title: 'أوقات العمل والدعم',
          rows: [
            {bold:'',text:'نستقبل طلباتكم من 4:00 عصراً حتى 10:00 مساءً يومياً.'},
            {bold:'',text:'يتم تنفيذ الطلبات والرد على الاستفسارات خلال هذه الأوقات فقط.'},
            {bold:'',text:'الطلبات خارج أوقات العمل تُنفَّذ في بداية الدوام التالي.'},
          ],
          warn: '', warn_type: 'gold', is_iptv: false, sort_order: 3
        },
      ];

      for (const p of defaultPolicies) {
        await sql`
          INSERT INTO policies (id, icon, title, rows, warn, warn_type, is_iptv, sort_order)
          VALUES (${p.id}, ${p.icon}, ${p.title}, ${JSON.stringify(p.rows)}, ${p.warn}, ${p.warn_type}, ${p.is_iptv}, ${p.sort_order})
        `;
      }
    }

    return new Response(JSON.stringify({ success: true, message: 'Database initialized' }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};

export const config = { path: '/api/init-db' };
