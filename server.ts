import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import https from 'https';
import http from 'http';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// STRICT NO-CACHE MIDDLEWARE FOR ALL API ROUTES
// Forces instantaneous bypass of browser, proxy, and intermediary caches
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  res.setHeader('X-Odoo-Sync-Timestamp', Date.now().toString());
  res.setHeader('X-Odoo-Cache-Status', 'BYPASS_LIVE');
  next();
});

// Odoo Configuration State (in-memory with defaults from env)
let odooConfig = {
  url: process.env.ODOO_URL || 'https://edu-smartcare.odoo.com',
  db: process.env.ODOO_DB || 'edu-smartcare',
  login: process.env.ODOO_LOGIN || 'ahmed3bdelhamedwork@gmail.com',
  apiKey: process.env.ODOO_API_KEY || 'd88233ec9119ba69a2d2646d760b2216ce9524cd',
  mcpKey: process.env.ODOO_MCP_KEY || 'd88233ec9119ba69a2d2646d760b2216ce9524cd',
};

// Cached UID per login (will be resolved dynamically on start or re-authentication)
let resolvedUid: number | null = 2; // Verified earlier for Ahmed Abdelhamed Mohammed

/**
 * Execute raw JSON-RPC call to Odoo instance with strict no-cache headers
 */
