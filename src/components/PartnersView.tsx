import React, { useState } from 'react';
import { Plus, Search, Building2, Trash2, Mail, Phone, MapPin, UserCheck } from 'lucide-react';
import { Partner } from '../types';
import { odooApi } from '../api';

interface PartnersViewProps {
  partners: Partner[];
  onRefresh: () => void;
  loading: boolean;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const PartnersView: React.FC<PartnersViewProps> = ({
  partners,
  onRefresh,
  loading,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [isCompany, setIsCompany] = useState(false);

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('يرجى إدخال اسم العميل أو الجهة', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await odooApi.createPartner({
        name,
        email,
        phone,
        street,
        city,
        isCompany,
      });

      if (res.success) {
        showToast(`تمت إضافة العميل بنجاح في Odoo (معرف #${res.id}) مع تخطي الكاش!`, 'success');
        setIsModalOpen(false);
        setName('');
        setEmail('');
        setPhone('');
        setStreet('');
        setCity('');
        setIsCompany(false);
        onRefresh();
      } else {
        showToast(res.error || 'فشل إضافة العميل', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, partnerName: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف ${partnerName} مباشرة من Odoo؟`)) return;
    try {
      const res = await odooApi.deleteRecord('res.partner', id);
      if (res.success) {
        showToast(`تم حذف ${partnerName} بنجاح من Odoo`, 'info');
        onRefresh();
      } else {
        showToast(res.error || 'فشل حذف جهة الاتصال', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const filteredPartners = partners.filter((p) => {
    const pEmail = p.email || '';
    const pPhone = p.phone || '';
    const pCity = p.city || '';
    return (
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pPhone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pCity.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <span>دليل العملاء والشركاء (Odoo Contacts & Partners)</span>
            <span className="text-xs bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded-full">
              {partners.length} شريك مسجل
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            الربط المباشر مع جدول res.partner في Odoo لمتابعة المرضى، المستشفيات، والموردين
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة عميل / جهة جديدة في Odoo</span>
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
              placeholder="بحث بالاسم، البريد، أو الهاتف..."
              className="w-full pr-9 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-3 px-4">رقم الشريك</th>
                <th className="py-3 px-4">اسم العميل / المؤسسة</th>
                <th className="py-3 px-4">النوع</th>
                <th className="py-3 px-4">البريد الإلكتروني</th>
                <th className="py-3 px-4">رقم الهاتف</th>
                <th className="py-3 px-4">المدينة / العنوان</th>
                <th className="py-3 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPartners.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-sky-700">#{p.id}</td>
                  <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                        p.is_company
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {p.is_company ? <Building2 className="w-3.5 h-3.5" /> : p.name.slice(0, 1)}
                    </div>
                    <span>{p.name}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        p.is_company
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {p.is_company ? 'شركة / جهة' : 'فرد / عميل'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono text-[11px]" dir="ltr">
                    {p.email || '-'}
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-mono text-[11px]" dir="ltr">
                    {p.phone || '-'}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {[p.city, p.street].filter(Boolean).join(' - ') || '-'}
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
              {filteredPartners.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    لا يوجد عملاء مطابقون
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
            <div className="bg-sky-600 px-6 py-4 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base">إضافة عميل أو شريك جديد في Odoo</h3>
                <p className="text-[11px] text-sky-100">تخطي الكاش وبث فوري إلى res.partner</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePartner} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  اسم العميل أو المؤسسة *
                </label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: مستشفى الشفاء، أحمد محمد..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="is-company-checkbox"
                  checked={isCompany}
                  onChange={(e) => setIsCompany(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded"
                />
                <label htmlFor="is-company-checkbox" className="text-xs font-bold text-slate-700 cursor-pointer">
                  هذا الشريك عبارة عن شركة أو مؤسسة (Company)
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="client@example.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم الهاتف</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01xxxxxxxxx"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">المدينة</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="القاهرة، الجيزة..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">العنوان / الشارع</label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="شارع التحرير، مبنى..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none"
                  />
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
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'جاري الإرسال المباشر إلى Odoo...' : 'حفظ الشريك فورياً'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
