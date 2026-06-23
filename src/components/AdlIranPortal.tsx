import React, { useState } from "react";
import { toPersianDigits, toEnglishDigits } from "../utils/shamsi";
import { ExternalLink, Link2, ShieldAlert, CheckCircle2, Lock, HelpCircle, FileText, Calendar, ArrowLeft, RefreshCw } from "lucide-react";

interface CaseRecord {
  caseNumber: string;
  nationalId: string;
  caseClass: string;
  branch: string;
  subject: string;
  parties: string;
  archiveNumber: string;
  status: string;
  timeline: { date: string; title: string }[];
  notices: { id: string; date: string; subject: string; status: string }[];
}

export default function AdlIranPortal() {
  const [caseNoQuery, setCaseNoQuery] = useState("");
  const [nationalIdQuery, setNationalIdQuery] = useState("");
  const [checkStatus, setCheckStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [caseResult, setCaseResult] = useState<CaseRecord | null>(null);
  const [stepMsg, setStepMsg] = useState("");

  const handleQueryAdl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseNoQuery || !nationalIdQuery) return;

    const enCase = toEnglishDigits(caseNoQuery).replace(/\D/g, "");
    const enNational = toEnglishDigits(nationalIdQuery).replace(/\D/g, "");

    if (enCase.length !== 16 && enCase.length !== 18) {
      setErrorMessage("شماره پرونده عدل ایران باید ۱۶ یا ۱۸ رقم باشد.");
      setCheckStatus("error");
      return;
    }

    if (enNational.length !== 10) {
      setErrorMessage("کدملی باید دقیقاً ۱۰ رقم عددی باشد.");
      setCheckStatus("error");
      return;
    }

    setCheckStatus("loading");
    setCaseResult(null);
    setErrorMessage("");

    // Simulate realistic security handshake steps
    setStepMsg("در حال برقراری کانال امن SSL با سرور پیشخوان عدل ایران...");
    await new Promise(r => setTimeout(r, 600));

    setStepMsg("در حال ارسال شناسه‌های اعتباری ثنا به سامانه مخابرات قضایی...");
    await new Promise(r => setTimeout(r, 700));

    setStepMsg("بازیابی و استخراج خلاصه پرونده و ابلاغیه‌های کارتابل ملی...");
    
    try {
      const response = await fetch("/api/adliran/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseNumber: enCase,
          nationalId: enNational
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || "شناسه کاربری یا رمز عبور ثنا موقت متصل نیست.");
      }

      const data = await response.json();
      setCaseResult(data);
      setCheckStatus("success");
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message || "خطا در بازیابی پرونده الکترونیک. لطفاً اتصال اینترنت یا کدملی ثنا را بازنگری کنید.";
      if (err.message === "Failed to fetch") errMsg = "ارتباط با شبکه اینترنت قطع است.";
      setErrorMessage(errMsg);
      setCheckStatus("error");
    }
  };

  const handleReset = () => {
    setCheckStatus("idle");
    setCaseResult(null);
    setCaseNoQuery("");
    setNationalIdQuery("");
    setErrorMessage("");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-350">
      {/* Top Banner */}
      <div className="bg-amber-500 text-slate-950 p-6 rounded-3xl border border-amber-400 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-900/10 flex items-center justify-center text-slate-100/10 shrink-0">
            <Link2 className="w-6 h-6 text-slate-950 font-bold" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold">درگاه ملی خدمات الکترونیک قضایی (عدل ایران)</h2>
            <p className="text-xs text-slate-900 font-bold mt-0.5">پایگاه رسمی ورود به سامانه‌های ابلاغ الکترونیک و پیگیری پرونده</p>
          </div>
        </div>
        <a
          href="https://adliran.ir"
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2.5 bg-slate-950 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition shadow select-none cursor-pointer shrink-0"
        >
          ورود مستقیم به عدل ایران
          <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Input Form Column */}
        <div className="md:col-span-5 bg-slate-900 text-white rounded-3xl p-6 shadow-md border border-slate-800 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <h3 className="text-xs font-bold text-white">استعلام سریع وضعیت پرونده</h3>
              <p className="text-[9px] text-slate-400 mt-0.5">اتصال زنده الکترونیک به دیتابیس لوکال و سرور استعلام</p>
            </div>
          </div>

          <form onSubmit={handleQueryAdl} className="space-y-4 text-xs font-bold text-slate-300">
            <div className="space-y-1.5">
              <label className="text-slate-400 block font-semibold">شماره پرونده (۱۶ یا ۱۸ رقمی فرعی عدل ایران)</label>
              <input
                type="text"
                required
                maxLength={18}
                value={caseNoQuery}
                onChange={(e) => setCaseNoQuery(toPersianDigits(e.target.value))}
                placeholder="مثال: ۱۴۰۳۹۸۷۶۵۴۳۲۱۰۰۱"
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 text-white rounded-xl outline-none focus:ring-1 focus:ring-amber-500 font-mono text-center font-extrabold text-xs"
                disabled={checkStatus === "loading"}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 block font-semibold">کدملی موکل متقاضی (۱۰ رقم)</label>
              <input
                type="text"
                required
                value={nationalIdQuery}
                onChange={(e) => setNationalIdQuery(toPersianDigits(e.target.value))}
                placeholder="مثال: ۰۰۸۷۶۵۴۳۲۱"
                maxLength={10}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 text-white rounded-xl outline-none focus:ring-1 focus:ring-amber-500 font-mono text-center font-extrabold text-xs"
                disabled={checkStatus === "loading"}
              />
            </div>

            {checkStatus !== "loading" ? (
              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl transition cursor-pointer select-none text-xs"
              >
                ارسال تقاضا و واکشی پرونده
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="w-full py-3 bg-slate-800 text-slate-500 font-black rounded-xl cursor-not-allowed select-none text-xs animate-pulse"
              >
                در حال بازیابی پرونده...
              </button>
            )}
          </form>

          {checkStatus === "success" && (
            <button
              onClick={handleReset}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-xl transition text-[11px] flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              استعلام مجدد پرونده دگر
            </button>
          )}

          <div className="text-[9px] text-slate-500 leading-relaxed text-center bg-slate-950/40 p-3 rounded-2xl border border-slate-850">
            * به موازات مقررات صیانت از حریم خصوصی عدل ایران، ابلاغیه‌ها صرفاً برای وکیل ذی‌سمت یا شخص اصیل پرونده صادر می‌گردد.
          </div>
        </div>

        {/* Results Columns */}
        <div className="md:col-span-7 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm min-h-[400px] flex flex-col justify-start">
          {checkStatus === "loading" && (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="relative flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin"></div>
                <Lock className="w-5 h-5 text-amber-500 absolute animate-pulse" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h4 className="text-xs font-black text-slate-800">اتصال پایگاه داده دادگستری</h4>
                <p className="text-[10px] text-slate-400 font-bold leading-relaxed">{stepMsg}</p>
              </div>
            </div>
          )}

          {checkStatus === "error" && (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center border border-red-100 shrink-0">
                <ShieldAlert className="w-6 h-6 stroke-1.5" />
              </div>
              <div className="space-y-1.5 max-w-xs">
                <h4 className="text-xs font-black text-slate-800">خطای دسترسی یا اهلیت</h4>
                <p className="text-[10px] text-red-600 font-bold leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          {checkStatus === "idle" && (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400">
                <HelpCircle className="w-8 h-8 stroke-1" />
              </div>
              <div className="space-y-1 max-w-xs">
                <h4 className="text-xs font-black text-slate-800">در انتظار درخواست استعلام</h4>
                <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                  شماره ۱۶ رقمی پرونده ثنا را در پنل سمت راست وارد نمایید تا به وب‌سرویس مستقیم متصل و شناسنامه کامل پرونده واکشی شود.
                </p>
              </div>
            </div>
          )}

          {checkStatus === "success" && caseResult && (
            <div className="space-y-5 animate-in fade-in duration-350">
              {/* Case Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-100 rounded text-[9px] font-black uppercase">اطلاعات پرونده معتبر</span>
                  <h3 className="text-xs font-black text-slate-800 mt-1">{caseResult.subject}</h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">
                  بایگانی: {toPersianDigits(caseResult.archiveNumber)}
                </span>
              </div>

              {/* Grid Metadata */}
              <div className="grid grid-cols-2 gap-4 text-[11px] font-bold text-slate-705">
                <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 space-y-0.5">
                  <span className="text-[9px] text-slate-400 block">مرجع رسیدگی‌کننده (شعبه):</span>
                  <span className="text-slate-800">{caseResult.branch}</span>
                </div>
                <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 space-y-0.5">
                  <span className="text-[9px] text-slate-400 block">کلاسه پرونده ثنا:</span>
                  <span className="text-slate-850 font-mono">{toPersianDigits(caseResult.caseClass)}</span>
                </div>
                <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 space-y-0.5 col-span-2">
                  <span className="text-[9px] text-slate-400 block">طرفین پرونده (اصحاب دعوی):</span>
                  <span className="text-slate-800">{caseResult.parties}</span>
                </div>
              </div>

              {/* Tabulated Notices */}
              <div className="space-y-2.5">
                <h4 className="text-[10px] font-black text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-500" />
                  لیست آخرین ابلاغیه‌های ثنا صادر شده:
                </h4>
                <div className="border border-slate-100 rounded-2xl overflow-hidden text-[10px] font-bold text-slate-705">
                  <div className="grid grid-cols-4 bg-slate-50 p-2.5 border-b border-slate-100 text-slate-500 font-semibold">
                    <span>شماره ابلاغیه</span>
                    <span>تاریخ صدور</span>
                    <span className="col-span-2">موضوع ابلاغیه / وضعیت</span>
                  </div>
                  {caseResult.notices.map((n, i) => (
                    <div key={i} className="grid grid-cols-4 p-2.5 border-b border-slate-50 items-center last:border-b-0 hover:bg-slate-50/30 transition">
                      <span className="font-mono text-slate-500">{toPersianDigits(n.id)}</span>
                      <span>{toPersianDigits(n.date)}</span>
                      <div className="col-span-2 flex flex-col gap-0.5">
                        <span className="text-slate-800 font-extrabold">{n.subject}</span>
                        <span className="text-[9px] text-green-600 block">{n.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline Status */}
              <div className="space-y-3 pb-2">
                <h4 className="text-[10px] font-black text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  روند کار تفصیلی پرونده (خط زمانی الکترونیک):
                </h4>
                <div className="relative border-r border-slate-150 mr-2.5 pr-4 space-y-5 text-xs text-slate-700">
                  {caseResult.timeline.map((act, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -right-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-white ring-4 ring-amber-500/10"></div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-slate-400 font-bold block font-mono">{toPersianDigits(act.date)}</span>
                        <p className="text-[10px] font-bold leading-relaxed text-slate-850">{act.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
