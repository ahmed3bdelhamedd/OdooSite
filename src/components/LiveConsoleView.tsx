import React, { useState } from 'react';
import {
  Terminal,
  Play,
  Zap,
  Clock,
  ShieldCheck,
  Code,
  CheckCircle,
  Copy,
  Activity,
  Layers,
} from 'lucide-react';
import { odooApi } from '../api';
import { OdooStatus } from '../types';

interface LiveConsoleViewProps {
  status: OdooStatus | null;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const LiveConsoleView: React.FC<LiveConsoleViewProps> = ({ status, showToast }) => {
  const [model, setModel] = useState('sale.order');
  const [method, setMethod] = useState('search_read');
  const [argsJson, setArgsJson] = useState('[]');
  const [kwargsJson, setKwargsJson] = useState('{\n  "fields": ["name", "partner_id", "amount_total", "state"],\n  "limit": 5\n}');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [execTime, setExecTime] = useState<string | null>(null);

  const handleRun = async () => {
    setLoading(true);
    setResult(null);
    setLatency(null);

    let parsedArgs = [];
    let parsedKwargs = {};

    try {
      parsedArgs = JSON.parse(argsJson);
    } catch {
      showToast('خطأ في تنسيق JSON الخاص بـ Arguments', 'error');
      setLoading(false);
      return;
    }

    try {
      parsedKwargs = JSON.parse(kwargsJson);
    } catch {
      showToast('خطأ في تنسيق JSON الخاص بـ Kwargs', 'error');
      setLoading(false);
      return;
    }

    const t0 = Date.now();
    try {
      const res = await odooApi.runRawCall(model, method, parsedArgs, parsedKwargs);
      const t1 = Date.now();
      setLatency(res.latencyMs || (t1 - t0));
      setExecTime(res.timestamp || new Date().toISOString());
      setResult(res);
      if (res.success) {
        showToast(`تم تنفيذ الاستعلام بنجاح في ${res.latencyMs || (t1 - t0)}ms بدون كاش`, 'success');
      } else {
        showToast(res.error || 'حدث خطأ من Odoo', 'error');
      }
    } catch (err: any) {
      setLatency(Date.now() - t0);
      setResult({ error: err.message });
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('تم النسخ إلى الحافظة', 'info');
  };

  const samplePythonCode = `import requests
import os

url = "${status?.url || 'https://edu-smartcare.odoo.com'}"
mcp_key = "d88233ec9119ba69a2d2646d760b2216ce9524cd"

headers = {
    "Authorization": f"bearer {mcp_key}",
    "Content-Type": "application/json",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache"
}

# Example: Instant live call to Odoo JSON-RPC without cache
payload = {
    "jsonrpc": "2.0",
    "method": "call",
    "params": {
        "service": "object",
        "method": "execute_kw",
        "args": [
            "edu-smartcare", 2, mcp_key,
            "${model}", "${method}",
            ${argsJson},
            ${kwargsJson.replace(/\n/g, '\n            ')}
        ]
    },
    "id": 1
}

response = requests.post(f"{url}/jsonrpc", json=payload, headers=headers)
print(response.json())`;

  return (
    <div className="space-y-6">
      {/* Top Banner explaining Cache Bypass */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold text-emerald-400">Zero-Cache Realtime Gateway</span>
            <span className="text-xs text-slate-400 font-mono">| {status?.url}</span>
          </div>
          <h2 className="text-xl font-black">فاحص تخطي الكاش والاستجابة المباشرة (Live Odoo Console)</h2>
          <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
            كافة الطلبات تمر مباشرة إلى خادم Odoo مع رؤوس <code className="text-amber-400">Cache-Control: no-cache, no-store</code> ومعامل زمني عشوائي لضمان عدم حفظ أي استجابة مؤقتة والوصول إلى البيانات اللحظية فوراً.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 block font-semibold">زمن الاستجابة المباشر</span>
            <span className="text-lg font-black text-emerald-400 font-mono">
              {status?.latencyMs || 0} ms
            </span>
          </div>
          <div className="bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 block font-semibold">حالة التخزين المؤقت</span>
            <span className="text-xs font-bold text-amber-400">BYPASS (تخطي فوري)</span>
          </div>
        </div>
      </div>

      {/* HTTP Headers and Parameters Verified */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Active Headers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>رؤوس الطلب النشطة (Active HTTP Headers)</span>
          </h3>
          <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[11px] space-y-1.5 overflow-x-auto" dir="ltr">
            <p><span className="text-sky-400">Authorization:</span> bearer d88233ec9119ba69a2d2646d760b2216ce9524cd</p>
            <p><span className="text-sky-400">Content-Type:</span> application/json</p>
            <p><span className="text-amber-400">Cache-Control:</span> no-cache, no-store, must-revalidate, max-age=0</p>
            <p><span className="text-amber-400">Pragma:</span> no-cache</p>
            <p><span className="text-amber-400">Expires:</span> 0</p>
            <p><span className="text-emerald-400">X-Odoo-Cache-Status:</span> BYPASS_LIVE</p>
          </div>
        </div>

        {/* Card 2: Active Session Credentials */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-600" />
            <span>جلسة المستخدم وقاعدة البيانات (Odoo Session)</span>
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">خادم Odoo:</span>
              <span className="font-mono font-bold text-slate-800" dir="ltr">{status?.url}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">اسم قاعدة البيانات (DB):</span>
              <span className="font-mono font-bold text-slate-800">{status?.db}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">المستخدم النشط:</span>
              <span className="font-bold text-slate-800">{status?.user?.name || status?.login}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">معرف المستخدم (UID):</span>
              <span className="font-mono font-bold text-emerald-600">UID: {status?.uid || 2}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">إصدار الخادم:</span>
              <span className="font-mono font-bold text-slate-800">
                {status?.version?.server_version || '20.0+e'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Query Tester */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-sky-600" />
              <span>تنفيذ استعلام مباشر على أي جدول في Odoo (Live execute_kw)</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              اختبر وصول البيانات فورياً بدون كاش لأي نموذج من نماذج Odoo
            </p>
          </div>

          <button
            onClick={handleRun}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${loading ? 'animate-pulse' : ''}`} />
            <span>{loading ? 'جاري الإرسال المباشر...' : 'إرسال فوري وتخطي الكاش'}</span>
          </button>
        </div>

        {/* Quick Model Selector Pills */}
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="text-slate-500 font-bold self-center">نماذج شائعة:</span>
          {[
            'sale.order',
            'account.move',
            'hr.employee',
            'product.template',
            'res.partner',
            'res.users',
          ].map((m) => (
            <button
              key={m}
              onClick={() => setModel(m)}
              className={`px-3 py-1 rounded-lg font-mono text-[11px] font-semibold transition-colors cursor-pointer ${
                model === m
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">النموذج (Model)</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الدالة (Method)</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:border-sky-500"
            >
              <option value="search_read">search_read (بحث وقراءة)</option>
              <option value="search">search (إرجاع المعرفات فقط)</option>
              <option value="read">read (قراءة بسجل محدد)</option>
              <option value="fields_get">fields_get (استعراض الحقول)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              المعاملات (Args JSON Array)
            </label>
            <textarea
              rows={4}
              value={argsJson}
              onChange={(e) => setArgsJson(e.target.value)}
              className="w-full p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl focus:outline-none"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              الخيارات (Kwargs JSON Object)
            </label>
            <textarea
              rows={4}
              value={kwargsJson}
              onChange={(e) => setKwargsJson(e.target.value)}
              className="w-full p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl focus:outline-none"
              dir="ltr"
            />
          </div>
        </div>

        {/* Live Response Output */}
        {result && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold text-slate-800">
                  الاستجابة المباشرة من Odoo (Response):
                </span>
                {latency !== null && (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                    {latency} ms
                  </span>
                )}
                {execTime && (
                  <span className="text-[10px] text-slate-400 font-mono" dir="ltr">
                    {execTime}
                  </span>
                )}
              </div>

              <button
                onClick={() => copyToClipboard(JSON.stringify(result, null, 2))}
                className="text-xs text-sky-600 hover:text-sky-800 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>نسخ النتيجة</span>
              </button>
            </div>

            <pre
              className="bg-slate-950 text-slate-100 p-4 rounded-xl font-mono text-xs max-h-80 overflow-y-auto leading-relaxed border border-slate-800"
              dir="ltr"
            >
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Python Integration Snippet Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-800">
              كود بايثون المطابق للاتصال الفوري بدون كاش (Python Requests Snippet)
            </h3>
          </div>
          <button
            onClick={() => copyToClipboard(samplePythonCode)}
            className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>نسخ الكود</span>
          </button>
        </div>
        <pre
          className="bg-slate-900 text-sky-200 p-4 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800"
          dir="ltr"
        >
          {samplePythonCode}
        </pre>
      </div>
    </div>
  );
};
