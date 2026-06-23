/**
 * Types and interfaces for Reza Pourmohammad Legal Suite
 */

export interface Client {
  id: string;
  name: string;             // نام و نام خانوادگی موکل
  nationalId: string;       // کد ملی
  phoneNumber: string;      // شماره تماس
  fatherName: string;       // نام پدر
  birthDate?: string;       // تاریخ تولد
  address: string;          // نشانی محل اقامت یا پستی
  description?: string;     // توضیحات پرونده موشکلی یا شخصی
  createdAt: string;        // تاریخ ایجاد
}

export type CaseStage = "بدوی" | "تجدیدنظر" | "دیوان عالی" | "دیوان عدالت اداری" | "شورا" | "دادگاه صلح" | "اجرای احکام کیفری" | "اجرای احکام مدنی" | "سایر";
export type CaseStatus = "جریان دارد" | "مختومه" | "در انتظار رای" | "تجدیدنظر خواهی";

export type ClientPartyRole = "خواهان" | "خوانده" | "شاکی" | "متشاکی" | "متهم";

export interface LegalCase {
  id: string;
  clientId: string;         // شناسه موکل مرتبط
  clientName: string;       // نام موکل (سریع‌تر کردن کوئری‌ها)
  clientRole: ClientPartyRole; // نقش موکل در پرونده
  opposingPartyName: string; // نام طرف یا طرف‌های مقابل (جدا شده با کاما)
  caseNumber: string;       // شماره پرونده عدل ایران
  courtCaseNumber?: string; // شماره پرونده دادگاه بدوی (در صورت وجود)
  archiveNumber?: string;   // شماره کلاسه بایگانی دفتر
  title: string;            // موضوع دعوی (خواسته / اتهام) 
  stage: CaseStage;         // مرحله پرونده
  branch: string;           // شعبه رسیدگی کننده (مثلاً شعبه ۱۰۱ دادگاه عمومی حقوقی)
  status: CaseStatus;       // وضعیت جاری پرونده
  description: string;      // خلاصه وضعیت نهایی پرونده
  appealCaseNumber?: string;    // شماره پرونده تجدید نظر
  rejectionCaseNumber?: string; // شماره پرونده واخواهی
  supremeCaseNumber?: string;   // شماره پرونده فرجام خواهی
  executionCaseNumber?: string; // شماره پرونده اجرای احکام کیفری / عمومی
  executionCivilCaseNumber?: string; // شماره پرونده اجرای احکام مدنی
  insolvencyCaseNumber?: string; // شماره پرونده اعسار
  investigationCaseNumber?: string; // شماره پرونده بازپرسی
  prosecutionCaseNumber?: string; // شماره پرونده دادیاری
  filingDate?: string;      // تاریخ تشکیل پرونده (شمسی)
  receivedFee?: number;     // مبلغ حق‌الوکاله دریافتی (تومان)
  paidExpenses?: number;    // هزینه‌های دادرسی و پرداختی پرونده (تومان)
  totalContractAmount?: number; // کل مبلغ قرارداد (تومان)
  downPayment?: number;     // مبلغ پیش پرداخت (تومان)
  sanaPassword?: string;    // رمز شخصی ثنای موکل
  installments?: { 
    id?: string;
    amount: number; 
    dueDate: string; 
    isPaid?: boolean; 
    paidDate?: string; 
  }[]; // اقساط
  payments?: {
    id: string;
    title: string; // e.g., "حق الوکاله", "هدیه", "هزینه دادرسی"
    amount: number; // تومان
    type: string; // "نقدی", "کارت به کارت", "چک"
    date: string; // تاریخ پرداخت
    cardNumber?: string; // شماره کارت / شبا
  }[]; // پرداختی‌های مختلف موکل
  associatedPersons?: { name: string; phone: string }[]; // افراد مرتبط
  createdAt: string;        // تاریخ ثبت در سیستم
}

export interface CaseNote {
  id: string;
  caseId: string;           // شناسه پرونده مرتبط
  title: string;            // عنوان یادداشت
  content: string;          // متن اصلی یادداشت پرونده
  createdAt: string;        // تاریخ ثبت یادداشت
}

export interface CaseDocument {
  id: string;
  caseId: string;           // شناسه پرونده مرتبط
  name: string;             // نام فایل سِند
  type: "pdf" | "image" | "doc" | "audio" | "other"; // نوع سند ارسالی
  size: string;             // حجم فایل
  dataUrl?: string;         // داده به صورت base64 یا شبیه‌سازی
  uploadedAt: string;       // تاریخ الحاق سند
}

export type EventType = "جلسه دادرسی" | "ملاقات با موکل" | "پیگیری اداری" | "سایر رویدادها" | "یادآوری غیر قضایی";

export interface LegalEvent {
  id: string;
  caseId?: string;          // شناسه پرونده مرتبط (اختیاری)
  caseTitle?: string;       // خواهان پرونده یا موضوع پرونده (اختیاری)
  clientName?: string;      // نام موکل مرتبط (اختیاری)
  title: string;            // عنوان جلسه یا موضوع ملاقات
  type: EventType;          // نوع رویداد
  jalaliDate: string;       // تاریخ شمسی رویداد (قالب: YYYY/MM/DD)
  time: string;             // ساعت رویداد (قالب: HH:MM)
  alarmEnabled: boolean;    // قابلیت زنگ هشدار/آلارم جلسه دادرسی
  description: string;      // یادداشت یا آدرس یا هدف ملاقات
  isArchived?: boolean;     // آیا این رویداد منقضی و بایگانی شده است؟
  alarm1Hour?: boolean;
  alarm1Day?: boolean;
  alarm3Days?: boolean;
  alarm1Week?: boolean;
  repeatSelected?: string;
  endRepeatOption?: string;
  endRepeatDate?: string;
  documentId?: string;       // شناسه مدرک پیوستی (اختیاری)
  documentName?: string;     // نام مدرک پیوستی (اختیاری)
  documentSize?: string;     // حجم مدرک پیوستی (اختیاری)
  documentDataUrl?: string;  // محتوای مدرک (اختیاری)
}
