import React from 'react';
import {
  Wallet,
  Receipt,
  Users,
  Boxes,
  ArrowUpRight,
  TrendingUp,
  Clock,
  ShieldCheck,
  Zap,
  Building,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { DashboardData, OdooStatus } from '../types';
import { TabType } from './Sidebar';

interface DashboardViewProps {
  data: DashboardData | null;
  status: OdooStatus | null;
  setActiveTab: (tab: TabType) => void;
  onRefresh: () => void;
  loading: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  status,
  setActiveTab,
  onRefresh,
  loading,
}) => {
  const metrics = data?.metrics || {
    totalSalesAmount: 0,
    totalInvoicesAmount: 0,
    paidInvoicesAmount: 0,
    pendingOrdersCount: 0,
    salesOrdersCount: 0,
    invoicesCount: 0,
    productsCount: 0,
    employeesCount: 0,
    partnersCount: 0,
  };

  return (
    <div className="space-y-6">
      {/* Welcome & Sync Status Banner */}
      <div className="bg-gradient-to-r from-[#003B5C] via-[#005073] to-[#14709c] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-sky-400/20 text-sky-200 border border-sky-300/30 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>اتصال مباشر بـ Odoo API مع تخطي الكاش الكامل</span>
            </span>
            <span className="text-xs text-sky-200/80 font-mono">
              قاعدة البيانات: {status?.db || 'edu-smartcare'}
            </span>
          </div>
          <h2 className="text-2xl font-black mb-1">
            مرحباً بك، {status?.user?.name || 'Ahmed Abdelhamed Mohammed'}
          </h2>
          <p className="text-sky-100/90 text-xs sm:text-sm">
            تمت مزامنة كافة البيانات المالية والتشغيلية والمخزنية مباشرة من Odoo بدون أي تأخير زمني أو تخزين مؤقت.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-2.5">
          <button
            onClick={() => setActiveTab('sales')}
            className="bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded-xl text-xs font-bold backdrop-blur-md transition-all cursor-pointer"
          >
            إدارة المبيعات ({metrics.salesOrdersCount})
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className="bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded-xl text-xs font-bold backdrop-blur-md transition-all cursor-pointer"
          >
            الفواتير والتحصيل ({metrics.invoicesCount})
          </button>
          <button
            onClick={() => setActiveTab('live_console')}
            className="bg-amber-400 hover:bg-amber-300 text-slate-900 px-4 py-2 rounded-xl text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 fill-slate-900" />
            <span>فاحص سرعة الاستجابة</span>
          </button>
        </div>

        {/* Decorative circle */}
        <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-white/5 rounded-full pointer-events-none"></div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Sales */}
        <div
          onClick={() => setActiveTab('sales')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-sky-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">إجمالي المبيعات في Odoo</span>
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">
            {metrics.totalSalesAmount.toLocaleString()} <span className="text-sm font-bold text-slate-500">ج.م</span>
          </h3>
          <div className="flex items-center justify-between text-xs mt-2 text-slate-500">
            <span className="flex items-center gap-1 text-emerald-600 font-bold">
              <TrendingUp className="w-3.5 h-3.5" />
              {metrics.salesOrdersCount} أمر بيع مسجل
            </span>
            <span>بث مباشر</span>
          </div>
        </div>

        {/* KPI 2: Invoices */}
        <div
          onClick={() => setActiveTab('invoices')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">الفواتير والمطالبات</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">
            {metrics.totalInvoicesAmount.toLocaleString()} <span className="text-sm font-bold text-slate-500">ج.م</span>
          </h3>
          <div className="flex items-center justify-between text-xs mt-2 text-slate-500">
            <span className="text-emerald-700 font-semibold">
              مسدد: {metrics.paidInvoicesAmount.toLocaleString()} ج.م
            </span>
            <span>{metrics.invoicesCount} فاتورة</span>
          </div>
        </div>

        {/* KPI 3: Employees */}
        <div
          onClick={() => setActiveTab('employees')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">الكوادر البشرية والطبية</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">
            {metrics.employeesCount} <span className="text-sm font-bold text-slate-500">موظف وطبيب</span>
          </h3>
          <div className="flex items-center justify-between text-xs mt-2 text-slate-500">
            <span className="text-indigo-600 font-semibold">SmartCare Staff</span>
            <span>نشط في Odoo</span>
          </div>
        </div>

        {/* KPI 4: Products & Services */}
        <div
          onClick={() => setActiveTab('products')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">الأصناف والخدمات الطبية</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">
            {metrics.productsCount} <span className="text-sm font-bold text-slate-500">صنف / خدمة</span>
          </h3>
          <div className="flex items-center justify-between text-xs mt-2 text-slate-500">
            <span className="text-amber-700 font-semibold">دليل الأسعار والخدمات</span>
            <span>محدث فوري</span>
          </div>
        </div>
      </div>

      {/* Main Content Sections: Recent Sales & Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales Orders from Odoo */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-600" />
                <span>أحدث أوامر المبيعات (Sale Orders)</span>
              </h3>
              <p className="text-[11px] text-slate-400">مجلوبة حياً ومباشرة من جدول sale.order</p>
            </div>
            <button
              onClick={() => setActiveTab('sales')}
              className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1"
            >
              <span>عرض الكل</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 pb-2">
                  <th className="py-2 px-2 font-semibold">رقم الأمر</th>
                  <th className="py-2 px-2 font-semibold">العميل</th>
                  <th className="py-2 px-2 font-semibold">الإجمالي</th>
                  <th className="py-2 px-2 font-semibold">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data?.recentSales || []).slice(0, 5).map((so) => (
                  <tr key={so.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-2 font-bold text-sky-600">{so.name}</td>
                    <td className="py-2.5 px-2 font-medium text-slate-700 truncate max-w-[140px]">
                      {so.partner_id ? so.partner_id[1] : 'بدون عميل'}
                    </td>
                    <td className="py-2.5 px-2 font-bold text-slate-900">
                      {Number(so.amount_total).toLocaleString()} ج.م
                    </td>
                    <td className="py-2.5 px-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          so.state === 'sale'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : so.state === 'cancel'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {so.state === 'sale' ? 'مؤكد' : so.state === 'cancel' ? 'ملغي' : 'مسودة'}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!data?.recentSales || data.recentSales.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      لا توجد أوامر مبيعات مسجلة حالياً
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Invoices from Odoo */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>أحدث فواتير العملاء (account.move)</span>
              </h3>
              <p className="text-[11px] text-slate-400">مجلوبة مباشرة مع حالة السداد والترحيل</p>
            </div>
            <button
              onClick={() => setActiveTab('invoices')}
              className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1"
            >
              <span>عرض الكل</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 pb-2">
                  <th className="py-2 px-2 font-semibold">رقم الفاتورة</th>
                  <th className="py-2 px-2 font-semibold">العميل</th>
                  <th className="py-2 px-2 font-semibold">المبلغ</th>
                  <th className="py-2 px-2 font-semibold">السداد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data?.recentInvoices || []).slice(0, 5).map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-2 font-bold text-slate-800">
                      {inv.name || `مسودة (#${inv.id})`}
                    </td>
                    <td className="py-2.5 px-2 font-medium text-slate-700 truncate max-w-[140px]">
                      {inv.partner_id ? inv.partner_id[1] : 'بدون عميل'}
                    </td>
                    <td className="py-2.5 px-2 font-bold text-slate-900">
                      {Number(inv.amount_total).toLocaleString()} ج.م
                    </td>
                    <td className="py-2.5 px-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.payment_state === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : inv.payment_state === 'in_payment'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {inv.payment_state === 'paid'
                          ? 'مسددة'
                          : inv.payment_state === 'in_payment'
                          ? 'تحت التحصيل'
                          : 'غير مسددة'}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!data?.recentInvoices || data.recentInvoices.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      لا توجد فواتير مسجلة حالياً
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Hospital / Staff Preview Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-600" />
              <span>فريق العمل والكوادر الطبية المسجلة (SmartCare Odoo Staff)</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              بيانات الكادر الطبي والإداري الحقيقية من قاعدة بيانات Odoo
            </p>
          </div>
          <button
            onClick={() => setActiveTab('employees')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>إدارة الموظفين</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {(data?.recentEmployees || []).slice(0, 5).map((emp) => (
            <div key={emp.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs mb-2">
                {emp.name.slice(0, 2)}
              </div>
              <h4 className="font-bold text-slate-800 text-xs truncate">{emp.name}</h4>
              <p className="text-[11px] text-slate-500 truncate">
                {emp.job_title || (emp.department_id ? emp.department_id[1] : 'كادر طبي')}
              </p>
              {emp.work_phone && (
                <p className="text-[10px] text-sky-600 font-mono mt-1" dir="ltr">
                  {emp.work_phone}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
