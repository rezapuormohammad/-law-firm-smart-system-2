import { Client, LegalCase, CaseNote, CaseDocument, LegalEvent } from "../types";

// Seed realistic Farsi Legal Data for immediate premium layout
const INITIAL_CLIENTS: Client[] = [
  {
    id: "cl_1",
    name: "زهرا حسینی",
    nationalId: "۰۰۸۷۶۵۴۳۲۱",
    phoneNumber: "۰۹۱۹۸۷۶۵۴۳۲",
    fatherName: "علی",
    address: "تهران، یوسف آباد، خیابان بیست و سوم، پلاک ۱۲، واحد ۴",
    description: "خواهان پرونده مطالبه مهریه و استرداد جهیزیه",
    createdAt: "۱۴۰۳/۱۰/۱۵"
  },
  {
    id: "cl_2",
    name: "مرتضی کریمی",
    nationalId: "۰۰۱۲۳۴۵۶۷۸",
    phoneNumber: "۰۹۱۲۳۴۵۶۷۸۹",
    fatherName: "حسن",
    address: "کرج، عظیمیه، میدان طالقانی، مجتمع البرز، طبقه ۵",
    description: "خوانده پرونده مطالبه وجه سفته به مبلغ ۲ میلیارد ریال",
    createdAt: "۱۴۰۴/۰۲/۲۰"
  },
  {
    id: "cl_3",
    name: "مریم دانا",
    nationalId: "۲۲۹۰۵۴۳۲۱۱",
    phoneNumber: "۰۹۳۵۱۲۳۴۵۶۷",
    fatherName: "رضا",
    address: "تهران، پاسداران، بوستان پنجم، پلاک ۷۸",
    description: "مالک ملک مسکونی تجاری - پرونده الزام به تنظیم سند رسمی",
    createdAt: "۱۴۰۴/۰۳/۰۱"
  }
];

const INITIAL_CASES: LegalCase[] = [
  {
    id: "ca_1",
    clientId: "cl_1",
    clientName: "زهرا حسینی",
    caseNumber: "۱۴۰۳۹۸۷۶۵۴۳۲۱۰۰۱",
    archiveNumber: "ب/۴۰۳/۱۱",
    title: "مطالبه مهریه به نرخ روز و تامین خواسته",
    stage: "بدوی",
    branch: "شعبه ۲۴۴ دادگاه خانواده تهران (مجتمع باهنر)",
    status: "جریان دارد",
    clientRole: "خواهان",
    opposingPartyName: "علی رضایی (زوج)",
    description: "دادخواست توقیف اموال زوج بابت مهریه مشتمل بر ۱۱۰ سکه تمام بهار آزادی انجام شده و در مرحله کارشناسی پلاک ثبتی است.",
    receivedFee: 45000000,
    paidExpenses: 12000000,
    createdAt: "۱۴۰۳/۱۰/۱۶"
  },
  {
    id: "ca_2",
    clientId: "cl_2",
    clientName: "مرتضی کریمی",
    caseNumber: "۱۴۰۴۹۱۲۳۴۵۶۷۸۰۰۲",
    archiveNumber: "ک/۴۰۴/۴۵",
    title: "مطالبه وجه سفته واخواست شده",
    stage: "تجدیدنظر",
    branch: "شعبه ۱۵ دادگاه تجدیدنظر استان البرز",
    status: "تجدیدنظر خواهی",
    clientRole: "خوانده",
    opposingPartyName: "رضا احمدی (خواهان)",
    description: "حکم بدوی مبنی بر محکومیت موکل صادر شده بود. لایحه اعتراض تسلیم و پرونده با ایرادات حقوقی به مرحله تجدیدنظر ارسال شده است.",
    receivedFee: 25000050,
    paidExpenses: 4500000,
    createdAt: "۱۴۰۴/۰۲/۲۱"
  },
  {
    id: "ca_3",
    clientId: "cl_3",
    clientName: "مریم دانا",
    caseNumber: "۱۴۰۴۳۱۲۳۴۵۶۷۸۹۹۹",
    archiveNumber: "ح/۴۰۴/۷۸",
    title: "الزام به تنظیم سند رسمی و فک رهن ملکی",
    stage: "بدوی",
    branch: "شعبه ۳۲ دادگاه عمومی حقوقی تهران (مجتمع صدر)",
    status: "جریان دارد",
    clientRole: "خواهان",
    opposingPartyName: "شرکت ساختمانی نگین",
    description: "جلسه دادرسی برای استعلام ثبتی و احراز مالکیت اولیه تشکیل می‌شود. مدارک انتقال قرارداد پیش‌فروش ضمیمه پرونده است.",
    receivedFee: 85000200,
    paidExpenses: 19500000,
    createdAt: "۱۴۰۴/۰۳/۰۲"
  }
];

const INITIAL_NOTES: CaseNote[] = [
  {
    id: "no_1",
    caseId: "ca_1",
    title: "اظهارنامه توقیف حساب بانکی زوج",
    content: "تحقیقات محلی نشان داد زوج یک دستگاه آپارتمان در غرب تهران دارد که برای جلوگیری از فرار از دین باید بلافاصله تقاضای توقیف فوری (تأمین خواسته) داده شود. لایحه مربوطه به دادستان ارسال شد.",
    createdAt: "۱۴۰۴/۰۲/۰۵"
  },
  {
    id: "no_2",
    caseId: "ca_1",
    title: "ملاقات با شهود زوجه",
    content: "امروز شهود در دفتر حاضر شدند. دو نفر تایید کردند زوج تمکن مالی خرید خانه را داشته ولی عمداً اموال را به نام مادرش منتقل کرده است. استناد به ماده ۲۱ قانون نحوه اجرای محکومیت‌های مالی الزامی است.",
    createdAt: "۱۴۰۴/۰۲/۱۸"
  },
  {
    id: "no_3",
    caseId: "ca_2",
    title: "تحلیل امضای پشت سفته",
    content: "اصالت امضای ضامن در سفته مورد اختلاف است. تقاضای ارجاع به کارشناسی خط و امضا در لایحه تجدیدنظرخواهی گنجانده شده و باید نمونه امضاهای قدیمی موکل ارائه شود.",
    createdAt: "۱404/02/25"
  }
];

