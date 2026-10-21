import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Receipt,
  FileCheck,
} from 'lucide-react';
import { SaleOrder, Partner, Product } from '../types';
import { odooApi } from '../api';

interface SalesViewProps {
  sales: SaleOrder[];
  partners: Partner[];
  products: Product[];
  onRefresh: () => void;
  loading: boolean;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SalesView: React.FC<SalesViewProps> = ({
  sales,
  partners,
  products,
  onRefresh,
  loading,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Sale Order Form State
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | ''>('');
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState(1);
  const [priceUnit, setPriceUnit] = useState(0);
  const [note, setNote] = useState('');

  // Handle product selection to auto-populate price
  const handleProductChange = (productIdStr: string) => {
    const pId = Number(productIdStr);
    setSelectedProductId(pId);
    const prod = products.find((p) => p.id === pId);
    if (prod) {
      setPriceUnit(prod.list_price || 0);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartnerId) {
      showToast('يرجى اختيار العميل أولاً', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const prod = products.find((p) => p.id === selectedProductId);
      const res = await odooApi.createSaleOrder({
        partnerId: Number(selectedPartnerId),
        orderLines: [
          {
            productId: Number(selectedProductId) || 18,
            quantity: Number(quantity) || 1,
            priceUnit: Number(priceUnit) || 0,
            description: prod ? prod.name : 'أمر بيع من النظام',
          },
        ],
        note,
      });

      if (res.success) {
        showToast(`تم إنشاء أمر البيع بنجاح في Odoo (رقم #${res.id}) مع تخطي الكاش!`, 'success');
        setIsModalOpen(false);
        // Reset form
        setSelectedPartnerId('');
        setSelectedProductId('');
        setQuantity(1);
        setPriceUnit(0);
        setNote('');
        // Immediately fetch fresh data from Odoo
        onRefresh();
      } else {
        showToast(res.error || 'فشل إنشاء أمر البيع', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف أمر البيع ${name} مباشرة من Odoo؟`)) return;
    try {
      const res = await odooApi.deleteRecord('sale.order', id);
      if (res.success) {
        showToast(`تم حذف أمر البيع ${name} بنجاح من Odoo`, 'info');
        onRefresh();
      } else {
        showToast(res.error || 'فشل حذف الأمر', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const filteredSales = sales.filter((order) => {
    const matchesSearch =
      order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.partner_id && order.partner_id[1].toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = statusFilter === '' || order.state === statusFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <span>أوامر المبيعات في Odoo (Sale Orders)</span>
            <span className="text-xs bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded-full">
              {sales.length} أمر
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            مزامنة حية ومباشرة بدون كاش مع جدول sale.order في Odoo Enterprise
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء أمر بيع جديد في Odoo</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث برقم الأمر أو اسم العميل..."
              className="w-full pr-9 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-sky-500 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
            >
              <option value="">جميع الحالات</option>
              <option value="sale">مؤكد (Sale)</option>
              <option value="draft">مسودة (Draft)</option>
              <option value="cancel">ملغي (Cancelled)</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-3 px-4">رقم الأمر (Odoo ID)</th>
                <th className="py-3 px-4">اسم العميل</th>
                <th className="py-3 px-4">تاريخ الطلب</th>
                <th className="py-3 px-4">الإجمالي (ج.م)</th>
                <th className="py-3 px-4">حالة الأمر</th>
                <th className="py-3 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.map((so) => (
                <tr key={so.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-sky-600 font-mono">
                    {so.name} <span className="text-[10px] text-slate-400 font-normal">#{so.id}</span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {so.partner_id ? so.partner_id[1] : 'غير محدد'}
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]" dir="ltr">
                    {so.date_order ? new Date(so.date_order).toLocaleDateString('ar-EG') : '-'}
                  </td>
                  <td className="py-3 px-4 font-black text-slate-900 text-sm">
                    {Number(so.amount_total).toLocaleString()} ج.م
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border inline-flex items-center gap-1 ${
                        so.state === 'sale'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : so.state === 'cancel'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {so.state === 'sale' && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                      {so.state === 'cancel' && <AlertCircle className="w-3 h-3 text-rose-600" />}
                      {so.state === 'draft' && <Clock className="w-3 h-3 text-amber-600" />}
                      {so.state === 'sale' ? 'طلب مؤكد' : so.state === 'cancel' ? 'ملغي' : 'مسودة'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleDelete(so.id, so.name)}
                      title="حذف من Odoo مباشرة"
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    لا توجد أوامر مبيعات تطابق معايير البحث
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Sale Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-sky-600 px-6 py-4 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base">إصدار أمر بيع مباشر في Odoo</h3>
                <p className="text-[11px] text-sky-100">سيتم الإرسال فورا وتخطي الكاش</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  العميل / الشريك (res.partner) *
                </label>
                <select
                  required
                  value={selectedPartnerId}
                  onChange={(e) => setSelectedPartnerId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500"
                >
                  <option value="">اختر العميل من قائمة شركاء Odoo...</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.is_company ? '(شركة)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  الخدمة / الصنف الطبي (product.template)
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500"
                >
                  <option value="">اختر الصنف من Odoo...</option>
                  {products.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      {prod.name} ({prod.list_price} ج.م)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">الكمية</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">سعر الوحدة (ج.م)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={priceUnit}
                    onChange={(e) => setPriceUnit(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-600">الإجمالي المتوقع:</span>
                <span className="font-black text-slate-900 text-sm">
                  {(quantity * priceUnit).toLocaleString()} ج.م
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">ملاحظات الطلب</label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="ملاحظات تظهر على أمر البيع في Odoo..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'جاري الإرسال المباشر إلى Odoo...' : 'تأكيد وإرسال فوري إلى Odoo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
