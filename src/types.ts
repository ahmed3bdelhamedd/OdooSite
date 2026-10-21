export interface OdooUser {
  id: number;
  name: string;
  email: string;
  company_id?: [number, string];
}

export interface OdooStatus {
  connected: boolean;
  latencyMs: number;
  timestamp: string;
  url: string;
  db: string;
  login: string;
  uid: number | null;
  version?: {
    server_version: string;
    server_serie: string;
    protocol_version: number;
  };
  user?: OdooUser | null;
  cachePolicy?: string;
  error?: string;
}

export interface SaleOrder {
  id: number;
  name: string;
  partner_id: [number, string] | false;
  amount_total: number;
  amount_untaxed?: number;
  state: string; // 'draft', 'sent', 'sale', 'done', 'cancel'
  date_order: string;
}

export interface Invoice {
  id: number;
  name: string | false;
  partner_id: [number, string] | false;
  amount_total: number;
  amount_residual?: number;
  state: string; // 'draft', 'posted', 'cancel'
  payment_state: string; // 'not_paid', 'in_payment', 'paid', 'partial', 'reversed'
  invoice_date: string | false;
  invoice_date_due?: string | false;
}

export interface Product {
  id: number;
  name: string;
  list_price: number;
  standard_price: number;
  qty_available: number;
  default_code: string | false;
  type?: string;
}

export interface Employee {
  id: number;
  name: string;
  job_title: string | false;
  department_id: [number, string] | false;
  work_email: string | false;
  work_phone: string | false;
}

export interface Partner {
  id: number;
  name: string;
  email: string | false;
  phone: string | false;
  street: string | false;
  city: string | false;
  is_company: boolean;
}

export interface DashboardMetrics {
  totalSalesAmount: number;
  totalInvoicesAmount: number;
  paidInvoicesAmount: number;
  pendingOrdersCount: number;
  salesOrdersCount: number;
  invoicesCount: number;
  productsCount: number;
  employeesCount: number;
  partnersCount: number;
}

export interface DashboardData {
  success: boolean;
  latencyMs: number;
  refreshedAt: string;
  metrics: DashboardMetrics;
  recentSales: SaleOrder[];
  recentInvoices: Invoice[];
  recentProducts: Product[];
  recentEmployees: Employee[];
  recentPartners: Partner[];
  error?: string;
}
