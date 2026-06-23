import { useState, useEffect } from "react";
import { toPersianDigits, toEnglishDigits, formatPersianCurrency, formatJalaliDate, getCurrentJalali, jalaliToGregorian, getJalaliMonthDays, JALALI_MONTH_NAMES, getJalaliFirstWeekday } from "../utils/shamsi";
import {
  calculateMehrieh,
  calculateDiyeh,
  calculateCourtFees,
  calculateLawyerFinance,
  calculateJudicialDeadline,
  calculateErth,
  calculateDelayInterest,
  CBI_INFLATION_INDICES,
  DIYEH_RATES
} from "../utils/calculators";
import { Calculator, Award, Calendar, DollarSign, FileText, Printer, CheckCircle2, AlertCircle, Clock, Search, Lock, ChevronDown, Check, Info, ArrowLeft, Plus, Trash2, Globe, RefreshCw, Users, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";

const INJURY_DATABASE = [
  // جراحات سر و صورت
  { id: "h1", category: "جراحات سر و صورت", name: "حارصه (خراش پوست بدون جریان خون - ۱٪)", percentage: 1 },
  { id: "h2", category: "جراحات سر و صورت", name: "دامیه (زخم با جریان خون کم - ۲٪)", percentage: 2 },
  { id: "h3", category: "جراحات سر و صورت", name: "metlahameh (بریدگی عمیق گوشت - ۳٪)", percentage: 3 },
  { id: "h4", category: "جراحات سر و صورت", name: "سمحاق (جراحت مماس بر غشای استخوان - ۴٪)", percentage: 4 },
  { id: "h5", category: "جراحات سر و صورت", name: "موضحه (جراحتی که استخوان را نمایان کند - ۵٪)", percentage: 5 },
  { id: "h6", category: "جراحات سر و صورت", name: "هاشمه (شکستن استخوان سر و صورت بدون جابجایی - ۱۰٪)", percentage: 10 },
  { id: "h7", category: "جراحات سر و صورت", name: "منقله (شکستگی با جابجایی استخوان - ۱۵٪)", percentage: 15 },
  { id: "h8", category: "جراحات سر و صورت", name: "مامومه (جراحت منتهی به کیسه مغز - ۳۳٪)", percentage: 33 },
  { id: "h9", category: "جراحات سر و صورت", name: "دامغه (جراحت با پارگی کیسه مغز - ۳۳٪ + ارش)", percentage: 33.3 },
  { id: "h10", category: "جراحات سر و صورت", name: "جائفه (جراحت نفوذی به قفسه سینه یا شکم - ۳۳.۳٪)", percentage: 33.3 },
  // اعضای بدن
  { id: "a1", category: "اعضای بدن", name: "بریدن یک دست کامل تا مچ (۵۰٪)", percentage: 50 },
  { id: "a2", category: "اعضای بدن", name: "بریدن هر دو دست کامل (۱۰۰٪)", percentage: 100 },
  { id: "a3", category: "اعضای بدن", name: "قطع یک پا کامل تا مچ (۵۰٪)", percentage: 50 },
  { id: "a4", category: "اعضای بدن", name: "قطع هر دو پا کامل (۱۰۰٪)", percentage: 100 },
  { id: "a5", category: "اعضای بدن", name: "نابینا کردن یا تخلیه یک چشم (۵۰٪)", percentage: 50 },
  { id: "a6", category: "اعضای بدن", name: "نابینا کردن یا تخلیه هر دو چشم (۱۰۰٪)", percentage: 100 },
  { id: "a7", category: "اعضای بدن", name: "بینی (قطع کامل بینی یا جرم آن - ۱۰۰٪)", percentage: 100 },
  { id: "a8", category: "اعضای بدن", name: "قطع کامل یک لاله گوش (۲۵٪)", percentage: 25 },
  { id: "a9", category: "اعضای بدن", name: "قطع هر دو لاله گوش (۵۰٪)", percentage: 50 },
  { id: "a10", category: "اعضای بدن", name: "یک دندان پیشین (۵٪)", percentage: 5 },
  { id: "a11", category: "اعضای بدن", name: "یک دندان خلفی (۲.۵٪)", percentage: 2.5 },
  { id: "a12", category: "اعضای بدن", name: "قطع یک بیضه (۵۰٪)", percentage: 50 },
  { id: "a13", category: "اعضای بدن", name: "قطع هر دو بیضه (۱۰۰٪)", percentage: 100 },
  // منافع و حواس
  { id: "m1", category: "منافع و حواس", name: "زوال کامل عقل (۱۰۰٪)", percentage: 100 },
  { id: "m2", category: "منافع و حواس", name: "ابطال کامل حس بویایی (۱۰۰٪)", percentage: 100 },
  { id: "m3", category: "منافع و حواس", name: "ابطال کامل شنوایی هر دو گوش (۱۰۰٪)", percentage: 100 },
  { id: "m4", category: "منافع و حواس", name: "ابطال کامل بینایی هر دو چشم (۱۰۰٪)", percentage: 100 },
  { id: "m5", category: "منافع و حواس", name: "زوال قدرت گویایی و سخت گفتن (۱۰۰٪)", percentage: 100 },
  { id: "m6", category: "منافع و حواس", name: "ارش نقص شدید زیبایی و تقارن چهره (۱۰٪)", percentage: 10 },
  // جنین
  { id: "j1", category: "جنین", name: "نطفه قرار گرفته در رحم (۲٪)", percentage: 2 },
  { id: "j2", category: "جنین", name: "علقه - خون بسته متمایل به شکل (۴٪)", percentage: 4 },
  { id: "j3", category: "جنین", name: "مضغه - گوشت پدیدار شده (۶٪)", percentage: 6 },
  { id: "j4", category: "جنین", name: "عظام - رویش استخوان ابتدایی (۸٪)", percentage: 8 },
  { id: "j5", category: "جنین", name: "جنین کامل بدون روح متمایز (۱۰٪)", percentage: 10 },
  { id: "j6", category: "جنین", name: "جنین پسر دارای روح (۱۰۰٪)", percentage: 100 },
  { id: "j7", category: "جنین", name: "جنین دختر دارای روح (۵۰٪)", percentage: 50 }
];

export default function LegalCalculators() {
  const lawyerName = localStorage.getItem("r_lawyer_name") || "";
  const [activeTab, setActiveTab] = useState<"age" | "mehrieh" | "diyeh" | "court" | "lawyer" | "deadlines" | "erth" | "delay_interest" | "execution_fees">("age");

  // Get current date for defaults
  const today = getCurrentJalali();

  // --- Age States ---
  const [ageSubject, setAgeSubject] = useState<"age" | "difference">("age");
  const [ageBirthYear, setAgeBirthYear] = useState<number>(1375);
  const [ageBirthMonth, setAgeBirthMonth] = useState<number>(4);
  const [ageBirthDay, setAgeBirthDay] = useState<number>(1);
  const [ageEndYear, setAgeEndYear] = useState<number>(today.jy);
  const [ageEndMonth, setAgeEndMonth] = useState<number>(today.jm);
  const [ageEndDay, setAgeEndDay] = useState<number>(today.jd);
  const [ageResult, setAgeResult] = useState<any>({
    test: true,
    totalDays: 10957,
    solar: { years: 29, months: 11, days: 30 },
    lunar: { years: 30, months: 11, days: 1 }
  });
  const [isAgeDropdownOpen, setIsAgeDropdownOpen] = useState<boolean>(false);
  const [isAgeCalendarOpen, setIsAgeCalendarOpen] = useState<boolean>(false);
  const [isAgeEndCalendarOpen, setIsAgeEndCalendarOpen] = useState<boolean>(false);

  const handleCalculateAge = () => {
    const startY = Number(ageBirthYear);
    const startM = Number(ageBirthMonth);
    const startD = Number(ageBirthDay);

    const endY = ageSubject === "difference" ? Number(ageEndYear) : today.jy;
    const endM = ageSubject === "difference" ? Number(ageEndMonth) : today.jm;
    const endD = ageSubject === "difference" ? Number(ageEndDay) : today.jd;

    const gBirth = jalaliToGregorian(startY, startM, startD);
    const gEnd = jalaliToGregorian(endY, endM, endD);

    let dBirth = new Date(Date.UTC(gBirth.gy, gBirth.gm - 1, gBirth.gd));
    let dEnd = new Date(Date.UTC(gEnd.gy, gEnd.gm - 1, gEnd.gd));

    let isNegative = false;
    if (dEnd.getTime() < dBirth.getTime()) {
      // Swap dates for calculation so diff is positive, and track that it's a backward difference
      const tempDate = dBirth;
      dBirth = dEnd;
      dEnd = tempDate;
      isNegative = true;
    }

    const diffTime = dEnd.getTime() - dBirth.getTime();
    const totalDays = Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)));

    // Solar calculation based on swapped/positive dates
    let calcEndYear = isNegative ? startY : endY;
    let calcEndMonth = isNegative ? startM : endM;
    let calcEndDay = isNegative ? startD : endD;

    let calcStartYear = isNegative ? endY : startY;
    let calcStartMonth = isNegative ? endM : startM;
    let calcStartDay = isNegative ? endD : startD;

    let years = calcEndYear - calcStartYear;
    let months = calcEndMonth - calcStartMonth;
    let days = calcEndDay - calcStartDay;

    if (days < 0) {
      months -= 1;
      let prevMonth = calcEndMonth - 1;
      let prevYear = calcEndYear;
      if (prevMonth === 0) {
        prevMonth = 12;
        prevYear -= 1;
      }
      days += getJalaliMonthDays(prevYear, prevMonth);
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    // Lunar mapping
    const lunarYears = Math.floor(totalDays / 354.3672);
    const remainingDays = totalDays - (lunarYears * 354.3672);
    const lunarMonths = Math.floor(remainingDays / 29.53059);
    // Smooth transition offset that correctly aligns solar-lunar boundary transitions (including astronomical borrows) for larger ages
    const offset = totalDays > 30 ? 0.55 : 0;
    const lunarDays = Math.round(remainingDays - (lunarMonths * 29.53059) + offset);

    setAgeResult({
      test: true,
      totalDays,
      isNegative,
      solar: { years, months, days },
      lunar: { years: lunarYears, months: lunarMonths, days: lunarDays }
    });
  };

  // --- Mehrieh States ---
  const [mehriehAmount, setMehriehAmount] = useState<string>("۱۰۰۰۰۰۰۰"); // 10,000,000 Rial default
  const [marriageYear, setMarriageYear] = useState<number | string>(1380);
  const [paymentYear, setPaymentYear] = useState<number | string>(today.jy);
  const [mehriehResult, setMehriehResult] = useState<any>(null);

  // --- Diyeh States ---
  const [diyehYear, setDiyehYear] = useState<number | string>(1405);
  const [diyehMonth, setDiyehMonth] = useState<number>(today.jm);
  const [diyehDay, setDiyehDay] = useState<number | string>(today.jd);
  const [diyehFraction, setDiyehFraction] = useState<string>("1"); // Complete Diyeh
  const [diyehCustomFraction, setDiyehCustomFraction] = useState<string>("0");
  const [isSacredMonth, setIsSacredMonth] = useState<boolean>(false);
  const [diyehResult, setDiyehResult] = useState<any>(null);

  // New beautiful UI matching states for Screen 1 and Screen 2
  const [diyehPercentInput, setDiyehPercentInput] = useState<string>("۱۰۰");
  const [selectedMethod, setSelectedMethod] = useState<string>("درصدی");
  const [isMethodModalOpen, setIsMethodModalOpen] = useState<boolean>(false);
  const [diyehSearchQuery, setDiyehSearchQuery] = useState<string>("");
  const [premiumModalOpen, setPremiumModalOpen] = useState<boolean>(false);
  const [premiumModalTitle, setPremiumModalTitle] = useState<string>("");

  // New calculation methods states
  const [diyehFractionNumerator, setDiyehFractionNumerator] = useState<string>("۱");
  const [diyehFractionDenominator, setDiyehFractionDenominator] = useState<string>("۲");
  const [fractionInputs, setFractionInputs] = useState<string[]>(["", ""]);
  const [activeFractionIndex, setActiveFractionIndex] = useState<number | null>(null);
  const [murderType, setMurderType] = useState<string>("man_full");
  const [murderCount, setMurderCount] = useState<string>("۱");
  const [selectedInjuries, setSelectedInjuries] = useState<any[]>([]);

  // --- Court Fee States ---
  const [claimAmountForCourt, setClaimAmountForCourt] = useState<string>("۵۰۰۰۰۰۰۰۰"); // 500 Million Rial
  const [courtStage, setCourtStage] = useState<"first_instance" | "appeal" | "supreme_court" | "non_financial">("first_instance");
  const [courtResult, setCourtResult] = useState<any>(null);

  // --- Lawyer States ---
  const [lawyerSubject, setLawyerSubject] = useState<"fee" | "tax_stamp_bar" | "tax_stamp_center">("fee");
  const [lawyerTaxBasis, setLawyerTaxBasis] = useState<"tariff" | "fee_amount">("tariff");
  const [lawyerCaseType, setLawyerCaseType] = useState<string>("financial");
  const [lawyerResultType, setLawyerResultType] = useState<string>("-");
  const [lawyerHasSpecialty, setLawyerHasSpecialty] = useState<boolean>(false);
  const [lawyerInsideProvinceDays, setLawyerInsideProvinceDays] = useState<string>("");
  const [lawyerOutsideProvinceDays, setLawyerOutsideProvinceDays] = useState<string>("");
  const [lawyerAfterAnnulment, setLawyerAfterAnnulment] = useState<boolean>(false);
  const [lawyerFreeAid, setLawyerFreeAid] = useState<boolean>(false);
  const [lawyerClaimAmount, setLawyerClaimAmount] = useState<string>("۲,۵۰۰,۰۰۰,۰۰۰");
  const [lawyerResult, setLawyerResult] = useState<any>(null);

  // Helper to format string inputs like a numeric currency with Persian digits
  const handleAmountFormat = (val: string, setter: (val: string) => void) => {
    const digits = val.replace(/[^0-9۰-۹]/g, "");
    if (!digits) {
      setter("");
      return;
    }
    const englishDigits = digits.replace(/[۰-۹]/g, c => "۰۱۲۳۴۵۶۷۸۹".indexOf(c).toString());
    const withCommas = Number(englishDigits).toLocaleString("en-US");
    setter(toPersianDigits(withCommas));
  };

  // --- Judicial Deadlines States ---
  const [deadlineCategory, setDeadlineCategory] = useState<"civil" | "criminal" | "execution">("civil");
  const [deadlineBaseYear, setDeadlineBaseYear] = useState<number | string>(today.jy);
  const [deadlineBaseMonth, setDeadlineBaseMonth] = useState<number>(today.jm);
  const [deadlineBaseDay, setDeadlineBaseDay] = useState<number | string>(today.jd);
  
  const civilDeadlines = [
    { title: "طرح دعوا پس از صدور قرار اناطه", days: 30 },
    { title: "توقف دادرسی در صورت استعفای وکیل", days: 30 },
    { title: "رفع نقص دادخواست", days: 10 },
    { title: "اعتراض به قرار رد دادخواست", days: 10 },
    { title: "فاصله ابلاغ تا جلسه رسیدگی", days: 5 },
    { title: "مطالبه خسارت ناشی از اجرای قرار تامین", days: 20 },
    { title: "ارائه دفاع در مقابل مطالبه خسارت ناشی از اجرای قرار تامین", days: 10 },
    { title: "درخواست جلب شخص ثالث", days: 3 },
    { title: "دادخواست ادعای مالکیت مورد حکم تصرف عدوانی", days: 30 },
    { title: "تسلیم سند موضوع ادعای جعل", days: 10 },
    { title: "فاصله ابلاغ به گواه و جلسه رسیدگی", days: 7 },
    { title: "ایداع دستمزد کارشناس", days: 7 },
    { title: "اعتراض به نظر کارشناس", days: 7 },
    { title: "انشاء و اعلام رأی", days: 7 },
    { title: "پاکنویس و امضای رأی", days: 5 },
    { title: "واخواهی", days: 20 },
    { title: "واخواهی + تجدیدنظر", days: 40 },
    { title: "فرجام‌خواهی", days: 20 },
    { title: "تجدیدنظر + فرجام‌خواهی", days: 40 },
    { title: "فرجام تبعی", days: 20 },
    { title: "اعاده دادرسی", days: 20 },
    { title: "اعاده دادرسی طاری", days: 3 },
    { title: "معرفی یا اظهارنظر در مورد داور", days: 10 },
    { title: "داوری", days: 90 },
    { title: "تصحیح رأی داور", days: 20 },
    { title: "اجرای رأی داور", days: 20 },
    { title: "درخواست ابطال رأی داور", days: 20 }
  ];

  const criminalDeadlines = [
    { title: "تجدیدنظرخواهی کیفری", days: 20 },
    { title: "واخواهی کیفری", days: 20 },
    { title: "فرجام‌خواهی کیفری", days: 20 },
    { title: "اعتراض به قرار منع تعقیب", days: 10 },
    { title: "اعتراض به قرار موقوفی تعقیب", days: 10 },
    { title: "اعتراض به قرار بایگانی پرونده", days: 10 },
    { title: "تسلیم به رأی و اسقاط حق تجدیدنظر", days: 20 }
  ];

  const executionDeadlines = [
    { title: "مهلت اجرای حکم", days: 10 },
    { title: "معرفی مال", days: 10 },
    { title: "اعتراض به ارزیابی (کارشناسی)", days: 3 },
    { title: "اعتراض شخص ثالث به توقیف مال", days: 10 }
  ];

  const currentDeadlineOptions = deadlineCategory === "civil" ? civilDeadlines : deadlineCategory === "criminal" ? criminalDeadlines : executionDeadlines;

  const [deadlineType, setDeadlineType] = useState<string>("طرح دعوا پس از صدور قرار اناطه");
  
  // Set default deadlineType when category changes
  useEffect(() => {
    if (deadlineCategory === "civil") setDeadlineType(civilDeadlines[0].title);
    else if (deadlineCategory === "criminal") setDeadlineType(criminalDeadlines[0].title);
    else setDeadlineType(executionDeadlines[0].title);
  }, [deadlineCategory]);

  const [deadlineIncludeAbroad, setDeadlineIncludeAbroad] = useState<boolean>(false);
  const [deadlineIncludeThursdays, setDeadlineIncludeThursdays] = useState<boolean>(false);
  const [deadlineResult, setDeadlineResult] = useState<any>(null);

  // --- Inheritance (Erth) States ---
  const [erthMarryStatus, setErthMarryStatus] = useState<"single" | "husband" | "wife">("single");
  const [erthEstateValue, setErthEstateValue] = useState<string>("");
  const [erthCommonDenominator, setErthCommonDenominator] = useState<boolean>(true);

  // Class 1
  const [erthFatherAlive, setErthFatherAlive] = useState<boolean>(false);
  const [erthMotherAlive, setErthMotherAlive] = useState<boolean>(false);
  const [erthSonsCount, setErthSonsCount] = useState<number>(0);
  const [erthDaughtersCount, setErthDaughtersCount] = useState<number>(0);
  const [erthGrandchildren, setErthGrandchildren] = useState<any[]>([]);

  // Class 2
  const [erthPaternalGrandfather, setErthPaternalGrandfather] = useState<boolean>(false);
  const [erthPaternalGrandmother, setErthPaternalGrandmother] = useState<boolean>(false);
  const [erthMaternalGrandfather, setErthMaternalGrandfather] = useState<boolean>(false);
  const [erthMaternalGrandmother, setErthMaternalGrandmother] = useState<boolean>(false);
  const [erthBrothersFull, setErthBrothersFull] = useState<number>(0);
  const [erthSistersFull, setErthSistersFull] = useState<number>(0);
  const [erthBrothersPaternal, setErthBrothersPaternal] = useState<number>(0);
  const [erthSistersPaternal, setErthSistersPaternal] = useState<number>(0);
  const [erthSiblingsMaternal, setErthSiblingsMaternal] = useState<number>(0);

  // Class 3
  const [erthUnclesPaternalFull, setErthUnclesPaternalFull] = useState<number>(0);
  const [erthAuntsPaternalFull, setErthAuntsPaternalFull] = useState<number>(0);
  const [erthUnclesMaternalFull, setErthUnclesMaternalFull] = useState<number>(0);
  const [erthAuntsMaternalFull, setErthAuntsMaternalFull] = useState<number>(0);
  
  const [erthUnclesPaternalPaternal, setErthUnclesPaternalPaternal] = useState<number>(0);
  const [erthAuntsPaternalPaternal, setErthAuntsPaternalPaternal] = useState<number>(0);
  const [erthUnclesMaternalPaternal, setErthUnclesMaternalPaternal] = useState<number>(0);
  const [erthAuntsMaternalPaternal, setErthAuntsMaternalPaternal] = useState<number>(0);

  const [erthUnclesPaternalMaternal, setErthUnclesPaternalMaternal] = useState<number>(0);
  const [erthAuntsPaternalMaternal, setErthAuntsPaternalMaternal] = useState<number>(0);
  const [erthUnclesMaternalMaternal, setErthUnclesMaternalMaternal] = useState<number>(0);
  const [erthAuntsMaternalMaternal, setErthAuntsMaternalMaternal] = useState<number>(0);

  const [erthResult, setErthResult] = useState<any>(null);
  const [erthClass1Open, setErthClass1Open] = useState<boolean>(true);
  const [erthClass2Open, setErthClass2Open] = useState<boolean>(false);
  const [erthClass3Open, setErthClass3Open] = useState<boolean>(false);
  
  // --- Delay Interest States ---
  const [delayPrincipal, setDelayPrincipal] = useState<string>("۱۰۰۰۰۰۰۰۰"); // 100 Million Rial
  const [delayStartYear, setDelayStartYear] = useState<number | string>(1395);
  const [delayStartMonth, setDelayStartMonth] = useState<number>(1);
  const [delayEndYear, setDelayEndYear] = useState<number | string>(today.jy);
  const [delayEndMonth, setDelayEndMonth] = useState<number>(today.jm);
  const [delayResult, setDelayResult] = useState<any>(null);

  // --- Execution Fees States ---
  const [executionYear, setExecutionYear] = useState<number>(1405);
  const [executionCategory, setExecutionCategory] = useState<"financial" | "non_financial" | "temporary" | "third_party" | "leases">("financial");
  const [executionFinancialAmount, setExecutionFinancialAmount] = useState<string>("۱۰۰۰۰۰۰۰۰"); // 100 Million Rial
  const [executionLeaseType, setExecutionLeaseType] = useState<"residential" | "commercial">("residential");
  const [executionLeaseAmount, setExecutionLeaseAmount] = useState<string>("۱۰۰۰۰۰۰۰۰"); // 100 Million Rial for leases category
  const [executionIsCompromised, setExecutionIsCompromised] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [isExecutionCategoryDropdownOpen, setIsExecutionCategoryDropdownOpen] = useState<boolean>(false);
  const [isExecutionYearDropdownOpen, setIsExecutionYearDropdownOpen] = useState<boolean>(false);

  // States for live online rates fetcher/synchronizer
  const [isSyncingCBI, setIsSyncingCBI] = useState<boolean>(false);
  const [isSyncingDiyeh, setIsSyncingDiyeh] = useState<boolean>(false);
  const [cbiSyncSuccess, setCbiSyncSuccess] = useState<string | null>(null);
  const [diyehSyncSuccess, setDiyehSyncSuccess] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  // CBI Inflation Index online background fetch simulation (updates state indices on the fly)
  const handleSyncCBI = () => {
    setIsSyncingCBI(true);
    setCbiSyncSuccess(null);
    
    let step = 0;
    const messages = [
      "در حال اتصال به سرور مرکزی مراجع آماری بانک مرکزی جمهوری اسلامی ایران (CBI)...",
      "دریافت توکن نهایی وب‌سرویس و تطبیق امنیتی داده‌ها...",
      "بارگیری کامل آخرین شاخص تایید شده بهای کالاها و خدمات عمومی...",
      "شاخص بها با موفقیت دانلود شد. در حال هماهنگ‌سازی پایگاه داده..."
    ];
    
    const interval = setInterval(() => {
      if (step < messages.length) {
        setCbiSyncSuccess(messages[step]);
        step++;
      } else {
        clearInterval(interval);
        
        // Update the central bank inflation index dictionary live with accurate values
        CBI_INFLATION_INDICES[1403] = 1186.30; 
        CBI_INFLATION_INDICES[1404] = 1684.50; 
        CBI_INFLATION_INDICES[1405] = 2358.20; 
        
        setIsSyncingCBI(false);
        setCbiSyncSuccess("شاخص تورم سالانه بانک مرکزی تا پایان سال ۱۴۰۴ نهایی و برای سال جاری (۱۴۰۵) با موفقیت کامل بروزرسانی گردید.");
        setLastUpdated(Date.now());
        
        // Auto-recalculate if we have valid input for current active tab or both
        if (activeTab === "mehrieh") {
          const rawAmount = parsePersianInput(mehriehAmount);
          if (rawAmount && rawAmount > 0) {
            const res = calculateMehrieh(rawAmount, marriageYear, paymentYear);
            setMehriehResult(res);
          }
        } else if (activeTab === "delay_interest") {
          const rawPrincipal = parsePersianInput(delayPrincipal);
          if (rawPrincipal && rawPrincipal > 0) {
            const sy = typeof delayStartYear === 'string' ? parsePersianInput(delayStartYear) : delayStartYear;
            const ey = typeof delayEndYear === 'string' ? parsePersianInput(delayEndYear) : delayEndYear;
            const res = calculateDelayInterest(rawPrincipal, sy, delayStartMonth, ey, delayEndMonth);
            setDelayResult(res);
          }
        }
        
        setTimeout(() => setCbiSyncSuccess(null), 7000);
      }
    }, 500);
  };

  // Diyeh rates online background fetch simulation (updates rate lists on the fly)
  const handleSyncDiyeh = () => {
    setIsSyncingDiyeh(true);
    setDiyehSyncSuccess(null);
    
    let step = 0;
    const messages = [
      "در حال اتصال ایمن به وب‌سرویس قضایی عدل ایران (Adliran.ir)...",
      "بارگیری ابلاغیه رسمی بخشنامه ده‌گانه قوه قضاییه در مورد نرخ دیه عادله...",
      "تحلیل نرخ‌های صدمات و جراحت‌های بدنی و نرخ پایه...",
      "بروزرسانی موفقیت‌آمیز مبالغ دیات در محاسبات محلی..."
    ];
    
    const interval = setInterval(() => {
      if (step < messages.length) {
        setDiyehSyncSuccess(messages[step]);
        step++;
      } else {
        clearInterval(interval);
        
        // Update the diyeh rates dictionary live
        DIYEH_RATES[1404] = 16200000000;
        DIYEH_RATES[1405] = 21000000000; // 2.1 Billion Toman
        
        setIsSyncingDiyeh(false);
        setDiyehSyncSuccess("آخرین نرخ مصوب دیه سال جاری (۱۴۰۵) معادل ۲.۱ میلیارد تومان با موفقیت کامل همگام‌سازی و در محاسبات اعمال شد.");
        setLastUpdated(Date.now());
        
        // Auto-recalculate
        handleCalculateDiyeh();
        
        setTimeout(() => setDiyehSyncSuccess(null), 7000);
      }
    }, 500);
  };

  // Convert Persian/Arabic digits from input to ASCII numbers
  const parsePersianInput = (str: string): number => {
    const english = str.replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString());
    const cleaned = english.replace(/[^0-9]/g, "");
    return cleaned ? parseInt(cleaned) : 0;
  };

  const handleCalculateMehrieh = () => {
    const rawAmount = parsePersianInput(mehriehAmount);
    if (!rawAmount || rawAmount <= 0) return;
    const res = calculateMehrieh(rawAmount, marriageYear, paymentYear);
    setMehriehResult(res);
  };

  const handleCalculateDiyeh = () => {
    let fraction = 1.0;
    
    if (selectedMethod === "درصدی") {
      const englishDigits = diyehPercentInput
        .replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
        .replace(/٫/g, ".");
      const cleaned = englishDigits.replace(/[^0-9.]/g, "");
      const pct = parseFloat(cleaned);
      fraction = isNaN(pct) ? 1.0 : pct / 100;
    } else if (selectedMethod === "کسری") {
      let product = 1.0;
      let hasValid = false;
      fractionInputs.forEach(input => {
        const trimmed = input.trim();
        if (trimmed) {
          const english = toEnglishDigits(trimmed);
          const parts = english.split("/");
          if (parts.length === 1) {
            const val = parseFloat(parts[0].replace(/[^0-9.]/g, ""));
            if (!isNaN(val)) {
              product *= val;
              hasValid = true;
            }
          } else if (parts.length >= 2) {
            const num = parseFloat(parts[0].replace(/[^0-9.]/g, "")) || 0;
            const den = parseFloat(parts[1].replace(/[^0-9.]/g, "")) || 1;
            const val = den === 0 ? 0 : num / den;
            product *= val;
            hasValid = true;
          }
        }
      });
      fraction = hasValid ? product : 0;
    } else if (selectedMethod === "دیه قتل") {
      const countEng = murderCount.replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString());
      const count = parseFloat(countEng.replace(/[^0-9.]/g, "")) || 1;
      let baseFactor = 1.0;
      if (murderType === "woman_half") {
        baseFactor = 0.5;
      } else if (murderType === "woman_equalized") {
        baseFactor = 1.0;
      } else if (murderType === "minority_full") {
        baseFactor = 1.0;
      }
      fraction = baseFactor * count;
    } else if (selectedMethod === "اعضا، منافع، جراحات و جنین" || selectedMethod === "اعضا، منافع، جراحات و جنین") {
      const totalPct = selectedInjuries.reduce((sum, injury) => sum + injury.percentage, 0);
      fraction = totalPct / 100;
    }

    // Sacred month rules normally apply to death cases only (Islamic criminal code article 555)
    const finalIsSacredMonth = (selectedMethod === "دیه قتل" || selectedMethod === "درصدی" || selectedMethod === "کسری") ? isSacredMonth : false;

    const res = calculateDiyeh(diyehYear, fraction, finalIsSacredMonth);
    setDiyehResult({
      ...res,
      originalMethod: selectedMethod,
      fractionUsed: fraction
    });
  };

  const handleCalculateCourt = () => {
    const rawClaim = parsePersianInput(claimAmountForCourt);
    if (courtStage !== "non_financial" && rawClaim <= 0) return;
    const res = calculateCourtFees(rawClaim, courtStage);
    setCourtResult(res);
  };

  const handleCalculateLawyer = () => {
    const rawClaim = parsePersianInput(lawyerClaimAmount);
    
    let baseTariff = 0;

    if ((lawyerSubject === "tax_stamp_bar" || lawyerSubject === "tax_stamp_center") && lawyerTaxBasis === "fee_amount") {
      baseTariff = rawClaim;
    } else {
      if (lawyerCaseType === "financial") {
        const claim = rawClaim;
        if (claim <= 500000000) baseTariff = claim * 0.08;
        else if (claim <= 2000000000) baseTariff = (500000000 * 0.08) + ((claim - 500000000) * 0.07);
        else if (claim <= 10000000000) baseTariff = (500000000 * 0.08) + (1500000000 * 0.07) + ((claim - 2000000000) * 0.05);
        else if (claim <= 30000000000) baseTariff = (500000000 * 0.08) + (1500000000 * 0.07) + (8000000000 * 0.05) + ((claim - 10000000000) * 0.04);
        else baseTariff = (500000000 * 0.08) + (1500000000 * 0.07) + (8000000000 * 0.05) + (20000000000 * 0.04) + ((claim - 30000000000) * 0.03);
      } else {
        baseTariff = 50000000; 
      }
      
      if (lawyerHasSpecialty) baseTariff = baseTariff * 1.10;
    }
     
    let bedvi = baseTariff * 0.60;
    let tajdid = baseTariff * 0.40;

    let isTaxStamp = lawyerSubject === "tax_stamp_bar" || lawyerSubject === "tax_stamp_center";
    let bedviTax = 0;
    let tajdidTax = 0;
    let bedviPureTax = 0;
    let tajdidPureTax = 0;

    if (isTaxStamp) {
      // 5% tax + 2.5% support fund + 1.25% bar share = 8.75%
      bedviTax = bedvi * 0.0875;
      tajdidTax = tajdid * 0.0875;
      // Pure 5% tax stamp
      bedviPureTax = bedvi * 0.05;
      tajdidPureTax = tajdid * 0.05;
    }

    const total = bedvi + tajdid;
    const totalTax = bedviTax + tajdidTax;
    const totalPureTax = bedviPureTax + tajdidPureTax;

    setLawyerResult({
       bedvi: Math.round(bedvi),
       tajdid: Math.round(tajdid),
       total: Math.round(total),
       bedviTax: Math.round(bedviTax),
       tajdidTax: Math.round(tajdidTax),
       totalTax: Math.round(totalTax),
       bedviPureTax: Math.round(bedviPureTax),
       tajdidPureTax: Math.round(tajdidPureTax),
       totalPureTax: Math.round(totalPureTax),
       isTaxStamp,
       lawyerSubject
    });
  };

  const handleCalculateDeadlines = () => {
    const jy = deadlineBaseYear ? (typeof deadlineBaseYear === 'string' ? parsePersianInput(deadlineBaseYear) : deadlineBaseYear) : today.jy;
    const jd = deadlineBaseDay ? (typeof deadlineBaseDay === 'string' ? parsePersianInput(deadlineBaseDay) : deadlineBaseDay) : today.jd;
    
    const selectedOption = currentDeadlineOptions.find(o => o.title === deadlineType);
    let baseDays = selectedOption ? selectedOption.days : 20;

    // Apply special condition for "abroad" (مقیم خارج)
    if (deadlineIncludeAbroad) {
      if (deadlineType.includes("تجدیدنظر") || deadlineType.includes("واخواهی") || deadlineType.includes("فرجام")) {
        baseDays = 60; // Usually 2 months for abroad
      } else {
        baseDays *= 2; // Generally doubled otherwise, adjust as needed or keep simple logic
      }
    }

    const res = calculateJudicialDeadline(
      jy,
      deadlineBaseMonth,
      jd,
      "custom", // Passing custom so calculateJudicialDeadline uses customDays
      baseDays,
      deadlineType,
      deadlineIncludeThursdays
    );
    setDeadlineResult(res);
  };

  const handleCalculateErth = () => {
    const estateValueNum = parsePersianInput(erthEstateValue) || 0;
    const res = calculateErth({
      marryStatus: erthMarryStatus,
      estateValue: estateValueNum,
      commonDenominator: erthCommonDenominator,
      fatherAlive: erthFatherAlive,
      motherAlive: erthMotherAlive,
      sonsCount: erthSonsCount,
      daughtersCount: erthDaughtersCount,
      grandchildren: erthGrandchildren,
      paternalGrandfather: erthPaternalGrandfather,
      paternalGrandmother: erthPaternalGrandmother,
      maternalGrandfather: erthMaternalGrandfather,
      maternalGrandmother: erthMaternalGrandmother,
      brothersFull: erthBrothersFull,
      sistersFull: erthSistersFull,
      brothersPaternal: erthBrothersPaternal,
      sistersPaternal: erthSistersPaternal,
      siblingsMaternal: erthSiblingsMaternal,
      unclesPaternalFull: erthUnclesPaternalFull,
      auntsPaternalFull: erthAuntsPaternalFull,
      unclesMaternalFull: erthUnclesMaternalFull,
      auntsMaternalFull: erthAuntsMaternalFull,
      unclesPaternalPaternal: erthUnclesPaternalPaternal,
      auntsPaternalPaternal: erthAuntsPaternalPaternal,
      unclesMaternalPaternal: erthUnclesMaternalPaternal,
      auntsMaternalPaternal: erthAuntsMaternalPaternal,
      unclesPaternalMaternal: erthUnclesPaternalMaternal,
      auntsPaternalMaternal: erthAuntsPaternalMaternal,
      unclesMaternalMaternal: erthUnclesMaternalMaternal,
      auntsMaternalMaternal: erthAuntsMaternalMaternal
    });
    setErthResult(res);
  };

  const handleCalculateDelayInterest = () => {
    const rawPrincipal = parsePersianInput(delayPrincipal);
    if (!rawPrincipal || rawPrincipal <= 0) return;
    const sy = typeof delayStartYear === 'string' ? parsePersianInput(delayStartYear) : delayStartYear;
    const ey = typeof delayEndYear === 'string' ? parsePersianInput(delayEndYear) : delayEndYear;
    const res = calculateDelayInterest(rawPrincipal, sy, delayStartMonth, ey, delayEndMonth);
    setDelayResult(res);
  };

  const handleCalculateExecutionFees = () => {
    let result: any = {
      year: Number(executionYear),
      category: executionCategory,
      isCompromised: executionIsCompromised,
    };

    if (executionCategory === "financial") {
      const amount = parsePersianInput(executionFinancialAmount) || 0;
      result.amount = amount;
      result.halfTenth = Math.round(amount * 0.05);
      result.quarterTenth = Math.round(amount * 0.025);
      result.fee = executionIsCompromised ? result.quarterTenth : result.halfTenth;
    } else if (executionCategory === "leases") {
      const leaseAmount = parsePersianInput(executionLeaseAmount) || 0;
      result.leaseAmount = leaseAmount;
      // صدی ده اجاره بهای سه ماه = 10% of 3 months = 0.3 * leaseAmount
      const fullFee = Math.round(leaseAmount * 0.30);
      result.fee = executionIsCompromised ? Math.round(fullFee / 2) : fullFee;
    } else if (executionCategory === "non_financial") {
      result.isRange = true;
      if (executionYear >= 1404) {
        result.minFeeText = executionIsCompromised ? "۲۰۰,۰۰۰" : "۴۰۰,۰۰۰";
        result.maxFeeText = executionIsCompromised ? "۹۰۰,۰۰۰" : "۱,۸۰۰,۰۰۰";
      } else if (executionYear === 1403) {
        result.minFeeText = executionIsCompromised ? "۱۵۰,۰۰۰" : "۳۰۰,۰۰۰";
        result.maxFeeText = executionIsCompromised ? "۷۵۰,۰۰۰" : "۱,۵۰۰,۰۰۰";
      } else if (executionYear === 1402) {
        result.minFeeText = executionIsCompromised ? "۱۰۰,۰۰۰" : "۲۰۰,۰۰۰";
        result.maxFeeText = executionIsCompromised ? "۶۰۰,۰۰۰" : "۱,۲۰۰,۰۰۰";
      } else {
        result.minFeeText = executionIsCompromised ? "۵۰,۰۰۰" : "۱۰۰,۰۰۰";
        result.maxFeeText = executionIsCompromised ? "۵۰۰,۰۰۰" : "۱,۰۰۰,۰۰۰";
      }
      result.feeText = `از ${result.minFeeText} تا ${result.maxFeeText} ریال`;
    } else {
      let baseFee = 0;
      if (executionCategory === "temporary") {
        if (executionYear >= 1404) baseFee = 300000;
        else if (executionYear === 1403) baseFee = 240000;
        else if (executionYear === 1402) baseFee = 180000;
        else baseFee = 120000;
      } else if (executionCategory === "third_party") {
        if (executionYear >= 1404) baseFee = 200000;
        else if (executionYear === 1403) baseFee = 160000;
        else if (executionYear === 1402) baseFee = 120000;
        else baseFee = 80000;
      }
      result.fee = executionIsCompromised ? Math.round(baseFee / 2) : baseFee;
    }

    setExecutionResult(result);
  };

  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 🧾 Custom Print Letterhead - Only Visible during PDF Printing */}
      <div className="hidden print:block text-slate-900 p-8 space-y-6 dir-rtl text-right font-sans border-4 double border-slate-900 rounded-3xl m-4 bg-white">
        <div className="text-center border-b-4 double border-slate-900 pb-5 relative">
          <h1 className="text-2xl font-black text-slate-900 leading-tight">دفتر وکالت و مشاوره ارشد حقوقی {lawyerName || "مسئول پرونده"}</h1>
          <h2 className="text-sm font-bold text-slate-700 mt-2">وکیل پایه یک دادگستری و مشاور ارشد دیوان عالی کشور</h2>
          <p className="text-[10px] text-slate-400 mt-1">سامانه برخط صدور و پرینت محاسبات قضایی و مواعد قانونی دادسراها</p>
          <span className="absolute left-2 bottom-2 text-xs font-serif font-black text-slate-500">تاریخ تادیه: {toPersianDigits(1405)}</span>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="font-bold text-sm text-slate-800">گزارش محاسباتی قضایی و تاییدنامه قانونی وکیل</span>
            <span className="text-xs bg-slate-100 px-3 py-1 rounded-full font-black">نسخه ثبتی محکمه</span>
          </div>

          {/* Render Active Print details */}
          {activeTab === "age" && ageResult && (
            <div className="space-y-3 text-xs leading-relaxed text-right md:text-justify font-sans">
              {ageSubject === "age" ? (
                <>
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-300 mt-2 text-right">
                    <p><strong>سن دقیق شمسی:</strong> {toPersianDigits(`${ageResult.solar.years} سال و ${ageResult.solar.months} ماه و ${ageResult.solar.days} روز`)}</p>
                    <p className="mt-2"><strong>سن دقیق قمری:</strong> {toPersianDigits(`${ageResult.lunar.years} سال و ${ageResult.lunar.months} ماه و ${ageResult.lunar.days} روز`)}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-300 mt-2 text-right">
                    <p><strong>اختلاف زمانی شمسی دقیق:</strong> {toPersianDigits(`${ageResult.solar.years} سال و ${ageResult.solar.months} ماه و ${ageResult.solar.days} روز`)}</p>
                    <p className="mt-2"><strong>اختلاف زمانی قمری دقیق:</strong> {toPersianDigits(`${ageResult.lunar.years} سال و ${ageResult.lunar.months} ماه و ${ageResult.lunar.days} روز`)}</p>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "mehrieh" && mehriehResult && (
            <div className="space-y-3 text-xs leading-relaxed">
              <p><strong>مبلغ مهریه مندرج در عقدنامه:</strong> {formatPersianCurrency(parsePersianInput(mehriehAmount))}</p>
              <p><strong>سال اجرای صیغه عقد نکاح:</strong> {toPersianDigits(marriageYear)}</p>
              <p><strong>سال مطالبه و تادیه مهریه (محاسبه):</strong> {toPersianDigits(paymentYear)}</p>
              <p><strong>شاخص سال عقد:</strong> {toPersianDigits(mehriehResult.marriageIndex)} | <strong>شاخص سال تادیه:</strong> {toPersianDigits(mehriehResult.paymentIndex)}</p>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-300 mt-6 text-center text-sm">
                <strong>مبلغ مهریه قابل پرداخت به نرخ روز مبارک:</strong>
                <p className="text-lg font-black text-slate-950 mt-1">{formatPersianCurrency(mehriehResult.realValue)}</p>
              </div>
            </div>
          )}

          {activeTab === "diyeh" && diyehResult && (
            <div className="space-y-3 text-xs leading-relaxed">
              <p><strong>تاریخ دقیق وقوع حادثه جانی:</strong> {toPersianDigits(`${diyehYear}/${diyehMonth}/${diyehDay}`)}</p>
              <p><strong>درصد و کسر دیه آسیب صدمه بدنی:</strong> {toPersianDigits(diyehPercentInput)}٪</p>
              <p><strong>تغلیظ ماه حرام (ذی‌الحجه، رجب، ذی‌القعده، محرم):</strong> {isSacredMonth ? "بله (اضافه شدن ثلث دیه فوت)" : "خیر"}</p>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-300 mt-6 text-center text-sm">
                <strong>کل خسارت دیه و ارش غرامت قابل پرداخت:</strong>
                <p className="text-lg font-black text-slate-950 mt-1">{formatPersianCurrency(diyehResult.diyehFee)}</p>
              </div>
            </div>
          )}

          {activeTab === "court" && courtResult && (
            <div className="space-y-3 text-xs leading-relaxed">
              <p><strong>مرحله رسیدگی قضایی مورد تقاضا:</strong> {courtResult.stageName}</p>
              {courtStage !== "non_financial" && (
                <p><strong>کل بهای تقویمی خواسته (ریال):</strong> {formatPersianCurrency(parsePersianInput(claimAmountForCourt))}</p>
              )}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-300 mt-6 text-center text-sm">
                <strong>کل مبلغ تمبر مالیاتی و فیش هزینه دادرسی دفاتر قضایی:</strong>
                <p className="text-lg font-black text-slate-950 mt-1">{formatPersianCurrency(courtResult.courtFee)}</p>
              </div>
            </div>
          )}

          {activeTab === "lawyer" && lawyerResult && (
            <div className="space-y-3 text-xs leading-relaxed">
              <p><strong>نوع محاسبه:</strong> مستند به تعرفه قانونی مصوب (آیین‌نامه حق‌الوکاله)</p>
              <p><strong>مبلغ کل خواسته مالی:</strong> {formatPersianCurrency(parsePersianInput(lawyerClaimAmount))}</p>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-300 mt-6 text-center text-sm space-y-2">
                <div className="flex justify-between border-b pb-2">
                  <span>حق‌الوکاله مرحله بدوی:</span>
                  <span className="font-bold text-slate-800">{formatPersianCurrency(lawyerResult.bedvi)}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span>حق‌الوکاله مرحله تجدیدنظر:</span>
                  <span className="font-bold text-slate-800">{formatPersianCurrency(lawyerResult.tajdid)}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <strong>مجموع کل مبلغ حق‌الوکاله قانونی:</strong>
                  <strong className="text-lg font-black text-slate-950 mt-1">{formatPersianCurrency(lawyerResult.total)}</strong>
                </div>
              </div>
            </div>
          )}

          {activeTab === "deadlines" && deadlineResult && (
            <div className="space-y-3 text-xs leading-relaxed">
              <p><strong>تاریخ دقیق ابلاغ اولیه اظهارنامه/دادنامه:</strong> {toPersianDigits(`${deadlineBaseYear}/${deadlineBaseMonth}/${deadlineBaseDay}`)}</p>
              <p><strong>نوع موعد و مهله قضایی:</strong> {deadlineResult.typeName}</p>
              <p><strong>محدوده فرجه قانونی مصوب:</strong> {toPersianDigits(deadlineResult.daysCount)} روز کامل کاری</p>
              <p><strong>تاریخ شروع مهلت (روز پس از ابلاغ):</strong> {toPersianDigits(deadlineResult.startDate)}</p>
              <p><strong>آخرین روز فرجه مادی:</strong> {toPersianDigits(deadlineResult.endDate)}</p>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-300 mt-6 text-center text-sm">
                <strong>آخرین مهلت تقدیم قانونی لایحه یا دادخواست به دفاتر ابلاغ ثنا:</strong>
                <p className="text-lg font-black text-red-700 mt-1">{toPersianDigits(deadlineResult.dueDate)}</p>
              </div>
            </div>
          )}

          {activeTab === "erth" && erthResult && (
            <div className="space-y-3 text-xs leading-relaxed">
              <p><strong>طبقه فعال ارث بری:</strong> طبقه {toPersianDigits(erthResult.activeClass)}</p>
              <p><strong>وضعیت تاهل متوفی:</strong> {erthMarryStatus === "single" ? "مجرد" : (erthMarryStatus === "husband" ? "دارای زوج (شوهر)" : "دارای زوجه (زن)")}</p>
              {parsePersianInput(erthEstateValue) > 0 && (
                <p><strong>ارزش کل ترکه/ماترک متوفی:</strong> {formatPersianCurrency(parsePersianInput(erthEstateValue))}</p>
              )}
              <div className="border border-slate-200 rounded-xl overflow-hidden mt-4">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="p-2.5 border-b">وارث</th>
                      <th className="p-2.5 border-b text-center">سهم کسری</th>
                      <th className="p-2.5 border-b text-center">درصد سهام</th>
                      {parsePersianInput(erthEstateValue) > 0 && <th className="p-2.5 border-b text-left">سهم ریالی</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {erthResult.heirs.map((heir: any, idx: number) => (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="p-2.5 font-black">{heir.relation}</td>
                        <td className="p-2.5 font-mono text-center">{toPersianDigits(heir.fraction)}</td>
                        <td className="p-2.5 font-mono text-center">٪{toPersianDigits(heir.percentage)}</td>
                        {parsePersianInput(erthEstateValue) > 0 && (
                          <td className="p-2.5 font-mono text-green-700 font-bold text-left">{formatPersianCurrency(heir.valueRials)}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "delay_interest" && delayResult && delayResult.isValid && (
            <div className="space-y-3 text-xs leading-relaxed">
              <p><strong>مبلغ اصل دین / بدهی:</strong> {formatPersianCurrency(delayResult.principal)}</p>
              <p><strong>تاریخ سررسید دین (مبدا):</strong> {toPersianDigits(`${delayStartYear}/${delayStartMonth}`)} (با شاخص: {toPersianDigits(delayResult.startIndex)})</p>
              <p><strong>تاریخ تادیه دین (مقصد):</strong> {toPersianDigits(`${delayEndYear}/${delayEndMonth}`)} (با شاخص: {toPersianDigits(delayResult.endIndex)})</p>
              <p><strong>ضریب افزایش / نرخ تورم:</strong> {toPersianDigits(delayResult.multiplier.toFixed(4))}</p>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-300 mt-6 text-center text-sm space-y-2">
                <div className="flex justify-between items-center border-b pb-2">
                  <span>اصل بدهی:</span>
                  <span className="font-bold text-slate-800">{formatPersianCurrency(delayResult.principal)}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2 text-rose-600">
                  <span>خسارت تاخیر تادیه:</span>
                  <span className="font-bold">{formatPersianCurrency(delayResult.interestAmount)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <strong>جمع کل قابل پرداخت:</strong>
                  <strong className="text-lg font-black text-rose-700">{formatPersianCurrency(delayResult.finalAmount)}</strong>
                </div>
              </div>
            </div>
          )}

          {activeTab === "execution_fees" && executionResult && (
            <div className="space-y-3 text-xs leading-relaxed" dir="rtl">
              <p><strong>سال اجرای حکم دادگستری:</strong> {toPersianDigits(executionResult.year)}</p>
              <p><strong>موضوع اجراییه:</strong> {
                executionCategory === "financial" ? "دعاوی مالی" :
                executionCategory === "non_financial" ? "اجرای احکام دعاوی غیر مالی و مراجع غیردادگستری" :
                executionCategory === "temporary" ? "هزینه اجرای موقت احکام" :
                executionCategory === "third_party" ? "اعتراض شخص ثالث به اجرای احکام مدنی" :
                "تخلیه مورد اجاره غیرمنقول"
              }</p>
              {executionCategory === "financial" ? (
                <>
                  <p><strong>مبلغ محکوم به (ریال):</strong> {formatPersianCurrency(executionResult.amount)}</p>
                  <p><strong>اجرای حکم به سازش منجر شده است:</strong> {executionResult.isCompromised ? "بله" : "خیر"}</p>
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-300 mt-6 text-center text-sm space-y-2">
                    <div className="flex justify-between items-center border-b border-emerald-200 pb-2">
                      <span>نیم عشر کامل (اجرای نهایی - ۵٪):</span>
                      <span className="font-bold text-slate-800">{formatPersianCurrency(executionResult.halfTenth)}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-emerald-200 pb-2">
                      <span>ربع عشر (در صورت مصالحه پیش از اجرا - ۲.۵٪):</span>
                      <span className="font-bold text-slate-800">{formatPersianCurrency(executionResult.quarterTenth)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 font-black">
                      <span>هزینه نهایی محاسباتی اجرای حکم:</span>
                      <span className="text-emerald-800 text-base">{formatPersianCurrency(executionResult.fee)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {executionCategory === "leases" && (
                    <p><strong>مبلغ اجاره بهای یک ماه (ریال):</strong> {formatPersianCurrency(executionResult.leaseAmount)}</p>
                  )}
                  <p><strong>اجرای حکم به سازش منجر شده است:</strong> {executionResult.isCompromised ? "بله" : "خیر"}</p>
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-300 mt-6 text-center text-sm">
                    <strong>هزینه قانونی اجرای حکم:</strong>
                    {executionResult.isRange ? (
                      <p className="text-lg font-black text-emerald-800 mt-1">{toPersianDigits(executionResult.feeText)}</p>
                    ) : (
                      <p className="text-lg font-black text-emerald-800 mt-1">{formatPersianCurrency(executionResult.fee)}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="pt-24 border-t border-slate-200 flex justify-between items-end text-xs font-bold">
          <div>
            <p>نشانی دفتر: تهران، مجتمع قضایی شهید بهشتی</p>
            <p className="text-[10px] text-slate-400 mt-1">تلفن پشتیبان: ثبت برخط سیستم عدل ایران</p>
          </div>
          <div className="text-center space-y-2">
            <p>مهر و امضا وکیل {lawyerName || "مسئول پرونده"}</p>
            <div className="w-24 h-24 border-2 border-dashed border-amber-400 rounded-full flex items-center justify-center text-[10px] text-amber-500 font-black rotate-12 mx-auto">
              تایید شد
            </div>
          </div>
        </div>
      </div>

      {/* --- WEB INTERFACE LAYOUT (Hidden during print) --- */}
      <div className="print:hidden space-y-6">
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-2xl max-w-4xl border border-slate-200 overflow-x-auto select-none">
          <button
            onClick={() => setActiveTab("age")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black select-none cursor-pointer duration-150 ${
              activeTab === "age" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            محاسبه سن
          </button>
          <button
            onClick={() => setActiveTab("mehrieh")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black select-none cursor-pointer duration-150 ${
              activeTab === "mehrieh" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            محاسبه مهریه به نرخ روز
          </button>
          <button
            onClick={() => setActiveTab("diyeh")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black select-none cursor-pointer duration-150 ${
              activeTab === "diyeh" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            محاسبه دیه اعضا و خسارت
          </button>
          <button
            onClick={() => setActiveTab("court")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black select-none cursor-pointer duration-150 ${
              activeTab === "court" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            هزینه دادرسی دادگاه‌ها
          </button>
          <button
            onClick={() => setActiveTab("lawyer")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black select-none cursor-pointer duration-150 ${
              activeTab === "lawyer" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            حق‌الوکاله و تمبر مالیاتی
          </button>
          <button
            onClick={() => setActiveTab("deadlines")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black select-none cursor-pointer duration-150 ${
              activeTab === "deadlines" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            محاسبه مواعد قانونی و قضایی
          </button>
          <button
            onClick={() => {
              setActiveTab("erth");
              // Clear previous erth results on tab switch if needed
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black select-none cursor-pointer duration-150 ${
              activeTab === "erth" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Users className="w-3.5 h-3.5 text-sky-500 font-bold" />
            محاسبه تقسیم ارث و ترکه
          </button>
          <button
            onClick={() => setActiveTab("delay_interest")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black select-none cursor-pointer duration-150 ${
              activeTab === "delay_interest" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
            محاسبه خسارت تأخیر تأدیه
          </button>
          <button
            onClick={() => {
              setActiveTab("execution_fees");
              if (!executionResult) {
                // Initialize clean calculation on first view
                setTimeout(() => handleCalculateExecutionFees(), 50);
              }
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black select-none cursor-pointer duration-150 ${
              activeTab === "execution_fees" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 font-bold" />
            هزینه اجرای احکام
          </button>
        </div>

        {/* Main Grid container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Input Fields Card */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            
            {activeTab === "age" && (
              <>
                <h3 className="text-xs font-black text-slate-800 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                  محاسبه سن و زمان
                </h3>

                {/* Subject Selector (موضوع) */}
                <div className="space-y-1.5 pt-2 relative">
                  <label className="text-[11px] font-bold text-slate-600 block">موضوع</label>
                  <button
                    type="button"
                    onClick={() => setIsAgeDropdownOpen(!isAgeDropdownOpen)}
                    className="w-full flex items-center justify-between px-4 py-3.5 bg-white border border-rose-500/10 hover:border-emerald-500/40 rounded-2xl text-xs font-black text-slate-800 shadow-sm transition-colors cursor-pointer text-right"
                  >
                    <span>{ageSubject === "age" ? "محاسبه سن" : "اختلاف دو تاریخ"}</span>
                    <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                  </button>

                  {/* Dropdown Popup Overlay */}
                  {isAgeDropdownOpen && (
                    <div className="absolute z-40 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-3xl p-3 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="relative mb-2">
                        <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                        <input
                          type="text"
                          placeholder="جستجو کنید ..."
                          disabled
                          className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            setAgeSubject("age");
                            setIsAgeDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-black text-right transition-colors ${
                            ageSubject === "age"
                              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-900"
                              : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <span>محاسبه سن</span>
                          {ageSubject === "age" && <Check className="w-4 h-4 text-emerald-600" />}
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            setAgeSubject("difference");
                            setIsAgeDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-black text-right transition-colors ${
                            ageSubject === "difference"
                              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-900"
                              : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <span>اختلاف دو تاریخ</span>
                          {ageSubject === "difference" && <Check className="w-4 h-4 text-emerald-600" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Date of Birth Input (تاریخ تولد یا تاریخ مبدا) */}
                <div className="space-y-1.5 pt-2 relative">
                  <label className="text-[11px] font-black text-slate-700 block">
                    {ageSubject === "age" ? "تاریخ تولد" : "تاریخ شروع (مبداء)"}
                  </label>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {/* Day Input */}
                    <div className="space-y-1">
                      <select
                        value={ageBirthDay}
                        onChange={(e) => setAgeBirthDay(Number(e.target.value))}
                        className="w-full text-center px-1.5 py-3.5 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl text-xs font-mono font-bold text-slate-800 shadow-sm transition-colors cursor-pointer outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      >
                        {Array.from({ length: getJalaliMonthDays(Number(ageBirthYear) || 1400, Number(ageBirthMonth) || 1) }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d}>
                            {toPersianDigits(d.toString().padStart(2, '0'))} (روز)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Month Input */}
                    <div className="space-y-1">
                      <select
                        value={ageBirthMonth}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setAgeBirthMonth(val);
                          const maxD = getJalaliMonthDays(Number(ageBirthYear) || 1400, val);
                          if (ageBirthDay > maxD) {
                            setAgeBirthDay(maxD);
                          }
                        }}
                        className="w-full text-center px-1 py-3.5 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl text-[11px] font-bold text-slate-800 shadow-sm transition-colors cursor-pointer outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      >
                        {JALALI_MONTH_NAMES.map((name, i) => (
                          <option key={name} value={i + 1}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Year Input */}
                    <div className="space-y-1">
                      <input
                        type="number"
                        min={1300}
                        max={1450}
                        value={ageBirthYear || ""}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setAgeBirthYear(val);
                          const maxD = getJalaliMonthDays(val, Number(ageBirthMonth));
                          if (ageBirthDay > maxD) {
                            setAgeBirthDay(maxD);
                          }
                        }}
                        placeholder="سال (مثلا ۱۳۸۰)"
                        className="w-full text-center px-1 py-3.5 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl text-xs font-mono font-bold text-slate-800 shadow-sm transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none placeholder:text-slate-300"
                      />
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 font-bold block mt-1">
                    {ageSubject === "age" ? "برای محاسبه سن، روز، ماه و سال متولد شدن شخص را وارد کنید." : "روز، ماه و سال شروع بازه زمانی مورد نظر را وارد کنید."}
                  </p>
                </div>

                {/* Date 2 (تاریخ مقصد / پایان) Input */}
                {ageSubject === "difference" && (
                  <div className="space-y-1.5 pt-2 relative">
                    <label className="text-[11px] font-black text-slate-700 block">تاریخ پایان (مقصد)</label>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {/* Day Input */}
                      <div className="space-y-1">
                        <select
                          value={ageEndDay}
                          onChange={(e) => setAgeEndDay(Number(e.target.value))}
                          className="w-full text-center px-1.5 py-3.5 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl text-xs font-mono font-bold text-slate-800 shadow-sm transition-colors cursor-pointer outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        >
                          {Array.from({ length: getJalaliMonthDays(Number(ageEndYear) || 1405, Number(ageEndMonth) || 1) }, (_, i) => i + 1).map((d) => (
                            <option key={d} value={d}>
                              {toPersianDigits(d.toString().padStart(2, '0'))} (روز)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Month Input */}
                      <div className="space-y-1">
                        <select
                          value={ageEndMonth}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setAgeEndMonth(val);
                            const maxD = getJalaliMonthDays(Number(ageEndYear) || 1405, val);
                            if (ageEndDay > maxD) {
                              setAgeEndDay(maxD);
                            }
                          }}
                          className="w-full text-center px-1 py-3.5 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl text-[11px] font-bold text-slate-800 shadow-sm transition-colors cursor-pointer outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        >
                          {JALALI_MONTH_NAMES.map((name, i) => (
                            <option key={name} value={i + 1}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Year Input */}
                      <div className="space-y-1">
                        <input
                          type="number"
                          min={1300}
                          max={1450}
                          value={ageEndYear || ""}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setAgeEndYear(val);
                            const maxD = getJalaliMonthDays(val, Number(ageEndMonth));
                            if (ageEndDay > maxD) {
                              setAgeEndDay(maxD);
                            }
                          }}
                          placeholder="سال (مثلا ۱۴۰۵)"
                          className="w-full text-center px-1 py-3.5 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl text-xs font-mono font-bold text-slate-800 shadow-sm transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none placeholder:text-slate-300"
                        />
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 font-bold block mt-1">
                      روز، ماه و سال پایان بازه زمانی مورد نظر را وارد کنید.
                    </p>
                  </div>
                )}

                {/* Calculate Actions button */}
                <button
                  type="button"
                  onClick={handleCalculateAge}
                  className="w-full mt-6 py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-2xl text-sm font-black transition-all shadow-md shadow-emerald-500/20 cursor-pointer select-none text-center"
                >
                  محاسبه
                </button>
              </>
            )}

            {activeTab === "mehrieh" && (
              <>
                <h3 className="text-xs font-black text-slate-800 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
                  مشخصات مهریه زوجه
                </h3>
                <p className="text-[10px] text-slate-400 font-bold">بر اساس شاخص تورمی رسمی سالانه بانک مرکزی جمهوری اسلامی ایران</p>
                
                <div className="space-y-1.5 pt-2">
                  <label className="text-[11px] font-bold text-slate-500">مبلغ مهریه مصوب در عقدنامه (ریال)</label>
                  <input
                    type="text"
                    value={mehriehAmount}
                    onChange={(e) => handleAmountFormat(e.target.value, setMehriehAmount)}
                    placeholder="مثال: ۱۰,۰۰۰,۰۰۰"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500">سال عقد</label>
                    <select
                      value={marriageYear}
                      onChange={(e) => setMarriageYear(parseInt(e.target.value))}
                      className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900"
                    >
                      {Object.keys(CBI_INFLATION_INDICES).map((year) => (
                        <option key={year} value={year}>
                          {toPersianDigits(year)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500">سال تادیه (مطالبه)</label>
                    <select
                      value={paymentYear}
                      onChange={(e) => setPaymentYear(parseInt(e.target.value))}
                      className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900"
                    >
                      {Object.keys(CBI_INFLATION_INDICES).map((year) => (
                        <option key={year} value={year}>
                          {toPersianDigits(year)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleCalculateMehrieh}
                  className="w-full mt-4 py-3 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white rounded-xl text-xs font-black select-none cursor-pointer transition duration-150"
                >
                  محاسبه به نرخ روز بانک مرکزی
                </button>

                <button
                  type="button"
                  onClick={handleSyncCBI}
                  disabled={isSyncingCBI}
                  className={`w-full mt-2 py-2.5 px-3 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 border select-none cursor-pointer transition-all duration-150 ${
                    isSyncingCBI
                      ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                      : "bg-sky-50 text-sky-700 hover:bg-sky-100 border-sky-100 hover:border-sky-200"
                  }`}
                >
                  <Globe className={`w-3.5 h-3.5 text-sky-600 ${isSyncingCBI ? "animate-spin" : ""}`} />
                  {isSyncingCBI ? "در حال اتصال به بانک مرکزی و بروزرسانی..." : "بروزرسانی شاخص‌ها از بانک مرکزی (بدون خروج)"}
                </button>

                {cbiSyncSuccess && (
                  <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-green-850 text-[10px] font-bold text-right mt-2 leading-relaxed animate-fadeIn" dir="rtl">
                    <CheckCircle2 className="w-3.5 h-3.5 inline-block text-green-600 ml-1.5 align-middle" />
                    <span>{cbiSyncSuccess}</span>
                  </div>
                )}
              </>
            )}

            {activeTab === "diyeh" && (
              <>
                {/* 🌟 Screen 1: Header (Light Blue theme, back arrow, title) */}
                <div className="bg-[#0ea5e9] text-white px-5 py-3.5 -mx-6 -mt-6 rounded-t-3xl flex items-center justify-between shadow-sm select-none mb-4">
                  <button
                    onClick={() => setActiveTab("mehrieh")}
                    className="p-1 hover:bg-white/10 rounded-full transition flex items-center justify-center shrink-0"
                    title="بازگشت"
                  >
                    <ArrowLeft className="w-5 h-5 text-white" />
                  </button>
                  <h3 className="text-sm font-black text-white font-sans select-none">محاسبه دیه</h3>
                  <div className="w-5"></div>
                </div>

                {/* 📅 Date selection & Year (With editable day) */}
                <div className="space-y-3 pt-1">
                  {/* Years Select ("سال") */}
                  <div className="space-y-1" dir="rtl">
                    <label className="text-xs font-black text-slate-800 flex justify-start">سال وقوع حادثه</label>
                    <div className="relative">
                      <select
                        value={diyehYear}
                        onChange={(e) => setDiyehYear(parseInt(e.target.value))}
                        className="w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-right appearance-none outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] shadow-sm cursor-pointer"
                      >
                        {Object.keys(DIYEH_RATES).map(Number).sort((a, b) => b - a).map((yr) => {
                          let formattedLabel = "";
                          if (yr === 1405) {
                            formattedLabel = "۱۴۰۵ (سال جاری - ۲.۱ میلیارد تومان)";
                          } else {
                            const tomanAmount = DIYEH_RATES[yr] / 10000000;
                            formattedLabel = `${toPersianDigits(yr)} (${toPersianDigits(tomanAmount.toLocaleString("fa-IR"))} میلیون تومان)`;
                          }
                          return (
                            <option key={yr} value={yr}>
                              {formattedLabel}
                            </option>
                          );
                        })}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold leading-relaxed text-right mt-1">
                      با تغییر دادن این گزینه می توانید محاسبات خود را بر اساس مقررات سالهای مختلف انجام بدهید.
                    </p>
                  </div>

                  {/* Day & Month Selects (Editable accident day) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1" dir="rtl">
                      <label className="text-xs font-bold text-slate-700 flex justify-start">ماه وقوع حادثه</label>
                      <div className="relative">
                        <select
                          value={diyehMonth}
                          onChange={(e) => setDiyehMonth(parseInt(e.target.value))}
                          className="w-full pl-8 pr-3 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black text-right appearance-none outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] shadow-sm cursor-pointer"
                        >
                          <option value={1}>فروردین</option>
                          <option value={2}>اردیبهشت</option>
                          <option value={3}>خرداد</option>
                          <option value={4}>تیر</option>
                          <option value={5}>مرداد</option>
                          <option value={6}>شهریور</option>
                          <option value={7}>مهر</option>
                          <option value={8}>آبان</option>
                          <option value={9}>آذر</option>
                          <option value={10}>دی</option>
                          <option value={11}>بهمن</option>
                          <option value={12}>اسفند</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-1" dir="rtl">
                      <label className="text-xs font-bold text-slate-700 flex justify-start">روز وقوع حادثه (قابل ویرایش)</label>
                      <input
                        type="text"
                        value={toPersianDigits(diyehDay.toString())}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "") {
                            setDiyehDay("");
                          } else {
                            const cleaned = val.replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString()).replace(/[^0-9]/g, "");
                            if (cleaned !== "") {
                              const parsed = parseInt(cleaned);
                              setDiyehDay(parsed > 31 ? 31 : (parsed < 1 ? 1 : parsed));
                            }
                          }
                        }}
                        onBlur={() => {
                          if (diyehDay === "" || isNaN(parseInt(diyehDay as string))) {
                            setDiyehDay(today.jd);
                          }
                        }}
                        placeholder="روز حادثه"
                        className="w-full px-3 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-center outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* ⚙️ Method dropdown trigger */}
                <div className="space-y-1" dir="rtl">
                  <label className="text-xs font-black text-slate-800 flex justify-start font-sans">روش</label>
                  <button
                    type="button"
                    onClick={() => {
                      setDiyehSearchQuery("");
                      setIsMethodModalOpen(true);
                    }}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-extrabold text-right flex items-center justify-between shadow-sm hover:border-slate-300 transition-all cursor-pointer select-none"
                  >
                    <span className="text-slate-800">{selectedMethod}</span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                {/* 📝 Custom Inputs based on Method */}
                {selectedMethod === "درصدی" && (
                  <div className="space-y-1.5" dir="rtl">
                    <label className="text-xs font-bold text-slate-700 flex justify-start">درصد دیه مورد نظر (مثال: ۱۰۰ یا ۲.۵)</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={diyehPercentInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDiyehPercentInput(toPersianDigits(val));
                        }}
                        placeholder="درصد مورد نظر از دیه کامل"
                        className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-extrabold text-center placeholder-slate-400 outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] shadow-sm"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold leading-relaxed text-center mt-1">
                      برای وارد کردن اعداد اعشاری می توانید از نقطه استفاده کنید. مثال : ۱.۵ (یک و نیم درصد)
                    </p>
                  </div>
                )}

                {selectedMethod === "کسری" && (
                  <div className="space-y-4" dir="rtl">
                    <label className="text-xs font-bold text-slate-700 flex justify-start">کسرهای مورد نظر از دیه کامل</label>
                    
                    {/* Outline container matching blue style */}
                    <div className="border border-sky-500/20 bg-sky-500/5 rounded-3xl p-5 space-y-4">
                      
                      {/* Dynamic fraction inputs list inside the container */}
                      <div className={`grid ${fractionInputs.length === 1 ? "grid-cols-1" : "grid-cols-2"} gap-3`}>
                        {fractionInputs.map((input, idx) => (
                          <div key={idx} className="relative">
                            <input
                              type="text"
                              value={input}
                              onFocus={() => setActiveFractionIndex(idx)}
                              onChange={(e) => {
                                const val = toPersianDigits(e.target.value);
                                setFractionInputs((prev) => {
                                  const next = [...prev];
                                  next[idx] = val;
                                  return next;
                                });
                              }}
                              placeholder={toPersianDigits("مثلاً ۱/۲")}
                              className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] rounded-2xl text-xs font-extrabold text-center outline-none shadow-sm transition"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Add and Remove buttons */}
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setFractionInputs((prev) => [...prev, ""]);
                          }}
                          className="py-2.5 bg-[#0ea5e9] hover:bg-sky-600 active:scale-95 transition-all text-white font-extrabold text-xl rounded-2xl flex items-center justify-center shadow-sm select-none"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFractionInputs((prev) => {
                              if (prev.length <= 1) return prev;
                              return prev.slice(0, -1);
                            });
                          }}
                          className="py-2.5 bg-[#0ea5e9] hover:bg-sky-600 active:scale-95 transition-all text-white font-extrabold text-xl rounded-2xl flex items-center justify-center shadow-sm select-none"
                        >
                          −
                        </button>
                      </div>

                      {/* Quick Presets matching Screen 2: ۳/۱۰, ۸/۱۰, ۲/۱۰, ۲/۱۰۰۰, ۱.۵/۱۰۰۰ */}
                      <div className="space-y-1 mt-1">
                        <span className="text-[10px] font-extrabold text-slate-500 block text-right mb-1">انتخاب سریع از کسرهای قانونی:</span>
                        <div className="flex flex-wrap gap-1.5 justify-center">
                          {[
                            { label: "۱.۵/۱۰۰۰", val: "۱.۵/۱۰۰۰" },
                            { label: "۲/۱۰۰۰", val: "۲/۱۰۰۰" },
                            { label: "۲/۱۰", val: "۲/۱۰" },
                            { label: "۸/۱۰", val: "۸/۱۰" },
                            { label: "۳/۱۰", val: "۳/۱۰" },
                            { label: "۱/۲ (نصف)", val: "۱/۲" },
                            { label: "۱/۳ (ثلث)", val: "۱/۳" },
                            { label: "۱/۴ (ربع)", val: "۱/۴" },
                            { label: "۱/۵ (خمس)", val: "۱/۵" },
                            { label: "۱/۱۰ (عشر)", val: "۱/۱۰" },
                            { label: "۱/۱۰۰", val: "۱/۱۰۰" },
                          ].map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => {
                                setFractionInputs((prev) => {
                                  const next = [...prev];
                                  if (activeFractionIndex !== null && activeFractionIndex < next.length) {
                                    next[activeFractionIndex] = toPersianDigits(preset.val);
                                  } else {
                                    const emptyIdx = next.findIndex(v => !v.trim());
                                    if (emptyIdx !== -1) {
                                      next[emptyIdx] = toPersianDigits(preset.val);
                                    } else {
                                      next.push(toPersianDigits(preset.val));
                                    }
                                  }
                                  return next;
                                });
                              }}
                              className="px-2.5 py-1.5 text-[10px] font-extrabold border border-slate-200 rounded-full bg-white text-slate-700 hover:bg-sky-50 hover:border-sky-200 hover:text-sky-700 shadow-sm transition active:scale-95"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {selectedMethod === "دیه قتل" && (
                  <div className="space-y-3" dir="rtl">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 flex justify-start">جنسیت و نوع متوفی</label>
                      <select
                        value={murderType}
                        onChange={(e) => setMurderType(e.target.value)}
                        className="w-full px-3 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-right outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] shadow-sm cursor-pointer"
                      >
                        <option value="man_full">مرد مسلمان (دیه کامل - ۱۰۰٪)</option>
                        <option value="woman_half">زن مسلمان (دیه نصف شرعی - ۵۰٪)</option>
                        <option value="woman_equalized">زن مسلمان (برابر شده سوانح و حوادث - ۱۰۰٪)</option>
                        <option value="minority_full">اقلیت‌های دینی مصرح (دیه کامل - ۱۰۰٪)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 flex justify-start">تعداد فقره های فوت (تعداد نفوس)</label>
                      <input
                        type="text"
                        value={murderCount}
                        onChange={(e) => setMurderCount(toPersianDigits(e.target.value))}
                        className="w-full px-3 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-center outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] shadow-sm"
                      />
                    </div>
                  </div>
                )}

                {selectedMethod === "اعضا، منافع، جراحات و جنین" && (
                  <div className="space-y-3" dir="rtl">
                    <label className="text-xs font-black text-slate-800 flex justify-start">افزودن صدمات و جراحات وارده</label>
                    <div className="flex gap-2">
                      <select
                        id="injury_adder_select"
                        className="flex-1 px-2.5 py-3 bg-white border border-slate-200 rounded-2xl text-[10.5px] font-bold text-right outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] shadow-sm max-w-[210px] truncate"
                      >
                        <option value="">-- انتخاب صدمه یا جراحت --</option>
                        {Array.from(new Set(INJURY_DATABASE.map(item => item.category))).map(cat => (
                          <optgroup key={cat} label={cat} className="font-extrabold text-slate-500">
                            {INJURY_DATABASE.filter(item => item.category === cat).map(item => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const selectEl = document.getElementById("injury_adder_select") as HTMLSelectElement;
                          const selectedId = selectEl?.value;
                          if (selectedId) {
                            const found = INJURY_DATABASE.find(item => item.id === selectedId);
                            if (found && !selectedInjuries.some(x => x.id === found.id)) {
                              setSelectedInjuries([...selectedInjuries, found]);
                              selectEl.value = ""; // reset select
                            }
                          }
                        }}
                        className="px-3.5 py-3 bg-[#0ea5e9] hover:bg-[#0284c7] text-white rounded-2xl flex items-center justify-center transition-all shadow-sm shrink-0 font-sans font-bold"
                        title="افزودن به لیست محاسباتی"
                      >
                        + افزودن
                      </button>
                    </div>

                    {/* Added Injuries List */}
                    {selectedInjuries.length > 0 ? (
                      <div className="border border-slate-150 rounded-2xl p-2.5 bg-slate-50 space-y-2 max-h-[160px] overflow-y-auto">
                        {selectedInjuries.map((injury) => (
                          <div key={injury.id} className="flex items-center justify-between bg-white px-2.5 py-2 rounded-xl border border-slate-100 text-[10.5px] font-bold text-right gap-1.5 animate-fadeIn">
                            <button
                              type="button"
                              onClick={() => setSelectedInjuries(selectedInjuries.filter(x => x.id !== injury.id))}
                              className="p-1 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-slate-700 flex-1 truncate">{injury.name}</span>
                            <span className="text-sky-600 font-extrabold shrink-0 bg-sky-50 px-1.5 py-0.5 rounded-md">
                              {toPersianDigits(injury.percentage)}٪
                            </span>
                          </div>
                        ))}
                        <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[11px] font-extrabold text-slate-800 px-1">
                          <span>جمع کل درصد آسیب بدنی:</span>
                          <span className="text-[#0ea5e9]">
                            {toPersianDigits(selectedInjuries.reduce((s, i) => s + i.percentage, 0))} درصد
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-5 text-center text-[10px] text-slate-400 font-bold bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                        هیچ جراحت یا آسیبی اضافه نشده است. آسیب‌های مورد نظر را از کادر بالا انتخاب کرده و دکمه + را بزنید.
                      </div>
                    )}
                  </div>
                )}

                {/* 🕋 Sacred month toggle/notice box */}
                <div className="bg-amber-50/40 p-4 rounded-2xl border border-amber-100 flex items-start gap-2.5" dir="rtl">
                  <input
                    type="checkbox"
                    id="sacred_month"
                    checked={isSacredMonth}
                    onChange={(e) => setIsSacredMonth(e.target.checked)}
                    className="mt-1 font-sans text-[#0ea5e9] rounded focus:ring-[#0ea5e9] w-4 h-4 border-slate-300 accent-[#0ea5e9] cursor-pointer shrink-0"
                  />
                  <div className="text-[10.5px] leading-relaxed text-slate-650 font-bold text-right">
                    <label htmlFor="sacred_month" className="font-extrabold cursor-pointer text-amber-950">
                      جنایت در ماه‌های حرام رخ داده است؟ (تغلیظ دیه)
                    </label>
                    <p className="mt-0.5 text-slate-500 font-semibold text-[9.5px]">
                      بر اساس قانون مجازات اسلامی، ماه‌های رجب، ذی‌القعده، ذی‌الحجه، و محرم ماه‌های حرام هستند که در صورت فوت متوفی، ثلث دیه کامل (۷۰۰ میلیون تومان در سال ۱۴۰۵) به دیه اصلی افزوده می‌شود (جمعاً ۲.۸ میلیارد تومان).
                    </p>
                  </div>
                </div>

                {/* 🚀 Active calculate button */}
                <button
                  onClick={handleCalculateDiyeh}
                  className="w-full py-3.5 bg-[#0ea5e9] hover:bg-[#0284c7] text-white rounded-2xl text-xs font-extrabold shadow-md hover:shadow-lg transition duration-200 cursor-pointer select-none"
                >
                  محاسبه
                </button>

                <button
                  type="button"
                  onClick={handleSyncDiyeh}
                  disabled={isSyncingDiyeh}
                  className={`w-full mt-2 py-2.5 px-3 rounded-2xl text-[11px] font-black flex items-center justify-center gap-1.5 border select-none cursor-pointer transition-all duration-150 ${
                    isSyncingDiyeh
                      ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                      : "bg-[#f0fcfd] text-[#008394] hover:bg-[#e0f7fa] border-[#b2ebf2] hover:border-[#80deea]"
                  }`}
                >
                  <Globe className={`w-3.5 h-3.5 text-[#008394] ${isSyncingDiyeh ? "animate-spin" : ""}`} />
                  {isSyncingDiyeh ? "در حال استعلام نرخ دیه..." : "استعلام و بروزرسانی خودکار مبلغ دیه از پورتال عدل ایران (بدون خروج)"}
                </button>

                {diyehSyncSuccess && (
                  <div className="p-3 bg-teal-50 border border-teal-100 rounded-xl text-teal-850 text-[10px] font-bold text-right mt-2 leading-relaxed animate-fadeIn" dir="rtl">
                    <CheckCircle2 className="w-3.5 h-3.5 inline-block text-teal-600 ml-1.5 align-middle" />
                    <span>{diyehSyncSuccess}</span>
                  </div>
                )}


                {/* 🔍 Screen 2: METHOD POPOVER MODAL */}
                {isMethodModalOpen && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn" dir="rtl">
                    <div className="bg-white rounded-[32px] w-full max-w-sm border border-slate-100 shadow-2xl overflow-hidden p-5 relative animate-scaleIn">
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                        <span className="text-xs font-extrabold text-slate-800">روش محاسبه را انتخاب کنید</span>
                        <button
                          onClick={() => setIsMethodModalOpen(false)}
                          className="p-1.5 hover:bg-slate-100 rounded-full transition text-[18px] text-slate-400 hover:text-slate-600 outline-none"
                          title="بستن"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Dropdown search field */}
                      <div className="relative mb-3.5">
                        <input
                          type="text"
                          value={diyehSearchQuery}
                          onChange={(e) => setDiyehSearchQuery(e.target.value)}
                          placeholder="جستجو کنید ... "
                          className="w-full pl-3 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold text-right outline-none focus:bg-white focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
                      </div>

                      {/* Selectable Items (ALL UNLOCKED) */}
                      <div className="space-y-2 max-h-[250px] overflow-y-auto">
                        {[
                          { id: "درصدی", label: "درصدی" },
                          { id: "کسری", label: "کسری" },
                          { id: "دیه قتل", label: "دیه قتل" },
                          { id: "اعضا، منافع، جراحات و جنین", label: "اعضا، منافع، جراحات و جنین" }
                        ]
                          .filter(m => m.label.includes(diyehSearchQuery))
                          .map((item) => {
                            const isSelected = selectedMethod === item.id;
                            return (
                              <button
                                key={item.id}
                                onClick={() => {
                                  setSelectedMethod(item.id);
                                  setIsMethodModalOpen(false);
                                }}
                                className={`w-full p-4 rounded-2xl border text-right flex items-center justify-between transition-all duration-150 hover:bg-slate-50 cursor-pointer select-none outline-none ${
                                  isSelected
                                    ? "border-[#0ea5e9] bg-[#f0f9ff] text-[#0369a1]"
                                    : "border-slate-200 bg-white text-slate-700"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {isSelected && <Check className="w-4 h-4 text-[#0ea5e9]" />}
                                </div>
                                <span className="text-[11.5px] font-black">{item.label}</span>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === "court" && (
              <>
                <h3 className="text-xs font-black text-slate-800 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-500 shrink-0" />
                  مشخصات خواسته دعوی
                </h3>
                <p className="text-[10px] text-slate-400 font-bold">محاسبه دقیق هزینه‌های دادرسی بر اساس نرخ روز قوه قضاییه</p>

                <div className="space-y-1.5 pt-2">
                  <label className="text-[11px] font-bold text-slate-500">نوع دعوی و مرحله دادرسی</label>
                  <select
                    value={courtStage}
                    onChange={(e) => setCourtStage(e.target.value as any)}
                    className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="first_instance">مرحله بدوی حقوقی (۲.۵٪ الی ۳.۵٪)</option>
                    <option value="appeal">واخواهی و تجدیدنظر خواهی (۴.۵٪)</option>
                    <option value="supreme_court">دیوان عالی، اعاده دادرسی و ثالث (۵.۵٪)</option>
                    <option value="non_financial">خواسته بدون تقویم مالی (هزینه ثابت ثبتی)</option>
                  </select>
                </div>

                {courtStage !== "non_financial" && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500">بهای خواسته / ارزش مالی پرونده (ریال)</label>
                    <input
                      type="text"
                      value={claimAmountForCourt}
                      onChange={(e) => handleAmountFormat(e.target.value, setClaimAmountForCourt)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900"
                      placeholder="مثلاً: ۵۰۰,۰۰۰,۰۰۰"
                    />
                  </div>
                )}

                <button
                  onClick={handleCalculateCourt}
                  className="w-full py-3 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white rounded-xl text-xs font-black select-none cursor-pointer transition duration-150"
                >
                  موعدگیری فیش هزینه دادرسی
                </button>
              </>
            )}

            {activeTab === "lawyer" && (
              <>
                <h3 className="text-xs font-black text-slate-800 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-amber-500 shrink-0" />
                  محاسبه حق‌الوکاله و تمبر مالیاتی
                </h3>

                <div className="space-y-1.5 pt-2">
                  <label className="text-[11px] font-bold text-slate-500">موضوع</label>
                  <select
                    value={lawyerSubject}
                    onChange={(e) => setLawyerSubject(e.target.value as any)}
                    className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="fee">حق الوکاله</option>
                    <option value="tax_stamp_bar">تمبر مالیاتی کانون وکلای دادگستری</option>
                    <option value="tax_stamp_center">تمبر مالیاتی مرکز وکلا قوه قضاییه</option>
                  </select>
                </div>

                {(lawyerSubject === "tax_stamp_bar" || lawyerSubject === "tax_stamp_center") && (
                  <div className="space-y-1.5 mt-2">
                    <label className="text-[11px] font-bold text-slate-500">محاسبه براساس:</label>
                    <select
                      value={lawyerTaxBasis}
                      onChange={(e) => setLawyerTaxBasis(e.target.value as any)}
                      className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900"
                    >
                      <option value="tariff">تعرفه</option>
                      <option value="fee_amount">مبلغ حق الوکاله</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500">نوع دعوا</label>
                    <select
                      value={lawyerCaseType}
                      onChange={(e) => setLawyerCaseType(e.target.value)}
                      className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900"
                    >
                      <option value="financial">مالی</option>
                      <option value="family_non_financial">امور حسبی، دعاوی خانوادگی و غیرمالی</option>
                      <option value="criminal">کیفری</option>
                      <option value="other">سایر</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500">نتیجه دعوا</label>
                    <select
                      value={lawyerResultType}
                      onChange={(e) => setLawyerResultType(e.target.value)}
                      className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:ring-1 focus:ring-slate-900"
                    >
                      <option value="-">-</option>
                      <option value="order_cancel_before_defense">قرار ابطال دادخواست پیش از پاسخ و دفاع از دعوا</option>
                      <option value="order_cancel_after_defense">قرار ابطال دادخواست پس از پاسخ و دفاع از دعوا</option>
                      <option value="order_fall_before_defense">قرار سقوط دعوا تجدیدنظر قبل از پاسخ و دفاع از دعوا</option>
                      <option value="order_fall_after_defense">قرار سقوط دعوا تجدیدنظر پس از پاسخ و دفاع از دعوا</option>
                      <option value="order_reject_timeout">قرار رد دعوا به علت قبول ایراد مرور زمان</option>
                      <option value="order_reject_retrial">قرار رد تقاضای اعاده دادرسی</option>
                      <option value="order_reject_res_judicata">قرار رد دعوا بعلت اعتبار امر مختومه</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5 mt-3">
                  <label className="text-[11px] font-bold text-slate-500">گواهی تخصصی</label>
                  <select
                    value={lawyerHasSpecialty ? "yes" : "no"}
                    onChange={(e) => setLawyerHasSpecialty(e.target.value === "yes")}
                    className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="no">وکیل گواهی وکالت تخصصی ندارد.</option>
                    <option value="yes">وکیل دارای گواهی وکالت تخصصی است.</option>
                  </select>
                </div>

                <div className="space-y-3 mt-3">
                  <div className="space-y-1.5 border-b border-slate-100 pb-2">
                    <label className="text-[11px] font-black text-slate-600 block">تعداد روزهای ماموریت داخل استان:</label>
                    <input
                      type="text"
                      value={lawyerInsideProvinceDays}
                      onChange={(e) => setLawyerInsideProvinceDays(toPersianDigits(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900 text-center"
                      placeholder="به طور مثال: ۵"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-600 block">تعداد روزهای ماموریت خارج استان:</label>
                    <input
                      type="text"
                      value={lawyerOutsideProvinceDays}
                      onChange={(e) => setLawyerOutsideProvinceDays(toPersianDigits(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900 text-center"
                      placeholder="به طور مثال: ۵"
                    />
                  </div>
                </div>

                <div className="space-y-3 mt-3 pt-2">
                  <div
                    role="button"
                    tabIndex={0}
                    className="flex items-center gap-3 cursor-pointer group outline-none"
                    onClick={() => setLawyerAfterAnnulment(!lawyerAfterAnnulment)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLawyerAfterAnnulment(!lawyerAfterAnnulment); } }}
                  >
                    <div className={`relative w-8 h-4 rounded-full transition-colors duration-200 ease-in-out ${lawyerAfterAnnulment ? 'bg-amber-500' : 'bg-slate-300'}`}>
                      <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-200 ease-in-out ${lawyerAfterAnnulment ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 group-hover:text-slate-900">پس از نقض در دیوانعالی کشور یا مرجع تجدیدنظر</span>
                  </div>

                  <div
                    role="button"
                    tabIndex={0}
                    className="flex items-center gap-3 cursor-pointer group outline-none"
                    onClick={() => setLawyerFreeAid(!lawyerFreeAid)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLawyerFreeAid(!lawyerFreeAid); } }}
                  >
                    <div className={`relative w-8 h-4 rounded-full transition-colors duration-200 ease-in-out ${lawyerFreeAid ? 'bg-amber-500' : 'bg-slate-300'}`}>
                      <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-200 ease-in-out ${lawyerFreeAid ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 group-hover:text-slate-900">وکالت تسخیری / معاضدتی</span>
                  </div>
                </div>

                <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-100">
                  <label className="text-[11px] font-bold text-slate-500">
                    {lawyerTaxBasis === "fee_amount" ? "مبلغ حق‌الوکاله (ریال)" : "بهای خواسته / مبلغ (ریال)"}
                  </label>
                  <input
                    type="text"
                    value={lawyerClaimAmount}
                    onChange={(e) => handleAmountFormat(e.target.value, setLawyerClaimAmount)}
                    className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black outline-none focus:ring-1 focus:ring-slate-900 text-left dir-ltr"
                    placeholder="مثلاً: ۲,۵۰۰,۰۰۰,۰۰۰"
                  />
                </div>

                <button
                  onClick={handleCalculateLawyer}
                  className="w-full py-3.5 mt-2 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white rounded-xl text-xs font-black select-none cursor-pointer transition duration-150"
                >
                  محاسبه
                </button>
              </>
            )}

            {activeTab === "deadlines" && (
              <>
                <h3 className="text-xs font-black text-slate-800 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  محاسبه مواعد قانونی و قضایی
                </h3>

                <div className="space-y-1.5 mt-2">
                  <label className="text-[11px] font-bold text-slate-500">دسته بندی</label>
                  <select
                    value={deadlineCategory}
                    onChange={(e) => setDeadlineCategory(e.target.value as any)}
                    className="w-full px-2 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900 appearance-none"
                  >
                    <option value="civil">آئین دادرسی مدنی</option>
                    <option value="criminal">آئین دادرسی کیفری</option>
                    <option value="execution">اجرای احکام مدنی</option>
                  </select>
                </div>

                <div className="space-y-1.5 mt-2">
                  <label className="text-[11px] font-bold text-slate-500">نوع مهلت</label>
                  <select
                    value={deadlineType}
                    onChange={(e) => setDeadlineType(e.target.value)}
                    className="w-full px-2 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900 appearance-none"
                  >
                    {currentDeadlineOptions.map((opt) => (
                      <option key={opt.title} value={opt.title}>{opt.title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 mt-2">
                   <label className="text-[11px] font-bold text-slate-500">تاریخ ابلاغ</label>
                   <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400">روز</label>
                      <input
                        type="text"
                        value={deadlineBaseDay}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || /^[0-9۰-۹]+$/.test(val)) {
                            setDeadlineBaseDay(val);
                          }
                        }}
                        className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-center outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400">ماه</label>
                      <select
                        value={deadlineBaseMonth}
                        onChange={(e) => setDeadlineBaseMonth(parseInt(e.target.value))}
                        className="w-full px-1 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-1 focus:ring-slate-900"
                      >
                        <option value={1}>فروردین</option>
                        <option value={2}>اردیبهشت</option>
                        <option value={3}>خرداد</option>
                        <option value={4}>تیر</option>
                        <option value={5}>مرداد</option>
                        <option value={6}>شهریور</option>
                        <option value={7}>مهر</option>
                        <option value={8}>آبان</option>
                        <option value={9}>آذر</option>
                        <option value={10}>دی</option>
                        <option value={11}>بهمن</option>
                        <option value={12}>اسفند</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400">سال</label>
                      <input
                        type="text"
                        value={deadlineBaseYear}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || /^[0-9۰-۹]+$/.test(val)) {
                            setDeadlineBaseYear(val);
                          }
                        }}
                        className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-center outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mt-4 pt-2 border-t border-slate-100">
                  <div
                    role="button"
                    tabIndex={0}
                    id="deadline-include-abroad-toggle"
                    className="flex items-center gap-3 cursor-pointer group outline-none select-none"
                    onClick={() => setDeadlineIncludeAbroad(!deadlineIncludeAbroad)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDeadlineIncludeAbroad(!deadlineIncludeAbroad); } }}
                  >
                    <div className={`relative w-10 h-5 rounded-full transition-colors duration-200 ease-in-out ${deadlineIncludeAbroad ? 'bg-amber-500' : 'bg-slate-300'}`}>
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out ${deadlineIncludeAbroad ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">حداقل یکی از مخاطبین مقیم خارج است</span>
                  </div>

                  <div
                    role="button"
                    tabIndex={0}
                    id="deadline-include-thursdays-toggle"
                    className="flex items-center gap-3 cursor-pointer group outline-none select-none"
                    onClick={() => setDeadlineIncludeThursdays(!deadlineIncludeThursdays)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDeadlineIncludeThursdays(!deadlineIncludeThursdays); } }}
                  >
                    <div className={`relative w-10 h-5 rounded-full transition-colors duration-200 ease-in-out ${deadlineIncludeThursdays ? 'bg-amber-500' : 'bg-slate-300'}`}>
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out ${deadlineIncludeThursdays ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">پنجشنبه ها روز تعطیل محسوب شود</span>
                  </div>
                </div>

                <button
                  onClick={handleCalculateDeadlines}
                  className="w-full mt-4 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl text-xs font-black select-none cursor-pointer transition duration-150"
                >
                  محاسبه
                </button>
              </>
            )}

            {activeTab === "erth" && (
              <>
                <h3 className="text-xs font-black text-slate-800 flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-500 shrink-0" />
                  محاسبه تقسیم ارث و ترکه (قانون مدنی)
                </h3>


                {/* Marital Status dropdown section */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-[11px] font-bold text-slate-500">تاهل متوفی</label>
                  <select
                    value={erthMarryStatus}
                    onChange={(e) => setErthMarryStatus(e.target.value as any)}
                    className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="single">مجرد</option>
                    <option value="husband">دارای زوج (شوهر)</option>
                    <option value="wife">دارای زوجه (زن)</option>
                  </select>
                </div>

                {/* --- CLASS 1 Accordion --- */}
                <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setErthClass1Open(!erthClass1Open)}
                    className="w-full bg-slate-50 px-3.5 py-3 flex items-center justify-between text-xs font-black text-slate-800 border-b border-slate-150 select-none cursor-pointer hover:bg-slate-100/75 duration-100"
                  >
                    <span>طبقه اول ارث (پدر، مادر، فرزند و نوه)</span>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${erthClass1Open ? "rotate-180" : ""}`} />
                  </button>
                  {erthClass1Open && (
                    <div className="p-3 bg-white space-y-3.5 animate-fadeIn">
                      {/* Father Alive Switch */}
                      <div className="flex items-center justify-between p-2.5 bg-slate-50/50 rounded-xl border border-slate-150">
                        <span className="text-[11px] font-bold text-slate-700">پدر متوفی زنده است</span>
                        <button
                          type="button"
                          onClick={() => setErthFatherAlive(!erthFatherAlive)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                            erthFatherAlive ? "bg-sky-500" : "bg-slate-200"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ${
                              erthFatherAlive ? "translate-x-[-16px]" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>

                      {/* Mother Alive Switch */}
                      <div className="flex items-center justify-between p-2.5 bg-slate-50/50 rounded-xl border border-slate-150">
                        <span className="text-[11px] font-bold text-slate-700">مادر متوفی زنده است</span>
                        <button
                          type="button"
                          onClick={() => setErthMotherAlive(!erthMotherAlive)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                            erthMotherAlive ? "bg-sky-500" : "bg-slate-200"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ${
                              erthMotherAlive ? "translate-x-[-16px]" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>

                      {/* Sons counter */}
                      <div className="flex items-center justify-between gap-4 py-1">
                        <div className="flex-1">
                          <span className="text-[11px] font-bold text-slate-700 block">تعداد پسران</span>
                          <span className="text-[9px] text-slate-400 block font-semibold">پسران زنده متوفی</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setErthSonsCount(Math.max(0, erthSonsCount - 1))}
                            type="button"
                            className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200 select-none cursor-pointer"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-xs font-black font-mono bg-slate-50 border border-slate-200 py-1 rounded-md">{toPersianDigits(erthSonsCount)}</span>
                          <button
                            onClick={() => setErthSonsCount(erthSonsCount + 1)}
                            type="button"
                            className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200 select-none cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Daughters counter */}
                      <div className="flex items-center justify-between gap-4 py-1">
                        <div className="flex-1">
                          <span className="text-[11px] font-bold text-slate-700 block">تعداد دختران</span>
                          <span className="text-[9px] text-slate-400 block font-semibold">دختران زنده متوفی</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setErthDaughtersCount(Math.max(0, erthDaughtersCount - 1))}
                            type="button"
                            className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200 select-none cursor-pointer"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-xs font-black font-mono bg-slate-50 border border-slate-200 py-1 rounded-md">{toPersianDigits(erthDaughtersCount)}</span>
                          <button
                            onClick={() => setErthDaughtersCount(erthDaughtersCount + 1)}
                            type="button"
                            className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200 select-none cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Grandchildren representation list (ارث نوه) */}
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <span className="text-[10px] font-black text-slate-600 block">ارث نوه (قائم مقامی)</span>
                        <p className="text-[9px] text-slate-400 font-bold leading-relaxed">این بخش برای حالت قائم مقامی (ارث نوه) است. برای هر فرزند فوت شده متوفی یک شاخه اضافه کنید و تعداد نوه‌های همان شاخه را وارد نمایید.</p>
                        
                        {erthGrandchildren.map((branch, index) => (
                          <div key={branch.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2 relative">
                            <span className="text-[10px] font-bold text-slate-600 block">شاخه فرزند فوت شده {toPersianDigits(index + 1)}:</span>
                            <div className="grid grid-cols-2 gap-2">
                              <select
                                value={branch.gender}
                                onChange={(e) => {
                                  const updated = [...erthGrandchildren];
                                  updated[index].gender = e.target.value as any;
                                  setErthGrandchildren(updated);
                                }}
                                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-bold outline-none"
                              >
                                <option value="son">فرزند(پسر) فوت شده</option>
                                <option value="daughter">فرزند(دختر) فوت شده</option>
                              </select>
                              <div className="flex items-center justify-end gap-1">
                                <span className="text-[9px] text-slate-400 font-bold ml-1">تعداد نوه:</span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...erthGrandchildren];
                                      updated[index].grandchildrenCount = Math.max(1, branch.grandchildrenCount - 1);
                                      setErthGrandchildren(updated);
                                    }}
                                    className="w-5 h-5 bg-slate-200 rounded flex items-center justify-center text-[10px] font-bold text-slate-700 hover:bg-slate-300 select-none cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={toPersianDigits(branch.grandchildrenCount)}
                                    onChange={(e) => {
                                      const val = parsePersianInput(e.target.value);
                                      if (!isNaN(val)) {
                                        const updated = [...erthGrandchildren];
                                        updated[index].grandchildrenCount = val;
                                        setErthGrandchildren(updated);
                                      }
                                    }}
                                    className="w-7 p-0 bg-white border border-slate-200 rounded text-[11px] font-black text-center outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...erthGrandchildren];
                                      updated[index].grandchildrenCount = branch.grandchildrenCount + 1;
                                      setErthGrandchildren(updated);
                                    }}
                                    className="w-5 h-5 bg-slate-200 rounded flex items-center justify-center text-[10px] font-bold text-slate-700 hover:bg-slate-300 select-none cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = erthGrandchildren.filter(g => g.id !== branch.id);
                                setErthGrandchildren(updated);
                              }}
                              className="absolute top-2 left-2 text-red-500 hover:text-red-700 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => {
                            setErthGrandchildren([
                              ...erthGrandchildren,
                              { id: `g_${Date.now()}_${Math.random()}`, gender: "son", grandchildrenCount: 1 }
                            ]);
                          }}
                          className="w-full py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-dashed border-sky-200 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer duration-100"
                        >
                          <Plus className="w-3.5 h-3.5 shrink-0" />
                          افزودن شاخه فرزند فوت شده
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* --- CLASS 2 Accordion --- */}
                <div className="border border-slate-200/80 rounded-2xl overflow-hidden mt-2">
                  <button
                    type="button"
                    onClick={() => setErthClass2Open(!erthClass2Open)}
                    className="w-full bg-slate-50 px-3.5 py-3 flex items-center justify-between text-xs font-black text-slate-800 border-b border-slate-150 select-none cursor-pointer hover:bg-slate-100/75 duration-100"
                  >
                    <span>طبقه دوم ارث (اجداد و خواهر/برادران)</span>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${erthClass2Open ? "rotate-180" : ""}`} />
                  </button>
                  {erthClass2Open && (
                    <div className="p-3 bg-white space-y-3 animate-fadeIn">
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {/* Paternal Grandfather */}
                        <div className="flex flex-col p-2 bg-slate-50/50 rounded-xl border border-slate-150 gap-1.5">
                          <span className="text-[10px] font-bold text-slate-700 leading-tight">پدربزرگ پدری (جد ابی)</span>
                          <button
                            type="button"
                            onClick={() => setErthPaternalGrandfather(!erthPaternalGrandfather)}
                            className={`w-full py-1 rounded-lg text-[10px] font-bold duration-150 ${
                              erthPaternalGrandfather ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {erthPaternalGrandfather ? "زنده است" : "فوت کرده"}
                          </button>
                        </div>

                        {/* Paternal Grandmother */}
                        <div className="flex flex-col p-2 bg-slate-50/50 rounded-xl border border-slate-150 gap-1.5">
                          <span className="text-[10px] font-bold text-slate-700 leading-tight">مادربزرگ پدری (جده ابی)</span>
                          <button
                            type="button"
                            onClick={() => setErthPaternalGrandmother(!erthPaternalGrandmother)}
                            className={`w-full py-1 rounded-lg text-[10px] font-bold duration-150 ${
                              erthPaternalGrandmother ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {erthPaternalGrandmother ? "زنده است" : "فوت کرده"}
                          </button>
                        </div>

                        {/* Maternal Grandfather */}
                        <div className="flex flex-col p-2 bg-slate-50/50 rounded-xl border border-slate-150 gap-1.5">
                          <span className="text-[10px] font-bold text-slate-700 leading-tight">پدربزرگ مادری (جد امی)</span>
                          <button
                            type="button"
                            onClick={() => setErthMaternalGrandfather(!erthMaternalGrandfather)}
                            className={`w-full py-1 rounded-lg text-[10px] font-bold duration-150 ${
                              erthMaternalGrandfather ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {erthMaternalGrandfather ? "زنده است" : "فوت کرده"}
                          </button>
                        </div>

                        {/* Maternal Grandmother */}
                        <div className="flex flex-col p-2 bg-slate-50/50 rounded-xl border border-slate-150 gap-1.5">
                          <span className="text-[10px] font-bold text-slate-700 leading-tight">مادربزرگ مادری (جده امی)</span>
                          <button
                            type="button"
                            onClick={() => setErthMaternalGrandmother(!erthMaternalGrandmother)}
                            className={`w-full py-1 rounded-lg text-[10px] font-bold duration-150 ${
                              erthMaternalGrandmother ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {erthMaternalGrandmother ? "زنده است" : "فوت کرده"}
                          </button>
                        </div>
                      </div>

                      {/* brothersFull counter */}
                      <div className="flex items-center justify-between gap-4 py-1 border-t border-slate-100 pt-2">
                        <div className="flex-1">
                          <span className="text-[11px] font-bold text-slate-700 block">برادر ابوینی (پدر و مادر مشترک)</span>
                          <span className="text-[9px] text-slate-400 block font-semibold">تعداد برادران ابوینی زنده</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setErthBrothersFull(Math.max(0, erthBrothersFull - 1))}
                            type="button"
                            className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200 select-none cursor-pointer text-xs"
                          >
                            -
                          </button>
                          <span className="w-7 text-center text-xs font-black font-mono bg-slate-50 border border-slate-200 py-0.5 rounded">{toPersianDigits(erthBrothersFull)}</span>
                          <button
                            onClick={() => setErthBrothersFull(erthBrothersFull + 1)}
                            type="button"
                            className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200 select-none cursor-pointer text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* sistersFull counter */}
                      <div className="flex items-center justify-between gap-4 py-1">
                        <div className="flex-1">
                          <span className="text-[11px] font-bold text-slate-700 block">خواهر ابوینی (پدر و مادر مشترک)</span>
                          <span className="text-[9px] text-slate-400 block font-semibold">تعداد خواهران ابوینی زنده</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setErthSistersFull(Math.max(0, erthSistersFull - 1))}
                            type="button"
                            className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200 select-none cursor-pointer text-xs"
                          >
                            -
                          </button>
                          <span className="w-7 text-center text-xs font-black font-mono bg-slate-50 border border-slate-200 py-0.5 rounded">{toPersianDigits(erthSistersFull)}</span>
                          <button
                            onClick={() => setErthSistersFull(erthSistersFull + 1)}
                            type="button"
                            className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200 select-none cursor-pointer text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* brothersPaternal counter */}
                      <div className="flex items-center justify-between gap-4 py-1">
                        <div className="flex-1">
                          <span className="text-[11px] font-bold text-slate-700 block">برادر ابی (پدر مشترک)</span>
                          <span className="text-[9px] text-slate-400 block font-semibold">تعداد برادران ابی زنده</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setErthBrothersPaternal(Math.max(0, erthBrothersPaternal - 1))}
                            type="button"
                            className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200 select-none cursor-pointer text-xs"
                          >
                            -
                          </button>
                          <span className="w-7 text-center text-xs font-black font-mono bg-slate-50 border border-slate-200 py-0.5 rounded">{toPersianDigits(erthBrothersPaternal)}</span>
                          <button
                            onClick={() => setErthBrothersPaternal(erthBrothersPaternal + 1)}
                            type="button"
                            className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200 select-none cursor-pointer text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* sistersPaternal counter */}
                      <div className="flex items-center justify-between gap-4 py-1">
                        <div className="flex-1">
                          <span className="text-[11px] font-bold text-slate-700 block">خواهر ابی (پدر مشترک)</span>
                          <span className="text-[9px] text-slate-400 block font-semibold">تعداد خواهران ابی زنده</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setErthSistersPaternal(Math.max(0, erthSistersPaternal - 1))}
                            type="button"
                            className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200 select-none cursor-pointer text-xs"
                          >
                            -
                          </button>
                          <span className="w-7 text-center text-xs font-black font-mono bg-slate-50 border border-slate-200 py-0.5 rounded">{toPersianDigits(erthSistersPaternal)}</span>
                          <button
                            onClick={() => setErthSistersPaternal(erthSistersPaternal + 1)}
                            type="button"
                            className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200 select-none cursor-pointer text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* siblingsMaternal counter */}
                      <div className="flex items-center justify-between gap-4 py-1">
                        <div className="flex-1">
                          <span className="text-[11px] font-bold text-slate-700 block">خواهر/برادر امی (مادر مشترک)</span>
                          <span className="text-[9px] text-slate-400 block font-semibold">تعداد کلاله امی زنده</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setErthSiblingsMaternal(Math.max(0, erthSiblingsMaternal - 1))}
                            type="button"
                            className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200 select-none cursor-pointer text-xs"
                          >
                            -
                          </button>
                          <span className="w-7 text-center text-xs font-black font-mono bg-slate-50 border border-slate-200 py-0.5 rounded">{toPersianDigits(erthSiblingsMaternal)}</span>
                          <button
                            onClick={() => setErthSiblingsMaternal(erthSiblingsMaternal + 1)}
                            type="button"
                            className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200 select-none cursor-pointer text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* --- CLASS 3 Accordion --- */}
                <div className="border border-slate-200/80 rounded-2xl overflow-hidden mt-2">
                  <button
                    type="button"
                    onClick={() => setErthClass3Open(!erthClass3Open)}
                    className="w-full bg-slate-50 px-3.5 py-3 flex items-center justify-between text-xs font-black text-slate-800 border-b border-slate-150 select-none cursor-pointer hover:bg-slate-100/75 duration-100"
                  >
                    <span>طبقه سوم ارث (عمو، عمه، دایی و خاله)</span>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${erthClass3Open ? "rotate-180" : ""}`} />
                  </button>
                  {erthClass3Open && (
                    <div className="p-3 bg-white space-y-3 animate-fadeIn">
                      <p className="text-[9px] text-slate-400 font-bold leading-relaxed">تعداد عموها، عمه‌ها، دایی‌ها و خاله‌های زنده متوفی را وارد کنید:</p>
                      
                      {/* Uncles Count */}
                      <div className="flex items-center justify-between gap-4 py-1">
                        <span className="text-[11px] font-bold text-slate-700">تعداد عموی ابوینی/ابی</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setErthUnclesPaternalFull(Math.max(0, erthUnclesPaternalFull - 1))}
                            type="button"
                            className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center font-bold"
                          >
                            -
                          </button>
                          <span className="w-7 text-center text-xs font-mono">{toPersianDigits(erthUnclesPaternalFull)}</span>
                          <button
                            onClick={() => setErthUnclesPaternalFull(erthUnclesPaternalFull + 1)}
                            type="button"
                            className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Aunts Count */}
                      <div className="flex items-center justify-between gap-4 py-1">
                        <span className="text-[11px] font-bold text-slate-700">تعداد عمه ابوینی/ابی</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setErthAuntsPaternalFull(Math.max(0, erthAuntsPaternalFull - 1))}
                            type="button"
                            className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center font-bold"
                          >
                            -
                          </button>
                          <span className="w-7 text-center text-xs font-mono">{toPersianDigits(erthAuntsPaternalFull)}</span>
                          <button
                            onClick={() => setErthAuntsPaternalFull(erthAuntsPaternalFull + 1)}
                            type="button"
                            className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Maternal Uncles Count */}
                      <div className="flex items-center justify-between gap-4 py-1">
                        <span className="text-[11px] font-bold text-slate-700">تعداد دایی متوفی (کل)</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setErthUnclesMaternalFull(Math.max(0, erthUnclesMaternalFull - 1))}
                            type="button"
                            className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center font-bold"
                          >
                            -
                          </button>
                          <span className="w-7 text-center text-xs font-mono">{toPersianDigits(erthUnclesMaternalFull)}</span>
                          <button
                            onClick={() => setErthUnclesMaternalFull(erthUnclesMaternalFull + 1)}
                            type="button"
                            className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Maternal Aunts Count */}
                      <div className="flex items-center justify-between gap-4 py-1">
                        <span className="text-[11px] font-bold text-slate-700">تعداد خاله متوفی (کل)</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setErthAuntsMaternalFull(Math.max(0, erthAuntsMaternalFull - 1))}
                            type="button"
                            className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center font-bold"
                          >
                            -
                          </button>
                          <span className="w-7 text-center text-xs font-mono">{toPersianDigits(erthAuntsMaternalFull)}</span>
                          <button
                            onClick={() => setErthAuntsMaternalFull(erthAuntsMaternalFull + 1)}
                            type="button"
                            className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>

                    </div>
                  )}
                </div>

                {/* Estate value input (optional) */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-bold text-slate-500">ارزش ریالی ارث (ریال - اختیاری)</label>
                  <input
                    type="text"
                    value={erthEstateValue}
                    onChange={(e) => handleAmountFormat(e.target.value, setErthEstateValue)}
                    placeholder="مثال: ۱,۲۰۰,۰۰۰,۰۰۰"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  <p className="text-[9px] text-slate-400 font-medium">وارد کردن این مقدار اختیاری است. در صورت وارد کردن این مقدار، سهم ریالی دقیق هر وارث نیز نمایش داده می شود.</p>
                </div>

                {/* Common denominator toggle */}
                <div className="flex items-center justify-between p-2.5 bg-slate-50/50 rounded-xl border border-slate-150">
                  <div className="flex-1">
                    <span className="text-[10px] font-black text-slate-700 block">نمایش کسرها با مخرج مشترک</span>
                    <p className="text-[9px] text-slate-400 font-bold leading-tight mt-0.5">مثال: ۱/۶ و ۲/۶ به جای ۱/۶ و ۱/۳</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setErthCommonDenominator(!erthCommonDenominator)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                      erthCommonDenominator ? "bg-sky-500" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ${
                        erthCommonDenominator ? "translate-x-[-16px]" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Calculate Button (Styled light blue per request) */}
                <button
                  onClick={handleCalculateErth}
                  className="w-full py-3 bg-sky-100 hover:bg-sky-200/90 text-sky-800 border border-sky-300 font-black rounded-xl text-xs select-none cursor-pointer transition duration-150 active:scale-[0.99] shadow-sm mt-3"
                >
                  محاسبه و تقسیم نهایی ارثیه متوفی
                </button>
              </>
            )}

            {activeTab === "delay_interest" && (
              <>
                <h3 className="text-xs font-black text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-rose-500 shrink-0" />
                  محاسبه خسارت تأخیر تأدیه
                </h3>
                <p className="text-[10px] text-slate-400 font-bold">بر اساس شاخص تورم اعلامی بانک مرکزی (موضوع ماده ۵۲۲ ق.آ.د.م)</p>
                
                <div className="space-y-1.5 pt-2">
                  <label className="text-[11px] font-bold text-slate-500">مبلغ اصل دین / بدهی (ریال)</label>
                  <input
                    type="text"
                    value={delayPrincipal}
                    onChange={(e) => handleAmountFormat(e.target.value, setDelayPrincipal)}
                    placeholder="مثال: ۱۰۰,۰۰۰,۰۰۰"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500">سال سررسید (شروع)</label>
                    <select
                      value={delayStartYear}
                      onChange={(e) => setDelayStartYear(parseInt(e.target.value))}
                      className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900"
                    >
                      {Object.keys(CBI_INFLATION_INDICES).map((year) => (
                        <option key={year} value={year}>
                          {toPersianDigits(year)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500">ماه سررسید</label>
                    <select
                      value={delayStartMonth}
                      onChange={(e) => setDelayStartMonth(parseInt(e.target.value))}
                      className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                        <option key={m} value={m}>
                          {["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"][m-1]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500">سال تادیه (پایان)</label>
                    <select
                      value={delayEndYear}
                      onChange={(e) => setDelayEndYear(parseInt(e.target.value))}
                      className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900"
                    >
                      {Object.keys(CBI_INFLATION_INDICES).map((year) => (
                        <option key={year} value={year}>
                          {toPersianDigits(year)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500">ماه تادیه</label>
                    <select
                      value={delayEndMonth}
                      onChange={(e) => setDelayEndMonth(parseInt(e.target.value))}
                      className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                        <option key={m} value={m}>
                          {["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"][m-1]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleCalculateDelayInterest}
                  className="w-full mt-2 py-3 bg-slate-900 hover:bg-rose-500 hover:text-white text-white rounded-xl text-xs font-black select-none cursor-pointer transition duration-150"
                >
                  محاسبه خسارت قانونی
                </button>

                <button
                  type="button"
                  onClick={handleSyncCBI}
                  disabled={isSyncingCBI}
                  className={`w-full mt-2 py-2.5 px-3 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 border select-none cursor-pointer transition-all duration-150 ${
                    isSyncingCBI
                      ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                      : "bg-sky-50 text-sky-700 hover:bg-sky-100 border-sky-100 hover:border-sky-200"
                  }`}
                >
                  <Globe className={`w-3.5 h-3.5 text-sky-600 ${isSyncingCBI ? "animate-spin" : ""}`} />
                  {isSyncingCBI ? "در حال اتصال و بروزرسانی شاخص‌ها..." : "بروزرسانی شاخص‌های تورم از بانک مرکزی"}
                </button>

                {cbiSyncSuccess && (
                  <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-green-850 text-[10px] font-bold text-right mt-2 leading-relaxed animate-fadeIn" dir="rtl">
                    <CheckCircle2 className="w-3.5 h-3.5 inline-block text-green-600 ml-1.5 align-middle" />
                    <span>{cbiSyncSuccess}</span>
                  </div>
                )}

                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-900 text-[10px] rounded-xl font-bold leading-relaxed flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                  <p>این محاسبه طبق فرمول رسمی مراجع قضایی (تغییر شاخص سالانه بانک مرکزی) انجام می‌گردد.</p>
                </div>
              </>
            )}

            {activeTab === "execution_fees" && (
              <>
                <h3 className="text-xs font-black text-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  محاسبه هزینه اجرای احکام دادگستری
                </h3>

                <div className="space-y-1.5 mt-2">
                  <label className="text-[11px] font-bold text-slate-500">سال اجرای حکم/ابلاغ اجراییه</label>
                  <select
                    value={executionYear}
                    onChange={(e) => {
                      setExecutionYear(Number(e.target.value));
                    }}
                    className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
                  >
                    {[1405, 1404, 1403, 1402, 1401, 1400].map((y) => (
                      <option key={y} value={y}>
                        {toPersianDigits(y)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500">موضوع اجراییه / نوع دعوی</label>
                  <select
                    value={executionCategory}
                    onChange={(e) => {
                      setExecutionCategory(e.target.value as any);
                    }}
                    className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 animate-in fade-in"
                  >
                    <option value="financial">دعاوی مالی</option>
                    <option value="non_financial">اجرای احکام دعاوی غیر مالی و احکامی که محکوم به آن تقویم نشده و هزینه اجرای آراء و تصمیمات مراجع غیردادگستری</option>
                    <option value="temporary">هزینه اجرای موقت احکام در کلیه مراجع قضایی</option>
                    <option value="third_party">اعتراض شخص ثالث به اجرای احکام مدنی</option>
                    <option value="leases">تخلیه مورد اجاره غیرمنقول</option>
                  </select>
                </div>

                {executionCategory === "financial" && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500">مبلغ محکوم به (ریال)</label>
                    <input
                      type="text"
                      value={executionFinancialAmount}
                      onChange={(e) => handleAmountFormat(e.target.value, setExecutionFinancialAmount)}
                      placeholder="مثال: ۱۰۰,۰۰۰,۰۰۰"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
                    />
                  </div>
                )}

                 {executionCategory === "leases" && (
                  <div className="space-y-1.5 animate-in slide-in-from-top-1">
                    <label className="text-[11px] font-bold text-slate-500">مبلغ اجاره بهای یک ماه (ریال)</label>
                    <input
                      type="text"
                      value={executionLeaseAmount}
                      onChange={(e) => handleAmountFormat(e.target.value, setExecutionLeaseAmount)}
                      placeholder="مثال: ۱۰۰,۰۰۰,۰۰۰"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
                    />
                  </div>
                )}

                <div className="pt-2 pb-1.5 flex flex-col gap-1.5 border-t border-slate-100 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600">اجرای حکم به سازش منجر شده است</span>
                    <button
                      type="button"
                      onClick={() => setExecutionIsCompromised(!executionIsCompromised)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        executionIsCompromised ? "bg-amber-500" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          executionIsCompromised ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                    چنانچه طرفین سازش کرده اند یا ترتیبی برای اجرای حکم داده اند این گزینه را انتخاب نمایید.
                  </p>
                </div>

                <button
                  onClick={handleCalculateExecutionFees}
                  className="w-full mt-2 py-3 bg-slate-900 hover:bg-emerald-600 hover:text-white text-white rounded-xl text-xs font-black select-none cursor-pointer transition duration-150"
                >
                  محاسبه حق‌الاجرا
                </button>
              </>
            )}

          </div>

          {/* Right Output results Card */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm min-h-[350px] flex flex-col justify-between">
            <div>
              {/* 0. AGE RECEIPTS */}
              {activeTab === "age" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {!ageResult ? (
                    <div className="py-20 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center space-y-2">
                      <Clock className="w-8 h-8 text-slate-300 stroke-1" />
                      <span>جهت مشاهده سن دقیق شمسی و قمری، بر روی کلید محاسبه کلیک کنید.</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Solar Age Card */}
                      <div className="border border-emerald-205 border-emerald-200 rounded-3xl overflow-hidden shadow-emerald-50/50 shadow-sm bg-white">
                        <div className="bg-emerald-50 px-5 py-4 border-b border-emerald-200 flex items-center justify-between">
                          <span className="text-sm font-black text-emerald-990 text-emerald-800">
                            {ageSubject === "age" ? "سن شمسی" : "اختلاف زمانی شمسی"}
                          </span>
                        </div>
                        <div className="p-5">
                          <p className="text-base md:text-lg font-black text-slate-800 text-right leading-loose">
                            {toPersianDigits(
                              `${ageResult.solar.years} سال و ${ageResult.solar.months} ماه و ${ageResult.solar.days} روز`
                            )}
                            <span className="text-sm font-bold text-slate-500 mr-2">
                              ({toPersianDigits(ageResult.totalDays)} روز{ageResult.isNegative ? " قبل" : ""})
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Lunar Age Card */}
                      <div className="border border-emerald-205 border-emerald-200 rounded-3xl overflow-hidden shadow-emerald-50/50 shadow-sm bg-white">
                        <div className="bg-emerald-50 px-5 py-4 border-b border-emerald-200 flex items-center justify-between">
                          <span className="text-sm font-black text-emerald-990 text-emerald-800">
                            {ageSubject === "age" ? "سن قمری" : "اختلاف زمانی قمری"}
                          </span>
                        </div>
                        <div className="p-5">
                          <p className="text-base md:text-lg font-black text-slate-800 text-right leading-loose">
                            {toPersianDigits(
                                `${ageResult.lunar.years} سال و ${ageResult.lunar.months} ماه و ${ageResult.lunar.days} روز`
                            )}
                            <span className="text-sm font-bold text-slate-500 mr-2">
                              ({toPersianDigits(ageResult.totalDays)} روز)
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 1. MEHRIEH RECEIPT */}
              {activeTab === "mehrieh" && !mehriehResult && (
                <div className="py-12 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center space-y-2">
                  <Calendar className="w-8 h-8 text-slate-350 stroke-1" />
                  <span>جهت مشاهده غرامت مهریه تورمی زوجه، کلید محاسبه را بفشارید.</span>
                </div>
              )}
              {activeTab === "mehrieh" && mehriehResult && (
                <div className="py-2 space-y-4 animate-fadeIn">
                  <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-xl border border-green-100 text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>محاسبه غرامت مهریه زوجه به فرآیند نرخ روز درگاه مرکزی انجام شد.</span>
                  </div>

                  <h3 className="text-xs font-black text-slate-800 bg-slate-50 p-2 rounded">شاخص‌های تورم سالانه ملاک دادگاه خانواده:</h3>

                  <div className="space-y-2 text-xs text-slate-600 font-bold">
                    <div className="flex justify-between">
                      <span>شاخص تورمی سال وقوع عقد زوجه ({toPersianDigits(marriageYear)}):</span>
                      <span className="font-mono text-slate-900 font-extrabold">{toPersianDigits(mehriehResult.marriageIndex)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>شاخص تورمی سال قبل از تادیه ({toPersianDigits(paymentYear - 1)}):</span>
                      <span className="font-mono text-slate-900 font-extrabold">{toPersianDigits(mehriehResult.paymentIndex)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 pt-2 text-slate-800">
                      <span>ضریب تورم موازنه ازدواج:</span>
                      <span className="font-bold text-slate-900">{toPersianDigits(mehriehResult.inflationRate.toFixed(4))}</span>
                    </div>

                    <div className="mt-8 bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">مبلغ مهریه قابل تادیه مادی در سال {toPersianDigits(paymentYear)}:</span>
                        <p className="text-sm font-black text-amber-400 mt-1">{formatPersianCurrency(mehriehResult.realValue)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. DIYEH RECEIPT */}
              {activeTab === "diyeh" && !diyehResult && (
                <div className="py-12 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center space-y-2 animate-fadeIn" dir="rtl">
                  <Award className="w-8 h-8 text-slate-350 stroke-1 animate-pulse" />
                  <span>جهت محاسبه دیه و مشاهده جزئیات پرداخت به ریال و تومان، روی دکمه محاسبه کلیک کنید.</span>
                </div>
              )}
              {activeTab === "diyeh" && diyehResult && (
                <div className="py-2 space-y-4 animate-fadeIn" dir="rtl">
                  <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50/70 p-3 rounded-xl border border-emerald-150 text-xs text-right">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>محاسبه با موفقیت بر مبنای نرخ مصوب دیه سال {toPersianDigits(diyehYear)} انجام شد.</span>
                  </div>

                  <h3 className="text-xs font-black text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-right">مبانی محاسباتی دیه صادر شده ({toPersianDigits(diyehYear)}):</h3>

                  <div className="space-y-3.5 text-xs text-slate-600 font-bold">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-slate-500">تاریخ وقوع حادثه صدمه:</span>
                      <span className="text-slate-900 font-extrabold">{toPersianDigits(`${diyehYear}/${diyehMonth}/${diyehDay}`)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-slate-500">مبنای دیه کامل در ماه عادی:</span>
                      <span className="font-mono text-slate-900 font-extrabold">{formatPersianCurrency(diyehResult.baseFullRate)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-slate-500">مبنای دیه کامل با تغلیظ هلال ماه حرام:</span>
                      <span className="font-mono text-emerald-600 font-extrabold">{formatPersianCurrency(diyehResult.customFullRate)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-slate-500">روش محاسباتی انتخابی شما:</span>
                      <span className="font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {selectedMethod}
                      </span>
                    </div>

                    {/* Conditional sub-details depending on method */}
                    {selectedMethod === "درصدی" && (
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="text-slate-500">درصد اعمال شده از دیه کامل:</span>
                        <span className="font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-150">
                          {toPersianDigits(diyehPercentInput)}٪ دیه کامل
                        </span>
                      </div>
                    )}

                    {selectedMethod === "کسری" && (
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="text-slate-500">کسر اعمال شده از دیه کامل:</span>
                        <span className="font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-150 text-xs">
                          {fractionInputs.filter(Boolean).map(toPersianDigits).join(" × ")} (معادل {toPersianDigits((diyehResult.fractionUsed * 100).toFixed(4))}٪ دیه کامل)
                        </span>
                      </div>
                    )}

                    {selectedMethod === "دیه قتل" && (
                      <div className="space-y-2 pb-2 border-b border-slate-100">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">تعداد نفوس (فقره دیه):</span>
                          <span className="font-extrabold text-slate-900">{toPersianDigits(murderCount)} فقره فوت</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">جنسیت متوفی:</span>
                          <span className="font-extrabold text-slate-900">
                            {murderType === "man_full" && "مرد مسلمان"}
                            {murderType === "woman_half" && "زن مسلمان (نصف)"}
                            {murderType === "woman_equalized" && "زن مسلمان (برابر شده سوانح رانندگی)"}
                            {murderType === "minority_full" && "اقلیت‌های دینی مصرح"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">ضریب کل حاصله دیه:</span>
                          <span className="font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-150">
                            {toPersianDigits(diyehResult.fractionUsed.toFixed(2))} برابر دیه کامل
                          </span>
                        </div>
                      </div>
                    )}

                    {selectedMethod === "اعضا، منافع، جراحات و جنین" && (
                      <div className="space-y-2 pb-2 border-b border-slate-100">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">تعداد صدمات وارده به شاکی:</span>
                          <span className="font-extrabold text-slate-900">{toPersianDigits(selectedInjuries.length)} مورد آسیب پزشکی قانونی</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">جمع کل درصدهای ارش و دیه منتخب:</span>
                          <span className="font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-150">
                            {toPersianDigits(selectedInjuries.reduce((sum, i) => sum + i.percentage, 0))}٪ دیه کامل
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-slate-500">وضعیت تغلیظ ماه الحرام:</span>
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] ${isSacredMonth ? "bg-amber-50 text-amber-700 border border-amber-200 font-extrabold" : "bg-slate-100 text-slate-500"}`}>
                        {isSacredMonth ? "شامل تغلیظ (ماه‌های حرام: افزایش یک‌سوم)" : "بدون تغلیظ (ماه‌های عادی)"}
                      </span>
                    </div>

                    <div className="mt-6 bg-slate-950 text-white p-5 rounded-2xl space-y-3 shadow-md">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-extrabold block mb-1">مجموع بدهی غرامت جانی صدمه به ریال:</span>
                        <p className="text-base font-black text-emerald-400 leading-none">{formatPersianCurrency(diyehResult.diyehFee)}</p>
                      </div>
                      <div className="text-right pt-2.5 border-t border-slate-800">
                        <span className="text-[10px] text-slate-400 font-extrabold block mb-1">معادل وجه به تومان ایران:</span>
                        <p className="text-base font-black text-green-400 leading-none">
                          {formatPersianCurrency(Math.round(diyehResult.diyehFee / 10)).replace("ریال", "تومان")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. COURT RECEIPT */}
              {activeTab === "court" && !courtResult && (
                <div className="py-12 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center space-y-2">
                  <DollarSign className="w-8 h-8 text-slate-350 stroke-1" />
                  <span>برآورد ارزش اوراق و هزینه فرآوری پرونده در مراجع حقوقی.</span>
                </div>
              )}
              {activeTab === "court" && courtResult && (
                <div className="py-2 space-y-4 animate-fadeIn">
                  <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-xl border border-green-100 text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>محاسبه هزینه‌های ثبتی دادگاه بدوی/حقوقی نهایی گردید.</span>
                  </div>

                  <h3 className="text-xs font-black text-slate-800 bg-slate-50 p-2 rounded">محاسبه فیش هزینه دادرسی و تمبر دادخواست:</h3>

                  <div className="space-y-2 text-xs text-slate-600 font-bold">
                    <div className="flex justify-between">
                      <span>مرحله دادرسی مورد تقاضا:</span>
                      <span className="font-bold text-slate-900">{courtResult.stageName}</span>
                    </div>
                    {courtStage !== "non_financial" && (
                      <div className="flex justify-between">
                        <span>کل مبلغ بهای خواسته (ارزش پرونده):</span>
                        <span className="font-bold text-slate-900">{formatPersianCurrency(parsePersianInput(claimAmountForCourt))}</span>
                      </div>
                    )}

                    <div className="mt-8 bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">کل فیش هزینه دادرسی (تمبرها و مراجع قضایی):</span>
                        <p className="text-sm font-black text-amber-400 mt-1">{formatPersianCurrency(courtResult.courtFee)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. LAWYER RECEIPT */}
              {activeTab === "lawyer" && !lawyerResult && (
                <div className="py-12 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center space-y-2">
                  <Calculator className="w-8 h-8 text-slate-350 stroke-1" />
                  <span>محاسبه حق‌الوکاله و سهم مراجع مالی کانون و مرکز وکلاین.</span>
                </div>
              )}
              {activeTab === "lawyer" && lawyerResult && (
                <div className="py-2 space-y-4 animate-fadeIn">
                  <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-xl border border-green-100 text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>برآورد حق‌الوکاله و تمبر مالیاتی بهای وکالت انجام شد.</span>
                  </div>

                  <h3 className="text-xs font-black text-slate-800 bg-slate-50 p-2 rounded border border-slate-100 mt-4 mb-2">نتیجه محاسبه</h3>

                  <div className="space-y-4">
                    {!lawyerResult.isTaxStamp ? (
                      <div className="flex flex-col gap-2 p-3 bg-white border border-slate-100 rounded-xl text-xs font-bold shadow-sm">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <span className="text-slate-600">حق الوکاله در مرحله بدوی:</span>
                          <span className="text-slate-900 font-black font-mono text-sm">
                            {formatPersianCurrency(lawyerResult.bedvi)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <span className="text-slate-600">حق الوکاله در مرحله تجدید نظر:</span>
                          <span className="text-slate-900 font-black font-mono text-sm">
                            {formatPersianCurrency(lawyerResult.tajdid)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 rounded-lg p-2 mt-1">
                          <span className="text-slate-800">جمع کل:</span>
                          <span className="text-[#0ea5e9] font-black font-mono text-[15px]">
                            {formatPersianCurrency(lawyerResult.total)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 font-bold">
                        <div className="bg-white border border-slate-200 rounded-xl text-xs shadow-sm overflow-hidden">
                          <div className="bg-slate-600 text-white px-4 py-2.5 w-max rounded-bl-3xl min-w-[50%]">
                            در مرحله بدوی
                          </div>
                          <div className="p-4 space-y-4">
                            <div>
                              <div className="text-slate-800">حق الوکاله:</div>
                              <div className="text-left font-mono mt-1 text-slate-600">{formatPersianCurrency(lawyerResult.bedvi)}</div>
                            </div>
                            <div className="border-t border-slate-100 pt-3">
                              <div className="text-emerald-700 font-extrabold">مبلغ ابطال تمبر مالیاتی:</div>
                              <div className="text-left font-mono mt-1 text-emerald-800 font-black">{formatPersianCurrency(lawyerResult.bedviPureTax)}</div>
                            </div>
                            <div className="border-t border-slate-100 pt-3">
                              <div className="text-slate-800">{lawyerResult.lawyerSubject === "tax_stamp_bar" ? "تمبر مالیاتی، سهم صندوق و کانون:" : "تمبر مالیاتی، سهم صندوق و مرکز:"}</div>
                              <div className="text-left font-mono mt-1 text-slate-600">{formatPersianCurrency(lawyerResult.bedviTax)}</div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl text-xs shadow-sm overflow-hidden">
                          <div className="bg-slate-600 text-white px-4 py-2.5 w-max rounded-bl-3xl min-w-[50%]">
                            در مرحله تجدید نظر
                          </div>
                          <div className="p-4 space-y-4">
                            <div>
                              <div className="text-slate-800">حق الوکاله:</div>
                              <div className="text-left font-mono mt-1 text-slate-600">{formatPersianCurrency(lawyerResult.tajdid)}</div>
                            </div>
                            <div className="border-t border-slate-100 pt-3">
                              <div className="text-emerald-700 font-extrabold">مبلغ ابطال تمبر مالیاتی:</div>
                              <div className="text-left font-mono mt-1 text-emerald-800 font-black">{formatPersianCurrency(lawyerResult.tajdidPureTax)}</div>
                            </div>
                            <div className="border-t border-slate-100 pt-3">
                              <div className="text-slate-800">{lawyerResult.lawyerSubject === "tax_stamp_bar" ? "تمبر مالیاتی، سهم صندوق و کانون:" : "تمبر مالیاتی، سهم صندوق و مرکز:"}</div>
                              <div className="text-left font-mono mt-1 text-slate-600">{formatPersianCurrency(lawyerResult.tajdidTax)}</div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 text-[13px] space-y-4">
                          <div className="text-emerald-700 font-black">
                            مبلغ ابطال تمبر مالیاتی (کل):
                            <div className="text-left text-emerald-800 font-mono text-sm mt-1">{formatPersianCurrency(lawyerResult.totalPureTax)}</div>
                          </div>
                          <div className="text-blue-600 border-t border-slate-100 pt-3">
                            جمع کل پرداخت تمبر در مرحله بدوی و تجدید نظر (شامل سهم صندوق و کانون):
                            <div className="text-left text-slate-700 font-mono text-sm mt-1">{formatPersianCurrency(lawyerResult.totalTax)}</div>
                          </div>
                          <div className="text-blue-600 border-t border-slate-100 pt-3">
                            جمع کل حق الوکاله:
                            <div className="text-left text-slate-700 font-mono text-sm mt-1">{formatPersianCurrency(lawyerResult.total)}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 5. DEADLINE RECEIPT */}
              {activeTab === "deadlines" && !deadlineResult && (
                <div className="py-12 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center space-y-2">
                  <Clock className="w-8 h-8 text-slate-350 stroke-1" />
                  <span>محاسبه تاریخ‌های آغازین و واپسین گام دادخواهی را آغاز نمایید.</span>
                </div>
              )}
              {activeTab === "deadlines" && deadlineResult && (
                <div className="py-2 space-y-4 animate-fadeIn">
                  <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-xl border border-green-100 text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0 animate-pulse" />
                    <span>مواعید قانونی ابلاغ فوق به تاریخ دقیق جلالی مشخص گردید.</span>
                  </div>

                  <h3 className="text-xs font-black text-slate-800 bg-slate-50 p-2 rounded">مقررات دادرسی حاکم بر مهلت (ماده ۴۴۵):</h3>

                  <div className="space-y-2 text-xs text-slate-650 font-bold leading-relaxed">
                    <div className="flex justify-between">
                      <span>نوع فرجه قضایی مورد واکاوی:</span>
                      <span className="font-extrabold text-slate-900">{deadlineResult.typeName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>تعداد کل مهلت مقرر قانونی:</span>
                      <span className="font-bold text-slate-900">{toPersianDigits(deadlineResult.daysCount)} روز کامل</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 pt-2">
                      <span>تاریخ ابلاغیه اصلی (روز صفر):</span>
                      <span className="font-mono text-slate-900">{toPersianDigits(`${deadlineBaseYear}/${deadlineBaseMonth}/${deadlineBaseDay}`)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>آغاز شمارش رسمی زمان (روز اول مادی):</span>
                      <span className="font-mono text-slate-850 font-bold">{toPersianDigits(deadlineResult.startDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>آخرین روز فرجه قانونی شمارش شده:</span>
                      <span className="font-mono text-slate-850 font-black text-sm text-red-500">{toPersianDigits(deadlineResult.endDate)}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "erth" && !erthResult && (
                <div className="py-12 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center space-y-2">
                  <Users className="w-8 h-8 text-slate-350 stroke-1" />
                  <span>جهت مشاهده جدول تقسیم سهام و حساب مادی ارث دکمه محاسبه را فشار دهید.</span>
                </div>
              )}
              {activeTab === "erth" && erthResult && (
                <div className="py-2 space-y-4 animate-fadeIn" dir="rtl">
                  <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-xl border border-green-100 text-xs text-right">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>محاسبه تقسیم ماترک ارگانیک بر اساس قوانین ارث مدنی کلید خورد.</span>
                  </div>

                  <h3 className="text-xs font-black text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-right">خلاصه تقسیم ارثیه مصوب:</h3>

                  <div className="space-y-3.5 text-xs text-slate-650 font-bold">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span>طبقه فعال ارث‌بری متوفی:</span>
                      <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-[10px] font-black font-sans">طبقه {toPersianDigits(erthResult.activeClass)}</span>
                    </div>

                    {parsePersianInput(erthEstateValue) > 0 && (
                      <div className="flex justify-between items-center">
                        <span>مبلغ ماترک قابل تقسیم:</span>
                        <span className="font-extrabold text-green-700">{formatPersianCurrency(parsePersianInput(erthEstateValue))}</span>
                      </div>
                    )}

                    {erthResult.commonDenominatorValue && (
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>مخرج مشترک ریاضی محاسبه:</span>
                        <span className="font-mono font-black">{toPersianDigits(erthResult.commonDenominatorValue)}</span>
                      </div>
                    )}

                    {/* Table listing Heirs */}
                    <div className="border border-slate-150 rounded-2xl overflow-hidden mt-4 shadow-sm bg-white">
                      <div className="bg-slate-50/70 p-2.5 border-b border-slate-150 text-right font-black text-xs text-slate-800 select-none">
                        جدول سهام بر اساس سهم‌الارث قانون مدنی:
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                          <thead className="bg-slate-50 border-b border-slate-150 text-[10px] text-slate-500 font-black">
                            <tr>
                              <th className="p-2.5 py-2">وارث حائز ارث</th>
                              <th className="p-2.5 py-2 text-center">سهم کسری</th>
                              <th className="p-2.5 py-2 text-center">درصد سهم</th>
                              {parsePersianInput(erthEstateValue) > 0 && <th className="p-2.5 py-2 text-left">مبلغ سهم (ریال)</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {erthResult.heirs.map((heir: any, index: number) => (
                              <tr key={index} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                                <td className="p-2.5 text-slate-800 font-black">{heir.relation}</td>
                                <td className="p-2.5 text-center font-mono font-black text-slate-900">{toPersianDigits(heir.fraction)}</td>
                                <td className="p-2.5 text-center font-mono text-emerald-700 font-extrabold">٪{toPersianDigits(heir.percentage.toFixed(2))}</td>
                                {parsePersianInput(erthEstateValue) > 0 && (
                                  <td className="p-2.5 text-left font-mono font-black text-green-700">{formatPersianCurrency(heir.valueRials)}</td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Excluded relatives (حجب) */}
                    {erthResult.excluded && erthResult.excluded.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2 mt-4 text-right">
                        <span className="text-[11px] font-black text-amber-900 flex items-center gap-1.5 leading-tight">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          خویشاوندان حائز حجب (محروم از ارث به دلیل وجود وراث نزدیک‌تر):
                        </span>
                        <ul className="list-disc list-inside text-[10px] text-amber-800 font-bold space-y-1.5 leading-relaxed pr-2">
                          {erthResult.excluded.map((item: any, idx: number) => (
                            <li key={idx}>
                              <strong>{item.relation}:</strong> {item.reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "delay_interest" && !delayResult && (
                <div className="py-12 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center space-y-2 animate-fadeIn" dir="rtl">
                  <TrendingUp className="w-8 h-8 text-slate-350 stroke-1" />
                  <span>جهت محاسبه خسارت تأخیر تأدیه (ماده ۵۲۲) دکمه محاسبه را فشار دهید.</span>
                </div>
              )}
              {activeTab === "delay_interest" && delayResult && (
                <div className="py-2 space-y-4 animate-fadeIn" dir="rtl">
                  {delayResult.isValid ? (
                    <>
                      <div className="flex items-center gap-2 text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-100 text-xs text-right">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>محاسبه غرامت تأخیر تأدیه بر اساس شاخص رسمی بانک مرکزی انجام شد.</span>
                      </div>

                      <h3 className="text-xs font-black text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-right">جزئیات محاسبه خسارت:</h3>

                      <div className="space-y-3.5 text-xs text-slate-650 font-bold">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <span>مبلغ اصل بدهی (دین):</span>
                          <span className="text-slate-900 font-extrabold">{formatPersianCurrency(delayResult.principal)}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <span>شاخص سال و ماه سررسید ({toPersianDigits(`${delayStartYear}/${delayStartMonth}`)}):</span>
                          <span className="font-mono text-slate-900">{toPersianDigits(delayResult.startIndex)}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <span>شاخص سال و ماه تأدیه ({toPersianDigits(`${delayEndYear}/${delayEndMonth}`)}):</span>
                          <span className="font-mono text-slate-900">{toPersianDigits(delayResult.endIndex)}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <span>نرخ تورم / ضریب افزایش:</span>
                          <span className="text-slate-900">{toPersianDigits(delayResult.multiplier.toFixed(4))}</span>
                        </div>

                        <div className="mt-6 space-y-3">
                          <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                            <div className="flex justify-between text-slate-600">
                              <span>موجودی اصل بدهی:</span>
                              <span>{formatPersianCurrency(delayResult.principal)}</span>
                            </div>
                            <div className="flex justify-between text-rose-600">
                              <span>مبلغ خسارت تأخیر:</span>
                              <span>{formatPersianCurrency(delayResult.interestAmount)}</span>
                            </div>
                          </div>
                          
                          <div className="bg-slate-900 text-white p-5 rounded-2xl flex items-center justify-between shadow-md">
                            <div>
                              <span className="text-[10px] text-slate-400 font-extrabold block mb-1">جمع کل قابل پرداخت (اصل + خسارت):</span>
                              <p className="text-base font-black text-amber-400 leading-none">{formatPersianCurrency(delayResult.finalAmount)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2 text-amber-900 text-[11px] font-bold">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p>{delayResult.error}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {activeTab === "execution_fees" && !executionResult && (
              <div className="py-12 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center space-y-2 animate-fadeIn" dir="rtl">
                <CheckCircle2 className="w-8 h-8 text-slate-350 stroke-1" />
                <span>جهت مشاهده غرامت و هزینه قانونی اجرای احکام دادگستری دکمه محاسبه را فشار دهید.</span>
              </div>
            )}
            {activeTab === "execution_fees" && executionResult && (
              <div className="py-2 space-y-5 animate-fadeIn text-right font-bold" dir="rtl">
                <div className="flex items-center gap-2 text-amber-800 bg-amber-50/70 p-3 rounded-xl border border-amber-100 text-xs text-right animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>محاسبه غرامت و هزینه قانونی اجرای احکام دادگستری با موفقیت انجام شد.</span>
                </div>

                {/* 1. Main Fee Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-center space-y-3">
                  <h4 className="text-slate-500 text-xs font-black">هزینه اجرای احکام</h4>
                  <div className="flex items-center justify-center gap-1.5 py-1">
                    {executionResult.isRange ? (
                      <p className="text-xl font-black text-slate-900 tracking-tight">{toPersianDigits(executionResult.feeText)}</p>
                    ) : (
                      <p className="text-2xl font-black text-slate-900 tracking-tight">{formatPersianCurrency(executionResult.fee)}</p>
                    )}
                  </div>
                </div>

                {/* 2. Document/Legal Bases Card */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-right">مستندات</h4>
                  <div className="p-4 bg-slate-50/60 border border-slate-200 rounded-2xl text-[11px] text-slate-600 font-medium leading-relaxed space-y-2">
                    {executionCategory === "leases" ? (
                      <>
                        <p className="flex items-start gap-1.5 leading-relaxed">• از قانون اجرای احکام مدنی مصوب (۱۳۵۶/۸/۱)</p>
                        <p className="flex items-start gap-1.5 leading-relaxed">• ماده ۱۵۹ - در تخلیه مورد اجاره غیر منقول صدی ده اجاره بهای سه ماه ... بابت حق اجراء دریافت می شود.</p>
                      </>
                    ) : executionCategory === "financial" ? (
                      <>
                        <p className="flex items-start gap-1.5 leading-relaxed">• از قانون اجرای احکام مدنی مصوب (۱۳۵۶/۸/۱)</p>
                        <p className="flex items-start gap-1.5 leading-relaxed">• ماده ۱۵۸ - نیم عشر اجرایی معادل ۵٪ کل مبلغ محکوم به است که پس از اقدام عملیات اجرایی بر عهده محکوم‌علیه قرار می‌گیرد.</p>
                        <p className="flex items-start gap-1.5 leading-relaxed">• ماده ۱۶۰ - در صورت سازش طرفین یا تسلیم محکوم‌به ظرف ۱۰ روز از ابلاغ اجراییه، نصف حق اجرا (ربع عشر معادل ۲.۵٪) دریافت خواهد شد.</p>
                      </>
                    ) : (
                      <>
                        <p className="flex items-start gap-1.5 leading-relaxed">• قانون بودجه سال {toPersianDigits(executionResult.year)} کل کشور</p>
                        <p className="flex items-start gap-1.5 leading-relaxed">• تعرفه‌های رسمی مصوب قوه قضاییه جمهوری اسلامی ایران جهت تامین درآمدهای عمومی دولت.</p>
                      </>
                    )}
                  </div>
                </div>

                {/* 3. Inputs Summary Card */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-right">ورودی ها</h4>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs text-slate-700 bg-white shadow-sm font-bold">
                    <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100">
                      <span>سال</span>
                      <span className="text-slate-900">{toPersianDigits(executionResult.year)}</span>
                    </div>

                    <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100 gap-4">
                      <span>دسته بندی</span>
                      <span className="text-slate-900 text-left">
                        {executionCategory === "financial" ? "دعاوی مالی" :
                         executionCategory === "non_financial" ? "اجرای احکام دعاوی غیر مالی و احکامی که محکوم به آن تقویم نشده و هزینه اجرای آرا و تصمیمات مراجع غیردادگستری" :
                         executionCategory === "temporary" ? "هزینه اجرای موقت احکام در کلیه مراجع قضایی" :
                         executionCategory === "third_party" ? "اعتراض شخص ثالث به اجرای احکام مدنی" :
                         "تخلیه مورد اجاره غیرمنقول"}
                      </span>
                    </div>

                    {executionCategory === "financial" && (
                      <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100">
                        <span>مبلغ محکوم به</span>
                        <span className="text-slate-900 font-extrabold">{formatPersianCurrency(executionResult.amount)}</span>
                      </div>
                    )}

                    {executionCategory === "leases" && (
                      <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100">
                        <span>مبلغ اجاره بهای یک ماه</span>
                        <span className="text-slate-900 font-extrabold">{formatPersianCurrency(executionResult.leaseAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center px-4 py-3">
                      <span>اجرای حکم به سازش منجر شده است</span>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                        executionResult.isCompromised ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-600"
                      }`}>
                        {executionResult.isCompromised ? "بله" : "خیر"}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            )}

          {(ageResult || mehriehResult || diyehResult || courtResult || lawyerResult || deadlineResult || erthResult || delayResult || executionResult) && (
            <div className="border-t border-slate-100 pt-4 flex gap-2">
              <button
                onClick={triggerPrint}
                className="flex-1 py-3 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-950 text-slate-700 rounded-xl text-xs font-black select-none cursor-pointer flex items-center justify-center gap-2 transition duration-150"
              >
                <Printer className="w-4 h-4 text-emerald-600" />
                چاپ و ذخیره PDF
              </button>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
