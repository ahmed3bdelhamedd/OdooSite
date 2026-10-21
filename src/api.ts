import { OdooStatus, DashboardData, SaleOrder, Invoice, Product, Employee, Partner } from './types';

// Force No-Cache Headers on all client requests
const NO_CACHE_HEADERS: HeadersInit = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

/**
 * Appends a random and timestamp cache-buster to prevent any browser caching
 */
function urlWithCacheBuster(path: string): string {
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}_cb=${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

export const odooApi = {
  // Live ping & connection status
  async getStatus(): Promise<OdooStatus> {
    const res = await fetch(urlWithCacheBuster('/api/odoo/status'), {
      method: 'GET',
      headers: NO_CACHE_HEADERS,
      cache: 'no-store',
    });
    return res.json();
  },

  // Live aggregated dashboard
  async getDashboard(): Promise<DashboardData> {
    const res = await fetch(urlWithCacheBuster('/api/odoo/dashboard'), {
      method: 'GET',
      headers: NO_CACHE_HEADERS,
      cache: 'no-store',
    });
    return res.json();
  },

  // Sales
  async getSales(): Promise<{ success: boolean; data: SaleOrder[]; timestamp: string }> {
    const res = await fetch(urlWithCacheBuster('/api/odoo/sales'), {
      method: 'GET',
      headers: NO_CACHE_HEADERS,
      cache: 'no-store',
    });
    return res.json();
  },

  async createSaleOrder(payload: {
    partnerId: number;
    orderLines: Array<{ productId: number; quantity: number; priceUnit: number; description?: string }>;
    dateOrder?: string;
    note?: string;
  }) {
    const res = await fetch('/api/odoo/sales', {
      method: 'POST',
      headers: NO_CACHE_HEADERS,
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Invoices
  async getInvoices(): Promise<{ success: boolean; data: Invoice[]; timestamp: string }> {
    const res = await fetch(urlWithCacheBuster('/api/odoo/invoices'), {
      method: 'GET',
      headers: NO_CACHE_HEADERS,
      cache: 'no-store',
    });
    return res.json();
  },

  async createInvoice(payload: {
    partnerId: number;
    invoiceDate?: string;
    invoiceLines: Array<{ productId: number; quantity: number; priceUnit: number; name?: string }>;
  }) {
    const res = await fetch('/api/odoo/invoices', {
      method: 'POST',
      headers: NO_CACHE_HEADERS,
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Products
  async getProducts(): Promise<{ success: boolean; data: Product[]; timestamp: string }> {
    const res = await fetch(urlWithCacheBuster('/api/odoo/products'), {
      method: 'GET',
      headers: NO_CACHE_HEADERS,
      cache: 'no-store',
    });
    return res.json();
  },

  async createProduct(payload: {
    name: string;
    listPrice: number;
    standardPrice?: number;
    defaultCode?: string;
    type?: string;
  }) {
    const res = await fetch('/api/odoo/products', {
      method: 'POST',
      headers: NO_CACHE_HEADERS,
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Employees
  async getEmployees(): Promise<{ success: boolean; data: Employee[]; timestamp: string }> {
    const res = await fetch(urlWithCacheBuster('/api/odoo/employees'), {
      method: 'GET',
      headers: NO_CACHE_HEADERS,
      cache: 'no-store',
    });
    return res.json();
  },

  async createEmployee(payload: {
    name: string;
    jobTitle?: string;
    workEmail?: string;
    workPhone?: string;
    departmentId?: number;
  }) {
    const res = await fetch('/api/odoo/employees', {
      method: 'POST',
      headers: NO_CACHE_HEADERS,
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Partners / Customers
  async getPartners(): Promise<{ success: boolean; data: Partner[]; timestamp: string }> {
    const res = await fetch(urlWithCacheBuster('/api/odoo/partners'), {
      method: 'GET',
      headers: NO_CACHE_HEADERS,
      cache: 'no-store',
    });
    return res.json();
  },

  async createPartner(payload: {
    name: string;
    email?: string;
    phone?: string;
    street?: string;
    city?: string;
    isCompany?: boolean;
  }) {
    const res = await fetch('/api/odoo/partners', {
      method: 'POST',
      headers: NO_CACHE_HEADERS,
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Delete
  async deleteRecord(model: string, id: number) {
    const res = await fetch(`/api/odoo/record/${model}/${id}`, {
      method: 'DELETE',
      headers: NO_CACHE_HEADERS,
    });
    return res.json();
  },

  // Raw Odoo Query & Zero-Cache Console
  async runRawCall(model: string, method: string, args: any[] = [], kwargs: Record<string, any> = {}) {
    const res = await fetch('/api/odoo/raw-call', {
      method: 'POST',
      headers: NO_CACHE_HEADERS,
      body: JSON.stringify({ model, method, args, kwargs }),
    });
    return res.json();
  },

  // Update Config
  async updateConfig(payload: { url?: string; db?: string; login?: string; apiKey?: string; mcpKey?: string }) {
    const res = await fetch('/api/odoo/config', {
      method: 'POST',
      headers: NO_CACHE_HEADERS,
      body: JSON.stringify(payload),
    });
    return res.json();
  },
};
