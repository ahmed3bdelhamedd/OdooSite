import React, { useState } from 'react';
import {
  Plus,
  Search,
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  CreditCard,
} from 'lucide-react';
import { Invoice, Partner, Product } from '../types';
import { odooApi } from '../api';

interface InvoicesViewProps {
  invoices: Invoice[];
  partners: Partner[];
  products: Product[];
  onRefresh: () => void;
  loading: boolean;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  invoices,
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

  // Form State
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | ''>('');
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState(1);
  const [priceUnit, setPriceUnit] = useState(0);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);

  const handleProductChange = (productIdStr: string) => {
    const pId = Number(productIdStr);
    setSelectedProductId(pId);
    const prod = products.find((p) => p.id === pId);
    if (prod) {
      setPriceUnit(prod.list_price || 0);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartnerId) {
      showToast('يرجى اختيار العميل أولاً', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const prod = products.find((p) => p.id === selectedProductId);
      const res = await odooApi.createInvoice({
        partnerId: Number(selectedPartnerId),
        invoiceDate,
        invoiceLines: [
          {
            productId: Number(selectedProductId) || 18,
            quantity: Number(quantity) || 1,
            priceUnit: Number(priceUnit) || 0,
            name: prod ? prod.name : 'بند فاتورة',
          },
        ],
      });

      if (res.success) {
        showToast(`تم إنشاء الفاتورة بنجاح في Odoo (رقم #${res.id}) مع تخطي الكاش!`, 'success');
        setIsModalOpen(false);
        setSelectedPartnerId('');
        setSelectedProductId('');
        setQuantity(1);
        setPriceUnit(0);
        onRefresh();
      } else {
        showToast(res.error || 'فشل إنشاء الفاتورة', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string | false) => {
    const displayName = name || `المسودة #${id}`;
    if (!window.confirm(`هل أنت متأكد من حذف الفاتورة ${displayName} مباشرة من Odoo؟`)) return;
    try {
      const res = await odooApi.deleteRecord('account.move', id);
      if (res.success) {
        showToast(`تم حذف الفاتورة ${displayName} بنجاح من Odoo`, 'info');
        onRefresh();
      } else {
        showToast(res.error || 'فشل حذف الفاتورة', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const invName = inv.name || `مسودة #${inv.id}`;
    const partnerName = inv.partner_id ? inv.partner_id[1] : '';
    const matchesSearch =
      invName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partnerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      statusFilter === '' || inv.state === statusFilter || inv.payment_state === statusFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <span>فواتير العملاء في Odoo (Customer Invoices)</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              {invoices.length} فاتورة
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            تتبع الفواتير الصادرة، السداد، والمستحقات مباشرة من جدول account.move
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء فاتورة جديدة في Odoo</span>
        </button>
      </div>

      {/* Filter and Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث برقم الفاتورة أو اسم العميل..."
              className="w-full pr-9 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
            >
              <option value="">جميع الحالات</option>
              <option value="posted">مرحلة (Posted)</option>
              <option value="draft">مسودة (Draft)</option>
              <option value="paid">مسددة بالكامل (Paid)</option>
              <option value="not_paid">غير مسددة (Not Paid)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-3 px-4">رقم الفاتورة</th>
                <th className="py-3 px-4">العميل</th>
                <th className="py-3 px-4">التاريخ</th>
                <th className="py-3 px-4">القيمة الإجمالية</th>
                <th className="py-3 px-4">حالة الترحيل</th>
                <th className="py-3 px-4">حالة السداد</th>
                <th className="py-3 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-800 font-mono">
                    {inv.name || <span className="text-amber-600">مسودة (#{inv.id})</span>}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {inv.partner_id ? inv.partner_id[1] : 'بدون عميل'}
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]" dir="ltr">
                    {inv.invoice_date || '-'}
                  </td>
                  <td className="py-3 px-4 font-black text-slate-900 text-sm">
                    {Number(inv.amount_total).toLocaleString()} ج.م
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        inv.state === 'posted'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : inv.state === 'cancel'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {inv.state === 'posted' ? 'مرحلة (Posted)' : inv.state === 'cancel' ? 'ملغاة' : 'مسودة'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        inv.payment_state === 'paid'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : inv.payment_state === 'in_payment'
                          ? 'bg-sky-50 text-sky-700 border-sky-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {inv.payment_state === 'paid'
                        ? 'مسددة بالكامل'
                        : inv.payment_state === 'in_payment'
                        ? 'تحت التحصيل'
                        : 'غير مسددة'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleDelete(inv.id, inv.name)}
                      title="حذف الفاتورة من Odoo"
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    لا توجد فواتير مطابقة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-emerald-600 px-6 py-4 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base">إنشاء فاتورة جديدة مباشرة في Odoo</h3>
                <p className="text-[11px] text-emerald-100">تخطي الكاش وبث فوري إلى account.move</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">العميل / المستفيد *</label>
                <select
                  required
                  value={selectedPartnerId}
                  onChange={(e) => setSelectedPartnerId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                >
                  <option value="">اختر العميل من قائمة شركاء Odoo...</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">تاريخ الفاتورة</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">الصنف / الخدمة</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                >
                  <option value="">اختر الخدمة أو المنتج...</option>
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none"
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center text-xs">
                <span className="font-bold text-emerald-800">إجمالي الفاتورة:</span>
                <span className="font-black text-emerald-950 text-sm">
                  {(quantity * priceUnit).toLocaleString()} ج.م
                </span>
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'جاري الإرسال المباشر إلى Odoo...' : 'إصدار الفاتورة فورياً'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