function callOdooJsonRpc(service: string, method: string, args: any[]): Promise<any> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(odooConfig.url);
    const postData = JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'call',
      params: { service, method, args },
    });

    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;

    const req = client.request(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: '/jsonrpc?_t=' + Date.now(), // timestamp query param to kill any edge proxy cache
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `bearer ${odooConfig.apiKey}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(raw);
            if (parsed.error) {
              reject(new Error(parsed.error.data?.message || parsed.error.message || 'Odoo Error'));
            } else {
              resolve(parsed.result);
            }
          } catch (e: any) {
            reject(new Error(`Failed to parse Odoo response: ${e.message} (HTTP ${res.statusCode})`));
          }
        });
      }
    );

    req.on('error', (err) => reject(err));
    req.write(postData);
    req.end();
  });
}

/**
 * Helper to execute Odoo object methods (execute_kw) with active credentials
 */
async function executeKw(model: string, method: string, args: any[] = [], kwargs: Record<string, any> = {}) {
  // Ensure we have a valid UID
  if (!resolvedUid) {
    try {
      const authUid = await callOdooJsonRpc('common', 'authenticate', [
        odooConfig.db,
        odooConfig.login,
        odooConfig.apiKey,
        {},
      ]);
      resolvedUid = typeof authUid === 'number' ? authUid : 2;
    } catch {
      resolvedUid = 2;
    }
  }

  return callOdooJsonRpc('object', 'execute_kw', [
    odooConfig.db,
    resolvedUid,
    odooConfig.apiKey,
    model,
    method,
    args,
    kwargs,
  ]);
}

// ----------------- API ENDPOINTS -----------------

// 1. Connection Status & Info (Live ping with latency calculation)
app.get('/api/odoo/status', async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const versionInfo = await callOdooJsonRpc('common', 'version', []);
    let userInfo: any = null;

    try {
      const users = await executeKw('res.users', 'read', [[resolvedUid]], {
        fields: ['name', 'email', 'company_id'],
      });
      userInfo = users?.[0] || null;
    } catch (e) {
      // Ignore user detail error if non-fatal
    }

    const latencyMs = Date.now() - startTime;

    res.json({
      connected: true,
      latencyMs,
      timestamp: new Date().toISOString(),
      url: odooConfig.url,
      db: odooConfig.db,
      login: odooConfig.login,
      uid: resolvedUid,
      version: versionInfo,
      user: userInfo,
      cachePolicy: 'STRICT_NO_CACHE',
    });
  } catch (err: any) {
    res.status(500).json({
      connected: false,
      latencyMs: Date.now() - startTime,
      error: err.message,
      url: odooConfig.url,
      db: odooConfig.db,
      timestamp: new Date().toISOString(),
    });
  }
});

// 2. Comprehensive Dashboard Live Snapshot (Aggregates real Odoo data instantly)
app.get('/api/odoo/dashboard', async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const [salesOrders, invoices, products, employees, partners] = await Promise.all([
      executeKw('sale.order', 'search_read', [[]], {
        fields: ['name', 'partner_id', 'amount_total', 'state', 'date_order', 'currency_id'],
        limit: 10,
        order: 'date_order desc',
      }).catch(() => []),

      executeKw('account.move', 'search_read', [[['move_type', '=', 'out_invoice']]], {
        fields: ['name', 'partner_id', 'amount_total', 'state', 'payment_state', 'invoice_date'],
        limit: 10,
        order: 'id desc',
      }).catch(() => []),

      executeKw('product.template', 'search_read', [[]], {
        fields: ['name', 'list_price', 'standard_price', 'qty_available', 'default_code'],
        limit: 10,
        order: 'id desc',
      }).catch(() => []),

      executeKw('hr.employee', 'search_read', [[]], {
        fields: ['name', 'job_title', 'department_id', 'work_email', 'work_phone'],
        limit: 10,
        order: 'id desc',
      }).catch(() => []),

      executeKw('res.partner', 'search_read', [[]], {
        fields: ['name', 'email', 'phone', 'is_company'],
        limit: 10,
        order: 'id desc',
      }).catch(() => []),
    ]);

    // Compute live metrics
    const totalSalesAmount = salesOrders.reduce((sum: number, so: any) => sum + (Number(so.amount_total) || 0), 0);
    const totalInvoicesAmount = invoices.reduce((sum: number, inv: any) => sum + (Number(inv.amount_total) || 0), 0);
    const paidInvoicesAmount = invoices
      .filter((inv: any) => inv.payment_state === 'paid')
      .reduce((sum: number, inv: any) => sum + (Number(inv.amount_total) || 0), 0);
    const pendingOrdersCount = salesOrders.filter((so: any) => so.state === 'draft' || so.state === 'sent').length;

    res.json({
      success: true,
      latencyMs: Date.now() - startTime,
      refreshedAt: new Date().toISOString(),
      metrics: {
        totalSalesAmount,
        totalInvoicesAmount,
        paidInvoicesAmount,
        pendingOrdersCount,
        salesOrdersCount: salesOrders.length,
        invoicesCount: invoices.length,
        productsCount: products.length,
        employeesCount: employees.length,
        partnersCount: partners.length,
      },
      recentSales: salesOrders,
      recentInvoices: invoices,
      recentProducts: products,
      recentEmployees: employees,
      recentPartners: partners,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, latencyMs: Date.now() - startTime });
  }
});

// 3. Sales Orders
app.get('/api/odoo/sales', async (req: Request, res: Response) => {
  try {
    const orders = await executeKw('sale.order', 'search_read', [[]], {
      fields: ['name', 'partner_id', 'amount_total', 'amount_untaxed', 'state', 'date_order', 'order_line'],
      order: 'date_order desc, id desc',
    });
    res.json({ success: true, data: orders, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/odoo/sales', async (req: Request, res: Response) => {
  try {
    const { partnerId, orderLines, dateOrder, note } = req.body;
    if (!partnerId) {
      return res.status(400).json({ success: false, error: 'Customer (partnerId) is required' });
    }

    // Format lines for Odoo command (0, 0, { ... })
    const formattedLines = (orderLines || []).map((line: any) => [
      0,
      0,
      {
        product_id: Number(line.productId) || 18,
        product_uom_qty: Number(line.quantity) || 1,
        price_unit: Number(line.priceUnit) || 0,
        name: line.description || 'Service/Product',
      },
    ]);

    const orderData: any = {
      partner_id: Number(partnerId),
      date_order: dateOrder || new Date().toISOString(),
    };

    if (formattedLines.length > 0) {
      orderData.order_line = formattedLines;
    }
    if (note) {
      orderData.note = note;
    }

    const orderId = await executeKw('sale.order', 'create', [orderData]);

    // Read back created order immediately with live details
    const createdOrders = await executeKw('sale.order', 'read', [[orderId]], {
      fields: ['name', 'partner_id', 'amount_total', 'state', 'date_order'],
    });

    res.json({
      success: true,
      message: 'Sale Order created directly in Odoo without cache',
      id: orderId,
      order: createdOrders?.[0] || { id: orderId },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Invoices (account.move)
app.get('/api/odoo/invoices', async (req: Request, res: Response) => {
  try {
    const invoices = await executeKw('account.move', 'search_read', [[['move_type', '=', 'out_invoice']]], {
      fields: ['name', 'partner_id', 'amount_total', 'amount_residual', 'state', 'payment_state', 'invoice_date', 'invoice_date_due'],
      order: 'id desc',
    });
    res.json({ success: true, data: invoices, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/odoo/invoices', async (req: Request, res: Response) => {
  try {
    const { partnerId, invoiceDate, invoiceLines } = req.body;
    if (!partnerId) {
      return res.status(400).json({ success: false, error: 'Customer is required' });
    }

    const formattedLines = (invoiceLines || []).map((line: any) => [
      0,
      0,
      {
        product_id: Number(line.productId) || 18,
        quantity: Number(line.quantity) || 1,
        price_unit: Number(line.priceUnit) || 0,
        name: line.name || 'Invoice line item',
      },
    ]);

    const moveData: any = {
      move_type: 'out_invoice',
      partner_id: Number(partnerId),
      invoice_date: invoiceDate || new Date().toISOString().split('T')[0],
      invoice_line_ids: formattedLines,
    };

    const invoiceId = await executeKw('account.move', 'create', [moveData]);

    const createdInvoices = await executeKw('account.move', 'read', [[invoiceId]], {
      fields: ['name', 'partner_id', 'amount_total', 'state', 'payment_state', 'invoice_date'],
    });

    res.json({
      success: true,
      message: 'Invoice created directly in Odoo',
      id: invoiceId,
      invoice: createdInvoices?.[0] || { id: invoiceId },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Products (product.template)
app.get('/api/odoo/products', async (req: Request, res: Response) => {
  try {
    const products = await executeKw('product.template', 'search_read', [[]], {
      fields: ['name', 'list_price', 'standard_price', 'qty_available', 'default_code', 'type'],
      order: 'id desc',
    });
    res.json({ success: true, data: products, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/odoo/products', async (req: Request, res: Response) => {
  try {
    const { name, listPrice, standardPrice, defaultCode, type } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Product name is required' });
    }

    const productData = {
      name,
      list_price: Number(listPrice) || 0,
      standard_price: Number(standardPrice) || 0,
      default_code: defaultCode || undefined,
      type: type || 'consu', // 'consu', 'service'
    };

    const productId = await executeKw('product.template', 'create', [productData]);

    const created = await executeKw('product.template', 'read', [[productId]], {
      fields: ['name', 'list_price', 'standard_price', 'qty_available', 'default_code', 'type'],
    });

    res.json({
      success: true,
      message: 'Product created directly in Odoo',
      id: productId,
      product: created?.[0] || { id: productId },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Employees (hr.employee)
app.get('/api/odoo/employees', async (req: Request, res: Response) => {
  try {
    const employees = await executeKw('hr.employee', 'search_read', [[]], {
      fields: ['name', 'job_title', 'department_id', 'work_email', 'work_phone', 'work_location_id'],
      order: 'id desc',
    });
    res.json({ success: true, data: employees, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/odoo/employees', async (req: Request, res: Response) => {
  try {
    const { name, jobTitle, workEmail, workPhone, departmentId } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Employee name is required' });
    }

    const empData: any = {
      name,
      job_title: jobTitle || false,
      work_email: workEmail || false,
      work_phone: workPhone || false,
    };
    if (departmentId) {
      empData.department_id = Number(departmentId);
    }

    const empId = await executeKw('hr.employee', 'create', [empData]);

    const created = await executeKw('hr.employee', 'read', [[empId]], {
      fields: ['name', 'job_title', 'department_id', 'work_email', 'work_phone'],
    });

    res.json({
      success: true,
      message: 'Employee created directly in Odoo',
      id: empId,
      employee: created?.[0] || { id: empId },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Partners / Customers (res.partner)
app.get('/api/odoo/partners', async (req: Request, res: Response) => {
  try {
    const partners = await executeKw('res.partner', 'search_read', [[]], {
      fields: ['name', 'email', 'phone', 'street', 'city', 'is_company'],
      order: 'id desc',
      limit: 100,
    });
    res.json({ success: true, data: partners, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/odoo/partners', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, street, city, isCompany } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Partner name is required' });
    }

    const partnerData = {
      name,
      email: email || false,
      phone: phone || false,
      street: street || false,
      city: city || false,
      is_company: Boolean(isCompany),
    };

    const partnerId = await executeKw('res.partner', 'create', [partnerData]);

    const created = await executeKw('res.partner', 'read', [[partnerId]], {
      fields: ['name', 'email', 'phone', 'street', 'city', 'is_company'],
    });

    res.json({
      success: true,
      message: 'Customer/Partner created directly in Odoo',
      id: partnerId,
      partner: created?.[0] || { id: partnerId },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Delete record dynamically from any model
app.delete('/api/odoo/record/:model/:id', async (req: Request, res: Response) => {
  try {
    const { model, id } = req.params;
    const recordId = Number(id);
    if (!recordId) {
      return res.status(400).json({ success: false, error: 'Invalid record ID' });
    }

    const result = await executeKw(model, 'unlink', [[recordId]]);
    res.json({
      success: true,
      message: `Record ${recordId} deleted from ${model}`,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Raw Odoo Diagnostic & Query Runner (Zero-cache execution console)
app.post('/api/odoo/raw-call', async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const { model, method, args = [], kwargs = {} } = req.body;
    if (!model || !method) {
      return res.status(400).json({ success: false, error: 'model and method are required' });
    }

    const result = await executeKw(model, method, args, kwargs);
    res.json({
      success: true,
      latencyMs: Date.now() - startTime,
      model,
      method,
      result,
      cachePolicy: 'BYPASS_LIVE',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      latencyMs: Date.now() - startTime,
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// 10. Update Config at Runtime
app.post('/api/odoo/config', (req: Request, res: Response) => {
  const { url, db, login, apiKey, mcpKey } = req.body;
  if (url) odooConfig.url = url;
  if (db) odooConfig.db = db;
  if (login) odooConfig.login = login;
  if (apiKey) odooConfig.apiKey = apiKey;
  if (mcpKey) odooConfig.mcpKey = mcpKey;

  // Reset UID so it re-authenticates
  resolvedUid = null;

  res.json({
    success: true,
    message: 'Odoo configuration updated',
    config: {
      url: odooConfig.url,
      db: odooConfig.db,
      login: odooConfig.login,
      apiKey: odooConfig.apiKey ? `${odooConfig.apiKey.slice(0, 6)}...` : '',
    },
  });
});

// ----------------- VITE MIDDLEWARE / SPA SERVING -----------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Odoo ERP Live Sync Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
