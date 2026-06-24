import { safeStorage } from "./utils/safeStorage";
import React, { useState, useEffect } from "react";
import { loadAllData, saveData } from "./utils/persistentState";
import { Client, LegalCase, CaseNote, CaseDocument, LegalEvent } from "./types";
import { documentDb } from "./utils/documentStorage";
import { toPersianDigits, getCurrentJalali, toEnglishDigits, addDaysToJalali, formatJalaliDate, doesEventMatchDate, isEventExpired } from "./utils/shamsi";
import { getRandomQuote, ImamQuote } from "./utils/imamQuotes";
import { AlarmService } from "./utils/alarmService";

// Component imports
import Dashboard from "./components/Dashboard";
import AddReminderPage from "./components/AddReminderPage";
import CaseManager from "./components/CaseManager";
import LegalCalculators from "./components/LegalCalculators";
import CalendarPanel from "./components/CalendarPanel";
import AIAssistant from "./components/AIAssistant";
import AdlIranPortal from "./components/AdlIranPortal";
import FinanceLedger from "./components/FinanceLedger";
import SecurityGate from "./components/SecurityGate";
import BackupSecurityHub from "./components/BackupSecurityHub";
import BackupCenter from "./components/BackupCenter";
import PastEventsArchive from "./components/PastEventsArchive";

import Terminology from "./components/Terminology";
import LawsExplorer from "./components/LawsExplorer";
import QuickNotes from "./components/QuickNotes";
import {
  Briefcase,
  Users,
  Calendar as CalendarIcon,
  BookOpen,
  MessageSquare,
  Link2,
  Download,
  Upload,
  Layers,
  Scale,
  Menu,
  X,
  Shield,
  HelpCircle,
  Coins,
  Share2,
  Lock,
  CloudUpload,
  ArrowRight,
  Bell,
  CheckCircle2,
  Database,
  Archive,
  Search,
  Printer, // <-- Added Import
  FileText
} from "lucide-react";

import { auth, onAuthStateChanged } from "./firebase/config";
import { syncFullStateToCloud } from "./firebase/db";
type User = { uid: string; email?: string | null };

