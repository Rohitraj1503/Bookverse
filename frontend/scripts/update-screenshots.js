#!/usr/bin/env node
/**
 * BookVerse Automated Screenshot Updater
 *
 * Captures real, high-resolution screenshots from the running BookVerse
 * application using Playwright Chromium with guaranteed validation and safety.
 *
 * Supported pages:
 *  - user_home.png        (Homepage & Editorial Hero)
 *  - books_listing.png    (Book Catalog with search & filter pills)
 *  - cart_checkout.png    (Shopping Cart & Order Summary)
 *  - admin_dashboard.png  (Admin Dashboard stats & overview)
 *  - admin_books.png      (Admin Books management table & pagination)
 *  - admin_orders.png     (Admin Customer Orders management)
 *
 * Usage:
 *   npm run screenshots:update
 *   npm run screenshots:update -- --page admin_dashboard
 *   npm run screenshots:update -- --page cart_checkout
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project Directories
const FRONTEND_DIR = path.resolve(__dirname, '..');
const PROJECT_ROOT = path.resolve(FRONTEND_DIR, '..');
const SCREENSHOTS_DIR = path.resolve(PROJECT_ROOT, 'screenshots');
const TEMP_DIR = path.resolve(SCREENSHOTS_DIR, '.temp');

// Configuration
const FRONTEND_URL = process.env.BOOKVERSE_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@bookverse.com';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'admin123';

const DEFAULT_VIEWPORT = {
  width: 1440,
  height: 1000,
};

// Screenshot Definitions
const SCREENSHOT_CONFIGS = [
  {
    id: 'landing_cyclone',
    filename: 'landing_cyclone.png',
    title: '3D Book Cyclone Landing Page',
    path: '/',
    auth: false,
    viewport: DEFAULT_VIEWPORT,
    async prepare(page) {
      await page.waitForSelector('.bookverse-landing-page, .landing-3d-canvas-container, canvas', { timeout: 15000 });
      // Allow Three.js canvas to initialize and render rotating books
      await page.waitForTimeout(2500);
    },
  },
  {
    id: 'user_home',
    filename: 'user_home.png',
    title: 'User Homepage',
    path: '/home',
    auth: false,
    viewport: DEFAULT_VIEWPORT,
    async prepare(page) {
      await page.waitForSelector('.home-page, .cinematic-hero, .navbar', { timeout: 15000 });
      // Ensure smooth entrance animations and cover images finish rendering
      await page.waitForTimeout(2000);
    },
  },
  {
    id: 'books_listing',
    filename: 'books_listing.png',
    title: 'Books Catalog / Listing',
    path: '/books',
    auth: false,
    viewport: DEFAULT_VIEWPORT,
    async prepare(page) {
      await page.waitForSelector('.book-card, .book-card-container, .books-page', { timeout: 15000 });
      // Scroll slightly to trigger any lazy covers, then scroll back to top
      await page.evaluate(() => window.scrollBy(0, 300));
      await page.waitForTimeout(800);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(1500);
    },
  },
  {
    id: 'cart_checkout',
    filename: 'cart_checkout.png',
    title: 'Shopping Cart & Checkout Summary',
    path: '/cart',
    auth: false,
    viewport: DEFAULT_VIEWPORT,
    async prepare(page) {
      // Seed realistic cart items and active customer profile in localStorage
      await page.evaluate(() => {
        const demoCart = [
          { bookId: 1, qty: 1 },
          { bookId: 2, qty: 1 },
          { bookId: 4, qty: 1 },
        ];
        localStorage.setItem('bv_cart', JSON.stringify(demoCart));
        localStorage.setItem(
          'bv_user',
          JSON.stringify({
            id: 2,
            name: 'Jane Reader',
            fullName: 'Jane Reader',
            email: 'jane@example.com',
            role: 'customer',
          })
        );
      });

      // Reload to ensure CartProvider hydrates the seeded localStorage state
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForSelector('.cart-page, .cart-item, [class*="cart"]', { timeout: 15000 });
      await page.waitForTimeout(1500);
    },
  },
  {
    id: 'admin_dashboard',
    filename: 'admin_dashboard.png',
    title: 'Admin Dashboard Overview',
    path: '/admin',
    auth: true,
    viewport: DEFAULT_VIEWPORT,
    async prepare(page) {
      await page.waitForSelector('.admin-dashboard, #statsCards, .admin-stats-grid', { timeout: 15000 });
      await page.waitForTimeout(1500);
    },
  },
  {
    id: 'admin_books',
    filename: 'admin_books.png',
    title: 'Admin Book Management',
    path: '/admin',
    auth: true,
    viewport: DEFAULT_VIEWPORT,
    async prepare(page) {
      await page.waitForSelector('.admin-books-section, .admin-books-table, .data-table', { timeout: 15000 });
      const booksTab = page.locator('button:has-text("Books")');
      if (await booksTab.isVisible()) {
        await booksTab.click();
      }
      await page.waitForTimeout(1500);
    },
  },
  {
    id: 'admin_orders',
    filename: 'admin_orders.png',
    title: 'Admin Orders Management',
    path: '/admin',
    auth: true,
    viewport: DEFAULT_VIEWPORT,
    async prepare(page) {
      await page.waitForSelector('.admin-dashboard', { timeout: 15000 });
      const ordersTab = page.locator('button:has-text("Orders")');
      if (await ordersTab.isVisible()) {
        await ordersTab.click();
      }
      await page.waitForSelector('.admin-table-wrapper, table', { timeout: 15000 });
      await page.waitForTimeout(1500);
    },
  },
];

// Helper: check if a URL is responding
async function checkUrl(targetUrl, timeoutMs = 3000) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(targetUrl);
      const client = parsed.protocol === 'https:' ? https : http;
      const req = client.get(
        targetUrl,
        {
          headers: { 'User-Agent': 'BookVerse-HealthCheck' },
          timeout: timeoutMs,
        },
        (res) => {
          resolve({ ok: true, status: res.statusCode });
        }
      );
      req.on('error', (err) => resolve({ ok: false, error: err.message }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ ok: false, error: 'Connection timed out' });
      });
    } catch (e) {
      resolve({ ok: false, error: e.message });
    }
  });
}

// Parse Command Line Arguments
function parseArgs() {
  const args = process.argv.slice(2);
  let pageFilter = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--page' && args[i + 1]) {
      pageFilter = args[i + 1].trim().toLowerCase().replace(/\.png$/, '');
      i++;
    } else if (args[i].startsWith('--page=')) {
      pageFilter = args[i].split('=')[1].trim().toLowerCase().replace(/\.png$/, '');
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
BookVerse Screenshot Updater

Usage:
  npm run screenshots:update                     Capture all screenshots
  npm run screenshots:update -- --page <name>    Capture a specific screenshot

Available pages:
  - user_home
  - books_listing
  - cart_checkout
  - admin_dashboard
  - admin_books
  - admin_orders
`);
      process.exit(0);
    }
  }

  return { pageFilter };
}

async function main() {
  const { pageFilter } = parseArgs();

  console.log('====================================================');
  console.log('📸 BookVerse Automated Screenshot Capture');
  console.log('====================================================');
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`Backend URL:  ${BACKEND_URL}`);
  console.log(`Output Dir:   ${SCREENSHOTS_DIR}\n`);

  // 1. Check Frontend Availability
  const feCheck = await checkUrl(FRONTEND_URL);
  if (!feCheck.ok) {
    console.error(`❌ Error: Frontend is not responding at ${FRONTEND_URL}`);
    console.error(`   Please start the Vite dev server first:`);
    console.error(`   cd frontend && npm run dev\n`);
    process.exit(1);
  }
  console.log(`✓ Frontend server is accessible at ${FRONTEND_URL}`);

  // 2. Check Backend Availability (Informational)
  const beCheck = await checkUrl(`${BACKEND_URL}/api/books`);
  if (beCheck.ok) {
    console.log(`✓ Spring Boot backend is accessible at ${BACKEND_URL}`);
  } else {
    console.warn(`⚠️ Warning: Backend at ${BACKEND_URL} is unreachable (${beCheck.error || beCheck.status}). Proceeding with cached / mock data.`);
  }

  // 3. Ensure Directories Exist
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  // Filter Target Screenshots
  let targets = SCREENSHOT_CONFIGS;
  if (pageFilter) {
    targets = SCREENSHOT_CONFIGS.filter(
      (c) => c.id.toLowerCase() === pageFilter || c.filename.toLowerCase() === pageFilter || c.filename.toLowerCase() === `${pageFilter}.png`
    );
    if (targets.length === 0) {
      console.error(`❌ Error: Unknown screenshot target "${pageFilter}".`);
      console.error(`   Available options: ${SCREENSHOT_CONFIGS.map((c) => c.id).join(', ')}`);
      process.exit(1);
    }
    console.log(`🎯 Targeting single screenshot: "${targets[0].id}"\n`);
  } else {
    console.log(`🎯 Capturing all ${targets.length} screenshots\n`);
  }

  // Launch Playwright Chromium
  console.log('🚀 Launching Chromium browser...');
  const browser = await chromium.launch({
    headless: true,
  });

  const results = [];

  for (const item of targets) {
    console.log(`\n----------------------------------------------------`);
    console.log(`📷 Capturing: ${item.title} (${item.filename})`);
    console.log(`   Route: ${item.path}`);

    const context = await browser.newContext({
      viewport: item.viewport || DEFAULT_VIEWPORT,
      deviceScaleFactor: 1,
    });

    // Handle Authentication for Admin routes safely
    if (item.auth) {
      await context.addInitScript(
        ({ email }) => {
          const adminUser = {
            id: 1,
            name: 'Admin User',
            fullName: 'Admin User',
            email: email,
            role: 'admin',
            token: 'demo_admin_jwt_token',
          };
          window.localStorage.setItem('bv_user', JSON.stringify(adminUser));
        },
        { email: ADMIN_EMAIL }
      );
    }

    const page = await context.newPage();
    const tempFilePath = path.join(TEMP_DIR, item.filename);
    const targetFilePath = path.join(SCREENSHOTS_DIR, item.filename);

    try {
      const fullUrl = `${FRONTEND_URL}${item.path}`;
      await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });

      // Run page-specific preparation (waiting for selectors, data, animations)
      if (item.prepare) {
        await item.prepare(page);
      }

      // Capture screenshot to temporary file first (Phase 4 requirement)
      await page.screenshot({
        path: tempFilePath,
        fullPage: false,
      });

      // Validate captured screenshot
      if (!fs.existsSync(tempFilePath)) {
        throw new Error(`Temp file was not created at ${tempFilePath}`);
      }

      const stats = fs.statSync(tempFilePath);
      if (stats.size < 10000) {
        throw new Error(`Captured image is too small (${stats.size} bytes). Possible blank page.`);
      }

      // Safely replace old screenshot
      fs.copyFileSync(tempFilePath, targetFilePath);
      fs.unlinkSync(tempFilePath);

      console.log(`   ✓ Successfully captured & verified (${Math.round(stats.size / 1024)} KB)`);
      console.log(`   ✓ Saved to: ${targetFilePath}`);
      results.push({ item, success: true, size: stats.size });
    } catch (err) {
      console.error(`   ❌ Failed to capture ${item.filename}: ${err.message}`);
      if (fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (_) {}
      }
      results.push({ item, success: false, error: err.message });
    } finally {
      await context.close();
    }
  }

  await browser.close();

  // Clean up temp directory if empty
  try {
    if (fs.existsSync(TEMP_DIR)) {
      const remaining = fs.readdirSync(TEMP_DIR);
      if (remaining.length === 0) {
        fs.rmdirSync(TEMP_DIR);
      }
    }
  } catch (_) {}

  console.log('\n====================================================');
  console.log('📊 Screenshot Capture Summary');
  console.log('====================================================');
  let successCount = 0;
  for (const res of results) {
    if (res.success) {
      successCount++;
      console.log(`✓ ${res.item.filename.padEnd(22)}: Success (${Math.round(res.size / 1024)} KB)`);
    } else {
      console.log(`✗ ${res.item.filename.padEnd(22)}: FAILED - ${res.error}`);
    }
  }

  console.log(`\nCompleted: ${successCount} / ${results.length} screenshots updated successfully.\n`);

  if (successCount < results.length) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error running screenshot updater:', err);
  process.exit(1);
});
