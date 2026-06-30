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
import LawsDatabase from "./components/LawsDatabase";
import QuickNotes from "./components/QuickNotes";
import StandaloneDocViewer from "./components/StandaloneDocViewer";
import DeadlineResultPage from "./components/DeadlineResultPage";
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
  Clock,
  CloudUpload,
  ArrowRight,
  Bell,
  CheckCircle2,
  Database,
  Archive,
  Search,
  Printer, // <-- Added Import
  FileText,
  Globe,
  Copy
} from "lucide-react";

import { auth, onAuthStateChanged } from "./firebase/config";
import { syncFullStateToCloud, restoreFromCloud } from "./firebase/db";
type User = { uid: string; email?: string | null };

export default function App() {
  // Theme state: "amber" (classic), "turquoise", "crimson", "emerald", "royal", "dark"
  type AppTheme = "amber" | "turquoise" | "crimson" | "emerald" | "royal" | "dark";
  const [theme, setTheme] = useState<AppTheme>(() => {
    const saved = safeStorage.getItem("r_app_theme") as AppTheme;
    return ["amber", "turquoise", "crimson", "emerald", "royal", "dark"].includes(saved) ? saved : "amber";
  });

  // Navigation active tab
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "cases" | "calculators" | "calendar" | "chat" | "adliran" | "finance" | "backup" | "backup-center" | "add-reminder" | "event-archive" | "terminology" | "laws" | "laws-db" | "quick-notes" | "ara-vahdat" | "nazariat" | "deadline-result"
  >("dashboard");
  const [activeCaseSubTab, setActiveCaseSubTab] = useState<"cases" | "closedCases" | "clients">("cases");
  const [targetCaseId, setTargetCaseId] = useState<string | undefined>(undefined);
  const [targetCaseOpenNotes, setTargetCaseOpenNotes] = useState<boolean>(false);
  
  // State for deadline calculation result page
  const [deadlineCalcData, setDeadlineCalcData] = useState<any>(null);

  // Tab History tracker for Back button functionality
  const [tabHistory, setTabHistory] = useState<string[]>(["dashboard"]);

  // Mobile sidebar layout drawer toggle
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dnsInfo, setDnsInfo] = useState<string | null>(null);

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
              title: `هشدار هوشمند قضایی`,
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

  // Load Initial persistent states with resilient fallback layers
  const [dataLoaded, setDataLoaded] = useState(false);
  useEffect(() => {
    const loadDataResilient = async () => {
      let localClients = [];
      let localCases = [];
      let localNotes = [];
      let localDocuments = [];
      let localEvents = [];
      let usingIndexedDB = false;

      // 1. First, try reading from IndexedDB (the most robust)
      try {
        const idxClients = await documentDb.get("idx_r_clients");
        const idxCases = await documentDb.get("idx_r_cases");
        const idxNotes = await documentDb.get("idx_r_notes");
        const idxDocuments = await documentDb.get("idx_r_documents");
        const idxEvents = await documentDb.get("idx_r_events");

        if (idxClients && idxCases) {
          localClients = JSON.parse(idxClients);
          localCases = JSON.parse(idxCases);
          localNotes = idxNotes ? JSON.parse(idxNotes) : [];
          localDocuments = idxDocuments ? JSON.parse(idxDocuments) : [];
          localEvents = idxEvents ? JSON.parse(idxEvents) : [];
          usingIndexedDB = true;
          console.log("Loaded data successfully from robust IndexedDB storage.");
        }
      } catch (err) {
        console.warn("Failed to load initial data from IndexedDB, falling back to localStorage:", err);
      }

      // 2. Fallback to localStorage/defaults if IndexedDB has no data
      if (!usingIndexedDB) {
        const data = loadAllData();
        localClients = data.clients;
        localCases = data.cases;
        localNotes = data.notes;
        localDocuments = data.documents;
        localEvents = data.events;
      }

      setClients(localClients);
      setCases(localCases);
      setNotes(localNotes);
      setEvents(localEvents);

      // 3. Load full documents (incorporating IndexedDB binary dataUrls)
      const enriched = [];
      for (const d of localDocuments) {
        if (!d.dataUrl) {
          const storedUrl = await documentDb.get(d.id);
          enriched.push({ ...d, dataUrl: storedUrl || undefined });
        } else {
          await documentDb.set(d.id, d.dataUrl);
          const copy = { ...d };
          delete copy.dataUrl;
          enriched.push(d);
        }
      }
      setDocuments(enriched);
      setDataLoaded(true);
    };

    loadDataResilient().catch(console.error);
  }, []);

  // Robust auto-persistence to IndexedDB to survive localStorage clearance/iframe blocks
  useEffect(() => {
    if (!dataLoaded) return;
    const persistToIndexedDB = async () => {
      try {
        const safeDocs = documents.map(d => {
          const copy = { ...d };
          delete copy.dataUrl; // Keep IndexedDB metadata small, binary urls are stored separately
          return copy;
        });
        await documentDb.set("idx_r_clients", JSON.stringify(clients));
        await documentDb.set("idx_r_cases", JSON.stringify(cases));
        await documentDb.set("idx_r_notes", JSON.stringify(notes));
        await documentDb.set("idx_r_documents", JSON.stringify(safeDocs));
        await documentDb.set("idx_r_events", JSON.stringify(events));
        
        // Also save to localStorage as a fallback (except documents to avoid 5MB limit)
        import('./utils/safeStorage').then(({ safeStorage }) => {
          safeStorage.setItem("r_clients", JSON.stringify(clients));
          safeStorage.setItem("r_cases", JSON.stringify(cases));
          safeStorage.setItem("r_notes", JSON.stringify(notes));
          safeStorage.setItem("r_events", JSON.stringify(events));
        });
      } catch (e) {
        console.warn("IndexedDB auto-save failed:", e);
      }
    };
    persistToIndexedDB();
  }, [clients, cases, notes, documents, events, dataLoaded]);

  // Firebase state tracker
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Auto-restore from Firestore cloud if local storage is empty/default and a user is logged in
  useEffect(() => {
    if (user && dataLoaded) {
      const isLocalEmpty = (clients.length === 0 && cases.length === 0) ||
                           (clients.length === 3 && clients[0].id === "cl_1" && cases.length === 3 && cases[0].id === "ca_1");
      if (isLocalEmpty) {
        console.log("Local state is empty/default. Attempting to auto-load backup from Firestore for user:", user.uid);
        restoreFromCloud(user.uid)
          .then((cloudData) => {
            if (cloudData) {
              handleTriggerRestoreData(cloudData);
              console.log("Successfully auto-restored legal archive from Firestore on login/startup!");
            }
          })
          .catch((err) => {
            console.error("Auto-restoring from Firestore failed:", err);
          });
      }
    }
  }, [user, dataLoaded]);

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

  const handleUpdateDocument = (id: string, updates: Partial<CaseDocument>) => {
    const updated = documents.map(d => d.id === id ? { ...d, ...updates } : d);
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

    const totalClients = (parsed.clients || []).length;
    const totalCases = (parsed.cases || []).length;
    const totalEvents = (parsed.events || []).length;

    // Sync restored data to the cloud if a user is currently logged in,
    // to prevent cloud metadata mismatch or older cloud backup from overwriting local state.
    if (user) {
      const persianDate = new Date().toLocaleDateString("fa-IR");
      const meta = {
        date: persianDate,
        clientsCount: totalClients,
        casesCount: totalCases,
        notesCount: (parsed.notes || []).length,
        docsCount: localDocsWithoutUrls.length,
        eventsCount: totalEvents
      };

      try {
        safeStorage.setItem(`r_cloud_backup_meta_${user.uid}`, JSON.stringify(meta));
        safeStorage.setItem("r_cloud_backup_slot", JSON.stringify({
          backupDateShort: persianDate,
          clients: parsed.clients || [],
          cases: parsed.cases || [],
          notes: parsed.notes || [],
          documents: localDocsWithoutUrls,
          events: parsed.events || []
        }));

        await syncFullStateToCloud(user.uid, {
          clients: parsed.clients || [],
          cases: parsed.cases || [],
          notes: parsed.notes || [],
          documents: localDocsWithoutUrls,
          events: parsed.events || []
        });
        console.log("Successfully synchronized restored data and metadata with the backup cloud.");
      } catch (cloudErr) {
        console.warn("Could not sync restored data/metadata with backup cloud:", cloudErr);
      }
    }

    alert(`بازیابی با موفقیت انجام شد:\n- ${toPersianDigits(totalClients)} موکل\n- ${toPersianDigits(totalCases)} پرونده\n- ${toPersianDigits(totalEvents)} رویداد و آلارم\n\nاطلاعات با موفقیت جایگزین شد.`);
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

  // Check if we are in standalone document viewer mode
  const params = new URLSearchParams(window.location.search);
  const standaloneDocId = params.get("previewDocId");
  const standaloneName = params.get("name") || "سند";
  const standaloneType = params.get("type") || "pdf";

  if (standaloneDocId) {
    return (
      <StandaloneDocViewer
        docId={standaloneDocId}
        initialName={standaloneName}
        initialType={standaloneType}
      />
    );
  }

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
    <div className={`min-h-screen flex flex-col md:flex-row bg-slate-50 font-sans relative ${
      theme === "turquoise" ? "theme-turquoise" :
      theme === "crimson" ? "theme-crimson" :
      theme === "emerald" ? "theme-emerald" :
      theme === "royal" ? "theme-royal" :
      theme === "dark" ? "theme-dark dark" : ""
    }`} dir="rtl">
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
                setActiveTab("calendar");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition select-none cursor-pointer duration-150 ${
                activeTab === "calendar"
                  ? "bg-amber-500 text-white font-black shadow-md shadow-amber-500/10"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <CalendarIcon className="w-4 h-4 shrink-0" />
              رویدادها و تقویم شمسی
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

            {/* Removed Adliran */}
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
              اتصال به سایت عدل ایران
            </button>

            <button
              onClick={() => {
                setActiveTab("terminology");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition select-none cursor-pointer duration-150 ${
                activeTab === "terminology"
                  ? "bg-amber-500 text-white font-black shadow-md shadow-amber-500/10"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Search className={`w-4 h-4 shrink-0 ${activeTab === "terminology" ? "text-white" : "text-amber-500"}`} />
              لغت‌نامه و ترمینولوژی
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
          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 block text-right pr-1">پوسته و تم نرم‌افزار:</span>
            <div className="grid grid-cols-2 gap-1.5 bg-slate-950/45 p-1.5 rounded-xl border border-slate-850/60">
              <button
                type="button"
                onClick={() => {
                  setTheme("amber");
                  safeStorage.setItem("r_app_theme", "amber");
                }}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  theme === "amber"
                    ? "bg-amber-500 text-slate-950 shadow"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                طلایی کلاسیک
              </button>

              <button
                type="button"
                onClick={() => {
                  setTheme("turquoise");
                  safeStorage.setItem("r_app_theme", "turquoise");
                }}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  theme === "turquoise"
                    ? "bg-teal-500 text-slate-950 shadow"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-teal-400" />
                فیروزه‌ای
              </button>

              <button
                type="button"
                onClick={() => {
                  setTheme("crimson");
                  safeStorage.setItem("r_app_theme", "crimson");
                }}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  theme === "crimson"
                    ? "bg-rose-600 text-white shadow"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                زرشکی مجلل
              </button>

              <button
                type="button"
                onClick={() => {
                  setTheme("emerald");
                  safeStorage.setItem("r_app_theme", "emerald");
                }}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  theme === "emerald"
                    ? "bg-emerald-600 text-white shadow"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                سبز قضایی
              </button>

              <button
                type="button"
                onClick={() => {
                  setTheme("royal");
                  safeStorage.setItem("r_app_theme", "royal");
                }}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  theme === "royal"
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                آبی سلطنتی
              </button>

              <button
                type="button"
                onClick={() => {
                  setTheme("dark");
                  safeStorage.setItem("r_app_theme", "dark");
                }}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  theme === "dark"
                    ? "bg-slate-900 text-white shadow border border-slate-700"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-black border border-slate-600" />
                مشکی اولد (کاهش باتری)
              </button>
            </div>
          </div>

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
                {activeTab === "laws-db" && <BookOpen className="w-5 h-5 font-bold" />}
                {activeTab === "ara-vahdat" && <BookOpen className="w-5 h-5 font-bold" />}
                {activeTab === "nazariat" && <HelpCircle className="w-5 h-5 font-bold" />}
                {activeTab === "quick-notes" && <FileText className="w-5 h-5 font-bold" />}
                {activeTab === "backup" && <Shield className="w-5 h-5 font-bold" />}
                {activeTab === "backup-center" && <Database className="w-5 h-5 font-bold" />}
                {activeTab === "event-archive" && <Archive className="w-5 h-5 font-bold" />}
                {activeTab === "deadline-result" && <Clock className="w-5 h-5 font-bold" />}
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
                  {activeTab === "laws-db" && "مجموعه قوانین"}
                  {activeTab === "ara-vahdat" && "مجموعه آرا وحدت رویه"}
                  {activeTab === "nazariat" && "نظریات مشورتی"}
                  {activeTab === "quick-notes" && "یادداشت"}
                  {activeTab === "backup" && "تنظیمات امنیتی و رمز ورود"}
                  {activeTab === "backup-center" && "مرکز پشتیبان‌گیری اطلاعات دفتر"}
                  {activeTab === "event-archive" && "بایگانی رویدادهای گذشته"}
                  {activeTab === "deadline-result" && "نتیجه محاسبه موعد قانونی"}
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
              if (tab === "cases" && typeof stateToPass === "string") {
                setTargetCaseId(stateToPass);
              } else {
                setTargetCaseId(undefined);
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
            initialCaseId={targetCaseId}
            initialOpenNotes={targetCaseOpenNotes}
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
            onUpdateDocument={handleUpdateDocument}
            onUpdateDocumentList={handleUpdateDocumentList}
            onDeleteDocument={handleDeleteDocument}
            onDeleteCase={handleDeleteCase}
            onDeleteClient={handleDeleteClient}
            onUpdateClient={handleUpdateClient}
            onNavigate={(tab) => setActiveTab(tab as any)}
          />
        )}

        {activeTab === "calculators" && (
          <LegalCalculators 
            onCalculateDeadline={(data) => {
              setDeadlineCalcData(data);
              setActiveTab("deadline-result");
            }} 
          />
        )}

        {activeTab === "deadline-result" && (
          <DeadlineResultPage 
            {...deadlineCalcData}
            onBack={() => setActiveTab("calculators")}
          />
        )}

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

        {activeTab === "laws-db" && <LawsDatabase />}

        {activeTab === "ara-vahdat" && <LawsDatabase mode="ara-vahdat" />}

        {activeTab === "nazariat" && <LawsDatabase mode="nazariat" />}

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
             onNavigate={(tab, subTab, stateToPass) => {
              if (tab === "cases") {
                if (typeof stateToPass === "string") {
                  setTargetCaseId(stateToPass);
                  setTargetCaseOpenNotes(false);
                } else if (typeof stateToPass === "object" && stateToPass !== null) {
                  setTargetCaseId(stateToPass.caseId);
                  setTargetCaseOpenNotes(!!stateToPass.openNotes);
                } else {
                  setTargetCaseId(undefined);
                  setTargetCaseOpenNotes(false);
                }
              } else {
                setTargetCaseId(undefined);
                setTargetCaseOpenNotes(false);
              }
              setActiveTab(tab as any);
              if (subTab) setActiveCaseSubTab(subTab as any);
            }}
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
            dataLoaded={dataLoaded}
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