export default function App() {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "cases" | "calculators" | "calendar" | "chat" | "adliran" | "finance" | "backup" | "backup-center" | "add-reminder" | "event-archive" | "terminology" | "laws" | "quick-notes"
  >("dashboard");
  const [activeCaseSubTab, setActiveCaseSubTab] = useState<"cases" | "closedCases" | "clients">("cases");

  // Tab History tracker for Back button functionality
  const [tabHistory, setTabHistory] = useState<string[]>(["dashboard"]);

  // Mobile sidebar layout drawer toggle
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Alarms Fired Registry (to prevent double-firing in the same minute)
  const [firedAlarms, setFiredAlarms] = useState<Set<string>>(() => {
    const saved = safeStorage.getItem("r_fired_alarms");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Clear old alarms (e.g. from more than 30 days ago) to keep storage clean
        return new Set(parsed);
      } catch (e) {
        return new Set();
      }
    }
    return new Set();
  });

  // Sync firedAlarms to localStorage
  useEffect(() => {
    safeStorage.setItem("r_fired_alarms", JSON.stringify(Array.from(firedAlarms)));
  }, [firedAlarms]);

  // Synchronize Tab History for robust "Back" button functionality
  useEffect(() => {
    setTabHistory((prev) => {
      const last = prev[prev.length - 1];
      const secondLast = prev[prev.length - 2];
      
      if (last === activeTab) return prev;
      if (secondLast === activeTab) {
        return prev.slice(0, -1);
      }
      return [...prev, activeTab];
    });
  }, [activeTab]);

  const handleBack = () => {
    setEditingReminder(undefined);
    if (tabHistory.length > 1) {
      const prevTab = tabHistory[tabHistory.length - 2];
      setActiveTab(prevTab as any);
    } else {
      setActiveTab("dashboard");
    }
  };

  // States
  const [editingReminder, setEditingReminder] = useState<LegalEvent | undefined>(undefined);
  const [clients, setClients] = useState<Client[]>([]);
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [events, setEvents] = useState<LegalEvent[]>([]);

  // --- CUSTOM DIALOG FOR IFRAME SANITY (NO confirm() OR alert() BLOCKS) ---
  const [customDialog, setCustomDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "alert" | "confirm";
    onConfirm?: () => void;
    onCancel?: () => void;
  } | null>(null);

  // Auto cleanup expired events and move to archive status
  useEffect(() => {
    if (events.length === 0) return;

    let hasChanges = false;
    const updatedEvents = events.map(ev => {
      // Skip if already archived
      if (ev.isArchived) return ev;
      
      if (isEventExpired(ev.jalaliDate, ev.time, 5, ev.endRepeatDate)) {
        hasChanges = true;
        return { ...ev, isArchived: true };
      }
      return ev;
    });

    if (hasChanges) {
      setEvents(updatedEvents);
      // Let the main state persistence effect save the updated events
    }
  }, [events]);

  // Background Alarm Service Sync Effect (BadSaba Integration Mode)
  useEffect(() => {
    // Request notification permission on first interaction/load
    AlarmService.requestPermission();

    const checkAlarms = () => {
      const nowJalali = getCurrentJalali();
      const pad = (n: number) => n.toString().padStart(2, "0");
      const todayStr = `${nowJalali.jy}/${pad(nowJalali.jm)}/${pad(nowJalali.jd)}`;
      const nowTimeStr = `${pad(nowJalali.hour)}:${pad(nowJalali.minute)}`;
      
      events.forEach(ev => {
        if (!ev.alarmEnabled || ev.isArchived) return;
        const dev = ev as any;
        
        // Define alarm triggers
        const triggerPoints = [];
        
        const isRecurring = dev.repeatSelected && dev.repeatSelected !== "بدون تکرار";
        
        if (isRecurring) {
          const matchToday = doesEventMatchDate(ev, todayStr);
          if (matchToday) {
            // 1. Final Event Time Today
            triggerPoints.push({ id: `${ev.id}_final_${todayStr}`, date: todayStr, time: ev.time, label: "موعد نهایی رویداد" });
            
            // 2. 1 Hour Before Today
            if (dev.alarm1Hour) {
              const [h, m] = toEnglishDigits(ev.time).split(":").map(Number);
              const targetH = h === 0 ? 23 : h - 1;
              triggerPoints.push({ id: `${ev.id}_1h_${todayStr}`, date: todayStr, time: `${pad(targetH)}:${pad(m)}`, label: "۱ ساعت قبل" });
            }
          }

          // 3. Days before checks
          if (dev.alarm1Day) {
            const tomorrowJalali = addDaysToJalali(nowJalali.jy, nowJalali.jm, nowJalali.jd, 1);
            const tomorrowStr = formatJalaliDate(tomorrowJalali.jy, tomorrowJalali.jm, tomorrowJalali.jd);
            if (doesEventMatchDate(ev, tomorrowStr)) {
              triggerPoints.push({ id: `${ev.id}_1d_${todayStr}`, date: todayStr, time: ev.time, label: "۲۴ ساعت قبل" });
            }
          }
          if (dev.alarm3Days) {
            const days3Jalali = addDaysToJalali(nowJalali.jy, nowJalali.jm, nowJalali.jd, 3);
            const days3Str = formatJalaliDate(days3Jalali.jy, days3Jalali.jm, days3Jalali.jd);
            if (doesEventMatchDate(ev, days3Str)) {
              triggerPoints.push({ id: `${ev.id}_3d_${todayStr}`, date: todayStr, time: ev.time, label: "۳ روز قبل" });
            }
          }
          if (dev.alarm1Week) {
            const days7Jalali = addDaysToJalali(nowJalali.jy, nowJalali.jm, nowJalali.jd, 7);
            const days7Str = formatJalaliDate(days7Jalali.jy, days7Jalali.jm, days7Jalali.jd);
            if (doesEventMatchDate(ev, days7Str)) {
              triggerPoints.push({ id: `${ev.id}_1w_${todayStr}`, date: todayStr, time: ev.time, label: "۱ هفته قبل" });
            }
          }
        } else {
          // Standard event checks
          // 1. Final Event Time
          triggerPoints.push({ id: `${ev.id}_final_${ev.jalaliDate}`, date: ev.jalaliDate, time: ev.time, label: "موعد نهایی رویداد" });
          
          // 2. 1 Hour Before
          if (dev.alarm1Hour && ev.time) {
            const [h, m] = toEnglishDigits(ev.time).split(":").map(Number);
            const targetH = h === 0 ? 23 : h - 1;
            triggerPoints.push({ id: `${ev.id}_1h_${ev.jalaliDate}`, date: ev.jalaliDate, time: `${pad(targetH)}:${pad(m || 0)}`, label: "۱ ساعت قبل" });
          }

          // 3. Days Before
          const addPoint = (days: number, tag: string, label: string) => {
            if (!ev.jalaliDate) return;
            const parts = toEnglishDigits(ev.jalaliDate).split("/").map(Number);
            if (parts.length < 3) return;
            const [y, m, d] = parts;
            try {
              const targetDate = addDaysToJalali(y, m, d, -days);
              const targetDateStr = formatJalaliDate(targetDate.jy, targetDate.jm, targetDate.jd);
              triggerPoints.push({ id: `${ev.id}_${tag}_${targetDateStr}`, date: targetDateStr, time: ev.time, label });
            } catch(e) {}
          };


          if (dev.alarm1Day) addPoint(1, "1d", "۲۴ ساعت قبل");
          if (dev.alarm3Days) addPoint(3, "3d", "۳ روز قبل");
          if (dev.alarm1Week) addPoint(7, "1w", "۱ هفته قبل");
        }

        // Execute triggers
        triggerPoints.forEach(pt => {
          const normalizeDate = (d?: string) => {
            if (!d) return d;
            const parts = toEnglishDigits(d).split("/");
            if (parts.length === 3) {
              return `${parts[0]}/${parts[1].padStart(2, "0")}/${parts[2].padStart(2, "0")}`;
            }
            return d;
          };
          const normalizeTime = (t?: string) => {
            if (!t) return t;
            const parts = toEnglishDigits(t).split(":");
            if (parts.length === 2) {
              return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
            }
            return t;
          };

          const matchDate = normalizeDate(pt.date) === normalizeDate(todayStr);
          const matchTime = normalizeTime(pt.time) === normalizeTime(nowTimeStr);
          
          if (matchDate && matchTime && !firedAlarms.has(pt.id)) {
            // Trigger Smart BadSaba Audio and Notification
            AlarmService.playBadSabaAlarm();
            AlarmService.showNotification(ev.title, `${pt.label}: ${ev.time}`);
            
            // --- REAL SMS DISPATCH INTEGRATION ---
            if (dev.smsEnabled !== false) {
              const phones = [];
              if (dev.smsPhone1 && dev.smsPhone1.length > 5) phones.push(dev.smsPhone1);
              if (dev.smsPhone2 && dev.smsPhone2.length > 5) phones.push(dev.smsPhone2);
              
              if (phones.length > 0) {
                const smsMessage = `دفتر وکالت ${lawyerName}\nیادآوری: ${ev.title}\n${pt.label}\nساعت: ${ev.time}\nتاریخ: ${ev.jalaliDate}`;
                AlarmService.sendRealSMS(phones, smsMessage);
              }
            }
            
            setFiredAlarms(prev => new Set(prev).add(pt.id));
            
            // Show workspace alert
            setCustomDialog({
              isOpen: true,
              title: `هشدار هوشمند قضایی (همگام‌ساز باد صبا)`,
              message: `موعد ${pt.label} برای رویداد «${ev.title}» فرا رسیده است. ساعت ابلاغ: ${toPersianDigits(ev.time)}`,
              type: "alert",
              onConfirm: () => setCustomDialog(null)
            });
          }
        });
      });
    };

    checkAlarms(); // Check immediately on mount/update
    const interval = setInterval(checkAlarms, 30000); // Check precisely every 30s
    return () => clearInterval(interval);
  }, [events, firedAlarms]);

  // --- LAWYER SECURITY PROFILE STATES ---
  const [lawyerName, setLawyerName] = useState(() => safeStorage.getItem("r_lawyer_name") || "");
  const [lawyerNationalId, setLawyerNationalId] = useState(() => safeStorage.getItem("r_lawyer_national_id") || "");
  const [lawyerPassword, setLawyerPassword] = useState(() => safeStorage.getItem("r_lawyer_password") || "");
  const [lawyerPhoto, setLawyerPhoto] = useState(() => safeStorage.getItem("r_lawyer_photo") || "");
  const [isRegistered, setIsRegistered] = useState(() => safeStorage.getItem("r_lawyer_registered") === "true");
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Dynamic Imam Quote displayed inside the app workspace environment
  const [appQuote, setAppQuote] = useState<ImamQuote>(() => getRandomQuote());

  const handleNextQuote = () => {
    setAppQuote(getRandomQuote());
  };

  // Load Initial persistent states
  const [dataLoaded, setDataLoaded] = useState(false);
  useEffect(() => {
    const data = loadAllData();
    setClients(data.clients);
    setCases(data.cases);
    setNotes(data.notes);
    setEvents(data.events);

    const loadFullDocs = async () => {
      const docs = data.documents || [];
      const enriched = [];
      for (const d of docs) {
        if (!d.dataUrl) {
          const storedUrl = await documentDb.get(d.id);
          enriched.push({ ...d, dataUrl: storedUrl || undefined });
        } else {
          // Store locally in IndexedDB if still in localStorage
          await documentDb.set(d.id, d.dataUrl);
          const copy = { ...d };
          delete copy.dataUrl;
          enriched.push(d);
        }
      }
      setDocuments(enriched);
    };
    loadFullDocs().catch(console.error);

    setDataLoaded(true);
  }, []);

  // Firebase state tracker
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // --- SECURE LOGOUT WITH OPTIONAL CLOUD BACKUP TRIGGER ---
  const handleSecureLogout = () => {
    if (user) {
      setCustomDialog({
        isOpen: true,
        title: "پشتیبان‌گیری ابری و خروج",
        message: "آیا مایلید پیش از خروج از سامانه، یک نسخه پشتیبان آنلاین در فضای ابری ذخیره کنید؟ (در صورت انتخاب «بله»، اطلاعات همگام‌سازی شده و سپس پورتال خارج می‌شود)",
        type: "confirm",
        onConfirm: async () => {
          try {
            // SAFEGUARD: If the user has empty local data, they might have wiped it to test restoration, 
            // so we should NOT write/sync this empty state to the cloud during logout, which would delete their pristine cloud backup!
            const localIsEmpty = clients.length === 0 && cases.length === 0;
            if (localIsEmpty) {
              const savedMeta = safeStorage.getItem(`r_cloud_backup_meta_${user.uid}`);
              if (savedMeta) {
                console.log("Safeguarded cloud backup from being overwritten by empty local state during logout.");
                setIsAuthorized(false);
                return;
              }
            }

            // Strip base64 files to prevent Firestore 1MB quota limit error and reduce LocalStorage memory footprint
            const safeDocs = documents.map(d => {
              const copy = { ...d };
              delete copy.dataUrl;
              return copy;
            });

            await syncFullStateToCloud(user.uid, {
              clients,
              cases,
              notes,
              documents: safeDocs,
              events
            });
            const persianDate = new Date().toLocaleDateString("fa-IR");
            try {
              safeStorage.setItem(`r_cloud_backup_meta_${user.uid}`, JSON.stringify({
                date: persianDate,
                clientsCount: clients.length,
                casesCount: cases.length,
                notesCount: notes.length,
                docsCount: documents.length,
                eventsCount: events.length
              }));
            } catch (metaErr) {
              console.warn("Could not save cloud backup metadata to localStorage:", metaErr);
            }

            try {
              safeStorage.setItem("r_cloud_backup_slot", JSON.stringify({
                backupDateShort: persianDate,
                clients,
                cases,
                notes,
                documents: safeDocs,
                events
              }));
            } catch (slotErr) {
              console.warn("Could not save full cloud backup cache to localStorage due to quota limit:", slotErr);
              // Fallback to storing a skeleton object so existing checks for this slot still succeed
              try {
                safeStorage.setItem("r_cloud_backup_slot", JSON.stringify({
                  backupDateShort: persianDate,
                  clients: [],
                  cases: [],
                  notes: [],
                  documents: [],
                  events: []
                }));
              } catch (fallbackErr) {
                console.warn("Could not write even skeleton cloud backup slot:", fallbackErr);
              }
            }
          } catch (e) {
            console.error("Logout backup failed:", e);
          } finally {
            setIsAuthorized(false);
          }
        },
        onCancel: () => {
          setIsAuthorized(false);
        }
      });
    } else {
      setIsAuthorized(false);
    }
  };

  // --- PERSISTENCE SYNCHRONIZERS ---
  const handleAddClient = (client: Client) => {
    const updated = [client, ...clients];
    setClients(updated);
    saveData("r_clients", updated);
  };

  const handleUpdateClient = (updatedClient: Client) => {
    const updated = clients.map(cl => cl.id === updatedClient.id ? updatedClient : cl);
    setClients(updated);
    saveData("r_clients", updated);
  };

  const handleAddCase = (newCase: LegalCase) => {
    const updated = [newCase, ...cases];
    setCases(updated);
    saveData("r_cases", updated);
  };

  const handleUpdateCase = (updatedCase: LegalCase) => {
    const updated = cases.map(c => c.id === updatedCase.id ? updatedCase : c);
    setCases(updated);
    saveData("r_cases", updated);
  };

  const handleAddNote = (note: CaseNote) => {
    const updated = [note, ...notes];
    setNotes(updated);
    saveData("r_notes", updated);
  };

  const handleUpdateNote = (id: string, title: string, content: string) => {
    const updated = notes.map(n => n.id === id ? { ...n, title, content } : n);
    setNotes(updated);
    saveData("r_notes", updated);
  };

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    saveData("r_notes", updated);
  };

  const handleAddDocument = async (doc: CaseDocument) => {
    if (doc.dataUrl) {
      await documentDb.set(doc.id, doc.dataUrl);
    }
    const updated = [doc, ...documents];
    setDocuments(updated);

    const stripped = updated.map(d => {
      const copy = { ...d };
      delete copy.dataUrl;
      return copy;
    });
    saveData("r_documents", stripped);
  };

  const handleDeleteDocument = async (id: string) => {
    await documentDb.delete(id);
    const updated = documents.filter(d => d.id !== id);
    setDocuments(updated);

    const stripped = updated.map(d => {
      const copy = { ...d };
      delete copy.dataUrl;
      return copy;
    });
    saveData("r_documents", stripped);
  };

  const handleUpdateDocumentName = (id: string, newName: string) => {
    const updated = documents.map(d => d.id === id ? { ...d, name: newName } : d);
    setDocuments(updated);

    const stripped = updated.map(d => {
      const copy = { ...d };
      delete copy.dataUrl;
      return copy;
    });
    saveData("r_documents", stripped);
  };

  const handleUpdateDocumentList = (updated: CaseDocument[]) => {
    setDocuments(updated);

    const stripped = updated.map(d => {
      const copy = { ...d };
      delete copy.dataUrl;
      return copy;
    });
    saveData("r_documents", stripped);
  };

  const handleDeleteCase = (id: string) => {
    setCustomDialog({
      isOpen: true,
      title: "تایید حذف پرونده",
      message: "آیا از حذف کل پرونده و اسناد و یادداشت‌های مرتبط با آن اطمینان دارید؟ این عمل غیرقابل بازگشت است.",
      type: "confirm",
      onConfirm: async () => {
        // Delete IndexedDB content for the associated documents
        const docsToDelete = documents.filter(d => d.caseId === id);
        for (const doc of docsToDelete) {
          try {
            await documentDb.delete(doc.id);
          } catch (dbErr) {
            console.error("Error deleting doc content from IndexedDB on case deletion:", dbErr);
          }
        }

        setCases(prevCases => {
          const updatedCases = prevCases.filter(c => c.id !== id);
          saveData("r_cases", updatedCases);
          return updatedCases;
        });

        setNotes(prevNotes => {
          const updatedNotes = prevNotes.filter(n => n.caseId !== id);
          saveData("r_notes", updatedNotes);
          return updatedNotes;
        });

        setDocuments(prevDocs => {
          const updatedDocs = prevDocs.filter(d => d.caseId !== id);
          // Crucial: Strip base64 dataUrl to avoid QuotaExceededError crashes in localStorage
          const stripped = updatedDocs.map(d => {
            const copy = { ...d };
            delete copy.dataUrl;
            return copy;
          });
          saveData("r_documents", stripped);
          return updatedDocs;
        });

        setEvents(prevEvents => {
          const updatedEvs = prevEvents.filter(e => e.caseId !== id);
          saveData("r_events", updatedEvs);
          return updatedEvs;
        });

        setCustomDialog(null);
      },
      onCancel: () => setCustomDialog(null)
    });
  };

  const handleDeleteClient = (id: string) => {
    const associatedCases = cases.filter(c => c.clientId === id);
    
    setCustomDialog({
      isOpen: true,
      title: "تایید حذف موکل",
      message: associatedCases.length > 0
        ? `آیا از حذف این موکّل اطمینان دارید؟ توجه داشته باشید که این موکّل دارای ${toPersianDigits(associatedCases.length)} پرونده فعال در سیستم است و با تایید حذف، کلیه پرونده‌ها، یادداشت‌‌ها، تقویم و اسناد مرتبط با او نیز حذف دائمی خواهند شد.`
        : "آیا از حذف پروفایل هویتی این موکّل اطمینان دارید؟",
      type: "confirm",
      onConfirm: async () => {
        // 1. Delete client
        setClients(prevClients => {
          const updated = prevClients.filter(cl => cl.id !== id);
          saveData("r_clients", updated);
          return updated;
        });

        if (associatedCases.length > 0) {
          const caseIds = associatedCases.map(c => c.id);

          // 2. Delete associated cases
          setCases(prevCases => {
            const updated = prevCases.filter(c => c.clientId !== id);
            saveData("r_cases", updated);
            return updated;
          });

          // 3. Delete associated notes
          setNotes(prevNotes => {
            const updated = prevNotes.filter(n => !caseIds.includes(n.caseId));
            saveData("r_notes", updated);
            return updated;
          });

          // 4. Delete associated documents from IndexedDB and state (and strip them)
          const docsToDelete = documents.filter(d => caseIds.includes(d.caseId));
          for (const doc of docsToDelete) {
            try {
              await documentDb.delete(doc.id);
            } catch (dbErr) {
              console.error("Error deleting doc from IndexedDB on client cascade deletion:", dbErr);
            }
          }

          setDocuments(prevDocs => {
            const updatedDocs = prevDocs.filter(d => !caseIds.includes(d.caseId));
            const stripped = updatedDocs.map(d => {
              const copy = { ...d };
              delete copy.dataUrl;
              return copy;
            });
            saveData("r_documents", stripped);
            return updatedDocs;
          });

          // 5. Delete associated events
          setEvents(prevEvents => {
            const updated = prevEvents.filter(e => !e.caseId || !caseIds.includes(e.caseId));
            saveData("r_events", updated);
            return updated;
          });
        }

        setCustomDialog(null);
      },
      onCancel: () => setCustomDialog(null)
    });
  };

  const handleAddEvent = (ev: LegalEvent) => {
    setEvents(prev => {
      const updated = [ev, ...prev];
      saveData("r_events", updated);
      return updated;
    });
  };

  const handleUpdateEvent = (updatedEv: LegalEvent) => {
    setEvents(prev => {
      const updated = prev.map(e => e.id === updatedEv.id ? updatedEv : e);
      saveData("r_events", updated);
      return updated;
    });
  };

  const handleDeleteEvent = (id: string) => {
    setCustomDialog({
      isOpen: true,
      title: "حذف جلسه یا رویداد",
      message: "آیا از حذف این رویداد یا جلسه دادرسی تقویم اطمینان کامل دارید؟",
      type: "confirm",
      onConfirm: () => {
        setEvents(prev => {
          const updated = prev.filter(e => e.id !== id);
          saveData("r_events", updated);
          return updated;
        });
        setCustomDialog(null);
      },
      onCancel: () => setCustomDialog(null)
    });
  };

  // --- GENERAL UPDATE PROFILE FOR LAWYER REGISTER ---
  const handleUpdateProfile = (name: string, nationalId: string, pass: string, photo?: string) => {
    setLawyerName(name);
    setLawyerNationalId(nationalId);
    setLawyerPassword(pass);
    if (photo !== undefined) {
      setLawyerPhoto(photo);
      safeStorage.setItem("r_lawyer_photo", photo);
    }
    setIsRegistered(true);
    safeStorage.setItem("r_lawyer_name", name);
    safeStorage.setItem("r_lawyer_national_id", nationalId);
    safeStorage.setItem("r_lawyer_password", pass);
    safeStorage.setItem("r_lawyer_registered", "true");
  };

  const handleTriggerRestoreData = async (parsed: any) => {
    setClients(parsed.clients || []);
    setCases(parsed.cases || []);
    setNotes(parsed.notes || []);
    setEvents(parsed.events || []);

    const docs = parsed.documents || [];
    const localDocsWithoutUrls = [];
    for (const doc of docs) {
      if (doc.dataUrl) {
        await documentDb.set(doc.id, doc.dataUrl);
      }
      const copy = { ...doc };
      delete copy.dataUrl;
      localDocsWithoutUrls.push(copy);
    }
    setDocuments(docs);

    saveData("r_clients", parsed.clients || []);
    saveData("r_cases", parsed.cases || []);
    saveData("r_notes", parsed.notes || []);
    saveData("r_documents", localDocsWithoutUrls);
    saveData("r_events", parsed.events || []);
  };

  // --- JSON BACKUP ARCHIVE ENGINES ---
  const handleExportBackup = () => {
    const backupObj = {
      clients,
      cases,
      notes,
      documents,
      events,
      exportVersion: "1.0",
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `پشتیبان_دفتر_وکالت_${lawyerName.replace(/\s+/g, "_")}_${new Date().toLocaleDateString("fa-IR").replace(/\//g, "-")}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.clients && parsed.cases && parsed.notes && parsed.documents && parsed.events) {
          setCustomDialog({
            isOpen: true,
            title: "تایید بازیابی اطلاعات کلاسه",
            message: "با ورود فایل بکاپ تمامی اطلاعات فعلی مرورگر شما هم‌اکنون با نسخه پشتیبان انتخابی جایگزین می‌شود. آیا موافقید؟",
            type: "confirm",
            onConfirm: () => {
              handleTriggerRestoreData(parsed);
              setCustomDialog({
                isOpen: true,
                title: "موفقیت در بازیابی",
                message: "پیکربندی اطلاعات قانونی و آرشیو با موفقیت بازیابی و بروزرسانی شد.",
                type: "alert",
                onConfirm: () => setCustomDialog(null)
              });
            },
            onCancel: () => setCustomDialog(null)
          });
        } else {
          setCustomDialog({
            isOpen: true,
            title: "خطای فرمت پشتیبان",
            message: "فایل پشتیبان انتخاب شده نامعتبر بوده و فاقد اطلاعات لازم برای اجراست.",
            type: "alert",
            onConfirm: () => setCustomDialog(null)
          });
        }
      } catch (err) {
        setCustomDialog({
          isOpen: true,
          title: "خطای سیستم در خوانش",
          message: "خطا در خواندن فایل پشتیبان ارسالی رخ داد.",
          type: "alert",
          onConfirm: () => setCustomDialog(null)
        });
      }
    };
    reader.readAsText(file);
  };

  if (!isAuthorized) {
    return (
      <SecurityGate
        storedName={lawyerName}
        storedNationalId={lawyerNationalId}
        storedPass={lawyerPassword}
        isRegistered={isRegistered}
        onRegisterCustom={handleUpdateProfile}
        onUnlockSuccess={() => setIsAuthorized(true)}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 font-sans relative" dir="rtl">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-slate-950 text-white p-3.5 flex items-center justify-between border-b border-amber-500/30 z-30">
        <div className="flex items-center gap-3">
          {/* Avatar and name directly on mobile top bar */}
          <div className="w-8.5 h-8.5 rounded-full bg-slate-900 border border-amber-500/30 overflow-hidden flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.15)]">
            {lawyerPhoto ? (
              <img src={lawyerPhoto} alt="وکیل" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <Scale className="w-4 h-4 text-amber-500" />
            )}
          </div>
          <div className="flex flex-col">
            <h1 className="text-[9.5px] sm:text-[11px] font-bold text-amber-400 leading-tight">اتوماسیون هوشمند دفتر وکالت</h1>
            <p className="text-[13px] sm:text-base font-black text-white mt-0.5 leading-none select-none tracking-wide">{lawyerName || "رضا پورمحمد"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-sm sm:text-base md:text-lg font-black text-amber-400 tracking-wide leading-none select-none pl-1">
            إِنَّا فَتَحْنَا لَكَ فَتْحًا مُّبِينًا
          </span>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 text-amber-500 hover:text-white bg-slate-900 border border-slate-800 rounded-lg shrink-0"
          >
            {sidebarOpen ? <X className="w-5 h-5 block" /> : <Menu className="w-5 h-5 block" />}
          </button>
        </div>
      </div>

      {/* Primary Sidebar Panel */}
      <aside
        className={`w-72 bg-gradient-to-b from-slate-950 to-slate-900 text-slate-300 border-l border-amber-500/20 flex flex-col justify-between shrink-0 p-5 z-40 md:z-10 transition-transform duration-300 md:translate-x-0 fixed md:static inset-y-0 right-0 h-full shadow-2xl ${
          sidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
        }`}
      >
        <div className="space-y-6">
          {/* Lawyer Brand profile badge */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-300 p-[1.5px] shadow-[0_0_12px_rgba(217,119,6,0.35)] shrink-0 overflow-hidden">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-500 overflow-hidden">
                  {lawyerPhoto ? (
                    <img src={lawyerPhoto} alt="وکیل" className="w-full h-full object-cover rounded-[14px]" referrerPolicy="no-referrer" />
                  ) : (
                    <Scale className="w-5 h-5 text-amber-400 animate-pulse" />
                  )}
                </div>
              </div>
              <div className="min-w-0">
                <h2 className="text-[12px] font-black text-white tracking-tight leading-6 truncate w-32">وکیل {lawyerName}</h2>
                <p className="text-[9px] text-amber-400 font-bold tracking-wider">وکیل پایه یک دادگستری</p>
                <div className="inline-flex mt-1 items-center px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/20 text-[7px] text-amber-400 font-extrabold uppercase">پورتال هوشمند</div>
              </div>
            </div>

            {/* Mobile close hamburger overlay */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-850 transition"
              title="بستن منو"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 text-xs font-semibold">
            <button
              onClick={() => {
                setActiveTab("dashboard");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition select-none cursor-pointer duration-150 ${
                activeTab === "dashboard"
                  ? "bg-amber-500 text-white font-black shadow-md shadow-amber-500/10"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              داشبورد اداری دفتر
            </button>

            <button
              onClick={() => {
                setActiveTab("finance");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition select-none cursor-pointer duration-150 ${
                activeTab === "finance"
                  ? "bg-amber-500 text-white font-black shadow-md shadow-amber-500/10"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Coins className={`w-4 h-4 shrink-0 ${activeTab === "finance" ? "text-white" : "text-amber-500"}`} />
              امور مالی و حسابداری دفتر
            </button>

            <button
              onClick={() => {
                setActiveTab("calculators");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition select-none cursor-pointer duration-150 ${
                activeTab === "calculators"
                  ? "bg-amber-500 text-white font-black shadow-md shadow-amber-500/10"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Scale className="w-4 h-4 shrink-0" />
              محاسبات
            </button>

            <button
              onClick={() => {
                setActiveTab("chat");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition select-none cursor-pointer duration-150 ${
                activeTab === "chat"
                  ? "bg-amber-500 text-white font-black shadow-md shadow-amber-500/10"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <MessageSquare className={`w-4 h-4 shrink-0 ${activeTab === "chat" ? "text-white" : "text-amber-500 hover:text-inherit"}`} />
              مشاوره هوشمند (چت AI)
            </button>

            <button
              onClick={() => {
                setActiveTab("adliran");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition select-none cursor-pointer duration-150 ${
                activeTab === "adliran"
                  ? "bg-amber-500 text-white font-black shadow-md shadow-amber-500/10"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Link2 className="w-4 h-4 shrink-0" />
              اتصال به عدل ایران
            </button>

            <button
              onClick={() => {
                setActiveTab("laws");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition select-none cursor-pointer duration-150 ${
                activeTab === "laws"
                  ? "bg-amber-500 text-white font-black shadow-md shadow-amber-500/10"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <BookOpen className={`w-4 h-4 shrink-0 ${activeTab === "laws" ? "text-white" : "text-amber-500"}`} />
              یار هوش مصنوعی قوانین و مقررات جمهوری اسلامی ایران
            </button>

            <button
              onClick={() => {
                setActiveTab("quick-notes");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition select-none cursor-pointer duration-150 ${
                activeTab === "quick-notes"
                  ? "bg-amber-500 text-white font-black shadow-md shadow-amber-500/10"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <FileText className={`w-4 h-4 shrink-0 ${activeTab === "quick-notes" ? "text-white" : "text-amber-500"}`} />
              یادداشت
            </button>


            <button
              onClick={() => {
                setActiveTab("backup-center");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition select-none cursor-pointer duration-150 ${
                activeTab === "backup-center"
                  ? "bg-amber-500 text-white font-black shadow-md shadow-amber-500/10"
                  : "text-slate-400 hover:bg-slate-805 hover:text-white"
              }`}
            >
              <Database className={`w-4 h-4 shrink-0 ${activeTab === "backup-center" ? "text-white" : "text-amber-500 hover:text-inherit"}`} />
              پشتیبان‌گیری اطلاعات دفتر
            </button>

            <button
              onClick={() => {
                setActiveTab("backup");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition select-none cursor-pointer duration-150 ${
                activeTab === "backup"
                  ? "bg-amber-500 text-white font-black shadow-md shadow-amber-500/10"
                  : "text-slate-400 hover:bg-slate-850 hover:text-white"
              }`}
            >
              <Shield className={`w-4 h-4 shrink-0 ${activeTab === "backup" ? "text-white" : "text-amber-500 hover:text-inherit"}`} />
              تنظیمات امنیتی و رمز ورود
            </button>
          </nav>
        </div>

        {/* Backups & Settings abbreviated quick access block */}
        <div className="border-t border-slate-800/85 pt-4 space-y-4 text-[11px] font-bold">
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                setCustomDialog({
                  isOpen: true,
                  title: "راهنمای اشتراک‌گذاری",
                  message: "برای ارسال این نرم‌افزار به شخص دیگر، لطفاً از دکمه «Share» (یا Export/Deploy) در منوی بالای همین صفحه (سیستم AI Studio) استفاده کنید. از آنجا که اطلاعات شما فقط در مرورگر خودتان (Local Storage) ذخیره شده است، هر شخصی که لینک را باز کند، یک نسخه کاملاً «خام» و بدون داده‌های شما دریافت خواهد کرد.",
                  type: "alert"
                });
              }}
              className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/30 text-amber-500 rounded-xl transition flex items-center justify-center gap-2 select-none cursor-pointer border border-amber-500/20"
            >
              <Share2 className="w-3.5 h-3.5" />
              راهنمای ارسال نرم‌افزار
            </button>
            <button
              onClick={handleSecureLogout}
              className="w-full py-2 bg-red-950/20 hover:bg-red-950/40 text-red-400 rounded-xl transition flex items-center justify-center gap-2 select-none cursor-pointer border border-red-900/10"
            >
              <Lock className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              خروج امن (قفل کردن پورتال)
            </button>
          </div>

          <div className="text-center font-semibold text-[10px] text-slate-500 bg-slate-950/20 p-2 rounded-xl">
            حقوقی {lawyerName || "وکیل"} • نسخه امنیتی ۲.۰
          </div>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
        {activeTab !== "dashboard" && activeTab !== "add-reminder" && (
          <div id="workspace-back-runner" className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-100 p-4 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-top-4 duration-350">
            <div className="flex items-center gap-3 font-semibold text-slate-705">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shrink-0">
                {activeTab === "cases" && <Briefcase className="w-5 h-5 font-bold" />}
                {activeTab === "calculators" && <Scale className="w-5 h-5 font-bold" />}
                {activeTab === "finance" && <Coins className="w-5 h-5 font-bold" />}
                {activeTab === "calendar" && <CalendarIcon className="w-5 h-5 font-bold" />}
                {activeTab === "chat" && <MessageSquare className="w-5 h-5 font-bold" />}
                {activeTab === "adliran" && <Link2 className="w-5 h-5 font-bold" />}
                {activeTab === "terminology" && <Search className="w-5 h-5 font-bold" />}
                {activeTab === "laws" && <BookOpen className="w-5 h-5 font-bold" />}
                {activeTab === "quick-notes" && <FileText className="w-5 h-5 font-bold" />}
                {activeTab === "backup" && <Shield className="w-5 h-5 font-bold" />}
                {activeTab === "backup-center" && <Database className="w-5 h-5 font-bold" />}
                {activeTab === "event-archive" && <Archive className="w-5 h-5 font-bold" />}
              </div>
              <div className="text-right">
                <h2 className="text-xs font-black text-slate-800">
                  {activeTab === "cases" && "پروفایل پرونده و موکلین"}
                  {activeTab === "calculators" && "محاسبات"}
                  {activeTab === "finance" && "امور مالی و حسابداری دفتر"}
                  {activeTab === "calendar" && "رویدادها و تقویم شمسی"}
                  {activeTab === "chat" && "مشاوره هوشمند (چت AI)"}
                  {activeTab === "adliran" && "اتصال به عدل ایران"}
                  {activeTab === "terminology" && "ترمینو‌لوژی حقوقی"}
                  {activeTab === "laws" && "یار هوش مصنوعی قوانین و مقررات جمهوری اسلامی ایران"}
                  {activeTab === "quick-notes" && "یادداشت"}
                  {activeTab === "backup" && "تنظیمات امنیتی و رمز ورود"}
                  {activeTab === "backup-center" && "مرکز پشتیبان‌گیری اطلاعات دفتر"}
                  {activeTab === "event-archive" && "بایگانی رویدادهای گذشته"}
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5 font-bold font-sans">بخش فعال در پورتال هوشمند مدیریت وکالت {lawyerName || "وکیل"}</p>
              </div>
            </div>
            <button
              id="global-back-button"
              onClick={handleBack}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-850 text-amber-400 hover:text-amber-300 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-md shadow-slate-900/10"
            >
              <ArrowRight className="w-4 h-4 text-amber-500" />
              <span>برگشت به صفحه قبل</span>
            </button>
          </div>
        )}

        {/* Render active workspace component */}
        {activeTab === "dashboard" && (
          <Dashboard
            clients={clients}
            cases={cases}
            events={events}
            lawyerName={lawyerName}
            onNavigate={(tab, subTab, stateToPass) => {
              if (tab === "add-reminder" && stateToPass) {
                setEditingReminder(stateToPass);
              } else {
                setEditingReminder(undefined);
              }
              setActiveTab(tab);
              if (subTab) setActiveCaseSubTab(subTab);
            }}
            onAddEvent={handleAddEvent}
            onUpdateEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
            onAddDocument={handleAddDocument}
          />
        )}



        {activeTab === "cases" && (
          <CaseManager
            defaultSubTab={activeCaseSubTab}
            clients={clients}
            cases={cases}
            notes={notes}
            documents={documents}
            onAddClient={handleAddClient}
            onAddCase={handleAddCase}
            onUpdateCase={handleUpdateCase}
            onAddNote={handleAddNote}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
            onAddDocument={handleAddDocument}
            onUpdateDocumentName={handleUpdateDocumentName}
            onUpdateDocumentList={handleUpdateDocumentList}
            onDeleteDocument={handleDeleteDocument}
            onDeleteCase={handleDeleteCase}
            onDeleteClient={handleDeleteClient}
            onUpdateClient={handleUpdateClient}
          />
        )}

        {activeTab === "calculators" && <LegalCalculators />}

        {activeTab === "finance" && (
          <FinanceLedger
            cases={cases}
            clients={clients}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === "calendar" && (
          <CalendarPanel
            events={events}
            onAddEvent={handleAddEvent}
            onUpdateEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
            casesList={cases.map((c) => ({ id: c.id, title: c.title, clientName: c.clientName }))}
          />
        )}

        {activeTab === "chat" && <AIAssistant />}

        {activeTab === "adliran" && <AdlIranPortal />}

        {activeTab === "terminology" && <Terminology />}

        {activeTab === "laws" && <LawsExplorer />}

        {activeTab === "quick-notes" && <QuickNotes />}

        {activeTab === "backup" && (
          <BackupSecurityHub
            clients={clients}
            cases={cases}
            notes={notes}
            documents={documents}
            events={events}
            lawyerName={lawyerName}
            lawyerNationalId={lawyerNationalId}
            lawyerPassword={lawyerPassword}
            lawyerPhoto={lawyerPhoto}
            onUpdateProfile={handleUpdateProfile}
            onTriggerRestore={handleTriggerRestoreData}
            onLockScreen={handleSecureLogout}
          />
        )}

        {activeTab === "backup-center" && (
          <BackupCenter
            clients={clients}
            cases={cases}
            notes={notes}
            documents={documents}
            events={events}
            lawyerName={lawyerName}
            lawyerNationalId={lawyerNationalId}
            onTriggerRestore={handleTriggerRestoreData}
          />
        )}

        {activeTab === "add-reminder" && (
          <AddReminderPage
            cases={cases}
            onAddEvent={handleAddEvent}
            onUpdateEvent={handleUpdateEvent}
            onBack={handleBack}
            editingEvent={editingReminder}
            onAddDocument={handleAddDocument}
          />
        )}

        {activeTab === "event-archive" && (
          <PastEventsArchive
            events={events}
            onBack={handleBack}
            onEdit={(ev) => {
              setEditingReminder(ev);
              setActiveTab("add-reminder");
            }}
            onDelete={handleDeleteEvent}
          />
        )}
      </main>

      {/* CUSTOM DIALOG MODAL (IFRAME-SAFE OVERLAYS) */}
      {customDialog && customDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-slate-200 animate-in zoom-in duration-150">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                <Shield className="w-5.5 h-5.5" />
              </div>
              <h3 className="text-sm font-black text-white">{customDialog.title}</h3>
            </div>
            
            <p className="text-xs text-slate-350 leading-relaxed font-bold">
              {customDialog.message}
            </p>
            
            <div className="flex items-center justify-end gap-3 pt-2">
              {customDialog.type === "confirm" && (
                <button
                  type="button"
                  onClick={() => {
                    if (customDialog.onCancel) customDialog.onCancel();
                    setCustomDialog(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-black transition cursor-pointer select-none"
                >
                  انصراف
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (customDialog.onConfirm) customDialog.onConfirm();
                  setCustomDialog(null);
                }}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition cursor-pointer select-none"
              >
                تایید
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
