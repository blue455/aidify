const express = require('express');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const path = require('path');
const { randomInt } = require('crypto');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const fs = require('fs');
const multer = require('multer');

dotenv.config();

const app = express();

// Middleware
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(express.static('public', { index: false }));
app.use(express.static(path.join(__dirname, 'AIDIFY NEW START V1'), { index: false }));
// Serve uploads as static files
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
// Multer storage
const storage = multer.diskStorage({
  destination: function(req, file, cb){ cb(null, uploadDir); },
  filename: function(req, file, cb){
    const safe = Date.now() + '-' + Math.random().toString(36).slice(2,8) + path.extname(file.originalname||'');
    cb(null, safe);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB per file

// MySQL pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'jod_done',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Health check for DB connection (optional)
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Routes
app.get('/', (req, res) => {
  // Serve the Aidify landing page as the site entry
  res.sendFile(path.join(__dirname, 'AIDIFY NEW START V1', 'landing_page.html'));
});

// Auth page (signup/login UI)
app.get('/auth', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Post-login home page
app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'AIDIFY NEW START V1', 'Home_page.html'));
});

// Send OTP for signup
app.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    // Check for duplicate email in users
    const [userRows] = await pool.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (userRows.length > 0) {
      return res.json({ success: false, message: 'Email already registered' });
    }

    const code = randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await pool.execute(
      'INSERT INTO otps (email, code, purpose, expires_at, used) VALUES (?, ?, \'signup\', ?, 0)',
      [email, code, expiresAt]
    );
    // If email credentials aren't configured, log and fall back to returning the OTP
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email credentials missing (EMAIL_USER/EMAIL_PASS). Returning OTP in response for debugging.');
      return res.json({ success: true, message: 'OTP stored (debug)', debugOtp: code });
    }

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP is ${code}. It expires in 10 minutes.`,
      });
      return res.json({ success: true, message: 'OTP sent to email' });
    } catch (sendErr) {
      console.error('nodemailer send error:', sendErr);
      // Nodemailer failed - fall back to returning the OTP so the signup flow can proceed
      return res.json({ success: true, message: 'OTP stored (nodemailer failed, debug)', debugOtp: code });
    }
  } catch (err) {
    console.error('send-otp error:', err);
    res.status(500).json({ success: false, message: 'Error sending OTP' });
  }
});

// Verify OTP for signup
app.post('/verify-otp', async (req, res) => {
  try {
    const { token, email } = req.body;
    if (!token || !email) {
      return res.status(400).json({ success: false, message: 'Token and email are required' });
    }

    const [rows] = await pool.execute(
      `SELECT id FROM otps
       WHERE email = ? AND code = ? AND purpose = 'signup' AND used = 0 AND expires_at > NOW()
       ORDER BY id DESC LIMIT 1`,
      [email, token]
    );

    if (rows.length === 0) {
      return res.json({ success: false, message: 'Invalid or expired OTP' });
    }

    const otpId = rows[0].id;
    await pool.execute('UPDATE otps SET used = 1 WHERE id = ?', [otpId]);
    res.json({ success: true, message: 'OTP verified' });
  } catch (err) {
    console.error('verify-otp error:', err);
    res.status(500).json({ success: false, message: 'Error verifying OTP' });
  }
});

// Signup
app.post('/signup', async (req, res) => {
  try {
    const { name, dob, city, country, email, password } = req.body;
    if (!name || !dob || !city || !country || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }

    // Check for duplicate email
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (existing.length > 0) {
      return res.json({ success: false, message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await pool.execute(
      'INSERT INTO users (name, dob, city, country, email, password_hash) VALUES (?, ?, ?, ?, ?, ?)',
      [name, dob, city, country, email, passwordHash]
    );

    res.json({ success: true, message: 'User registered' });
  } catch (err) {
    console.error('signup error:', err);
    res.status(500).json({ success: false, message: 'Signup failed' });
  }
});

// Forgot password - request reset code
app.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const [users] = await pool.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (users.length === 0) {
      return res.json({ success: false, message: 'Email not registered' });
    }

    const code = randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await pool.execute(
      'INSERT INTO otps (email, code, purpose, expires_at, used) VALUES (?, ?, \'reset\', ?, 0)',
      [email, code, expiresAt]
    );

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Code',
      text: `Your password reset code is ${code}. It expires in 10 minutes.`,
    });

    res.json({ success: true, message: 'Reset code sent!' });
  } catch (err) {
    console.error('forgot-password error:', err);
    res.status(500).json({ success: false, message: 'Error sending reset code' });
  }
});

// Reset password
app.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }

    const [rows] = await pool.execute(
      `SELECT id FROM otps
       WHERE email = ? AND code = ? AND purpose = 'reset' AND used = 0 AND expires_at > NOW()
       ORDER BY id DESC LIMIT 1`,
      [email, otp]
    );

    if (rows.length === 0) {
      return res.json({ success: false, message: 'Invalid or expired OTP' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await pool.execute('UPDATE users SET password_hash = ? WHERE email = ?', [newHash, email]);
    await pool.execute('UPDATE otps SET used = 1 WHERE id = ?', [rows[0].id]);

    res.json({ success: true, message: 'Password updated!' });
  } catch (err) {
    console.error('reset-password error:', err);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
});

// Login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const [rows] = await pool.execute('SELECT id, password_hash, country FROM users WHERE email = ? LIMIT 1', [email]);
    if (rows.length === 0) {
      return res.json({ success: false, message: 'Invalid email or password' });
    }

    const { id, password_hash, country } = rows[0];
    const ok = await bcrypt.compare(password, password_hash);
    if (!ok) {
      return res.json({ success: false, message: 'Invalid email or password' });
    }

    // No session/JWT yet; just return success (include country for localization)
    res.json({ success: true, message: 'Login successful', userId: id, country });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// Create a shop
// Create a shop (only one shop per user)
app.post('/api/shops', async (req, res) => {
  try {
    const { ownerEmail, name, description } = req.body;
    if (!ownerEmail || !name) {
      return res.status(400).json({ success: false, message: 'ownerEmail and name are required' });
    }
    const [users] = await pool.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [ownerEmail]);
    if (!users.length) return res.status(404).json({ success: false, message: 'Owner not found' });
    const userId = users[0].id;

    // Only allow one shop per user
    const [existingShop] = await pool.execute('SELECT id, name, description FROM shops WHERE user_id = ? LIMIT 1', [userId]);
    if (existingShop.length) {
      return res.json({ success: true, shopId: existingShop[0].id, shop: existingShop[0] });
    }

    const [result] = await pool.execute(
      'INSERT INTO shops (user_id, name, description) VALUES (?, ?, ?)',
      [userId, name, description || null]
    );
    res.json({ success: true, shopId: result.insertId, shop: { id: result.insertId, name, description } });
  } catch (err) {
    console.error('create shop error:', err);
    res.status(500).json({ success: false, message: 'Failed to create shop' });
  }
});

// Get shop by ownerEmail
app.get('/api/shops', async (req, res) => {
  try {
    const { ownerEmail } = req.query;
    if (!ownerEmail) return res.status(400).json({ success: false, message: 'ownerEmail required' });
    const [users] = await pool.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [ownerEmail]);
    if (!users.length) return res.status(404).json({ success: false, message: 'Owner not found' });
    const userId = users[0].id;
    const [shops] = await pool.execute('SELECT id, name, description FROM shops WHERE user_id = ? LIMIT 1', [userId]);
    if (!shops.length) return res.json({ success: false, message: 'No shop found for user' });
    res.json({ success: true, shop: shops[0] });
  } catch (err) {
    console.error('get shop error:', err);
    res.status(500).json({ success: false, message: 'Failed to get shop' });
  }
});

// Create a product (images are URLs for now)
app.post('/api/products', upload.array('images', 12), async (req, res) => {
  try {
    const body = req.body;
    const ownerEmail = body.ownerEmail;
    const shopId = body.shopId ? Number(body.shopId) : null;
    const title = body.title;
    const description = body.description || null;
    const price = Number(body.price);
    const category = body.category || null;
    const stock = body.stock == null || body.stock === '' ? null : Number(body.stock);
    const status = ['draft','published'].includes(String(body.status||'draft')) ? body.status : 'draft';

    if (!title || Number.isNaN(price)) {
      return res.status(400).json({ success: false, message: 'title and price are required' });
    }

    let resolvedShopId = shopId || null;
    if (!resolvedShopId) {
      if (!ownerEmail) return res.status(400).json({ success: false, message: 'ownerEmail required when shopId is not provided' });
      const [users] = await pool.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [ownerEmail]);
      if (!users.length) return res.status(404).json({ success: false, message: 'Owner not found' });
      const userId = users[0].id;
      const [shops] = await pool.execute('SELECT id FROM shops WHERE user_id = ? ORDER BY id ASC LIMIT 1', [userId]);
      if (shops.length) {
        resolvedShopId = shops[0].id;
      } else {
        const [ins] = await pool.execute('INSERT INTO shops (user_id, name) VALUES (?, ?)', [userId, 'My Shop']);
        resolvedShopId = ins.insertId;
      }
    }

    const [result] = await pool.execute(
      'INSERT INTO products (shop_id, title, description, price, category, stock, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [resolvedShopId, title, description, price, category, stock, status]
    );
    const productId = result.insertId;

    // Save uploaded files as image URLs
    if (req.files && req.files.length) {
      const values = req.files.map((f, i) => [productId, `/uploads/${path.basename(f.path)}`, i]);
      await pool.query('INSERT INTO product_images (product_id, url, sort_order) VALUES ?', [values]);
    }

    res.json({ success: true, productId });
  } catch (err) {
    console.error('create product error:', err);
    res.status(500).json({ success: false, message: 'Failed to create product' });
  }
});

// List products (public)
app.get('/api/products', async (req, res) => {
  try {
    let { status = 'published', category, q = '', page = '1', limit = '50', shopId } = req.query;
    const where = [];
    const args = [];
    if (shopId) { where.push('p.shop_id = ?'); args.push(Number(shopId)); }
    if (status) { where.push('p.status = ?'); args.push(status); }
    if (category) { where.push('p.category = ?'); args.push(category); }
    if (q) { where.push('(p.title LIKE ? OR p.description LIKE ? OR p.category LIKE ?)'); args.push(`%${q}%`,`%${q}%`,`%${q}%`); }
    const whereSql = where.length ? ('WHERE ' + where.join(' AND ')) : '';

    const pageNum = Math.max(1, parseInt(String(page),10)||1);
    const lim = Math.min(100, Math.max(1, parseInt(String(limit),10)||50));
    const offset = (pageNum - 1) * lim;

    const [rows] = await pool.query(
      `SELECT p.id, p.shop_id, p.title, p.description, p.price, p.category, p.stock, p.status, p.created_at
       FROM products p
       ${whereSql}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      args.concat([lim, offset])
    );

    if (!rows.length) return res.json({ success: true, products: [], total: 0 });
    const ids = rows.map(r => r.id);
    const [imgs] = await pool.query('SELECT product_id, url, sort_order FROM product_images WHERE product_id IN (?) ORDER BY sort_order ASC, id ASC', [ids]);
    const imgMap = {};
    imgs.forEach(x => { if(!imgMap[x.product_id]) imgMap[x.product_id]=[]; imgMap[x.product_id].push(x.url); });

    const products = rows.map(r => ({ id: r.id, title: r.title, description: r.description, price: Number(r.price), category: r.category, stock: r.stock, status: r.status, createdAt: new Date(r.created_at).getTime(), images: imgMap[r.id] || [] }));

    // Optionally return count
    const [[{cnt}]] = await pool.query(`SELECT COUNT(*) as cnt FROM products p ${whereSql}`, args);
    res.json({ success: true, products, total: Number(cnt) });
  } catch (err) {
    console.error('list products error:', err);
    res.status(500).json({ success: false, message: 'Failed to list products' });
  }
});

// Get product by id
app.get('/api/products/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'Invalid id' });
    const [rows] = await pool.query('SELECT id, shop_id, title, description, price, category, stock, status, created_at FROM products WHERE id = ? LIMIT 1', [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' });
    const [imgs] = await pool.query('SELECT url FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, id ASC', [id]);
    const images = imgs.map(x => x.url);
    const r = rows[0];
    res.json({ success: true, product: { id: r.id, title: r.title, description: r.description, price: Number(r.price), category: r.category, stock: r.stock, status: r.status, createdAt: new Date(r.created_at).getTime(), images } });
  } catch (err) {
    console.error('get product error:', err);
    res.status(500).json({ success: false, message: 'Failed to get product' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
