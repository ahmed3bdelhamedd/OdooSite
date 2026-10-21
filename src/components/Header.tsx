import React from 'react';
import { RefreshCw, Zap, Wifi, ShieldCheck, Plus, Clock } from 'lucide-react';
import { OdooStatus } from '../types';

interface HeaderProps {
  status: OdooStatus | null;
  loading: boolean;
  onRefresh: () => void;
  lastRefreshed: string | null;
  autoRefreshInterval: number;
  setAutoRefreshInterval: (interval: number) => void;
  onQuickAction: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  loading,
  onRefresh,
  lastRefreshed,
  autoRefreshInterval,
  setAutoRefreshInterval,
  onQuickAction,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-20 shadow-xs flex-shrink-0">
      <div className="flex items-center gap-3">
        {/* Status Pill */}
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-200 shadow-2xs">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span>{status?.connected ? 'متصل مباشر بـ Odoo 20' : 'جاري الاتصال بـ Odoo...'}</span>
          {status?.latencyMs !== undefined && (
            <span className="bg-emerald-200/70 text-emerald-900 px-1.5 py-0.5 rounded text-[11px] font-mono">
              {status.latencyMs}ms
            </span>
          )}
        </div>

        {/* Cache-Bypass Active Badge */}
        <div className="hidden md:flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1 rounded-full text-xs font-semibold">
          <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
          <span>تخطي الكاش نشط (استجابة فورية)</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Auto Refresh Selector */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-600 font-medium">تحديث تلقائي:</span>
          <select
            value={autoRefreshInterval}
            onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
            className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
          >
            <option value={0}>متوقف</option>
            <option value={5}>كل 5 ثوان</option>
            <option value={10}>كل 10 ثوان</option>
            <option value={30}>كل 30 ثانية</option>
          </select>
        </div>

        {/* Last Refreshed Time Display */}
        {lastRefreshed && (
          <span className="hidden sm:inline-block text-[11px] text-slate-400 font-mono">
            {lastRefreshed}
          </span>
        )}

        {/* Force Refresh (Bypass Cache) Button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          title="إرسال طلب فوري بدون كاش لتحديث كافة البيانات من Odoo"
          className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 px-3 py-2 rounded-xl text-xs font-bold border border-slate-300 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-600' : ''}`} />
          <span className="hidden sm:inline">تحديث فوري (تخطي الكاش)</span>
        </button>

        {/* Quick Action Button */}
        <button
          onClick={onQuickAction}
          className="bg-sky-600 hover:bg-sky-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إجراء سريع</span>
        </button>

        {/* User Badge */}
        <div className="flex items-center gap-2 border-r border-slate-200 pr-3 mr-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 to-blue-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            أ.م
          </div>
          <div className="hidden xl:block text-right">
            <p className="text-xs font-bold text-slate-800 leading-tight">
              {status?.user?.name || 'Ahmed Abdelhamed'}
            </p>
            <p className="text-[10px] text-slate-500 leading-tight">
              {status?.user?.company_id ? status.user.company_id[1] : 'SmartCare ERP'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
