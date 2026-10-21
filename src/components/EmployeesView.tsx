import React, { useState } from 'react';
import { Plus, Search, Users, Trash2, Mail, Phone, Briefcase, Building } from 'lucide-react';
import { Employee } from '../types';
import { odooApi } from '../api';

interface EmployeesViewProps {
  employees: Employee[];
  onRefresh: () => void;
  loading: boolean;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({
  employees,
  onRefresh,
  loading,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [workPhone, setWorkPhone] = useState('');

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('يرجى إدخال اسم الموظف / الطبيب', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await odooApi.createEmployee({
        name,
        jobTitle,
        workEmail,
        workPhone,
      });

      if (res.success) {
        showToast(`تم تسجيل الموظف بنجاح في Odoo (رقم #${res.id}) مع تخطي الكاش!`, 'success');
        setIsModalOpen(false);
        setName('');
        setJobTitle('');
        setWorkEmail('');
        setWorkPhone('');
        onRefresh();
      } else {
        showToast(res.error || 'فشل تسجيل الموظف', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, empName: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف الموظف ${empName} مباشرة من Odoo؟`)) return;
    try {
      const res = await odooApi.deleteRecord('hr.employee', id);
      if (res.success) {
        showToast(`تم حذف الموظف ${empName} بنجاح من Odoo`, 'info');
        onRefresh();
      } else {
        showToast(res.error || 'فشل حذف الموظف', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const title = emp.job_title || '';
    const dept = emp.department_id ? emp.department_id[1] : '';
    const email = emp.work_email || '';
    return (
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <span>فريق العمل والموارد البشرية (Odoo HR Employees)</span>
            <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
              {employees.length} موظف وطبيب
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            سجلات الكادر الطبي والإداري المباشرة من جدول hr.employee في Odoo
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>تسجيل موظف / طبيب جديد في Odoo</span>
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
              placeholder="بحث بالاسم، المسمى، أو القسم..."
              className="w-full pr-9 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-3 px-4">كود الموظف</th>
                <th className="py-3 px-4">اسم الموظف / الطبيب</th>
                <th className="py-3 px-4">المسمى الوظيفي</th>
                <th className="py-3 px-4">القسم</th>
                <th className="py-3 px-4">البريد الإلكتروني</th>
                <th className="py-3 px-4">رقم الهاتف</th>
                <th className="py-3 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                    EMP-{emp.id}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px]">
                      {emp.name.slice(0, 1)}
                    </div>
                    <span>{emp.name}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">
                    {emp.job_title || <span className="text-slate-400 italic">غير محدد</span>}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {emp.department_id ? emp.department_id[1] : 'الإدارة العامة'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]" dir="ltr">
                    {emp.work_email || '-'}
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-mono text-[11px]" dir="ltr">
                    {emp.work_phone || '-'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleDelete(emp.id, emp.name)}
                      title="حذف من Odoo"
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    لا يوجد موظفون مطابقون
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
            <div className="bg-indigo-600 px-6 py-4 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base">تسجيل موظف أو طبيب جديد في Odoo</h3>
                <p className="text-[11px] text-indigo-100">تخطي الكاش وبث فوري إلى hr.employee</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  اسم الموظف / الطبيب الكامل *
                </label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: د. إبراهيم خليل، أ. سارة محمود..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  المسمى الوظيفي (Job Title)
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="استشاري جراحة، محاسب، أخصائي تمريض..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    البريد الإلكتروني للعمل
                  </label>
                  <input
                    type="email"
                    value={workEmail}
                    onChange={(e) => setWorkEmail(e.target.value)}
                    placeholder="doctor@smartcare.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    رقم الهاتف
                  </label>
                  <input
                    type="text"
                    value={workPhone}
                    onChange={(e) => setWorkPhone(e.target.value)}
                    placeholder="01xxxxxxxxx"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none"
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
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'جاري الإرسال المباشر إلى Odoo...' : 'حفظ الموظف فورياً'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
