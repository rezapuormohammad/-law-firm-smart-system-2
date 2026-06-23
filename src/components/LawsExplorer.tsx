import { useState } from "react";
import { toPersianDigits } from "../utils/shamsi";
import { Bot, Send, Sparkles, Copy, Check } from "lucide-react";

export default function LawsExplorer() {
  // AI Law Assistant states
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiCopied, setAiCopied] = useState(false);

  // AI Assistant Integration
  const handleAskAI = async () => {
    if (!aiPrompt.trim()) return;

    setLoading(true);
    setAiResponse("");

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `موضوع سوال حقوقی من: "${aiPrompt}". لطفاً مشخص کنید که چه مواد قانونی در قوانین مدنی، مجازات اسلامی، آیین دادرسی مدنی یا کیفری، یا قوانین اساسی و تجارتی ایران در رابطه با این موضوع وجود دارد؟ شماره مواد و تفسیر خلاصه کاربردی لایحه کاربردی آنها را ارایه دهید.`
            }
          ],
          systemInstruction: "شما یک دستیار هوشمند و پژوهشگر ارشد قوانین ایران هستید. وظیفه شما یافتن شماره ماده‌ها و تبیین حقوقی بر مبنای قوانین موضوعه ایران است. پاسخ خود را دقیق، رسمی، شماره‌بندی شده و مستند به قانون ارایه دهید."
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || "خطا در پاسخگویی هوش مصنوعی.");
      }
      const data = await response.json();
      setAiResponse(data.text);
    } catch (e: any) {
      let errMsg = "متاسفانه در حال حاضر امکان بازیابی اطلاعات از بانک قوانین هوش مصنوعی وجود ندارد. لطفاً ارتباط شبکه خود را بسنجید.";
      if (e.message === "Failed to fetch") errMsg = "ارتباط با شبکه اینترنت قطع است.";
      setAiResponse(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Copy output to Clipboard
  const handleCopyAIResponse = () => {
    if (!aiResponse) return;
    navigator.clipboard.writeText(aiResponse);
    setAiCopied(true);
    setTimeout(() => {
      setAiCopied(false);
    }, 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Main Container & Full Width AI Assistant Card */}
      <div className="bg-slate-900 text-white border border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col space-y-6 animate-in fade-in duration-300">
        <div className="space-y-6">
          
          {/* Header Layout inside the card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-5 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400">
                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-200">یار هوش مصنوعی قوانین و مقررات جمهوری اسلامی ایران</h3>
                <p className="text-[10px] text-slate-400 mt-1 font-bold">پژوهشگر ارشد قوانین موضوعه ملی، کیفری و حقوقی مجهز به موتور استخراج مستندات و لوایح دادرسی</p>
              </div>
            </div>
            
            {aiResponse && (
              <button
                type="button"
                onClick={handleCopyAIResponse}
                className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all duration-150 cursor-pointer select-none flex items-center gap-2 self-start sm:self-auto ${
                  aiCopied
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-800 hover:bg-slate-750 text-amber-400 border border-slate-700"
                }`}
                title="کپی کردن متن پاسخ هوش مصنوعی"
              >
                {aiCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    پاسخ کپی شد!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    کپی هوشمند کادر پاسخ
                  </>
                )}
              </button>
            )}
          </div>

          {/* User Prompt Input Area */}
          <div className="space-y-2 pt-1">
            <label className="text-[10px] text-slate-400 font-semibold block">موضوع پرونده، بند اتهامی، جرم یا مستند قانونی مورد نظر خود را تشریح کنید:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAskAI();
                }}
                placeholder="مثال: جرم تبانی برای بردن مال غیر، عدم ثبت رسمی ازدواج تعزیری است؟"
                className="flex-1 px-4 py-3 bg-slate-850 border border-slate-750 rounded-2xl text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                disabled={loading}
              />
              <button
                onClick={handleAskAI}
                disabled={loading || !aiPrompt.trim()}
                className="px-5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-2xl flex items-center justify-center transition disabled:opacity-50 cursor-pointer select-none shadow-md shadow-amber-500/10 font-bold"
              >
                <Send className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </div>

          {/* Response area - large and animated expansion */}
          <div 
            className={`mt-4 bg-slate-950/40 border border-slate-850 rounded-2xl p-5 overflow-y-auto transition-all duration-300 relative ${
              aiResponse || loading 
                ? "min-h-[480px] max-h-[800px] md:max-h-[950px] border-amber-500/10 shadow-lg" 
                : "min-h-[250px] max-h-[350px]"
            }`}
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-4 animate-pulse">
                <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-400 font-bold">در حال پردازش مفاد قانونی و استخراج نکات لایحه دادرسی...</p>
                <p className="text-[10px] text-slate-500 italic">بروزرسانی همزمان بر اساس آرای وحدت رویه جدید دیوان عالی کشور</p>
              </div>
            ) : aiResponse ? (
              <div className="text-xs leading-relaxed text-slate-300 whitespace-pre-wrap font-sans space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-850/60 pb-3 mb-3">
                  <span className="text-[10px] bg-amber-500/15 text-amber-400 px-2.5 py-1 rounded-lg font-black flex items-center gap-1.5 align-middle">
                    <Bot className="w-3.5 h-3.5" />
                    نتایج تطبیقی استخراج شده
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyAIResponse}
                    className="text-[10px] text-slate-400 hover:text-white transition flex items-center gap-1.5 cursor-pointer selection:bg-transparent"
                  >
                    {aiCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {aiCopied ? "کپی شد" : "کپی کل متن مستند"}
                  </button>
                </div>
                <div className="px-1 text-slate-200 selection:bg-amber-500/30 selection:text-white">
                  {toPersianDigits(aiResponse)}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 text-slate-500">
                <Bot className="w-12 h-12 stroke-1 text-slate-600 animate-bounce" />
                <div className="space-y-1.5">
                  <p className="text-xs font-black text-slate-400">استعلام تقاطعی مواد و تبیین فوری قوانین دادرسی</p>
                  <p className="text-[10px] max-w-xs mx-auto leading-relaxed">یک موضوع یا سوال حقوقی را در بخش بالا تایپ کنید تا تمام مواد مربوطه همراه با تحلیل لایحه برای شما مهیا شود.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
