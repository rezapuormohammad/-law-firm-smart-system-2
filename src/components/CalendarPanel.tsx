import React, { useState, useEffect } from "react";
import {
  getCurrentJalali,
  getJalaliMonthDays,
  getJalaliFirstWeekday,
  JALALI_MONTH_NAMES,
  JALALI_WEEKDAYS,
  toPersianDigits,
  formatTimeWithColon,
  jalaliToGregorian,
  doesEventMatchDate
} from "../utils/shamsi";
import { LegalEvent, EventType } from "../types";
import { Calendar, Plus, Clock, Bell, Trash2, ChevronRight, ChevronLeft, MapPin, User, FileText, Pencil } from "lucide-react";

interface CalendarPanelProps {
  events: LegalEvent[];
  onAddEvent: (event: LegalEvent) => void;
  onUpdateEvent: (event: LegalEvent) => void;
  onDeleteEvent: (id: string) => void;
  clientsList?: { id: string; name: string }[];
  casesList?: { id: string; title: string; clientName: string }[];
}

export default function CalendarPanel({
  events,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  clientsList = [],
  casesList = []
}: CalendarPanelProps) {
  const current = getCurrentJalali();
  const [year, setYear] = useState<number>(current.jy);
  const [month, setMonth] = useState<number>(current.jm);
  const [selectedDayDay, setSelectedDayDay] = useState<number>(current.jd);

  // Form states for creating new event
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<LegalEvent | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<EventType>("جلسه دادرسی");
  const [newTime, setNewTime] = useState("10:00");
  const [newAlarm, setNewAlarm] = useState(true);
  const [newDesc, setNewDesc] = useState("");
  const [newCaseId, setNewCaseId] = useState("");
  const [showAlarmTestModal, setShowAlarmTestModal] = useState(false);

  // Additional multi-day and SMS alarm configs
  const [alarm1Day, setAlarm1Day] = useState(true);
  const [alarm3Days, setAlarm3Days] = useState(false);
  const [alarm1Week, setAlarm1Week] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [smsPhone1, setSmsPhone1] = useState("09144627119");
  const [smsPhone2, setSmsPhone2] = useState("09901095393");

  const daysInMonth = getJalaliMonthDays(year, month);
  const firstDayOfWeekIndex = getJalaliFirstWeekday(year, month);

  // Next / Prev Month Controls
  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
    setSelectedDayDay(1);
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
    setSelectedDayDay(1);
  };

  // Compile calendar cells
  const gridCells: { type: "empty" | "day"; dayNumber?: number }[] = [];
  // 1. Padding preceding empty days
  for (let i = 0; i < firstDayOfWeekIndex; i++) {
    gridCells.push({ type: "empty" });
  }
  // 2. Add real days of month
  for (let d = 1; d <= daysInMonth; d++) {
    gridCells.push({ type: "day", dayNumber: d });
  }

  // Filter events of the selected month
  const getSelectedDateString = (dayNum: number) => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${year}/${pad(month)}/${pad(dayNum)}`;
  };

  const selectedDateStr = getSelectedDateString(selectedDayDay);
  const dayEvents = events.filter(e => doesEventMatchDate(e, selectedDateStr));

  const getEventsForDay = (dayNum: number) => {
    const dateStr = getSelectedDateString(dayNum);
    return events.filter(e => doesEventMatchDate(e, dateStr));
  };

  const handleStartEdit = (ev: LegalEvent) => {
    setEditingEvent(ev);
    setNewTitle(ev.title);
    setNewType(ev.type);
    setNewTime(ev.time);
    setNewAlarm(ev.alarmEnabled);
    setNewDesc(ev.description || "");
    setNewCaseId(ev.caseId || "");
    const dev = ev as any;
    setAlarm1Day(dev.alarm1Day !== false);
    setAlarm3Days(!!dev.alarm3Days);
    setAlarm1Week(!!dev.alarm1Week);
    setSmsEnabled(dev.smsEnabled !== false);
    setSmsPhone1(dev.smsPhone1 || "09144627119");
    setSmsPhone2(dev.smsPhone2 || "09901095393");
    setShowAddModal(true);
  };

  const handleOpenAddModal = () => {
    setEditingEvent(null);
    setNewTitle("");
    setNewType("جلسه دادرسی");
    setNewTime("10:00");
    setNewAlarm(true);
    setNewDesc("");
    setNewCaseId("");
    setAlarm1Day(true);
    setAlarm3Days(false);
    setAlarm1Week(false);
    setSmsEnabled(true);
    setSmsPhone1("09144627119");
    setSmsPhone2("09901095393");
    setShowAddModal(true);
  };

  const handleSubmitEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const matchedCase = casesList.find(c => c.id === newCaseId);

    if (editingEvent) {
      const updatedEvent: LegalEvent = {
        ...editingEvent,
        isArchived: false,
        caseId: newCaseId || undefined,
        caseTitle: matchedCase?.title || undefined,
        clientName: matchedCase?.clientName || undefined,
        title: newTitle,
        type: newType,
        time: newTime,
        alarmEnabled: newAlarm,
        description: newDesc,
        alarm1Day,
        alarm3Days,
        alarm1Week,
        smsEnabled,
        smsPhone1,
        smsPhone2
      } as any;
      onUpdateEvent(updatedEvent);
    } else {
      const event: LegalEvent = {
        id: "ev_" + Date.now(),
        caseId: newCaseId || undefined,
        caseTitle: matchedCase?.title || undefined,
        clientName: matchedCase?.clientName || undefined,
        title: newTitle,
        type: newType,
        jalaliDate: selectedDateStr,
        time: newTime,
        alarmEnabled: newAlarm,
        description: newDesc,
        alarm1Day,
        alarm3Days,
        alarm1Week,
        smsEnabled,
        smsPhone1,
        smsPhone2
      } as any;
      onAddEvent(event);
    }

    setShowAddModal(false);
    setEditingEvent(null);
    // Reset inputs
    setNewTitle("");
    setNewType("جلسه دادرسی");
    setNewTime("10:00");
    setNewAlarm(true);
    setNewDesc("");
    setNewCaseId("");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Shamsi Calendar Month Grid Builder (8 cols) */}
        <div className="xl:col-span-8 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          {/* Calendar Header Bar */}
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-amber-500" />
              <div>
                <h2 className="text-sm font-bold text-slate-800">تقویم رویدادها و جلسات وکالت</h2>
                <p className="text-xs text-slate-400">تنظیم آلارم دادخواست‌ها و اوقات رسیدگی با استناد به تقویم شمسی</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => {
                  import('../utils/icsHelper').then(({ downloadICSFile }) => {
                    downloadICSFile(events, 'alarms.ics');
                  });
                }}
                className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-black rounded-lg transition-colors flex items-center gap-1 cursor-pointer border border-emerald-200 shadow-sm whitespace-nowrap"
                title="دانلود تقویم (ICS) جهت درون‌ریزی در تقویم گوشی"
              >
                <Calendar className="w-3.5 h-3.5" />
                ثبت همه در تقویم
              </button>
              
              <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-white rounded-lg hover:shadow-sm text-slate-600 transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="text-xs font-bold text-slate-800 w-28 text-center select-none">
                  {JALALI_MONTH_NAMES[month - 1]} {toPersianDigits(year)}
                </div>
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 hover:bg-white rounded-lg hover:shadow-sm text-slate-600 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Weekday Titles Row */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {JALALI_WEEKDAYS.map((w, idx) => (
              <div
                key={idx}
                className={`text-[10px] py-2 font-bold rounded ${
                  idx === 6 ? "text-red-500 bg-red-50/20" : "text-slate-500"
                }`}
              >
                {w}
              </div>
            ))}
          </div>

          {/* Calendar Grid Cells */}
          <div className="grid grid-cols-7 gap-2.5">
            {gridCells.map((cell, index) => {
              if (cell.type === "empty") {
                return (
                  <div key={index} className="aspect-square bg-slate-50/30 rounded-xl border border-dotted border-slate-100"></div>
                );
              }

              const dayNum = cell.dayNumber!;
              const isSelected = selectedDayDay === dayNum;
              const isToday = current.jy === year && current.jm === month && current.jd === dayNum;
              const dayEvs = getEventsForDay(dayNum);

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDayDay(dayNum)}
                  className={`aspect-square p-2 rounded-2xl border flex flex-col justify-between items-center transition relative group cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/10"
                      : isToday
                      ? "bg-amber-50 border-amber-300 text-amber-900 ring-2 ring-amber-100"
                      : "bg-white border-slate-100 hover:border-amber-300 hover:bg-amber-50/10 text-slate-800"
                  }`}
                >
                  <span className="text-xs font-bold font-mono">{toPersianDigits(dayNum)}</span>

                  {/* Red/Green/Blue/Orange indicator bubbles for scheduled items */}
                  {dayEvs.length > 0 && (
                    <div className="flex gap-0.5 justify-center flex-wrap max-w-full">
                      {dayEvs.slice(0, 3).map((e) => (
                        <span
                          key={e.id}
                          className={`w-1.5 h-1.5 rounded-full ${
                            e.type === "جلسه دادرسی"
                              ? "bg-red-500"
                              : e.type === "ملاقات با موکل"
                              ? "bg-green-500"
                              : e.type === "پیگیری اداری"
                              ? "bg-blue-500"
                              : "bg-amber-500"
                          }`}
                          title={`${e.type}: ${e.title}`}
                        />
                      ))}
                      {dayEvs.length > 3 && <span className="text-[8px] font-bold text-slate-400">+</span>}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Guidelines info */}
          <div className="mt-4 flex gap-4 text-[10px] text-slate-400 border-t border-slate-50 pt-4 justify-center">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
              جلسه دادرسی دادگاه
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
              ملاقات با موکلین
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
              پیگیرى اداری ثناو ثبت لایحه
            </span>
          </div>
        </div>

        {/* Selected Day Agenda Workspace panel (4 cols) */}
        <div className="xl:col-span-4 bg-slate-900 text-white rounded-2xl p-6 shadow-sm self-stretch flex flex-col justify-between">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xs text-slate-400">برنامه‌های روز برگزیده</h3>
                <h2 className="text-xs font-bold text-amber-400 mt-1">
                  {toPersianDigits(selectedDateStr)}
                </h2>
              </div>
              <button
                onClick={handleOpenAddModal}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-[10px] font-bold flex items-center gap-1 transition cursor-pointer select-none"
              >
                <Plus className="w-3.5 h-3.5" />
                رویداد جدید
              </button>
            </div>

            {/* Event list */}
            <div className="space-y-3.5 max-h-[380px] overflow-y-auto">
              {dayEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-2 text-slate-500">
                  <Clock className="w-10 h-10 stroke-1" />
                  <p className="text-[11px]">رویدادی برای این روز ثبت نشده است.</p>
                </div>
              ) : (
                dayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-800/40 relative group hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-semibold ${
                          ev.type === "جلسه دادرسی"
                            ? "bg-red-500/10 text-red-400 border border-red-500/10"
                            : ev.type === "ملاقات با موکل"
                            ? "bg-green-500/10 text-green-400 border border-green-500/10"
                            : ev.type === "پیگیری اداری"
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/10"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/10"
                        }`}
                      >
                        {ev.type}
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {toPersianDigits(ev.time)}
                        </span>
                        {ev.alarmEnabled && (
                          <span className="w-4 h-4 bg-amber-400/10 text-amber-400 rounded-full flex items-center justify-center" title="آلارم صوتی فعال">
                            <Bell className="w-2.5 h-2.5 animate-pulse" />
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleStartEdit(ev)}
                          className="opacity-80 md:opacity-0 md:group-hover:opacity-100 text-amber-400 hover:text-amber-300 p-1 rounded transition duration-150 cursor-pointer"
                          title="ویرایش رویداد"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteEvent(ev.id)}
                          className="opacity-80 md:opacity-0 md:group-hover:opacity-100 text-red-400 hover:text-red-300 p-1 rounded transition duration-150 cursor-pointer"
                          title="حذف رویداد"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-white mt-2">{toPersianDigits(ev.title)}</h4>

                    {ev.caseTitle && (
                      <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-1 border-t border-slate-800 pt-1">
                        <FileText className="w-3 h-3 text-amber-500" />
                        پرونده: {ev.caseTitle} (موکل: {ev.clientName})
                      </p>
                    )}

                    {ev.description && (
                      <p className="text-[10px] text-slate-300 mt-1 leading-relaxed bg-slate-900/40 p-2 rounded border border-slate-800/20">
                        {toPersianDigits(ev.description)}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Notice & Testing */}
          <div className="border-t border-slate-800 pt-4 mt-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[10px] text-slate-400 bg-slate-950/20 p-2.5 rounded-xl border border-slate-800/50">
              <Bell className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="leading-relaxed">آلارم دادخواست‌ها و جلسات دادرسی ۲۴ ساعت قبل و در صبح روز ابلاغی به صورت صوتی طنین‌انداز می‌شود.</span>
            </div>
            
            <button
              onClick={() => setShowAlarmTestModal(true)}
              className="w-full py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer border border-slate-700 hover:border-slate-600 shadow-sm"
              title="تست در لحظه آلارم جهت اطمینان از عملکرد سیستم"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              تنظیمات و تست هشدارها
            </button>
          </div>
        </div>
      </div>

      {/* Adding Event Dialog Modal Popup Backdrop */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fadeIn backdrop-blur-sm">
          <div className="bg-white text-slate-800 rounded-2xl border border-slate-100 shadow-xl max-w-md w-full scale-100 transition p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                {editingEvent ? <Pencil className="w-5 h-5 text-amber-500" /> : <Plus className="w-5 h-5 text-amber-500" />}
                {editingEvent ? `ویرایش رویداد در تاریخ ${toPersianDigits(selectedDateStr)}` : `ثبت رویداد جدید در تاریخ ${toPersianDigits(selectedDateStr)}`}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingEvent(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitEvent} className="space-y-4 text-xs font-medium">
              <div className="space-y-1">
                <label className="text-slate-500">عنوان رویداد / ملاقات / جلسه دادرسی</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثلاً: جلسه رسیدگی شعبه ۲ خانواده خانواده باهنر"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500">دسته‌بندی موضوعی</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as EventType)}
                    className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="جلسه دادرسی">جلسه دادرسی دادگاه</option>
                    <option value="ملاقات با موکل">ملاقات با موکل</option>
                    <option value="پیگیری اداری">پیگیری اداری اداری</option>
                    <option value="سایر رویدادها">سایر رویدادها</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500">ساعت جلسه رسیدگی</label>
                  <input
                    type="text"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(formatTimeWithColon(e.target.value))}
                    placeholder="مثال: ۱۰:۳۰"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500">ارتباط با پرونده موکل در سیستم (اختیاری)</label>
                <select
                  value={newCaseId}
                  onChange={(e) => setNewCaseId(e.target.value)}
                  className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="">بدون ارتباط (رویداد عمومی دفتر)</option>
                  {casesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      پرونده: {c.title} (موکّل: {c.clientName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3 bg-amber-500/5 p-4 rounded-xl border border-amber-500/10 text-xs font-bold text-slate-705">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="alarm_form"
                    checked={newAlarm}
                    onChange={(e) => setNewAlarm(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500 cursor-pointer w-4 h-4"
                  />
                  <label htmlFor="alarm_form" className="text-[11px] font-black text-amber-900 cursor-pointer select-none">
                    فعال‌سازی سیستم هوشمند هشدار آلارم
                  </label>
                </div>

                {newAlarm && (
                  <div className="space-y-3 pt-2.5 border-t border-slate-200/50 animate-in fade-in duration-200 text-xs text-slate-700">
                    <span className="text-[10px] text-amber-800 font-extrabold block">زمان‌بندی اطلاع‌رسانی:</span>
                    <div className="flex flex-wrap gap-4 items-center">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={alarm1Day}
                          onChange={(e) => setAlarm1Day(e.target.checked)}
                          className="rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                        />
                        <span>۱ روز قبل</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={alarm3Days}
                          onChange={(e) => setAlarm3Days(e.target.checked)}
                          className="rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                        />
                        <span>۳ روز قبل</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={alarm1Week}
                          onChange={(e) => setAlarm1Week(e.target.checked)}
                          className="rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                        />
                        <span>۱ هفته قبل</span>
                      </label>
                    </div>

                    <div className="pt-2 border-t border-slate-200/50 space-y-3">
                      <label className="flex items-center gap-2 cursor-pointer text-blue-900 font-extrabold bg-blue-50 px-2 py-1 rounded">
                        <input
                          type="checkbox"
                          checked={smsEnabled}
                          onChange={(e) => setSmsEnabled(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span>ارسال همزمان پیام کوتاه (SMS)</span>
                      </label>

                      {smsEnabled && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-extrabold block">شماره همراه اول (گیرنده اصلی):</label>
                            <input
                              type="text"
                              placeholder="09144627119"
                              value={smsPhone1}
                              onChange={(e) => setSmsPhone1(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none text-xs font-mono font-black text-slate-900"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-extrabold block">شماره همراه دوم (همکار / منشی):</label>
                            <input
                              type="text"
                              placeholder="09901095393"
                              value={smsPhone2}
                              onChange={(e) => setSmsPhone2(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none text-xs font-mono font-black text-slate-900"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-slate-500">ملاحظات و لایحه ارجاعی / نشانی دادگاه</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  placeholder="مثال: لایحه استرداد جهیزیه امضا شده است. وکالتنامه الصاق شده و مدارک تکمیلی لازم است..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-slate-900 hover:bg-amber-600 text-white rounded-xl font-bold transition select-none cursor-pointer"
                >
                  {editingEvent ? "ذخیره تغییرات رویداد" : "افزودن و برنامه‌ریزی رویداد"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingEvent(null);
                  }}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition select-none cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Alarm Test & Settings Modal */}
      {showAlarmTestModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
             onClick={(e) => { if(e.target === e.currentTarget) setShowAlarmTestModal(false); }}>
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-500" />
                تست و تنظیمات هشدار
              </h2>
              <button onClick={() => setShowAlarmTestModal(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition">
                &times;
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-blue-800 text-xs leading-relaxed font-medium">
                شما می‌توانید با استفاده از گزینه‌های زیر اطمینان حاصل کنید که دستگاه شما اجازه پخش صدا و نمایش اعلان‌ها را می‌دهد. در صورتی که اعلان کار نکرد، مجوزهای مرورگر خود را بررسی کنید.
              </div>

              <button
                onClick={() => {
                  import('../utils/alarmService').then(({ AlarmService }) => {
                    AlarmService.playBadSabaAlarm();
                  });
                }}
                className="w-full flex items-center justify-between bg-white border border-slate-200 hover:border-amber-400 p-3 rounded-xl transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-800">تست هشدار صوتی</div>
                    <div className="text-[10px] text-slate-500">پخش صدای هشدار</div>
                  </div>
                </div>
                <div className="px-3 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold">آزمایش</div>
              </button>

              <button
                onClick={() => {
                  import('../utils/alarmService').then(({ AlarmService }) => {
                    AlarmService.requestPermission().then((granted) => {
                      if(granted) {
                        AlarmService.showNotification(
                          "تست اعلان سیستم",
                          "این یک پیام تستی از سامانه مدیریت وکالت است."
                        );
                      } else {
                        alert("مجوز نمایش اعلان در مرورگر شما مسدود شده است. لطفا از تنظیمات مرورگر آن را فعال کنید.");
                      }
                    });
                  });
                }}
                className="w-full flex items-center justify-between bg-white border border-slate-200 hover:border-blue-400 p-3 rounded-xl transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-800">تست اعلان (Notification)</div>
                    <div className="text-[10px] text-slate-500">نمایش یک پیام روی صفحه</div>
                  </div>
                </div>
                <div className="px-3 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold">آزمایش</div>
              </button>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <button 
                onClick={() => setShowAlarmTestModal(false)}
                className="w-full py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                بستن پنجره
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
