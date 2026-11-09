/**
 * ELROI CARE TRUST - Production Web Server & Management System
 * Official Website: www.elroicaretrust.in
 * Founder: P.K. Immanuel Neas Kumar | Mobile: 7904947631
 * 
 * Pure Node.js Implementation (Zero external npm dependencies required)
 * Dual Standalone + Vercel Serverless Ready
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Auto-load environment variables from .env.local and .env
function autoLoadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const fullPath = path.join(__dirname, file);
    try {
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        content.split(/\r?\n/).forEach(line => {
          line = line.trim();
          if (!line || line.startsWith('#')) return;
          const eqIdx = line.indexOf('=');
          if (eqIdx !== -1) {
            const key = line.slice(0, eqIdx).trim();
            let val = line.slice(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        });
      }
    } catch (e) { }
  }

  // Automatically map TRUST_READ_WRITE_TOKEN or custom store tokens to standard BLOB_READ_WRITE_TOKEN
  if (process.env.TRUST_READ_WRITE_TOKEN && !process.env.BLOB_READ_WRITE_TOKEN) {
    process.env.BLOB_READ_WRITE_TOKEN = process.env.TRUST_READ_WRITE_TOKEN;
  }
  if (process.env.TRUST_STORE_ID && !process.env.BLOB_STORE_ID) {
    process.env.BLOB_STORE_ID = process.env.TRUST_STORE_ID;
  }
}
autoLoadEnv();

// Official Vercel Blob SDK
let vercelBlob = null;
try {
  vercelBlob = require('@vercel/blob');
} catch (e) { }

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const IS_VERCEL = !!(process.env.VERCEL || process.env.NOW_REGION || process.env.AWS_LAMBDA_FUNCTION_NAME);

const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const KENNY_DIR = path.join(ROOT_DIR, 'kenny');
const UPLOADS_DIR = IS_VERCEL ? '/tmp/uploads' : path.join(ROOT_DIR, 'public', 'uploads');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const TMP_DATA_DIR = IS_VERCEL ? '/tmp' : DATA_DIR;

const DB_FILE = path.join(DATA_DIR, 'database.json');
const TMP_DB_FILE = path.join(TMP_DATA_DIR, 'database.json');

const CUSTOM_PHOTOS_FILE = path.join(DATA_DIR, 'custom_photos.json');
const TMP_CUSTOM_PHOTOS_FILE = path.join(TMP_DATA_DIR, 'custom_photos.json');

const DELETED_PHOTOS_FILE = path.join(DATA_DIR, 'deleted_photos.json');
const TMP_DELETED_PHOTOS_FILE = path.join(TMP_DATA_DIR, 'deleted_photos.json');

const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const TMP_SETTINGS_FILE = path.join(TMP_DATA_DIR, 'settings.json');

// Ensure required directories exist (safely skip if read-only)
[PUBLIC_DIR, UPLOADS_DIR, DATA_DIR, TMP_DATA_DIR].forEach(dir => {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (e) { }
});

// MIME Types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8'
};

// In-Memory Global Caches (Persists through warm lambda invocations)
let inMemoryDB = null;
let inMemorySettings = null;
let inMemoryCustomPhotos = null;
let inMemoryDeletedPhotos = null;

// Helper: Read Database
function readDB() {
  if (inMemoryDB) return inMemoryDB;
  if (IS_VERCEL && fs.existsSync(TMP_DB_FILE)) {
    try {
      inMemoryDB = JSON.parse(fs.readFileSync(TMP_DB_FILE, 'utf8'));
      return inMemoryDB;
    } catch (e) { }
  }
  try {
    if (fs.existsSync(DB_FILE)) {
      inMemoryDB = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      return inMemoryDB;
    }
  } catch (err) {
    console.error('Error reading DB:', err.message);
  }
  inMemoryDB = { trust_info: {}, impact_metrics: {}, activities: [], enquiries: [], donations: [] };
  return inMemoryDB;
}

// Helper: Save Database
function saveDB(data) {
  inMemoryDB = data;
  if (IS_VERCEL) {
    try {
      fs.writeFileSync(TMP_DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) { }
  }
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    return false;
  }
}

// Helper: Read Settings
function readSettings() {
  if (inMemorySettings) return inMemorySettings;
  if (IS_VERCEL && fs.existsSync(TMP_SETTINGS_FILE)) {
    try {
      inMemorySettings = JSON.parse(fs.readFileSync(TMP_SETTINGS_FILE, 'utf8'));
      return inMemorySettings;
    } catch (e) { }
  }
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      inMemorySettings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
      return inMemorySettings;
    }
  } catch (e) { }
  inMemorySettings = {
    storage_mode: 'auto',
    vercel_blob_token: process.env.BLOB_READ_WRITE_TOKEN || process.env.TRUST_READ_WRITE_TOKEN || '',
    store_id: process.env.BLOB_STORE_ID || process.env.TRUST_STORE_ID || ''
  };
  return inMemorySettings;
}

// Helper: Save Settings
function saveSettings(settings) {
  inMemorySettings = settings;
  if (IS_VERCEL) {
    try {
      fs.writeFileSync(TMP_SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
    } catch (e) { }
  }
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (err) {
    return false;
  }
}

// Helper: Get Active Vercel Blob Token
function getActiveVercelToken() {
  const envToken = process.env.BLOB_READ_WRITE_TOKEN || process.env.TRUST_READ_WRITE_TOKEN;
  if (envToken && envToken.trim().length > 0) {
    const token = envToken.trim();
    if (!process.env.BLOB_READ_WRITE_TOKEN) process.env.BLOB_READ_WRITE_TOKEN = token;
    return token;
  }
  // Check any other *_READ_WRITE_TOKEN from Vercel store attachments
  for (const key of Object.keys(process.env)) {
    if (key.endsWith('_READ_WRITE_TOKEN') && process.env[key] && process.env[key].trim().length > 0) {
      const token = process.env[key].trim();
      process.env.BLOB_READ_WRITE_TOKEN = token;
      return token;
    }
  }
  const settings = readSettings();
  if (settings && settings.vercel_blob_token && settings.vercel_blob_token.trim().length > 0) {
    const token = settings.vercel_blob_token.trim();
    process.env.BLOB_READ_WRITE_TOKEN = token;
    return token;
  }
  return '';
}

// Helper: Upload Buffer directly to Vercel Blob Storage via @vercel/blob put() SDK
async function uploadToVercelBlob(buffer, originalFileName, contentType, requestedAccess = 'auto') {
  const token = getActiveVercelToken();
  if (!token) {
    throw new Error('Vercel Blob token is not configured.');
  }

  const ext = path.extname(originalFileName) || '.jpg';
  const base = path.basename(originalFileName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
  const blobPath = `gallery/${Date.now()}-${base}${ext}`;

  // 1. Official @vercel/blob SDK put()
  if (vercelBlob && typeof vercelBlob.put === 'function') {
    // Determine order of access attempts based on requestedAccess
    let modesToTry = ['public', 'private'];
    if (requestedAccess === 'private') {
      modesToTry = ['private', 'public'];
    }

    let lastError = null;
    for (const mode of modesToTry) {
      try {
        const blob = await vercelBlob.put(blobPath, buffer, {
          access: mode,
          token: token,
          contentType: contentType || 'image/jpeg',
          addRandomSuffix: true
        });
        blob.effectiveAccess = mode;
        return blob;
      } catch (err) {
        lastError = err;
        console.warn(`@vercel/blob put() with access='${mode}' failed: ${err.message}. Trying next mode if available.`);
      }
    }
    throw lastError || new Error('Failed to upload to Vercel Blob with both public and private access.');
  }

  // 2. Direct HTTPS REST API fallback
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'blob.vercel-storage.com',
      port: 443,
      path: `/${blobPath}`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-api-version': '7',
        'Content-Type': contentType || 'image/jpeg',
        'Content-Length': buffer.length,
        'x-add-random-suffix': 'true'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300 && data.url) {
            data.effectiveAccess = 'public';
            resolve(data);
          } else {
            reject(new Error(data.message || `Vercel Blob error (${res.statusCode}): ${body}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse Vercel Blob response: ${body}`));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(buffer);
    req.end();
  });
}

// Helper: Read Custom Photos
function readCustomPhotos() {
  if (Array.isArray(inMemoryCustomPhotos)) {
    return inMemoryCustomPhotos;
  }
  if (IS_VERCEL && fs.existsSync(TMP_CUSTOM_PHOTOS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(TMP_CUSTOM_PHOTOS_FILE, 'utf8'));
      if (Array.isArray(data)) {
        inMemoryCustomPhotos = data;
        return inMemoryCustomPhotos;
      }
    } catch (e) { }
  }
  try {
    if (fs.existsSync(CUSTOM_PHOTOS_FILE)) {
      const data = JSON.parse(fs.readFileSync(CUSTOM_PHOTOS_FILE, 'utf8'));
      if (Array.isArray(data)) {
        inMemoryCustomPhotos = data;
        return inMemoryCustomPhotos;
      }
    }
  } catch (err) { }
  inMemoryCustomPhotos = [];
  return inMemoryCustomPhotos;
}

// Helper: Save Custom Photos
function saveCustomPhotos(photos) {
  inMemoryCustomPhotos = photos;
  if (IS_VERCEL) {
    try {
      fs.writeFileSync(TMP_CUSTOM_PHOTOS_FILE, JSON.stringify(photos, null, 2), 'utf8');
    } catch (e) { }
  }
  try {
    fs.writeFileSync(CUSTOM_PHOTOS_FILE, JSON.stringify(photos, null, 2), 'utf8');
    return true;
  } catch (err) {
    return false;
  }
}

// Helper: Read Deleted Photos (Allows removing any photo from gallery)
function readDeletedPhotos() {
  if (Array.isArray(inMemoryDeletedPhotos)) {
    return inMemoryDeletedPhotos;
  }
  if (IS_VERCEL && fs.existsSync(TMP_DELETED_PHOTOS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(TMP_DELETED_PHOTOS_FILE, 'utf8'));
      if (Array.isArray(data)) {
        inMemoryDeletedPhotos = data;
        return inMemoryDeletedPhotos;
      }
    } catch (e) { }
  }
  try {
    if (fs.existsSync(DELETED_PHOTOS_FILE)) {
      const data = JSON.parse(fs.readFileSync(DELETED_PHOTOS_FILE, 'utf8'));
      if (Array.isArray(data)) {
        inMemoryDeletedPhotos = data;
        return inMemoryDeletedPhotos;
      }
    }
  } catch (err) { }
  inMemoryDeletedPhotos = [];
  return inMemoryDeletedPhotos;
}

// Helper: Save Deleted Photos
function saveDeletedPhotos(list) {
  inMemoryDeletedPhotos = list;
  if (IS_VERCEL) {
    try {
      fs.writeFileSync(TMP_DELETED_PHOTOS_FILE, JSON.stringify(list, null, 2), 'utf8');
    } catch (e) { }
  }
  try {
    fs.writeFileSync(DELETED_PHOTOS_FILE, JSON.stringify(list, null, 2), 'utf8');
    return true;
  } catch (err) {
    return false;
  }
}

// Helper: Sync previously uploaded photos from Vercel Blob store
async function syncVercelBlobPhotos() {
  const token = getActiveVercelToken();
  if (!token || !vercelBlob || typeof vercelBlob.list !== 'function') return;
  try {
    const listRes = await vercelBlob.list({ prefix: 'gallery/', token });
    if (listRes && Array.isArray(listRes.blobs) && listRes.blobs.length > 0) {
      const current = readCustomPhotos();
      const deleted = readDeletedPhotos();
      let changed = false;
      for (const b of listRes.blobs) {
        const cleanName = path.basename(b.pathname || b.url);
        if (deleted.includes(cleanName) || deleted.includes(b.url)) continue;
        const exists = current.some(p => p.pathname === b.pathname || p.url === b.url || (p.raw_blob_url && p.raw_blob_url === b.url));
        if (!exists) {
          const isPrivate = (b.url || '').includes('private.blob.vercel-storage.com');
          current.push({
            id: Date.now() + Math.floor(Math.random() * 1000),
            filename: cleanName,
            url: isPrivate ? `/api/blob-image?url=${encodeURIComponent(b.url)}` : b.url,
            raw_blob_url: b.url,
            pathname: b.pathname,
            storage: 'vercel_blob',
            access: isPrivate ? 'private' : 'public',
            title: 'ELROI Charity Activity',
            category: 'community',
            description: 'Uploaded via ELROI Management Portal',
            date: b.uploadedAt ? new Date(b.uploadedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            featured: false
          });
          changed = true;
        }
      }
      if (changed) {
        saveCustomPhotos(current);
      }
    }
  } catch (e) {
    console.warn('Vercel Blob list sync skipped:', e.message);
  }
}

// Dynamic Gallery Scanner
function getGalleryItems() {
  const customPhotos = readCustomPhotos();
  const deletedPhotos = readDeletedPhotos();
  const isDeleted = (id, filename) => {
    return deletedPhotos.includes(String(id)) || (filename && deletedPhotos.includes(filename));
  };

  const items = [];
  let idCounter = 1;

  // Add custom uploaded photos first (newest on top, excluding deleted)
  customPhotos.forEach(item => {
    if (isDeleted(item.id, item.filename)) return;
    items.push({
      id: item.id || idCounter++,
      filename: item.filename,
      url: item.url || `/uploads/${encodeURIComponent(item.filename)}`,
      title: item.title || 'ELROI Charity Activity',
      category: item.category || 'community',
      description: item.description || '',
      date: item.date || new Date().toISOString().split('T')[0],
      featured: !!item.featured,
      storage: item.storage || 'local'
    });
  });

  // Add existing photos from kenny/ (excluding bank/passbook documents, founder portrait, and deleted photos)
  if (fs.existsSync(KENNY_DIR)) {
    const files = fs.readdirSync(KENNY_DIR)
      .filter(f => /\.(jpe?g|png|webp)$/i.test(f) && !f.includes('9.24.31') && !f.includes('11.57.07') && !f.includes('12.15.26'))
      .sort();

    const categoryMap = [
      { cat: 'groceries', title: 'Monthly Provisions & Rice Distribution', desc: 'Distributing essential 25kg/10kg rice and groceries to impoverished families.' },
      { cat: 'blind_disabled', title: 'Aid for Blind & Differently Abled Persons', desc: 'Providing monthly sustenance and mobility support to visually and physically impaired individuals.' },
      { cat: 'children', title: 'Children Welfare & Joyful Educational Camp', desc: 'Empowering underprivileged children through educational supplies, fun programs, and wholesome feasts.' },
      { cat: 'widows_seniors', title: 'Widows Support & Senior Citizen Care', desc: 'Bringing dignity, fresh clothes, and groceries to destitute elderly mothers and fathers.' },
      { cat: 'tribal', title: 'Tribal Hamlet & Nomadic Settlement Outreach', desc: 'Direct humanitarian relief with provisions, shelter aid, and clothes in remote tribal settlements.' }
    ];

    files.forEach((f, idx) => {
      let cat = 'community';
      let title = `Community Service Drive #${idx + 1}`;
      let desc = 'ELROI CARE TRUST serving the underprivileged with care and compassion.';
      let featured = false;

      if (f.includes('2.54.36 AM')) {
        cat = 'blind_disabled';
        title = 'Provisions Support for Differently Abled Person';
        desc = 'Handing over grocery essentials and nourishment kits to a wheelchair-bound person.';
        featured = true;
      } else if (f.includes('2.54.37 AM')) {
        cat = 'widows_seniors';
        title = 'Monthly Rice & Provisions for Elderly Widow';
        desc = 'Providing rice bags and monthly nutrition provisions directly to destitute seniors.';
        featured = true;
      } else if (f.includes('9.41.42 PM')) {
        cat = 'tribal';
        title = 'Rural & Tribal Community Relief Distribution';
        desc = 'Supplying essential rice and blankets to elderly villagers in remote areas.';
        featured = true;
      } else if (f.includes('9.21.17 PM') || f.includes('9.21.21 PM')) {
        cat = 'groceries';
        title = 'Monthly Provision Kits Packing & Preparation';
        desc = 'Preparing high-grade rice bags, toor dal, and essential groceries for distribution.';
        featured = true;
      } else if (f.includes('9.22.32 PM')) {
        cat = 'tribal';
        title = 'Direct Relief at Nomadic Tribal Settlements';
        desc = 'Delivering bulk rice, fresh vegetables, and groceries directly to families living in tent camps.';
        featured = true;
      } else if (f.includes('9.34.43 PM') || f.includes('10.03.22 PM') || f.includes('9.51.03 PM') || f.includes('9.23.20 PM')) {
        cat = 'children';
        title = 'Joyful Children Program & Wholesome Meals';
        desc = 'Gathering rural children for motivational programs, gifts, and delicious nutritious lunches.';
        featured = true;
      } else if (f.includes('9.27.55 PM')) {
        cat = 'widows_seniors';
        title = 'Clothing & Grocery Distribution to Destitute Elders';
        desc = 'Handing over new clothing and essential food supplies to an elderly resident.';
        featured = true;
      } else {
        const preset = categoryMap[idx % categoryMap.length];
        cat = preset.cat;
        title = `${preset.title} (${idx + 1})`;
        desc = preset.desc;
        featured = (idx % 8 === 0);
      }

      const itemId = idCounter++;
      if (isDeleted(itemId, f)) return;

      items.push({
        id: itemId,
        filename: f,
        url: `/photos/${encodeURIComponent(f)}`,
        title,
        category: cat,
        description: desc,
        date: '2026-10',
        featured
      });
    });
  }

  return items;
}

// Convert amount number to words (Indian numbering system)
function numberToIndianWords(num) {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  num = parseInt(num, 10);
  if (isNaN(num) || num === 0) return 'Zero Rupees Only';

  function inWords(n) {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : ' ');
    if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? 'and ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 !== 0 ? inWords(n % 10000000) : '');
  }

  return 'Rupees ' + inWords(num).trim() + ' Only';
}

// Simple multipart form data parser for Node.js
function parseMultipart(req, callback) {
  const contentType = req.headers['content-type'] || '';
  const match = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!match) {
    return callback(new Error('No boundary found in multipart headers'));
  }
  const boundary = (match[1] || match[2] || '').trim();
  const chunks = [];

  req.on('data', chunk => chunks.push(chunk));
  req.on('end', () => {
    try {
      const buffer = Buffer.concat(chunks);
      const boundaryBuffer = Buffer.from('--' + boundary);

      const fields = {};
      const files = [];

      let start = buffer.indexOf(boundaryBuffer);
      while (start !== -1) {
        start += boundaryBuffer.length;
        if (buffer.slice(start, start + 2).toString() === '--') break;
        if (buffer.slice(start, start + 2).toString() === '\r\n') start += 2;
        else if (buffer[start] === 0x0a) start += 1;

        const next = buffer.indexOf(boundaryBuffer, start);
        if (next === -1) break;

        let partEnd = next;
        if (buffer[next - 1] === 0x0a) {
          partEnd = (buffer[next - 2] === 0x0d) ? next - 2 : next - 1;
        }
        const part = buffer.slice(start, partEnd);
        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd !== -1) {
          const headersStr = part.slice(0, headerEnd).toString('utf8');
          const body = part.slice(headerEnd + 4);

          const dispMatch = headersStr.match(/Content-Disposition: form-data; name="([^"]+)"(?:; filename="([^"]+)")?/i);
          if (dispMatch) {
            const fieldName = dispMatch[1];
            const fileName = dispMatch[2];

            if (fileName) {
              const ctMatch = headersStr.match(/Content-Type: ([^\r\n]+)/i);
              files.push({
                fieldName,
                fileName,
                contentType: ctMatch ? ctMatch[1].trim() : 'application/octet-stream',
                data: body
              });
            } else {
              fields[fieldName] = body.toString('utf8');
            }
          }
        }
        start = next;
      }

      callback(null, fields, files);
    } catch (err) {
      callback(err);
    }
  });
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  const host = req.headers.host || `localhost:${PORT}`;
  const parsedUrl = new URL(req.url, `http://${host}`);
  const pathname = decodeURIComponent(parsedUrl.pathname);
  const method = req.method;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // ==========================================
  // API ROUTES
  // ==========================================

  // GET /api/trust-info
  if (pathname === '/api/trust-info' && method === 'GET') {
    const db = readDB();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      trust_info: db.trust_info,
      impact_metrics: db.impact_metrics
    }));
  }

  // GET /api/activities
  if (pathname === '/api/activities' && method === 'GET') {
    const db = readDB();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(db.activities || []));
  }

  // GET /api/photos
  if (pathname === '/api/photos' && method === 'GET') {
    if (getActiveVercelToken()) {
      syncVercelBlobPhotos().catch(() => {});
    }
    const allItems = getGalleryItems();
    const cat = parsedUrl.searchParams.get('category');
    let filtered = allItems;
    if (cat && cat !== 'all') {
      filtered = allItems.filter(item => item.category === cat);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(filtered));
  }

  // GET /api/blob-image (Secure streaming proxy for private Vercel Blob images)
  if (pathname === '/api/blob-image' && method === 'GET') {
    const rawUrl = parsedUrl.searchParams.get('url');
    if (!rawUrl) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      return res.end('Missing url parameter');
    }
    const token = getActiveVercelToken();
    try {
      if (vercelBlob && typeof vercelBlob.get === 'function' && token) {
        const result = await vercelBlob.get(rawUrl, { access: 'private', token });
        if (result && result.stream) {
          res.writeHead(200, {
            'Content-Type': (result.blob && result.blob.contentType) || 'image/jpeg',
            'Cache-Control': 'public, max-age=86400, s-maxage=86400',
            ...(result.blob && result.blob.size ? { 'Content-Length': result.blob.size } : {})
          });
          const { Readable } = require('stream');
          Readable.fromWeb(result.stream).pipe(res);
          return;
        }
      }
    } catch (e) {
      console.warn('Private blob proxy stream error, redirecting:', e.message);
    }
    res.writeHead(302, { 'Location': rawUrl });
    return res.end();
  }

  // POST /api/photos (Upload Photo - Admin Portal)
  if (pathname === '/api/photos' && method === 'POST') {
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('multipart/form-data')) {
      parseMultipart(req, async (err, fields, files) => {
        if (err || !files || files.length === 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, message: 'No image file uploaded' }));
        }

        // Verify authorization: Passcode or admin token/session
        const reqPasscode = (fields.passcode || '').trim();
        const authHeader = req.headers['authorization'] || '';
        const isAuth = reqPasscode === 'elroicaretrust@2026' || 
                       authHeader.includes('elroi_admin_session_') || 
                       fields.admin_token;

        if (!isAuth) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ 
            success: false, 
            message: 'Unauthorized: Admin authentication required to upload photos.' 
          }));
        }

        const file = files[0];
        const ext = path.extname(file.fileName).toLowerCase() || '.jpg';
        const cleanName = `upload_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;
        const savePath = path.join(UPLOADS_DIR, cleanName);

        const vToken = getActiveVercelToken();
        const requestedAccess = fields.access === 'private' ? 'private' : (fields.access === 'public' ? 'public' : 'auto');

        // 1. If Vercel Blob Storage is configured, store via @vercel/blob put()!
        if (vToken) {
          try {
            const blobResult = await uploadToVercelBlob(file.data, file.fileName, file.contentType, requestedAccess);

            // Optional local disk cache if writable and not on Vercel
            if (!IS_VERCEL) {
              try { fs.writeFileSync(savePath, file.data); } catch (e) { }
            }

            const effectiveAccess = blobResult.effectiveAccess || requestedAccess || 'public';
            const photoUrl = effectiveAccess === 'private'
              ? `/api/blob-image?url=${encodeURIComponent(blobResult.url)}`
              : blobResult.url;

            const custom = readCustomPhotos();
            const newItem = {
              id: Date.now(),
              filename: cleanName,
              url: photoUrl,
              raw_blob_url: blobResult.url,
              pathname: blobResult.pathname,
              storage: 'vercel_blob',
              access: effectiveAccess,
              title: fields.title || file.fileName,
              category: fields.category || 'community',
              description: fields.description || '',
              date: fields.date || new Date().toISOString().split('T')[0],
              featured: fields.featured === 'true' || fields.featured === true
            };
            custom.unshift(newItem);
            saveCustomPhotos(custom);

            res.writeHead(201, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({
              success: true,
              message: `Photo uploaded successfully to Vercel Blob (${effectiveAccess})!`,
              storage: 'vercel_blob',
              access: effectiveAccess,
              blob: blobResult,
              photo: newItem
            }));
          } catch (blobErr) {
            console.error('@vercel/blob put() upload error:', blobErr.message);
            // On Vercel, the local filesystem is read-only. Return the exact Vercel error so user knows what to fix!
            if (IS_VERCEL) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({
                success: false,
                message: `Vercel Blob Storage upload failed: ${blobErr.message}. Please check your BLOB_READ_WRITE_TOKEN in Vercel Storage settings.`
              }));
            }
          }
        }

        // On Vercel when no token is present:
        if (IS_VERCEL) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            success: false,
            message: 'Vercel Blob Storage is not connected yet. On Vercel serverless, photos must be stored in Vercel Blob. Please go to Vercel Dashboard > Storage > Create Database > Blob > Connect to inject your BLOB_READ_WRITE_TOKEN, or paste your token in the Admin Portal Storage tab.'
          }));
        }

        // 2. Standard Local Server Storage (Local development)
        try {
          fs.writeFileSync(savePath, file.data);
          const custom = readCustomPhotos();
          const newItem = {
            id: Date.now(),
            filename: cleanName,
            url: `/uploads/${encodeURIComponent(cleanName)}`,
            storage: 'local',
            title: fields.title || file.fileName,
            category: fields.category || 'community',
            description: fields.description || '',
            date: fields.date || new Date().toISOString().split('T')[0],
            featured: fields.featured === 'true' || fields.featured === true
          };
          custom.unshift(newItem);
          saveCustomPhotos(custom);

          res.writeHead(201, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            success: true,
            message: 'Photo uploaded successfully to Local Gallery!',
            storage: 'local',
            photo: newItem
          }));
        } catch (writeErr) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, message: 'Error saving image file: ' + writeErr.message }));
        }
      });
      return;
    } else {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, message: 'Expected multipart/form-data' }));
    }
  }

  // DELETE /api/photos/:id (Admin delete photo - handles custom, vercel blob, and field photos)
  if (pathname.startsWith('/api/photos/') && (method === 'DELETE' || method === 'POST')) {
    const rawPhotoId = pathname.replace('/api/photos/', '').trim();
    const photoId = decodeURIComponent(rawPhotoId);
    let custom = readCustomPhotos();
    const idx = custom.findIndex(p => String(p.id) === String(photoId) || p.filename === photoId || (p.pathname && p.pathname.includes(photoId)));

    if (idx !== -1) {
      const removed = custom[idx];
      custom.splice(idx, 1);
      saveCustomPhotos(custom);

      // Record in deleted list
      const deleted = readDeletedPhotos();
      if (!deleted.includes(String(removed.id))) deleted.push(String(removed.id));
      if (removed.filename && !deleted.includes(removed.filename)) deleted.push(removed.filename);
      saveDeletedPhotos(deleted);

      // Delete from Vercel Blob if stored in Vercel
      if (removed.storage === 'vercel_blob' && vercelBlob && typeof vercelBlob.del === 'function') {
        const token = getActiveVercelToken();
        if (token) {
          const blobTarget = removed.raw_blob_url || removed.url || removed.pathname;
          try {
            await vercelBlob.del(blobTarget, { token });
          } catch (delErr) {
            console.warn('Failed to delete blob from Vercel:', delErr.message);
          }
        }
      }

      // Delete from local disk if exists
      if (removed.filename) {
        const filePath = path.join(UPLOADS_DIR, removed.filename);
        if (fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch (e) { }
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, message: 'Photo deleted successfully!' }));
    }

    // 2. Original Field photos or referenced by ID/filename
    const deleted = readDeletedPhotos();
    if (!deleted.includes(photoId)) deleted.push(photoId);
    if (!deleted.includes(rawPhotoId)) deleted.push(rawPhotoId);
    saveDeletedPhotos(deleted);

    // Try deleting from local disk if exists in kenny/ or uploads/
    const kennyPath = path.join(KENNY_DIR, photoId);
    if (fs.existsSync(kennyPath)) {
      try { fs.unlinkSync(kennyPath); } catch (e) { }
    }
    const uploadPath = path.join(UPLOADS_DIR, photoId);
    if (fs.existsSync(uploadPath)) {
      try { fs.unlinkSync(uploadPath); } catch (e) { }
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, message: 'Photo removed from gallery successfully!' }));
  }

  // GET /api/storage/status
  if (pathname === '/api/storage/status' && method === 'GET') {
    const token = getActiveVercelToken();
    const settings = readSettings();
    const storeId = process.env.BLOB_STORE_ID || process.env.TRUST_STORE_ID || settings.store_id || null;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      configured: !!token,
      engine: token ? 'vercel_blob' : 'local',
      target: token ? 'Vercel Blob Cloud CDN (Active)' : 'Local Disk (Vercel Ready)',
      store_id: storeId,
      message: token
        ? 'Connected to Vercel Blob Storage. All new photos are hosted on Vercel CDN.'
        : 'Running on local server storage. To store photos in Vercel Blob in the future, connect your Vercel project or set BLOB_READ_WRITE_TOKEN.',
      token_preview: token ? `${token.slice(0, 15)}...${token.slice(-6)}` : null
    }));
  }

  // POST /api/storage/config
  if (pathname === '/api/storage/config' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const settings = readSettings();
        if (payload.vercel_blob_token !== undefined) {
          settings.vercel_blob_token = payload.vercel_blob_token.trim();
        }
        if (payload.storage_mode !== undefined) {
          settings.storage_mode = payload.storage_mode;
        }
        settings.last_updated = new Date().toISOString();
        saveSettings(settings);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: true,
          message: 'Storage settings saved successfully!',
          configured: !!getActiveVercelToken()
        }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, message: 'Invalid JSON request' }));
      }
    });
    return;
  }

  // POST /api/storage/test
  if (pathname === '/api/storage/test' && method === 'POST') {
    const token = getActiveVercelToken();
    if (!token) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, message: 'No Vercel Blob token configured yet.' }));
    }
    const testBuffer = Buffer.from(`ELROI CARE TRUST - Vercel storage connection check ${new Date().toISOString()}`, 'utf8');
    uploadToVercelBlob(testBuffer, 'elroi_test_check.txt', 'text/plain')
      .then(blobRes => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: true,
          message: 'Vercel Blob Storage is connected and verified successfully!',
          url: blobRes.url
        }));
      })
      .catch(err => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: false,
          message: 'Vercel connection test failed: ' + err.message
        }));
      });
    return;
  }

  // POST /api/enquiries (Contact & Volunteer Form)
  if (pathname === '/api/enquiries' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        if (!payload.name || !payload.phone) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, message: 'Name and Phone number are required' }));
        }

        const db = readDB();
        if (!db.enquiries) db.enquiries = [];

        const newEnquiry = {
          id: `ENQ-${Date.now().toString().slice(-4)}`,
          name: payload.name.trim(),
          email: (payload.email || '').trim(),
          phone: payload.phone.trim(),
          subject: (payload.subject || 'General Enquiry').trim(),
          message: (payload.message || '').trim(),
          date: new Date().toISOString().split('T')[0],
          status: 'New'
        };

        db.enquiries.unshift(newEnquiry);
        saveDB(db);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: true,
          message: 'Thank you! Your enquiry has been received. Our team will contact you shortly.',
          enquiry: newEnquiry
        }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, message: 'Invalid JSON request' }));
      }
    });
    return;
  }

  // GET /api/enquiries (Admin view)
  if (pathname === '/api/enquiries' && method === 'GET') {
    const db = readDB();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(db.enquiries || []));
  }

  // POST /api/donations (Record Donation & Issue Receipt)
  if (pathname === '/api/donations' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        if (!payload.donor_name || !payload.amount || !payload.phone) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, message: 'Donor name, amount, and phone number are required' }));
        }

        const db = readDB();
        if (!db.donations) db.donations = [];

        const amountNum = parseFloat(payload.amount);
        const receiptId = `ECT-${new Date().getFullYear()}-${String(db.donations.length + 1001).padStart(4, '0')}`;

        const newDonation = {
          id: receiptId,
          donor_name: payload.donor_name.trim(),
          pan: (payload.pan || 'N/A').toUpperCase().trim(),
          email: (payload.email || '').trim(),
          phone: payload.phone.trim(),
          address: (payload.address || '').trim(),
          amount: amountNum,
          amount_words: numberToIndianWords(amountNum),
          payment_mode: payload.payment_mode || 'UPI / Bank Transfer',
          txn_ref: (payload.txn_ref || 'PENDING-VERIFICATION').trim(),
          date: payload.date || new Date().toISOString().split('T')[0],
          cause: payload.cause || 'General Charitable Corpus Fund (Provisions, Differently Abled, Widows & Children)',
          receipt_status: 'Issued'
        };

        db.donations.unshift(newDonation);
        saveDB(db);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: true,
          message: 'Donation recorded successfully! Your 80G tax receipt is ready.',
          receipt: newDonation
        }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, message: 'Invalid JSON request' }));
      }
    });
    return;
  }

  // GET /api/donations (Admin view)
  if (pathname === '/api/donations' && method === 'GET') {
    const db = readDB();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(db.donations || []));
  }

  // GET /api/receipt/:id (Fetch single receipt)
  if (pathname.startsWith('/api/receipt/') && method === 'GET') {
    const id = pathname.replace('/api/receipt/', '').trim();
    const db = readDB();
    const found = (db.donations || []).find(d => d.id === id);
    if (found) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(found));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, message: 'Receipt not found' }));
    }
  }

  // POST /api/admin/login
  if (pathname === '/api/admin/login' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        if (payload.username === 'admin' && payload.password === 'elroicaretrust@2026') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            success: true,
            token: 'elroi_admin_session_' + Date.now(),
            admin_name: 'P.K. Immanuel Neas Kumar (Founder)'
          }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, message: 'Invalid Username or Password' }));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, message: 'Invalid Request' }));
      }
    });
    return;
  }

  // ==========================================
  // STATIC ASSETS & PHOTOS SERVING
  // ==========================================

  // Serve photos directly from kenny/
  if (pathname.startsWith('/photos/')) {
    const filename = pathname.replace('/photos/', '');
    const filePath = path.join(KENNY_DIR, filename);

    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME_TYPES[ext] || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400'
      });
      return fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Photo not found');
    }
  }

  // Serve uploaded images from public/uploads/
  if (pathname.startsWith('/uploads/')) {
    const filename = pathname.replace('/uploads/', '');
    const filePath = path.join(UPLOADS_DIR, filename);

    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME_TYPES[ext] || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400'
      });
      return fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Uploaded file not found');
    }
  }

  // Map route aliases to HTML files
  let safePath = pathname;
  if (safePath === '/' || safePath === '') safePath = '/index.html';
  else if (safePath === '/favicon.ico' || safePath === '/favicon.png') safePath = '/logo.jpg';
  else if (safePath === '/about') safePath = '/about.html';
  else if (safePath === '/activities') safePath = '/activities.html';
  else if (safePath === '/80g' || safePath === '/tax-benefits-80g') safePath = '/tax-benefits-80g.html';
  else if (safePath === '/donate') safePath = '/donate.html';
  else if (safePath === '/gallery') safePath = '/gallery.html';
  else if (safePath === '/contact') safePath = '/contact.html';
  else if (safePath === '/receipt') safePath = '/receipt.html';
  else if (safePath === '/admin') safePath = '/admin.html';

  const fullPath = path.join(PUBLIC_DIR, safePath);

  // Serve file from public/
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    const ext = path.extname(fullPath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    return fs.createReadStream(fullPath).pipe(res);
  }

  // Fallback 404
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!DOCTYPE html>
  <html>
  <head>
    <title>404 - Page Not Found | ELROI CARE TRUST</title>
    <style>
      body { font-family: system-ui, sans-serif; text-align: center; padding: 80px 20px; background: #f8fafc; color: #1e293b; }
      h1 { color: #0b2545; font-size: 2.5rem; margin-bottom: 12px; }
      p { font-size: 1.1rem; color: #64748b; margin-bottom: 24px; }
      a { display: inline-block; background: #0b2545; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
    </style>
  </head>
  <body>
    <h1>404 - Page Not Found</h1>
    <p>The page you are looking for does not exist.</p>
    <a href="/">Return to Homepage</a>
  </body>
  </html>`);
});

if (require.main === module) {
  server.listen(PORT, () => {
    const token = getActiveVercelToken();
    const storeId = process.env.BLOB_STORE_ID || process.env.TRUST_STORE_ID;
    console.log(`====================================================`);
    console.log(` ELROI CARE TRUST - Production Web Server Running `);
    console.log(` Care, Compassion and Humanity `);
    console.log(` URL: http://localhost:${PORT}`);
    console.log(` Storage: ${token ? `Vercel Blob Storage [Active] (Store: ${storeId || 'Connected'})` : 'Local Disk Storage'}`);
    console.log(` Official Domain: www.elroicaretrust.in`);
    console.log(` Founder: P.K. Immanuel Neas Kumar (7904947631)`);
    console.log(`====================================================`);
    if (token) {
      syncVercelBlobPhotos().catch(() => {});
    }
  });
}

module.exports = server;