const INITIAL_DOCUMENTS: CaseDocument[] = [
  {
    id: "do_1",
    caseId: "ca_1",
    name: "سند_ازدواج_رسمی.pdf",
    type: "pdf",
    size: "۲.۴ مگابایت",
    uploadedAt: "۱۴۰۳/۱۰/۱۶"
  },
  {
    id: "do_2",
    caseId: "ca_1",
    name: "استعلام_ثبتی_ملک_توقیفی.jpg",
    type: "image",
    size: "۸۵۰ کیلوبایت",
    uploadedAt: "۱۴۰۴/۰۱/۱۲"
  }
];

const INITIAL_EVENTS: LegalEvent[] = [
  {
    id: "ev_today_1",
    caseId: "ca_1",
    caseTitle: "مطالبه مهریه زهرا حسینی",
    clientName: "زهرا حسینی",
    title: "جلسه دادرسی و دفاع در برابر ادعای اعسار زوج",
    type: "جلسه دادرسی",
    jalaliDate: "۱۴۰۵/۰۳/۲۴",
    time: "۰۹:۳۰",
    alarmEnabled: true,
    description: "حضور زوجه الزامی است. لایحه مستند به حساب‌های بانکی مخفی زوج ارائه شود. مجتمع باهنر شعبه ۲۴۴"
  },
  {
    id: "ev_today_2",
    caseId: "ca_2",
    caseTitle: "مطالبه وجه سفته مرتضی کریمی",
    clientName: "مرتضی کریمی",
    title: "ملاقات حضوری جهت تنظیم لایحه تجدیدنظرخواهی",
    type: "ملاقات با موکل",
    jalaliDate: "۱۴۰۵/۰۳/۲۴",
    time: "۱۶:۰۰",
    alarmEnabled: false,
    description: "موکل باید اسناد سجلی قدیمی به همراه دسته چک‌های ده سال گذشته را جهت مطابقت امضا بیاورد."
  },
  {
    id: "ev_1",
    caseId: "ca_1",
    caseTitle: "مطالبه مهریه زهرا حسینی",
    clientName: "زهرا حسینی",
    title: "جلسه دادرسی و ارزیابی ملکی آپارتمان زوج",
    type: "جلسه دادرسی",
    jalaliDate: "۱۴۰۵/۰۳/۲۸",
    time: "۱۰:۳۰",
    alarmEnabled: true,
    description: "حضور زوجه الزامی است. مدارک مستندات بانکی و مدارک ثبتی همره باشد. شعبه خانواده مجتمع باهنر"
  },
  {
    id: "ev_2",
    caseId: "ca_2",
    caseTitle: "مطالبه وجه سفته مرتضی کریمی",
    clientName: "مرتضی کریمی",
    title: "جلسه تحویل نمونه امضا به کارشناس خط",
    type: "جلسه دادرسی",
    jalaliDate: "۱۴۰۵/۰۴/۰۵",
    time: "۰۹:۰۰",
    alarmEnabled: true,
    description: "موکل باید اسناد سجلی قدیمی به همراه دسته چک‌های ده سال گذشته را جهت مطابقت امضا بیاورد."
  },
  {
    id: "ev_3",
    caseId: "ca_3",
    caseTitle: "تنظیم سند مریم دانا",
    clientName: "مریم دانا",
    title: "ملاقات حضوری در دفتر جهت بررسی تسویه حساب ثمن",
    type: "ملاقات با موکل",
    jalaliDate: "۱۴۰۵/۰۳/۲۵",
    time: "۱۷:۳۰",
    alarmEnabled: false,
    description: "بررسی فیش‌های واریزی موکل به حساب سازنده و برنامه‌ریزی لایحه فرعی الزام به تنظیم."
  }
];

/**
 * Storage Loaders
 */
export function loadAllData() {
  const clients = localStorage.getItem("r_clients");
  const cases = localStorage.getItem("r_cases");
  const notes = localStorage.getItem("r_notes");
  const documents = localStorage.getItem("r_documents");
  const events = localStorage.getItem("r_events");

  if (!clients) {
    // Write defaults
    localStorage.setItem("r_clients", JSON.stringify(INITIAL_CLIENTS));
    localStorage.setItem("r_cases", JSON.stringify(INITIAL_CASES));
    localStorage.setItem("r_notes", JSON.stringify(INITIAL_NOTES));
    localStorage.setItem("r_documents", JSON.stringify(INITIAL_DOCUMENTS));
    localStorage.setItem("r_events", JSON.stringify(INITIAL_EVENTS));

    return {
      clients: INITIAL_CLIENTS,
      cases: INITIAL_CASES,
      notes: INITIAL_NOTES,
      documents: INITIAL_DOCUMENTS,
      events: INITIAL_EVENTS,
    };
  }

  return {
    clients: JSON.parse(clients),
    cases: JSON.parse(cases || "[]"),
    notes: JSON.parse(notes || "[]"),
    documents: JSON.parse(documents || "[]"),
    events: JSON.parse(events || "[]"),
  };
}

/**
 * Storage Savers
 */
export function saveData(key: string, data: any) {
  localStorage.setItem(key, JSON.stringify(data));
}
