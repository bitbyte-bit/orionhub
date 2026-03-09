import express from 'express';
import { createServer as createViteServer } from 'vite';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'zionn-secret-key-2026';
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Database setup
  const db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  // Clear existing data if requested or for fresh start (optional, but user asked for empty db)
  // await db.exec('DELETE FROM negotiations; DELETE FROM products; DELETE FROM businesses; DELETE FROM users;');

  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      password TEXT,
      displayName TEXT,
      role TEXT,
      photoURL TEXT,
      status TEXT DEFAULT 'active', -- active, warned, banned, suspended
      createdAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    -- Initialize commission rate if not exists
    INSERT OR IGNORE INTO settings (key, value) VALUES ('commission_rate', '10');
  `);

  // Seed Master Admin
  const adminEmail = 'adminzionn@gmail.com';
  const adminPassword = 'adminzionn';
  const existingAdmin = await db.get('SELECT * FROM users WHERE email = ?', [adminEmail]);
  if (!existingAdmin) {
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
    await db.run(
      'INSERT INTO users (id, email, password, displayName, role, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['admin-zionn', adminEmail, hashedAdminPassword, 'Master Admin', 'admin', 'active', Date.now()]
    );
  }

  await db.exec(`
    CREATE TABLE IF NOT EXISTS businesses (
      id TEXT PRIMARY KEY,
      ownerId TEXT,
      name TEXT,
      description TEXT,
      category TEXT,
      address TEXT,
      phone TEXT,
      email TEXT,
      website TEXT,
      logo TEXT,
      banner TEXT,
      createdAt INTEGER,
      FOREIGN KEY(ownerId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      businessId TEXT,
      name TEXT,
      description TEXT,
      price REAL,
      category TEXT,
      stock INTEGER,
      image TEXT,
      createdAt INTEGER,
      updatedAt INTEGER,
      FOREIGN KEY(businessId) REFERENCES businesses(id)
    );

    CREATE TABLE IF NOT EXISTS negotiations (
      id TEXT PRIMARY KEY,
      productId TEXT,
      customerId TEXT,
      businessId TEXT,
      status TEXT,
      messages TEXT, -- JSON string
      createdAt INTEGER,
      updatedAt INTEGER,
      FOREIGN KEY(productId) REFERENCES products(id),
      FOREIGN KEY(customerId) REFERENCES users(id),
      FOREIGN KEY(businessId) REFERENCES businesses(id)
    );
  `);

  // Multer setup for file uploads
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });
  const upload = multer({ storage });

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // --- API Routes ---

  // Auth
  app.post('/api/auth/register', async (req, res) => {
    const { email, password, displayName, role } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = Math.random().toString(36).substr(2, 9);
    const createdAt = Date.now();

    try {
      await db.run(
        'INSERT INTO users (id, email, password, displayName, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
        [id, email, hashedPassword, displayName, role || 'user', createdAt]
      );
      const token = jwt.sign({ id, email, role: role || 'user' }, JWT_SECRET);
      res.json({ token, user: { id, email, displayName, role: role || 'user' } });
    } catch (error) {
      res.status(400).json({ error: 'Email already exists' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    if (user.status === 'banned') return res.status(403).json({ error: 'Your account has been banned' });
    if (user.status === 'suspended') return res.status(403).json({ error: 'Your account has been suspended' });

    if (await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
      res.json({ token, user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role, photoURL: user.photoURL, status: user.status } });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  app.put('/api/auth/profile', authenticateToken, async (req: any, res) => {
    const { displayName, photoURL } = req.body;
    await db.run('UPDATE users SET displayName = ?, photoURL = ? WHERE id = ?', [displayName, photoURL, req.user.id]);
    res.json({ success: true });
  });

  app.put('/api/auth/password', authenticateToken, async (req: any, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await db.get('SELECT password FROM users WHERE id = ?', [req.user.id]);
    
    if (await bcrypt.compare(currentPassword, user.password)) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Incorrect current password' });
    }
  });

  app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
    const user = await db.get('SELECT id, email, displayName, role, photoURL FROM users WHERE id = ?', [req.user.id]);
    res.json(user);
  });

  // Upload
  app.post('/api/upload', authenticateToken, upload.single('file'), (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  });

  // Businesses
  app.get('/api/businesses/my', authenticateToken, async (req: any, res) => {
    const business = await db.get('SELECT * FROM businesses WHERE ownerId = ?', [req.user.id]);
    res.json(business || null);
  });

  app.get('/api/businesses/stats', authenticateToken, async (req: any, res) => {
    const business = await db.get('SELECT id FROM businesses WHERE ownerId = ?', [req.user.id]);
    if (!business) return res.status(404).json({ error: 'Business not found' });

    const productCount = await db.get('SELECT COUNT(*) as count FROM products WHERE businessId = ?', [business.id]);
    const negotiationCount = await db.get('SELECT COUNT(*) as count FROM negotiations WHERE businessId = ?', [business.id]);
    
    // Calculate total volume and commission for THIS business
    const acceptedNegotiations = await db.all('SELECT messages FROM negotiations WHERE businessId = ? AND status = "accepted"', [business.id]);
    let totalVolume = 0;
    acceptedNegotiations.forEach(n => {
      const messages = JSON.parse(n.messages);
      const lastOffer = [...messages].reverse().find(m => m.offerPrice);
      if (lastOffer) totalVolume += lastOffer.offerPrice;
    });

    const commissionRateSetting = await db.get('SELECT value FROM settings WHERE key = "commission_rate"');
    const commissionRate = parseFloat(commissionRateSetting?.value || '10') / 100;
    const totalCommission = totalVolume * commissionRate;
    const netIncome = totalVolume - totalCommission;

    res.json({
      products: productCount.count,
      negotiations: negotiationCount.count,
      totalVolume,
      totalCommission,
      netIncome,
      commissionRate: parseFloat(commissionRateSetting?.value || '10')
    });
  });

  app.post('/api/businesses', authenticateToken, async (req: any, res) => {
    const id = Math.random().toString(36).substr(2, 9);
    const { name, description, category, address, phone, email, website, logo, banner } = req.body;
    const createdAt = Date.now();

    await db.run(
      'INSERT INTO businesses (id, ownerId, name, description, category, address, phone, email, website, logo, banner, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, req.user.id, name, description, category, address, phone, email, website, logo, banner, createdAt]
    );
    res.json({ id, name });
  });

  // Products
  app.get('/api/products', async (req, res) => {
    const { businessId, category } = req.query;
    let query = 'SELECT * FROM products';
    const params = [];

    if (businessId || category) {
      query += ' WHERE';
      if (businessId) {
        query += ' businessId = ?';
        params.push(businessId);
      }
      if (category) {
        if (businessId) query += ' AND';
        query += ' category = ?';
        params.push(category);
      }
    }

    const products = await db.all(query, params);
    res.json(products);
  });

  app.post('/api/products', authenticateToken, async (req: any, res) => {
    const id = Math.random().toString(36).substr(2, 9);
    const { businessId, name, description, price, category, stock, image } = req.body;
    const now = Date.now();

    await db.run(
      'INSERT INTO products (id, businessId, name, description, price, category, stock, image, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, businessId, name, description, price, category, stock, image, now, now]
    );
    res.json({ id, name });
  });

  app.put('/api/products/:id', authenticateToken, async (req: any, res) => {
    const { name, description, price, category, stock, image } = req.body;
    const now = Date.now();

    await db.run(
      'UPDATE products SET name = ?, description = ?, price = ?, category = ?, stock = ?, image = ?, updatedAt = ? WHERE id = ?',
      [name, description, price, category, stock, image, now, req.params.id]
    );
    res.json({ success: true });
  });

  app.delete('/api/products/:id', authenticateToken, async (req: any, res) => {
    await db.run('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  });

  // Negotiations
  app.get('/api/negotiations', authenticateToken, async (req: any, res) => {
    const { role, id } = req.user;
    let query = 'SELECT * FROM negotiations';
    const params = [];

    if (role === 'user') {
      query += ' WHERE customerId = ?';
      params.push(id);
    } else {
      // For business owners, we'd need to join with businesses table
      query = `
        SELECT n.* FROM negotiations n
        JOIN businesses b ON n.businessId = b.id
        WHERE b.ownerId = ?
      `;
      params.push(id);
    }

    const negotiations = await db.all(query, params);
    res.json(negotiations.map(n => ({ ...n, messages: JSON.parse(n.messages) })));
  });

  app.post('/api/negotiations', authenticateToken, async (req: any, res) => {
    const id = Math.random().toString(36).substr(2, 9);
    const { productId, businessId, status, messages } = req.body;
    const now = Date.now();

    await db.run(
      'INSERT INTO negotiations (id, productId, customerId, businessId, status, messages, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, productId, req.user.id, businessId, status, JSON.stringify(messages), now, now]
    );
    res.json({ id });
  });

  app.put('/api/negotiations/:id', authenticateToken, async (req: any, res) => {
    const { status, messages } = req.body;
    const now = Date.now();

    await db.run(
      'UPDATE negotiations SET status = ?, messages = ?, updatedAt = ? WHERE id = ?',
      [status, JSON.stringify(messages), now, req.params.id]
    );
    res.json({ success: true });
  });

  // Admin Routes
  const isAdmin = (req: any, res: any, next: any) => {
    if (req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ error: 'Admin access required' });
    }
  };

  app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
    const users = await db.all('SELECT id, email, displayName, role, photoURL, status, createdAt FROM users');
    res.json(users);
  });

  app.put('/api/admin/users/:id/status', authenticateToken, isAdmin, async (req, res) => {
    const { status } = req.body;
    await db.run('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true });
  });

  app.get('/api/admin/settings', authenticateToken, isAdmin, async (req, res) => {
    const settings = await db.all('SELECT * FROM settings');
    const result: any = {};
    settings.forEach(s => result[s.key] = s.value);
    res.json(result);
  });

  app.put('/api/admin/settings', authenticateToken, isAdmin, async (req, res) => {
    const { commission_rate } = req.body;
    if (commission_rate !== undefined) {
      await db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['commission_rate', commission_rate.toString()]);
    }
    res.json({ success: true });
  });

  app.get('/api/admin/stats', authenticateToken, isAdmin, async (req, res) => {
    const userCount = await db.get('SELECT COUNT(*) as count FROM users');
    const businessCount = await db.get('SELECT COUNT(*) as count FROM businesses');
    const productCount = await db.get('SELECT COUNT(*) as count FROM products');
    const negotiationCount = await db.get('SELECT COUNT(*) as count FROM negotiations');
    
    // Calculate total volume and commission
    const acceptedNegotiations = await db.all('SELECT messages FROM negotiations WHERE status = "accepted"');
    let totalVolume = 0;
    acceptedNegotiations.forEach(n => {
      const messages = JSON.parse(n.messages);
      const lastOffer = [...messages].reverse().find(m => m.offerPrice);
      if (lastOffer) totalVolume += lastOffer.offerPrice;
    });

    const commissionRateSetting = await db.get('SELECT value FROM settings WHERE key = "commission_rate"');
    const commissionRate = parseFloat(commissionRateSetting?.value || '10') / 100;
    const totalCommission = totalVolume * commissionRate;

    res.json({
      users: userCount.count,
      businesses: businessCount.count,
      products: productCount.count,
      negotiations: negotiationCount.count,
      totalVolume,
      totalCommission,
      commissionRate: parseFloat(commissionRateSetting?.value || '10')
    });
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
