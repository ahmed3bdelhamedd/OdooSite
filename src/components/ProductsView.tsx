import React, { useState } from 'react';
import { Plus, Search, Boxes, Trash2, Tag, Layers, CheckCircle2 } from 'lucide-react';
import { Product } from '../types';
import { odooApi } from '../api';

interface ProductsViewProps {
  products: Product[];
  onRefresh: () => void;
  loading: boolean;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  onRefresh,
  loading,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [listPrice, setListPrice] = useState<number | ''>('');
  const [standardPrice, setStandardPrice] = useState<number | ''>('');
  const [defaultCode, setDefaultCode] = useState('');
  const [type, setType] = useState('consu');

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('يرجى كتابة اسم الصنف / الخدمة', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await odooApi.createProduct({
        name,
        listPrice: Number(listPrice) || 0,
        standardPrice: Number(standardPrice) || 0,
        defaultCode: defaultCode || undefined,
        type,
      });

      if (res.success) {
        showToast(`تمت إضافة الصنف بنجاح إلى Odoo (معرف #${res.id}) مع تخطي الكاش!`, 'success');
        setIsModalOpen(false);
        setName('');
        setListPrice('');
        setStandardPrice('');
        setDefaultCode('');
        onRefresh();
      } else {
        showToast(res.error || 'فشل إضافة الصنف', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, prodName: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف الصنف ${prodName} مباشرة من Odoo؟`)) return;
    try {
      const res = await odooApi.deleteRecord('product.template', id);
      if (res.success) {
        showToast(`تم حذف الصنف ${prodName} بنجاح من Odoo`, 'info');
        onRefresh();
      } else {
        showToast(res.error || 'فشل حذف الصنف', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const filteredProducts = products.filter((p) => {
    const code = p.default_code || '';
    return (
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <span>دليل المنتجات والخدمات (Odoo Products)</span>
            <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
              {products.length} صنف مسجل
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            الربط المباشر مع product.template بدون تأخير مع تحديث فوري للأسعار والكميات
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة صنف / خدمة جديدة في Odoo</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث بالاسم أو الكود (SKU)..."
              className="w-full pr-9 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-3 px-4">كود الصنف</th>
                <th className="py-3 px-4">اسم المنتج / الخدمة</th>
                <th className="py-3 px-4">النوع</th>
                <th className="py-3 px-4">سعر البيع (List Price)</th>
                <th className="py-3 px-4">سعر التكلفة</th>
                <th className="py-3 px-4">الكمية المتاحة</th>
                <th className="py-3 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-amber-700">
                    {p.default_code || <span className="text-slate-400">#P-{p.id}</span>}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800">{p.name}</td>
                  <td className="py-3 px-4 text-slate-600">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 border border-slate-200">
                      {p.type === 'service' ? 'خدمة طبية' : 'صنف مخزني'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-black text-slate-900 text-sm">
                    {Number(p.list_price).toLocaleString()} ج.م
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {Number(p.standard_price).toLocaleString()} ج.م
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {p.qty_available !== undefined ? p.qty_available : '-'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      title="حذف من Odoo"
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    لا توجد منتجات مطابقة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-amber-600 px-6 py-4 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base">إضافة صنف جديد في Odoo</h3>
                <p className="text-[11px] text-amber-100">إرسال فوري إلى product.template</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  اسم المنتج أو الخدمة الطبية *
                </label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: كشف استشاري قلب، رسم قلب، تحاليل..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    سعر البيع (ج.م) *
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={listPrice}
                    onChange={(e) => setListPrice(Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    سعر التكلفة (ج.م)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={standardPrice}
                    onChange={(e) => setStandardPrice(Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    كود الصنف (SKU)
                  </label>
                  <input
                    type="text"
                    value={defaultCode}
                    onChange={(e) => setDefaultCode(e.target.value)}
                    placeholder="MED-001"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">نوع الصنف</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none"
                  >
                    <option value="consu">صنف استهلاكي / عيني</option>
                    <option value="service">خدمة (Service)</option>
                  </select>
                </div>
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
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'جاري الإرسال المباشر إلى Odoo...' : 'حفظ ونشر فوري في Odoo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
