import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { Sidebar, TabType } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { SalesView } from './components/SalesView';
import { InvoicesView } from './components/InvoicesView';
import { ProductsView } from './components/ProductsView';
import { EmployeesView } from './components/EmployeesView';
import { PartnersView } from './components/PartnersView';
import { LiveConsoleView } from './components/LiveConsoleView';
import { SettingsView } from './components/SettingsView';
import { odooApi } from './api';
import {
  OdooStatus,
  DashboardData,
  SaleOrder,
  Invoice,
  Product,
  Employee,
  Partner,
} from './types';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [status, setStatus] = useState<OdooStatus | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [sales, setSales] = useState<SaleOrder[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(10); // 10s auto-refresh by default

  // Toast Notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // Primary Live Fetch Function (Strictly bypasses cache)
  const fetchAllData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [statusRes, dashRes, salesRes, invRes, prodRes, empRes, partRes] = await Promise.allSettled([
        odooApi.getStatus(),
        odooApi.getDashboard(),
        odooApi.getSales(),
        odooApi.getInvoices(),
        odooApi.getProducts(),
        odooApi.getEmployees(),
        odooApi.getPartners(),
      ]);

      if (statusRes.status === 'fulfilled') {
        setStatus(statusRes.value);
      }
      if (dashRes.status === 'fulfilled') {
        setDashboardData(dashRes.value);
      }
      if (salesRes.status === 'fulfilled' && salesRes.value.success) {
        setSales(salesRes.value.data);
      }
      if (invRes.status === 'fulfilled' && invRes.value.success) {
        setInvoices(invRes.value.data);
      }
      if (prodRes.status === 'fulfilled' && prodRes.value.success) {
        setProducts(prodRes.value.data);
      }
      if (empRes.status === 'fulfilled' && empRes.value.success) {
        setEmployees(empRes.value.data);
      }
      if (partRes.status === 'fulfilled' && partRes.value.success) {
        setPartners(partRes.value.data);
      }

      const now = new Date();
      setLastRefreshed(
        `آخر تحديث فوري: ${now.toLocaleTimeString('ar-EG', { hour12: true })}`
      );
    } catch (err: any) {
      console.error('Error fetching live Odoo data:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Real-time polling timer
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const interval = setInterval(() => {
      fetchAllData(true);
    }, autoRefreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefreshInterval, fetchAllData]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 text-slate-800 antialiased font-['Cairo',sans-serif]">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 left-5 z-50 flex flex-col gap-2 pointer-events-auto transition-all animate-bounce-short">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold text-white border ${
              toast.type === 'error'
                ? 'bg-rose-600 border-rose-500'
                : toast.type === 'info'
                ? 'bg-sky-600 border-sky-500'
                : 'bg-emerald-600 border-emerald-500'
            }`}
          >
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 shrink-0" />}
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="text-white/80 hover:text-white mr-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        counts={{
          sales: sales.length,
          invoices: invoices.length,
          products: products.length,
          employees: employees.length,
          partners: partners.length,
        }}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <Header
          status={status}
          loading={loading}
          onRefresh={() => fetchAllData(false)}
          lastRefreshed={lastRefreshed}
          autoRefreshInterval={autoRefreshInterval}
          setAutoRefreshInterval={setAutoRefreshInterval}
          onQuickAction={() => setActiveTab('sales')}
        />

        {/* Dynamic View Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-100/90">
          {activeTab === 'dashboard' && (
            <DashboardView
              data={dashboardData}
              status={status}
              setActiveTab={setActiveTab}
              onRefresh={() => fetchAllData(false)}
              loading={loading}
            />
          )}

          {activeTab === 'sales' && (
            <SalesView
              sales={sales}
              partners={partners}
              products={products}
              onRefresh={() => fetchAllData(false)}
              loading={loading}
              showToast={showToast}
            />
          )}

          {activeTab === 'invoices' && (
            <InvoicesView
              invoices={invoices}
              partners={partners}
              products={products}
              onRefresh={() => fetchAllData(false)}
              loading={loading}
              showToast={showToast}
            />
          )}

          {activeTab === 'products' && (
            <ProductsView
              products={products}
              onRefresh={() => fetchAllData(false)}
              loading={loading}
              showToast={showToast}
            />
          )}

          {activeTab === 'employees' && (
            <EmployeesView
              employees={employees}
              onRefresh={() => fetchAllData(false)}
              loading={loading}
              showToast={showToast}
            />
          )}

          {activeTab === 'partners' && (
            <PartnersView
              partners={partners}
              onRefresh={() => fetchAllData(false)}
              loading={loading}
              showToast={showToast}
            />
          )}

          {activeTab === 'live_console' && (
            <LiveConsoleView status={status} showToast={showToast} />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              status={status}
              onRefresh={() => fetchAllData(false)}
              showToast={showToast}
            />
          )}
        </main>
      </div>
    </div>
  );
}
