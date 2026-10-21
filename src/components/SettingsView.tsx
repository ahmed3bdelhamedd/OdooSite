import React, { useState } from 'react';
import { Settings, CheckCircle2, AlertCircle, RefreshCw, Key, Globe, Database, User } from 'lucide-react';
import { OdooStatus } from '../types';
import { odooApi } from '../api';

interface SettingsViewProps {
  status: OdooStatus | null;
  onRefresh: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ status, onRefresh, showToast }) => {
  const [url, setUrl] = useState(status?.url || 'https://edu-smartcare.odoo.com');
  const [db, setDb] = useState(status?.db || 'edu-smartcare');
  const [login, setLogin] = useState(status?.login || 'ahmed3bdelhamedwork@gmail.com');
  const [apiKey, setApiKey] = useState('d88233ec9119ba69a2d2646d760b2216ce9524cd');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await odooApi.updateConfig({ url, db, login, apiKey, mcpKey: apiKey });
      if (res.success) {
        showToast('تم حفظ إعدادات الاتصال بنجاح', 'success');
        onRefresh();
      } else {
        showToast(res.error || 'فشل التحديث', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await odooApi.getStatus();
      setTestResult(res);
      if (res.connected) {
        showToast(`الاتصال ناجح تماماً! زمن الاستجابة: ${res.latencyMs}ms`, 'success');
      } else {
        showToast(`فشل الاتصال: ${res.error}`, 'error');
      }
    } catch (err: any) {
      setTestResult({ connected: false, error: err.message });
      showToast(err.message, 'error');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
          <Settings className="w-5 h-5 text-sky-600" />
          <span>إعدادات ربط Odoo API ومفاتيح الوصول</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          إدارة بيانات خادم Odoo والمفتاح الأمني (MCP Key) المعتمد للاتصال السحابي الفوري
        </p>
      </div>

      {/* Settings Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>عنوان الخادم (Odoo Instance URL)</span>
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://edu-smartcare.odoo.com"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:border-sky-500"
              dir="ltr"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                <span>اسم قاعدة البيانات (Database Name)</span>
              </label>
              <input
                type="text"
                required
                value={db}
                onChange={(e) => setDb(e.target.value)}
                placeholder="edu-smartcare"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:border-sky-500"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>بريد تسجيل الدخول (User Login)</span>
              </label>
              <input
                type="email"
                required
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="ahmed3bdelhamedwork@gmail.com"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:border-sky-500"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-slate-400" />
              <span>مفتاح الـ API / MCP Key (Odoo API Key)</span>
            </label>
            <input
              type="text"
              required
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="d88233ec9119ba69a2d2646d760b2216ce9524cd"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:border-sky-500"
              dir="ltr"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              المفتاح الذي قمت بتوفيره في التوجيهات للاتصال الفوري بدون كاش
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin text-sky-600' : ''}`} />
              <span>{testing ? 'جاري فحص الاتصال...' : 'اختبار الاتصال المباشر الآن'}</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات وتطبيقها فوراً'}
            </button>
          </div>
        </form>

        {/* Test Result Box */}
        {testResult && (
          <div
            className={`p-4 rounded-xl border text-xs ${
              testResult.connected
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-1">
              {testResult.connected ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>تم تأكيد الاتصال بنجاح بـ Odoo Enterprise 20!</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>فشل اختبار الاتصال:</span>
                </>
              )}
            </div>
            {testResult.connected ? (
              <p className="text-[11px] text-emerald-700 font-mono">
                Latency: {testResult.latencyMs}ms | User: {testResult.user?.name || testResult.login} (UID: {testResult.uid}) | Cache-Policy: NO-CACHE
              </p>
            ) : (
              <p className="text-[11px] text-rose-700">{testResult.error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
