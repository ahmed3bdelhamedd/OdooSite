import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Boxes,
  Users,
  Building2,
  Terminal,
  Settings,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export type TabType =
  | 'dashboard'
  | 'sales'
  | 'invoices'
  | 'products'
  | 'employees'
  | 'partners'
  | 'live_console'
  | 'settings';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  counts?: {
    sales?: number;
    invoices?: number;
    products?: number;
    employees?: number;
    partners?: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, counts }) => {
  const navItems: Array<{ id: TabType; label: string; icon: React.ReactNode; count?: number; badge?: string }> = [
    {
      id: 'dashboard',
      label: 'لوحة التحكم (Dashboard)',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'sales',
      label: 'المبيعات والأوامر (Sales)',
      icon: <ShoppingCart className="w-5 h-5" />,
      count: counts?.sales,
    },
    {
      id: 'invoices',
      label: 'الفواتير والتحصيل (Invoices)',
      icon: <Receipt className="w-5 h-5" />,
      count: counts?.invoices,
    },
    {
      id: 'products',
      label: 'المخزون والخدمات (Products)',
      icon: <Boxes className="w-5 h-5" />,
      count: counts?.products,
    },
    {
      id: 'employees',
      label: 'الموارد البشرية (HR & Staff)',
      icon: <Users className="w-5 h-5" />,
      count: counts?.employees,
    },
    {
      id: 'partners',
      label: 'العملاء والجهات (Contacts)',
      icon: <Building2 className="w-5 h-5" />,
      count: counts?.partners,
    },
    {
      id: 'live_console',
      label: 'فاحص تخطي الكاش (Live Console)',
      icon: <Terminal className="w-5 h-5" />,
      badge: 'فوري 0ms',
    },
    {
      id: 'settings',
      label: 'إعدادات ربط Odoo (Settings)',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <aside className="bg-[#0b141d] text-slate-300 w-64 flex-shrink-0 flex flex-col z-30 shadow-xl border-l border-slate-800 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 bg-[#070d14] border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-sky-500/20">
            S
          </div>
          <div>
            <h1 className="font-bold text-white text-sm tracking-wide flex items-center gap-1.5">
              <span>SmartCare ERP</span>
              <span className="text-[10px] bg-sky-500/20 text-sky-400 border border-sky-500/30 px-1.5 py-0.2 rounded font-mono">
                Odoo 20
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">بث مباشر بدون كاش</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-right cursor-pointer ${
                isActive
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-900/40'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-sky-700 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.count}
                </span>
              )}
              {item.badge && (
                <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded-full font-bold">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 bg-[#070d14] text-xs">
        <a
          href="https://edu-smartcare.odoo.com"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-sky-300 transition-colors"
        >
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="truncate text-[11px]">edu-smartcare.odoo.com</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
        </a>
      </div>
    </aside>
  );
};
