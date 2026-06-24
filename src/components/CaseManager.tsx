import { safeStorage } from "../utils/safeStorage";
import React, { useState, useEffect } from "react";
import { Client, LegalCase, CaseNote, CaseDocument, CaseStage, CaseStatus, ClientPartyRole } from "../types";
import { toPersianDigits, toEnglishDigits, formatDateWithSlash } from "../utils/shamsi";
import { documentDb } from "../utils/documentStorage";
import {
  FolderPlus,
  UserPlus,
  User,
  FileText,
  Trash2,
  Paperclip,
  Plus,
  Calendar,
  AlertCircle,
  Clock,
  Briefcase,
  Layers,
  MapPin,
  CheckCircle2,
  FileUp,
  Image as ImageIcon,
  Printer,
  Coins,
  CreditCard,
  Search,
  Eye,
  Edit2,
  RefreshCw,
  FolderArchive,
  Bell,
  MessageCircle,
  ChevronUp,
  ChevronDown
} from "lucide-react";

interface CaseManagerProps {
  defaultSubTab?: "cases" | "closedCases" | "clients";
  clients: Client[];
  cases: LegalCase[];
  notes: CaseNote[];
  documents: CaseDocument[];
  onAddClient: (newClient: Client) => void;
  onAddCase: (newCase: LegalCase) => void;
  onUpdateCase: (updatedCase: LegalCase) => void;
  onAddNote: (newNote: CaseNote) => void;
  onUpdateNote: (id: string, title: string, content: string) => void;
  onDeleteNote: (id: string) => void;
  onAddDocument: (newDoc: CaseDocument) => void;
  onUpdateDocumentName: (id: string, newName: string) => void;
  onDeleteDocument: (id: string) => void;
  onDeleteCase: (id: string) => void;
  onDeleteClient: (id: string) => void;
  onUpdateClient: (updatedClient: Client) => void;
  onNavigateToAlarms?: () => void;
  onUpdateDocumentList?: (updatedDocs: CaseDocument[]) => void;
}

const hasValue = (val: any): boolean => {
  if (val === undefined || val === null) return false;
  if (typeof val === "string") {
    const trimmed = val.trim();
    return trimmed !== "" && trimmed !== "-" && trimmed !== "۰" && trimmed !== "0";
  }
  if (typeof val === "number") {
    return val > 0;
  }
  return true;
};

export default function CaseManager({
  clients,
  cases,
  notes,
  documents,
  onAddClient,
  onAddCase,
  onUpdateCase,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onAddDocument,
  onUpdateDocumentName,
  onDeleteDocument,
  onDeleteCase,
  onDeleteClient,
  onUpdateClient,
  onNavigateToAlarms,
  onUpdateDocumentList,
  defaultSubTab = "cases"
}: CaseManagerProps) {
  const lawyerName = safeStorage.getItem("r_lawyer_name") || "";
  // Tabs: "cases" | "closedCases" | "clients"
  const [subTab, setSubTab] = useState<"cases" | "closedCases" | "clients">(defaultSubTab);
  
  // Keep subTab synced if defaultSubTab changes from external navigation
  useEffect(() => {
    setSubTab(defaultSubTab);
  }, [defaultSubTab]);

  const [searchTerm, setSearchTerm] = useState("");

  // Selection states
  const [selectedCase, setSelectedCase] = useState<LegalCase | null>(null);

  const moveDocument = (docId: string, direction: "up" | "down") => {
    if (!selectedCase) return;
    const caseDocs = documents.filter(d => d.caseId === selectedCase.id);
    const index = caseDocs.findIndex(d => d.id === docId);
    if (index === -1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= caseDocs.length) return;

    const updatedCaseDocs = [...caseDocs];
    const temp = updatedCaseDocs[index];
    updatedCaseDocs[index] = updatedCaseDocs[targetIndex];
    updatedCaseDocs[targetIndex] = temp;

    let caseDocPtr = 0;
    const newGlobalDocs = documents.map(doc => {
      if (doc.caseId === selectedCase.id) {
        return updatedCaseDocs[caseDocPtr++];
      }
      return doc;
    });

    if (onUpdateDocumentList) {
      onUpdateDocumentList(newGlobalDocs);
    }
  };
  const [showNotesManager, setShowNotesManager] = useState<LegalCase | null>(null);
  const [printableCase, setPrintableCase] = useState<LegalCase | null>(null);
  const [printableClient, setPrintableClient] = useState<Client | null>(null);
  const [contactClient, setContactClient] = useState<Client | null>(null);
  const [includeFinancialInPrint, setIncludeFinancialInPrint] = useState(true);

  const getStandardPhone = (phone: string) => {
    if (!phone) return "";
    const p2e = (s: string) => s.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
    const processed = p2e(phone).replace(/\D/g, '');
    return processed.replace(/^0/, '');
  };

  // Form toggles
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showCaseForm, setShowCaseForm] = useState(false);
  const [editingCase, setEditingCase] = useState<LegalCase | null>(null);

  // --- New Client Form States ---
  const [clientName, setClientName] = useState("");
  const [clientNatId, setClientNatId] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientFather, setClientFather] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientBirthDate, setClientBirthDate] = useState("");
  const [clientDesc, setClientDesc] = useState("");

  // --- New Case Form States ---
  const [caseFormStep, setCaseFormStep] = useState(1); // 1: General, 2: Finance
  const [caseClientId, setCaseClientId] = useState("");
  const [caseNo, setCaseNo] = useState("");
  const [courtCaseNo, setCourtCaseNo] = useState("");
  const [caseArchiveNo, setCaseArchiveNo] = useState("");
  const [appealCaseNo, setAppealCaseNo] = useState("");
  const [rejectionCaseNo, setRejectionCaseNo] = useState("");
  const [supremeCaseNo, setSupremeCaseNo] = useState("");
  const [executionCaseNo, setExecutionCaseNo] = useState("");
  const [executionCivilCaseNo, setExecutionCivilCaseNo] = useState("");
  const [insolvencyCaseNo, setInsolvencyCaseNo] = useState("");
  const [investigationCaseNo, setInvestigationCaseNo] = useState("");
  const [prosecutionCaseNo, setProsecutionCaseNo] = useState("");
  const [caseFilingDate, setCaseFilingDate] = useState("");
  const [caseTitle, setCaseTitle] = useState("");
  const [caseOpposingName, setCaseOpposingName] = useState("");
  const [caseClientRole, setCaseClientRole] = useState<ClientPartyRole>("خواهان");
  const [caseStage, setCaseStage] = useState<CaseStage>("بدوی");
  const [caseBranch, setCaseBranch] = useState("");
  const [caseStatus, setCaseStatus] = useState<CaseStatus>("جریان دارد");
  const [caseDesc, setCaseDesc] = useState("");
  const [caseTotalContractAmount, setCaseTotalContractAmount] = useState("");
  const [caseDownPayment, setCaseDownPayment] = useState("");
  const [caseSanaPassword, setCaseSanaPassword] = useState("");
  const [caseInstallments, setCaseInstallments] = useState<{ id?: string, amount: string, dueDate: string, isPaid?: boolean, paidDate?: string }[]>([]);
  const [casePayments, setCasePayments] = useState<{ id: string, title: string, amount: string, type: string, date: string, cardNumber: string }[]>([]);
  const [caseAssociatedPersons, setCaseAssociatedPersons] = useState<{ name: string, phone: string }[]>([]);
  const [docNameInput, setDocNameInput] = useState("");

  const resetCaseFormStates = () => {
    setCaseFormStep(1);
    setCaseClientId("");
    setCaseNo("");
    setCourtCaseNo("");
    setCaseArchiveNo("");
    setAppealCaseNo("");
    setRejectionCaseNo("");
    setSupremeCaseNo("");
    setExecutionCaseNo("");
    setExecutionCivilCaseNo("");
    setInsolvencyCaseNo("");
    setInvestigationCaseNo("");
    setProsecutionCaseNo("");
    setCaseFilingDate("");
    setCaseTitle("");
    setCaseOpposingName("");
    setCaseClientRole("خواهان");
    setCaseStage("بدوی");
    setCaseBranch("");
    setCaseStatus("جریان دارد");
    setCaseDesc("");
    setCaseTotalContractAmount("");
    setCaseDownPayment("");
    setCaseSanaPassword("");
    setCaseInstallments([]);
    setCasePayments([]);
    setCaseAssociatedPersons([]);
  };

  // --- Finance Edit States (inside modal detail) ---
  const [isEditingFinance, setIsEditingFinance] = useState(false);
  const [editFee, setEditFee] = useState("");
  const [editExpenses, setEditExpenses] = useState("");

  // Sync selected case finance state
  useEffect(() => {
    if (selectedCase) {
      setEditFee(selectedCase.receivedFee?.toString() || "0");
      setEditExpenses(selectedCase.paidExpenses?.toString() || "0");
      setIsEditingFinance(false);
    }
  }, [selectedCase]);

  // Cleanup selectedCase if it was deleted
  useEffect(() => {
    if (selectedCase && !cases.find(c => c.id === selectedCase.id)) {
      setSelectedCase(null);
    }
  }, [cases]);

  // --- New Note State (inside modal/sheet) ---
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  // --- Note editing states ---
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteTitle, setEditNoteTitle] = useState("");
  const [editNoteContent, setEditNoteContent] = useState("");

  // --- Document Preview Overlay State ---
  const [previewDoc, setPreviewDoc] = useState<CaseDocument | null>(null);

  // --- Document Renaming states ---
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editDocName, setEditDocName] = useState("");

  // --- File attachment (inside modal) ---
  const [dragActive, setDragActive] = useState(false);

  // Handle Client creation/update
  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    if (editingClient) {
        const updatedClient: Client = {
            ...editingClient,
            name: clientName,
            nationalId: toPersianDigits(clientNatId),
            phoneNumber: toPersianDigits(clientPhone),
            fatherName: clientFather,
            birthDate: clientBirthDate,
            address: clientAddress,
            description: clientDesc
        };
        onUpdateClient(updatedClient);
        setEditingClient(null);
    } else {
        const newClient: Client = {
            id: "cl_" + Date.now(),
            name: clientName,
            nationalId: toPersianDigits(clientNatId),
            phoneNumber: toPersianDigits(clientPhone),
            fatherName: clientFather,
            birthDate: clientBirthDate,
            address: clientAddress,
            description: clientDesc,
            createdAt: new Date().toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })
        };
        onAddClient(newClient);
    }

    setShowClientForm(false);
    // Reset
    setClientName("");
    setClientNatId("");
    setClientPhone("");
    setClientFather("");
    setClientBirthDate("");
    setClientAddress("");
    setClientDesc("");
  };

  // Helper to parse Farsi/Arabic and formatted digits to number
  const parseDigits = (val: string) => {
    if (!val) return 0;
    const farsiDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
    const arabicDigits = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
    let clean = val;
    for (let i = 0; i < 10; i++) {
      clean = clean.replace(farsiDigits[i], i.toString()).replace(arabicDigits[i], i.toString());
    }
    clean = clean.replace(/[^\d.]/g, "");
    return parseFloat(clean) || 0;
  };

  const formatNumberWithSeparator = (val: string) => {
    const num = parseDigits(val);
    if (num === 0) return "";
    return num.toLocaleString('fa-IR');
  };

  // Handle Case creation
  const handleCreateCase = (e: React.FormEvent): boolean => {
    e.preventDefault();
    if (!caseTitle.trim()) {
      alert("لطفاً موضوع دعوی (خواسته) را وارد نمایید.");
      return false;
    }
    if (!caseClientId) {
      alert("لطفاً موکل مرتبط را انتخاب نمایید.");
      return false;
    }

    const client = clients.find(cl => cl.id === caseClientId);

    const totalContractAmountNum = parseDigits(caseTotalContractAmount);
    const downPaymentNum = parseDigits(caseDownPayment);
    const installmentsData = caseInstallments.map(ins => ({
      id: ins.id || "ins_" + Date.now() + Math.random(),
      amount: parseDigits(ins.amount),
      dueDate: ins.dueDate,
      isPaid: ins.isPaid,
      paidDate: ins.paidDate
    }));
    const paymentsData = casePayments.map(p => ({
      id: p.id, title: p.title, amount: parseDigits(p.amount), type: p.type, date: p.date, cardNumber: p.cardNumber
    }));
    const associatedPersonsData = caseAssociatedPersons;

    const newCase: LegalCase = {
      id: "ca_" + Date.now(),
      clientId: caseClientId,
      clientName: client?.name || "",
      clientRole: caseClientRole,
      opposingPartyName: caseOpposingName,
      caseNumber: toPersianDigits(caseNo),
      courtCaseNumber: courtCaseNo ? toPersianDigits(courtCaseNo) : undefined,
      archiveNumber: caseArchiveNo ? toPersianDigits(caseArchiveNo) : undefined,
      appealCaseNumber: appealCaseNo ? toPersianDigits(appealCaseNo) : undefined,
      rejectionCaseNumber: rejectionCaseNo ? toPersianDigits(rejectionCaseNo) : undefined,
      supremeCaseNumber: supremeCaseNo ? toPersianDigits(supremeCaseNo) : undefined,
      executionCaseNumber: executionCaseNo ? toPersianDigits(executionCaseNo) : undefined,
      executionCivilCaseNumber: executionCivilCaseNo ? toPersianDigits(executionCivilCaseNo) : undefined,
      insolvencyCaseNumber: insolvencyCaseNo ? toPersianDigits(insolvencyCaseNo) : undefined,
      investigationCaseNumber: investigationCaseNo ? toPersianDigits(investigationCaseNo) : undefined,
      prosecutionCaseNumber: prosecutionCaseNo ? toPersianDigits(prosecutionCaseNo) : undefined,
      filingDate: caseFilingDate ? toPersianDigits(caseFilingDate) : undefined,
      title: caseTitle,
      stage: caseStage,
      branch: caseBranch,
      status: caseStatus,
      description: caseDesc,
      payments: paymentsData,
      totalContractAmount: totalContractAmountNum,
      downPayment: downPaymentNum,
      sanaPassword: caseSanaPassword,
      installments: installmentsData,
      associatedPersons: associatedPersonsData,
      createdAt: new Date().toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })
    };

    onAddCase(newCase);
    setShowCaseForm(false);
    // Reset
    setCaseClientId("");
    setCaseNo("");
    setCourtCaseNo("");
    setCaseArchiveNo("");
    setAppealCaseNo("");
    setRejectionCaseNo("");
    setSupremeCaseNo("");
    setExecutionCaseNo("");
    setExecutionCivilCaseNo("");
    setInsolvencyCaseNo("");
    setCaseTitle("");
    setCaseOpposingName("");
    setCaseClientRole("خواهان");
    setCaseStage("بدوی");
    setCaseBranch("");
    setCaseStatus("جریان دارد");
    setCaseDesc("");
    setCaseTotalContractAmount("");
    setCaseDownPayment("");
    setCaseSanaPassword("");
    setCaseInstallments([]);
    return true;
  };

  // Handle addition of quick note inside Case modal
  const handleAddQuickNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !noteTitle.trim() || !noteContent.trim()) return;

    const newNote: CaseNote = {
      id: "no_" + Date.now(),
      caseId: selectedCase.id,
      title: noteTitle,
      content: noteContent,
      createdAt: new Date().toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })
    };

    onAddNote(newNote);
    setNoteTitle("");
    setNoteContent("");
  };

  // Save edited note handler
  const handleSaveEditedNote = (noteId: string) => {
    if (!editNoteTitle.trim() || !editNoteContent.trim()) return;
    onUpdateNote(noteId, editNoteTitle, editNoteContent);
    setEditingNoteId(null);
  };

  const handleSaveEditedDocName = (docId: string) => {
    if (!editDocName.trim()) return;
    onUpdateDocumentName(docId, editDocName);
    setEditingDocId(null);
  };

  const handleViewDocument = async (doc: CaseDocument) => {
    try {
      let docUrl = doc.dataUrl;

      // Ensure we have the data URL
      if (!docUrl) {
        const storedUrl = await documentDb.get(doc.id);
        if (storedUrl) {
          docUrl = storedUrl;
          // Optimistically update the document list if needed, or just use it for rendering
        }
      }

      if (docUrl) {
        // Create an Object URL for better browser compatibility and iframe rendering
        // Fetch API can parse data URIs
        const response = await fetch(docUrl);
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        
        // Use the object URL instead of the massive data URI for rendering
        setPreviewDoc({ ...doc, dataUrl: objectUrl });
      } else {
        setPreviewDoc(doc); // Open anyway to show error view
      }
    } catch (err: any) {
      console.error("Error preparing document for preview:", err);
      // Fallback to whatever we had
      setPreviewDoc(doc);
    }
  };

  // Ensure object URLs are cleaned up when modal closes
  const closePreview = () => {
    if (previewDoc?.dataUrl && previewDoc.dataUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewDoc.dataUrl);
    }
    setPreviewDoc(null);
  };

  // Handle file uploads (converts images under 1MB to Base64 instantly for offline previewing)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!selectedCase || !files || files.length === 0) return;

    const file = files[0];
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isAudio = file.type.startsWith("audio/");
    const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + " مگابایت";

    const createDocItem = (dataUrl?: string) => {
      const newDoc: CaseDocument = {
        id: "do_" + Date.now(),
        caseId: selectedCase.id,
        name: file.name,
        type: isPdf ? "pdf" : isImage ? "image" : isAudio ? "audio" : "other",
        size: toPersianDigits(sizeStr),
        dataUrl,
        uploadedAt: new Date().toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })
      };
      onAddDocument(newDoc);
      setDocNameInput("");
    };

    if (file.size < 20971520) { // 20 MB max
      // Convert to Base64 (both images and PDFs can be converted to dataUrls)
      const reader = new FileReader();
      reader.onload = (event) => {
        createDocItem(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      createDocItem();
    }
  };

  // Drag over handler for documents
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (!selectedCase || !e.dataTransfer.files || e.dataTransfer.files.length === 0) return;

    const file = e.dataTransfer.files[0];
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + " مگابایت";

    const createDocItem = (dataUrl?: string) => {
      const newDoc: CaseDocument = {
        id: "do_" + Date.now(),
        caseId: selectedCase.id,
        name: file.name,
        type: isPdf ? "pdf" : isImage ? "image" : "other",
        size: toPersianDigits(sizeStr),
        dataUrl,
        uploadedAt: new Date().toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })
      };
      onAddDocument(newDoc);
      setDocNameInput("");
    };

    if (file.size < 20971520) { // 20 MB max
      const reader = new FileReader();
      reader.onload = (event) => {
        createDocItem(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      createDocItem();
    }
  };

  // Get notes/documents for specifically selected case
  const activeCaseNotes = selectedCase ? notes.filter(n => n.caseId === selectedCase.id) : [];
  const activeCaseDocs = selectedCase ? documents.filter(d => d.caseId === selectedCase.id) : [];

  const handlePrint = (caseToPrint?: LegalCase, includeFinancial: boolean = true) => {
    const caseObj = caseToPrint || selectedCase;
    if (!caseObj) return;
    const associatedClient = clients.find(cl => cl.id === caseObj.clientId);

    const clientName = associatedClient?.name || caseObj.clientName;
    const clientRole = caseObj.clientRole;
    const clientPhone = associatedClient?.phoneNumber;
    const clientNationalId = associatedClient?.nationalId;

    let printWindow: Window | null = null;
    try {
      printWindow = window.open("", "_blank");
    } catch (e) {
      console.warn("window.open blocked:", e);
    }

    let doc: Document | null = null;
    let iframe: HTMLIFrameElement | null = null;

    if (printWindow) {
      doc = printWindow.document;
    } else {
      iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);
      doc = iframe.contentWindow?.document || iframe.contentDocument || null;
    }

    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html lang="fa" dir="rtl">
          <head>
            <meta charset="UTF-8">
            <title>برگه پرونده - ${caseObj.title}</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700&display=swap');
              body {
                font-family: 'Vazirmatn', 'Tahoma', sans-serif;
                background-color: white !important;
                color: black !important;
                padding: 40px;
                line-height: 1.6;
              }
              @media print {
                body {
                  padding: 10px;
                }
                .no-print {
                  display: none !important;
                }
              }
            </style>
          </head>
          <body class="p-8">
            <div class="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
              <div class="flex items-center gap-3">
                <div class="text-right">
                  <h1 class="text-lg font-black text-slate-900">دفتر وکالت ${lawyerName || "وکیل"}</h1>
                  <p class="text-xs text-slate-600 font-bold mt-1">وکیل پایه یک دادگستری و مشاور حقوقی</p>
                </div>
              </div>
              <div class="text-center font-bold">
                <h2 class="text-md font-extrabold text-slate-800">برگ خلاصه وضعیت و سابقه پرونده قضایی</h2>
              </div>
            </div>

            <!-- Client Section -->
            <div class="mb-6">
              <h3 class="text-xs font-black text-slate-900 mb-2 border-r-4 border-amber-500 pr-2 pb-0.5">۱. مشخصات هویتی موکل</h3>
              <div class="grid grid-cols-2 gap-4 border border-slate-300 p-4 rounded-xl text-xs bg-slate-50/10">
                ${hasValue(clientName) ? `<p><strong>نام موکل:</strong> <span style="color: #1e40af; font-weight: 600;">${clientName}</span></p>` : ""}
                ${hasValue(clientRole) ? `<p><strong>نقش موکل:</strong> <span style="color: #1e40af; font-weight: 600;">${clientRole}</span></p>` : ""}
                ${hasValue(clientPhone) ? `<p><strong>تلفن همراه:</strong> <span style="color: #1e40af; font-weight: 600; font-family: monospace;">${toPersianDigits(clientPhone)}</span></p>` : ""}
                ${hasValue(clientNationalId) ? `<p><strong>کد ملی:</strong> <span style="color: #1e40af; font-weight: 600; font-family: monospace;">${toPersianDigits(clientNationalId)}</span></p>` : ""}
              </div>
            </div>

            <!-- Case Section -->
            <div class="mb-6">
              <h3 class="text-xs font-black text-slate-900 mb-2 border-r-4 border-amber-500 pr-2 pb-0.5">۲. اطلاعات پرونده</h3>
              <div class="grid grid-cols-2 gap-4 border border-slate-300 p-4 rounded-xl text-xs bg-slate-50/10">
                ${hasValue(caseObj.title) ? `<p><strong>موضوع پرونده (خواسته):</strong> <span style="color: #1e40af; font-weight: 600;">${toPersianDigits(caseObj.title)}</span></p>` : ""}
                ${hasValue(caseObj.caseNumber) ? `<p><strong>شماره پرونده (ثنا):</strong> <span style="color: #1e40af; font-weight: 600; font-family: monospace;">${toPersianDigits(caseObj.caseNumber)}</span></p>` : ""}
                ${hasValue(caseObj.branch) ? `<p><strong>شعبه دادگاه:</strong> <span style="color: #1e40af; font-weight: 600;">${toPersianDigits(caseObj.branch)}</span></p>` : ""}
                ${hasValue(caseObj.sanaPassword) ? `<p><strong>رمز شخصی ثنا:</strong> <span style="color: #1e40af; font-weight: 600; font-family: monospace;">${caseObj.sanaPassword}</span></p>` : ""}
                ${hasValue(caseObj.opposingPartyName) ? `<p><strong>طرف مقابل پرونده:</strong> <span style="color: #1e40af; font-weight: 600;">${caseObj.opposingPartyName}</span></p>` : ""}
                ${hasValue(caseObj.filingDate) ? `<p><strong>تاریخ تشکیل پرونده:</strong> <span style="color: #1e40af; font-weight: 600; font-family: monospace;">${toPersianDigits(caseObj.filingDate)}</span></p>` : ""}
                ${hasValue(caseObj.createdAt) ? `<p><strong>تاریخ ثبت در سیستم:</strong> <span style="color: #1e40af; font-weight: 600; font-family: monospace;">${toPersianDigits(caseObj.createdAt)}</span></p>` : ""}
                ${hasValue(caseObj.stage) ? `<p><strong>مرحلۀ پرونده:</strong> <span style="color: #1e40af; font-weight: 600;">${caseObj.stage}</span></p>` : ""}
                ${hasValue(caseObj.status) ? `<p><strong>وضعیت پرونده:</strong> <span style="color: #1e40af; font-weight: 600;">${caseObj.status}</span></p>` : ""}
                ${hasValue(caseObj.courtCaseNumber) ? `<p><strong>شماره دادگاه بدوی:</strong> <span style="color: #1e40af; font-weight: 600; font-family: monospace;">${toPersianDigits(caseObj.courtCaseNumber)}</span></p>` : ""}
                ${hasValue(caseObj.archiveNumber) ? `<p><strong>کلاسه بایگانی دفتر:</strong> <span style="color: #1e40af; font-weight: 600; font-family: monospace;">${toPersianDigits(caseObj.archiveNumber)}</span></p>` : ""}
                ${hasValue(caseObj.appealCaseNumber) ? `<p><strong>شماره تجدید نظر:</strong> <span style="color: #1e40af; font-weight: 600; font-family: monospace;">${toPersianDigits(caseObj.appealCaseNumber)}</span></p>` : ""}
                ${hasValue(caseObj.rejectionCaseNumber) ? `<p><strong>شماره واخواهی:</strong> <span style="color: #1e40af; font-weight: 600; font-family: monospace;">${toPersianDigits(caseObj.rejectionCaseNumber)}</span></p>` : ""}
                ${hasValue(caseObj.supremeCaseNumber) ? `<p><strong>فرجام خواهی/دیوان:</strong> <span style="color: #1e40af; font-weight: 600; font-family: monospace;">${toPersianDigits(caseObj.supremeCaseNumber)}</span></p>` : ""}
                ${hasValue(caseObj.executionCaseNumber) ? `<p><strong>اجرای احکام کیفری:</strong> <span style="color: #1e40af; font-weight: 600; font-family: monospace;">${toPersianDigits(caseObj.executionCaseNumber)}</span></p>` : ""}
                ${hasValue(caseObj.executionCivilCaseNumber) ? `<p><strong>اجرای احکام مدنی:</strong> <span style="color: #1e40af; font-weight: 600; font-family: monospace;">${toPersianDigits(caseObj.executionCivilCaseNumber)}</span></p>` : ""}
                ${hasValue(caseObj.insolvencyCaseNumber) ? `<p><strong>شماره پرونده اعسار:</strong> <span style="color: #1e40af; font-weight: 600; font-family: monospace;">${toPersianDigits(caseObj.insolvencyCaseNumber)}</span></p>` : ""}
                ${hasValue(caseObj.investigationCaseNumber) ? `<p><strong>شماره پرونده بازپرسی:</strong> <span style="color: #1e40af; font-weight: 600; font-family: monospace;">${toPersianDigits(caseObj.investigationCaseNumber)}</span></p>` : ""}
                ${hasValue(caseObj.prosecutionCaseNumber) ? `<p><strong>شماره پرونده دادیاری:</strong> <span style="color: #1e40af; font-weight: 600; font-family: monospace;">${toPersianDigits(caseObj.prosecutionCaseNumber)}</span></p>` : ""}
              </div>
            </div>

            <!-- Financial Section -->
            ${(includeFinancial && (hasValue(caseObj.totalContractAmount) || hasValue(caseObj.downPayment) || hasValue(caseObj.receivedFee) || hasValue(caseObj.paidExpenses) || (caseObj.installments && caseObj.installments.length > 0) || (caseObj.payments && caseObj.payments.length > 0))) ? `
            <div class="mb-6">
              <h3 class="text-xs font-black text-slate-900 mb-2 border-r-4 border-amber-500 pr-2 pb-0.5">۳. وضعیت مالی و قرارداد</h3>
              <div class="grid grid-cols-2 gap-4 border border-slate-300 p-4 rounded-xl text-xs bg-slate-50/10">
                ${hasValue(caseObj.totalContractAmount) ? `<p><strong>کل مبلغ قرارداد:</strong> <span style="color: #1e40af; font-weight: 600;">${toPersianDigits((caseObj.totalContractAmount ?? 0).toLocaleString())} تومان</span></p>` : ""}
                ${hasValue(caseObj.downPayment) ? `<p><strong>پیش‌پرداخت:</strong> <span style="color: #1e40af; font-weight: 600;">${toPersianDigits((caseObj.downPayment ?? 0).toLocaleString())} تومان</span></p>` : ""}
                ${hasValue(caseObj.receivedFee) ? `<p><strong>حق‌الوکاله دریافتی:</strong> <span style="color: #1e40af; font-weight: 600;">${toPersianDigits((caseObj.receivedFee ?? 0).toLocaleString())} تومان</span></p>` : ""}
                ${hasValue(caseObj.paidExpenses) ? `<p><strong>هزینه‌های انجام شده:</strong> <span style="color: #1e40af; font-weight: 600;">${toPersianDigits((caseObj.paidExpenses ?? 0).toLocaleString())} تومان</span></p>` : ""}
              </div>
              
              ${caseObj.installments && caseObj.installments.length > 0 ? `
              <div class="mt-3 border border-slate-350 rounded-xl overflow-hidden mb-4">
                <div class="bg-slate-100 px-3 py-1.5 border-b border-slate-350">
                  <h4 class="text-[10px] font-black text-slate-800">جدول اقساط حق‌الوکاله:</h4>
                </div>
                <table class="w-full border-collapse text-xs text-right" dir="rtl">
                  <thead>
                    <tr class="bg-slate-50 font-bold border-b border-slate-350 text-slate-600">
                      <th class="p-2 border-l border-slate-350 text-center w-12" style="background:#f1f5f9;">ردیف</th>
                      <th class="p-2 border-l border-slate-350" style="background:#f1f5f9;">مبلغ قسط</th>
                      <th class="p-2 border-l border-slate-350" style="background:#f1f5f9;">تاریخ سررسید</th>
                      <th class="p-2" style="background:#f1f5f9;">وضعیت پرداخت</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${caseObj.installments.map((ins, idx) => `
                      <tr class="border-b border-slate-200 last:border-0">
                        <td class="p-2 border-l border-slate-200 text-center font-mono text-[10px]">${toPersianDigits(idx + 1)}</td>
                        <td class="p-2 border-l border-slate-200" style="color: #1e40af; font-weight: 600;">${toPersianDigits((ins.amount ?? 0).toLocaleString())} تومان</td>
                        <td class="p-2 border-l border-slate-200 font-mono">${toPersianDigits(ins.dueDate)}</td>
                        <td class="p-2">
                          ${ins.isPaid ? `<span style="color: #16a34a; font-weight: bold;">پرداخت شده ${ins.paidDate ? `(در ` + toPersianDigits(ins.paidDate) + `)` : ``}</span>` : `<span style="color: #d97706; font-weight: bold;">معوق / در انتظار پرداخت</span>`}
                        </td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>
              ` : ""}

              ${caseObj.payments && caseObj.payments.length > 0 ? `
              <div class="mt-3 border border-slate-350 rounded-xl overflow-hidden mb-4">
                <div class="bg-slate-100 px-3 py-1.5 border-b border-slate-350">
                  <h4 class="text-[10px] font-black text-slate-800">تراکنش‌ها و وجوه دریافتی:</h4>
                </div>
                <table class="w-full border-collapse text-xs text-right" dir="rtl">
                  <thead>
                    <tr class="bg-slate-50 font-bold border-b border-slate-350 text-slate-600">
                      <th class="p-2 border-l border-slate-350 text-center w-12" style="background:#f1f5f9;">ردیف</th>
                      <th class="p-2 border-l border-slate-350" style="background:#f1f5f9;">بابت / شرح</th>
                      <th class="p-2 border-l border-slate-350" style="background:#f1f5f9;">مبلغ دریافتی</th>
                      <th class="p-2 border-l border-slate-350" style="background:#f1f5f9;">نوع پرداخت</th>
                      <th class="p-2" style="background:#f1f5f9;">تاریخ پرداخت</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${caseObj.payments.map((p, idx) => `
                      <tr class="border-b border-slate-200 last:border-0">
                        <td class="p-2 border-l border-slate-200 text-center font-mono text-[10px]">${toPersianDigits(idx + 1)}</td>
                        <td class="p-2 border-l border-slate-200" style="color: #334155;">${p.title}</td>
                        <td class="p-2 border-l border-slate-200" style="color: #16a34a; font-weight: 600;">${toPersianDigits((p.amount ?? 0).toLocaleString())} تومان</td>
                        <td class="p-2 border-l border-slate-200" style="color: #475569;">${p.type}</td>
                        <td class="p-2 font-mono">${toPersianDigits(p.date)}</td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>
              ` : ""}
            </div>
            ` : ""}

            <!-- Associated Persons Section -->
            ${caseObj.associatedPersons && caseObj.associatedPersons.length > 0 ? `
            <div class="mb-6">
              <h3 class="text-xs font-black text-slate-900 mb-2 border-r-4 border-amber-500 pr-2 pb-0.5">۴. افراد مرتبط با پرونده</h3>
              <table class="w-full border-collapse border border-slate-350 text-xs text-right" dir="rtl">
                <thead>
                  <tr class="bg-slate-100 font-bold border-b border-slate-350">
                    <th class="border border-slate-350 p-2 text-right">نام و نام خانوادگی</th>
                    <th class="border border-slate-350 p-2 text-right">شماره تماس (تلفن همراه)</th>
                  </tr>
                </thead>
                <tbody>
                  ${caseObj.associatedPersons.map(person => `
                    <tr>
                      <td class="border border-slate-350 p-2" style="color: #1e40af; font-weight: 600;">${person.name || "-"}</td>
                      <td class="border border-slate-350 p-2 font-mono" style="color: #1e40af; font-weight: bold;">${person.phone ? toPersianDigits(person.phone) : "-"}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
            ` : ""}

            <!-- Description -->
            ${hasValue(caseObj.description) ? `
            <div class="mb-6">
              <h3 class="text-xs font-black text-slate-900 mb-2 border-r-4 border-amber-500 pr-2 pb-0.5">۵. شرح خلاصه و مبانی وضعیت پرونده</h3>
              <div class="border border-slate-300 p-3 text-xs bg-slate-50/20 whitespace-pre-line" style="color: #1e40af; font-weight: 500;">${toPersianDigits(caseObj.description)}</div>
            </div>
            ` : ""}

            <!-- Signatures Section -->
            <div class="mt-12 pt-8 flex justify-between items-start text-[10px] border-t border-slate-100">
              <div class="space-y-1">
                <span class="text-slate-500 font-bold block">سامانه مدیریت مراجعین دفتر وکالت ${lawyerName || "وکیل"}</span>
                <span class="text-slate-400 block">شماره‌های تماس: ۰۹۱۴۴۶۲۷۱۱۹ - ۰۹۹۰۱۰۹۵۳۹۳</span>
              </div>
              <div class="text-center pl-16 space-y-3">
                <p class="font-bold text-slate-800">صحت مندرجات مورد تایید است</p>
                <p class="text-[11px] text-amber-600 font-extrabold pb-12">امضا و مهر رسمی وکیل ${lawyerName || "مسئول پرونده"}</p>
              </div>
            </div>

            <script>
              function runPrint() {
                window.focus();
                window.print();
              }
              if (document.readyState === "complete" || document.readyState === "interactive") {
                setTimeout(runPrint, 300);
              } else {
                window.onload = function() {
                  setTimeout(runPrint, 300);
                };
              }
            </script>
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        try {
          if (printWindow) {
            printWindow.focus();
            printWindow.print();
          } else if (iframe) {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          }
        } catch (e) {
          console.warn("Direct print trigger blocked:", e);
          if (!printWindow) {
            window.print();
          }
        }
        if (iframe) {
          setTimeout(() => {
            try {
              document.body.removeChild(iframe!);
            } catch (err) {}
          }, 10000);
        }
      }, 500);
    }
  };

  const handlePrintClient = (clientToPrint: Client) => {
    if (!clientToPrint) return;

    let printWindow: Window | null = null;
    try {
      printWindow = window.open("", "_blank");
    } catch (e) {
      console.warn("window.open blocked:", e);
    }

    let doc: Document | null = null;
    let iframe: HTMLIFrameElement | null = null;

    if (printWindow) {
      doc = printWindow.document;
    } else {
      iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);
      doc = iframe.contentWindow?.document || iframe.contentDocument || null;
    }

    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html lang="fa" dir="rtl">
          <head>
            <meta charset="UTF-8">
            <title>پروفایل موکل - ${clientToPrint.name}</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700&display=swap');
              body {
                font-family: 'Vazirmatn', 'Tahoma', sans-serif;
                background-color: white !important;
                color: black !important;
                padding: 40px;
                line-height: 1.6;
              }
              @media print {
                body {
                  padding: 10px;
                }
                .no-print {
                  display: none !important;
                }
              }
            </style>
          </head>
          <body class="p-8">
            <div class="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
              <div class="flex items-center gap-3">
                <div class="text-right">
                  <h1 class="text-lg font-black text-slate-900">دفتر وکالت ${lawyerName || "وکیل"}</h1>
                  <p class="text-xs text-slate-600 font-bold mt-1">وکیل پایه یک دادگستری و مشاور حقوقی</p>
                </div>
              </div>
              <div class="text-center font-bold">
                <h2 class="text-md font-extrabold text-slate-800">برگ شناسنامه و خلاصه مشخصات موکل</h2>
              </div>
            </div>

            <!-- Client Section -->
            <div class="mb-6">
              <h3 class="text-xs font-black text-slate-900 mb-2 border-r-4 border-amber-500 pr-2 pb-0.5">مشخصات هویتی و ثبتی موکل</h3>
              <table class="w-full border-collapse border border-slate-350 text-xs text-right" dir="rtl">
                <tbody>
                  <tr>
                    <td class="border border-slate-350 p-2.5 font-bold bg-slate-50 w-1/4">نام و نام خانوادگی:</td>
                    <td class="border border-slate-350 p-2.5 w-1/4">${clientToPrint.name}</td>
                    <td class="border border-slate-350 p-2.5 font-bold bg-slate-50 w-1/4">کد ملی / شناسه ملی:</td>
                    <td class="border border-slate-350 p-2.5 w-1/4 font-mono">${toPersianDigits(clientToPrint.nationalId)}</td>
                  </tr>
                  <tr>
                    <td class="border border-slate-350 p-2.5 font-bold bg-slate-50">نام پدر:</td>
                    <td class="border border-slate-350 p-2.5">${clientToPrint.fatherName || "-"}</td>
                    <td class="border border-slate-350 p-2.5 font-bold bg-slate-50">تاریخ تولد:</td>
                    <td class="border border-slate-350 p-2.5 font-mono">${clientToPrint.birthDate ? toPersianDigits(clientToPrint.birthDate) : "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Focus Content: Detailed Contact and Location Section -->
            <div class="mb-6">
              <h3 class="text-xs font-black text-slate-900 mb-2 border-r-4 border-amber-500 pr-2 pb-0.5">اطلاعات تماس، ارتباطات و نشانی قانونی اقامتگاه موکل</h3>
              <table class="w-full border-collapse border border-slate-350 text-xs text-right" dir="rtl">
                <tbody>
                  <tr>
                    <td class="border border-slate-350 p-2.5 font-bold bg-slate-50 w-1/4">تلفن همراه ثنا:</td>
                    <td class="border border-slate-350 p-2.5 font-mono text-amber-700 font-bold">${toPersianDigits(clientToPrint.phoneNumber)}</td>
                    <td class="border border-slate-350 p-2.5 font-bold bg-slate-50 w-1/4">یادداشت اداری / صنف:</td>
                    <td class="border border-slate-350 p-2.5">${toPersianDigits(clientToPrint.description || "-")}</td>
                  </tr>
                  <tr>
                    <td class="border border-slate-350 p-2.5 font-bold bg-slate-50">نشانی کامل پستی اقامتگاه:</td>
                    <td class="border border-slate-350 p-2.5" colspan="3">${toPersianDigits(clientToPrint.address || "-")}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="mt-12 text-[10px] text-slate-400 text-center border-t pt-4">
              سامانه اتوماسیون وکالت ${lawyerName || "وکیل"} - شماره‌های تماس: ۰۹۱۴۴۶۲۷۱۱۹ - ۰۹۹۰۱۰۹۵۳۹۳
              <br/>
              تاریخ خلاصه وضعیت موکل: ${toPersianDigits(new Date().toLocaleDateString("fa-IR"))}
            </div>

            <script>
              function runPrint() {
                window.focus();
                window.print();
              }
              if (document.readyState === "complete" || document.readyState === "interactive") {
                setTimeout(runPrint, 300);
              } else {
                window.onload = function() {
                  setTimeout(runPrint, 300);
                };
              }
            </script>
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        try {
          if (printWindow) {
            printWindow.focus();
            printWindow.print();
          } else if (iframe) {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          }
        } catch (e) {
          console.warn("Direct print trigger blocked:", e);
          if (!printWindow) {
            window.print();
          }
        }
        if (iframe) {
          setTimeout(() => {
            try {
              document.body.removeChild(iframe!);
            } catch (err) {}
          }, 10000);
        }
      }, 500);
    }
  };

  // Filter cases and clients based on the searchTerm
  const filteredCases = cases.filter((c) => {
    // Filter by subTab first
    if (subTab === "cases" && c.status === "مختومه") return false;
    if (subTab === "closedCases" && c.status !== "مختومه") return false;

    const title = c.title || "";
    const clientName = c.clientName || "";
    const caseNumber = c.caseNumber || "";
    const archiveNumber = c.archiveNumber || "";
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      title.toLowerCase().includes(term) ||
      clientName.toLowerCase().includes(term) ||
      caseNumber.toLowerCase().includes(term) ||
      archiveNumber.toLowerCase().includes(term)
    );
  });

  const filteredClients = clients.filter((cl) => {
    const name = cl.name || "";
    const nationalId = cl.nationalId || "";
    const phoneNumber = cl.phoneNumber || "";
    const fatherName = cl.fatherName || "";
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      name.toLowerCase().includes(term) ||
      nationalId.toLowerCase().includes(term) ||
      phoneNumber.toLowerCase().includes(term) ||
      fatherName.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Sub tabs and Add commands */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        {/* Navigation toggles */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl max-w-2xl overflow-x-auto shrink-0 self-start border border-slate-200">
          <button
            onClick={() => {
              setSubTab("cases");
              setSearchTerm("");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition select-none cursor-pointer whitespace-nowrap min-w-max duration-150 ${
              subTab === "cases" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            پرونده‌های جاری
          </button>
          
          <button
            onClick={() => {
              setSubTab("closedCases");
              setSearchTerm("");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition select-none cursor-pointer whitespace-nowrap min-w-max duration-150 ${
              subTab === "closedCases" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <FolderArchive className="w-4 h-4" />
            پرونده‌های مختومه
          </button>
          
          <button
            onClick={() => {
              setSubTab("clients");
              setSearchTerm("");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition select-none cursor-pointer whitespace-nowrap min-w-max duration-150 ${
              subTab === "clients" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <User className="w-4 h-4" />
            اطلاعات موکلین
          </button>
        </div>

        {/* Dynamic add buttons */}
        <div>
          {(subTab === "cases" || subTab === "closedCases") ? (
            <button
              onClick={() => {
                resetCaseFormStates();
                setShowCaseForm(true);
              }}
              disabled={clients.length === 0}
              className="px-4 py-2.5 bg-slate-900 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition disabled:opacity-50 select-none cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              تشکیل پرونده جدید
            </button>
          ) : (
            <button
              onClick={() => {
                  setEditingClient(null);
                  setClientName("");
                  setClientNatId("");
                  setClientPhone("");
                  setClientFather("");
                  setClientBirthDate("");
                  setClientAddress("");
                  setClientDesc("");
                  setShowClientForm(true);
              }}
              className="px-4 py-2.5 bg-slate-900 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition select-none cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              افزودن پروفایل موکل جدید
            </button>
          )}
        </div>
      </div>

      {/* --- Global Search Bar --- */}
      <div className="bg-slate-50/50 border border-slate-200/85 p-4 rounded-2xl flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-lg">
          <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder={
              subTab === "cases"
                ? "جستجوی کلاسه، موضوع دعوی یا نام موکل پرونده..."
                : "جستجوی موکل با نامثبتی، کد ملی، شماره موبایل یا نام پدر..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 bg-white border border-slate-250 rounded-xl text-xs font-bold font-sans outline-none focus:ring-1 focus:ring-slate-950 shadow-3xs text-slate-800"
          />
        </div>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="text-[11px] font-black text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-150 px-3 py-1.5 rounded-xl cursor-pointer select-none transition shrink-0"
          >
            پاک کردن فیلتر جستجو
          </button>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 mb-4">
        {subTab === "cases" && (
          <button
            onClick={() => {
              setEditingCase(null);
              setShowCaseForm(true);
            }}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-[10px] font-black transition flex items-center gap-2 shadow-sm cursor-pointer select-none"
          >
            <Plus className="w-3.5 h-3.5" />
            ثبت پرونده جدید
          </button>
        )}
        {subTab === "clients" && (
          <button
            onClick={() => {
              setEditingClient(null);
              setShowClientForm(true);
            }}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-[10px] font-black transition flex items-center gap-2 shadow-sm cursor-pointer select-none"
          >
            <Plus className="w-3.5 h-3.5" />
            افزودن موکل جدید
          </button>
        )}
      </div>

      {clients.length === 0 && (subTab === "cases" || subTab === "closedCases") && (
        <div className="p-4 bg-amber-50 text-amber-900 text-xs border border-amber-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>هنوز هیچ موکلی ثبت نشده است؛ جهت ثبت پرونده ابتدا باید از بخش <strong>«اطلاعات موکلین»</strong> یک موکل ایجاد نمایید.</span>
        </div>
      )}

      {/* --- Tab 1: Cases Table/List --- */}
      {(subTab === "cases" || subTab === "closedCases") && (
        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
          {cases.filter(c => subTab === "cases" ? c.status !== "مختومه" : c.status === "مختومه").length === 0 ? (
            <div className="text-center py-24 text-slate-400">
              <FolderPlus className="w-12 h-12 stroke-1 mx-auto mb-2 text-slate-300" />
              <p className="text-xs">{subTab === "cases" ? "هیچ پرونده جاری و فعالی یافت نشد. پرونده جدید ایجاد نمایید." : "هیچ پرونده مختومه‌ای یافت نشد."}</p>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="text-center py-16 text-slate-450 bg-slate-50/50">
              <Search className="w-10 h-10 stroke-1 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-black text-slate-700">پرونده‌ای منطبق با عبارت جستجو یافت نشد.</p>
              <p className="text-[10px] text-slate-450 mt-1 font-semibold">لطفاً املای صحیح نام موکل یا موضوع دعوی را بررسی کنید.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                    <th className="p-4">شماره پرونده / موضوع دعوی</th>
                    <th className="p-4">نام خواهان / موکل</th>
                    <th className="p-4">مرحله فعلی</th>
                    <th className="p-4">شعبه رسیدگی‌کننده</th>
                    <th className="p-4">وضعیت پرونده</th>
                    <th className="p-4 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredCases.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">
                            {toPersianDigits(c.title)}
                          </p>
                          <p className="text-[10px] font-mono text-slate-400 mt-1">شماره پرونده: {toPersianDigits(c.caseNumber)}</p>
                        </div>
                      </td>
                      <td className="p-4 text-slate-700">{c.clientName}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-bold text-[11px]">
                          {c.stage}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 max-w-xs truncate" title={c.branch}>{toPersianDigits(c.branch)}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                            c.status === "جریان دارد"
                              ? "bg-green-50 text-green-700 border border-green-100"
                              : c.status === "مختومه"
                              ? "bg-slate-100 text-slate-600"
                              : "bg-amber-50 text-amber-700 border border-amber-100"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => onUpdateCase({ ...c, status: c.status === "مختومه" ? "جریان دارد" : "مختومه" })}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                              c.status === "مختومه"
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                            }`}
                            title={c.status === "مختومه" ? "تغییر وضعیت به جریان دارد" : "تغییر وضعیت به مختومه"}
                          >
                            <RefreshCw className="w-3 h-3" />
                            {c.status === "مختومه" ? "جریان دارد" : "مختومه"}
                          </button>
                          <button
                            onClick={() => setPrintableCase(c)}
                            className="px-2 py-1 bg-slate-100 hover:bg-amber-50 text-slate-800 border border-slate-200 hover:border-amber-200 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                            title="نمایش پرونده جهت چاپ و خروجی PDF"
                          >
                            <Eye className="w-3.5 h-3.5 text-amber-600" />
                            نمایش
                          </button>
                          <button
                            onClick={() => setSelectedCase(c)}
                            className="px-2 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-bold hover:bg-amber-600 transition"
                          >
                            مدارک
                          </button>
                          <button
                            onClick={() => setShowNotesManager(c)}
                            className="px-2 py-1 bg-amber-600 text-white rounded-lg text-[10px] font-bold hover:bg-amber-700 transition"
                          >
                            یادداشت
                          </button>
                          <button
                            onClick={() => {
                              setEditingCase(c);
                              setShowCaseForm(true);
                              // Pre-fill states here
                              setCaseClientId(c.clientId);
                              setCaseNo(toEnglishDigits(c.caseNumber || "").replace(/\D/g, ""));
                              setCourtCaseNo(c.courtCaseNumber ? toEnglishDigits(c.courtCaseNumber).replace(/\D/g, "") : "");
                              setCaseArchiveNo(c.archiveNumber ? toEnglishDigits(c.archiveNumber) : "");
                              setAppealCaseNo(c.appealCaseNumber ? toEnglishDigits(c.appealCaseNumber).replace(/\D/g, "") : "");
                              setRejectionCaseNo(c.rejectionCaseNumber ? toEnglishDigits(c.rejectionCaseNumber).replace(/\D/g, "") : "");
                              setSupremeCaseNo(c.supremeCaseNumber ? toEnglishDigits(c.supremeCaseNumber).replace(/\D/g, "") : "");
                              setExecutionCaseNo(c.executionCaseNumber ? toEnglishDigits(c.executionCaseNumber).replace(/\D/g, "") : "");
                              setExecutionCivilCaseNo(c.executionCivilCaseNumber ? toEnglishDigits(c.executionCivilCaseNumber).replace(/\D/g, "") : "");
                              setInsolvencyCaseNo(c.insolvencyCaseNumber ? toEnglishDigits(c.insolvencyCaseNumber).replace(/\D/g, "") : "");
                              setInvestigationCaseNo(c.investigationCaseNumber ? toEnglishDigits(c.investigationCaseNumber).replace(/\D/g, "") : "");
                              setProsecutionCaseNo(c.prosecutionCaseNumber ? toEnglishDigits(c.prosecutionCaseNumber).replace(/\D/g, "") : "");
                              setCaseFilingDate(c.filingDate || "");
                              setCaseTitle(c.title);
                              setCaseOpposingName(c.opposingPartyName || "");
                              setCaseClientRole(c.clientRole || "خواهان");
                              setCaseStage(c.stage);
                              setCaseBranch(c.branch || "");
                              setCaseStatus(c.status);
                              setCaseDesc(c.description || "");
                              setCaseSanaPassword(c.sanaPassword || "");
                              setCaseTotalContractAmount(c.totalContractAmount ? c.totalContractAmount.toString() : "");
                              setCaseDownPayment(c.downPayment ? c.downPayment.toString() : "");
                              setCasePayments(c.payments?.map(p => ({ ...p, amount: p.amount.toString(), cardNumber: p.cardNumber || "" })) || []);
                              setCaseInstallments(c.installments?.map(i => ({ ...i, amount: i.amount.toString() })) || []);
                              setCaseAssociatedPersons(c.associatedPersons || []);
                              setCaseFormStep(1);
                            }}
                            className="px-2 py-1 bg-amber-500 text-white rounded-lg text-[10px] font-bold hover:bg-amber-600 transition"
                          >
                            ویرایش
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onDeleteCase(c.id); }}
                            className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="حذف کلی پرونده"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* --- Tab 2: Clients list --- */}
      {subTab === "clients" && (
        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden animate-fadeIn">
          {clients.length === 0 ? (
            <div className="text-center py-24 text-slate-400">
              <UserPlus className="w-12 h-12 stroke-1 mx-auto mb-2 text-slate-300" />
              <p className="text-xs">پروفایل موکلی ثبت نشده است؛ جهت تنظیم وکالتنامه موکل جدید اضافه کنید.</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-16 text-slate-450 bg-slate-50/50">
              <Search className="w-10 h-10 stroke-1 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-black text-slate-700">موکلی با مشخصات وارد شده یافت نشد.</p>
              <p className="text-[10px] text-slate-450 mt-1 font-semibold">لطفاً صحت کدملی، شماره تلفن یا نام موکل را بررسی نمایید.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 text-xs">
                    <th className="p-4">نام موکل</th>
                    <th className="p-4">شناسه ملی</th>
                    <th className="p-4">شماره تماس پیامک ثنا</th>
                    <th className="p-4">نام پدر</th>
                    <th className="p-4">تاریخ تولد</th>
                    <th className="p-4">نشانی قانونی پستی</th>
                    <th className="p-4 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {filteredClients.map((cl) => (
                    <tr key={cl.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 text-slate-900 font-bold">{cl.name}</td>
                      <td className="p-4 font-mono">{toPersianDigits(cl.nationalId)}</td>
                      <td className="p-4 font-mono">{toPersianDigits(cl.phoneNumber)}</td>
                      <td className="p-4">{cl.fatherName}</td>
                      <td className="p-4 font-mono">{cl.birthDate ? toPersianDigits(cl.birthDate) : "-"}</td>
                      <td className="p-4 text-slate-500 max-w-sm truncate" title={cl.address}>{toPersianDigits(cl.address)}</td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-2">
                            <button
                                onClick={() => setContactClient(cl)}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition"
                                title="ارتباط با موکل"
                            >
                                <MessageCircle className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => {
                                    setEditingClient(cl);
                                    setClientName(cl.name);
                                    setClientNatId(cl.nationalId);
                                    setClientPhone(cl.phoneNumber);
                                    setClientFather(cl.fatherName);
                                    setClientBirthDate(cl.birthDate || "");
                                    setClientAddress(cl.address);
                                    setClientDesc(cl.description || "");
                                    setShowClientForm(true);
                                }}
                                className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                                title="ویرایش پروفایل موکل"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setPrintableClient(cl)}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                title="نمایش و چاپ اطلاعات موکل"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onDeleteClient(cl.id); }}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                                title="حذف پرونده موکل"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* --- DIALOG MODALS --- */}

      {/* Modal: Contact Client */}
      {contactClient && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fadeIn backdrop-blur-sm" onClick={() => setContactClient(null)}>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-sm w-full p-6 space-y-4 text-xs font-bold text-slate-700" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-green-500" />
                ارتباط با {contactClient.name}
              </h3>
              <button 
                onClick={() => setContactClient(null)}
                className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg transition"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <p className="text-slate-500 mb-3 text-center">شماره تماس: <span className="font-mono">{toPersianDigits(contactClient.phoneNumber)}</span></p>
              
              <a href={`sms:${contactClient.phoneNumber}`} className="flex items-center gap-3 w-full p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition text-slate-700">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <span>ارسال پیامک (SMS)</span>
              </a>

              <a href={`rubika://`} onClick={(e) => {
                e.preventDefault();
                const phone = getStandardPhone(contactClient.phoneNumber);
                navigator.clipboard.writeText(contactClient.phoneNumber).catch(() => {});
                
                // Try mobile scheme first
                window.location.href = `rubika://resolve?phone=+98${phone}`;
                
                // Fallback to web version after a short delay
                setTimeout(() => {
                  window.open(`https://web.rubika.ir/#/`, '_blank');
                }, 1000);
              }} className="flex items-center gap-3 w-full p-3 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50 transition text-slate-700" title="ابتدا در اپلیکیشن موبایل تلاش می‌شود، در صورت عدم نصب نسخه وب را باز می‌کند.">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 flex-col">
                  <span className="text-[10px] font-black leading-none">R</span>
                </div>
                <div className="flex flex-col">
                  <span>ارسال پیام در روبیکا</span>
                  <span className="text-[8px] font-normal text-slate-400 mt-0.5">باز کردن در اپلیکیشن یا وب</span>
                </div>
              </a>

              <a href={`eitaa://`} onClick={(e) => {
                e.preventDefault();
                const phone = getStandardPhone(contactClient.phoneNumber);
                navigator.clipboard.writeText(contactClient.phoneNumber).catch(() => {});
                
                // Try mobile scheme first
                window.location.href = `eitaa://resolve?phone=+98${phone}`;
                
                // Fallback to web version after a short delay
                setTimeout(() => {
                  window.open(`https://eitaa.com/`, '_blank');
                }, 1000);
              }} className="flex items-center gap-3 w-full p-3 rounded-xl border border-slate-100 hover:border-orange-200 hover:bg-orange-50 transition text-slate-700" title="ابتدا در اپلیکیشن موبایل تلاش می‌شود، در صورت عدم نصب نسخه وب را باز می‌کند.">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 flex-col">
                  <span className="text-[10px] font-black leading-none">E</span>
                </div>
                <div className="flex flex-col">
                  <span>ارسال پیام در ایتا</span>
                  <span className="text-[8px] font-normal text-slate-400 mt-0.5">باز کردن در اپلیکیشن یا وب</span>
                </div>
              </a>

              <a href={`tg://resolve?phone=98${getStandardPhone(contactClient.phoneNumber)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 w-full p-3 rounded-xl border border-slate-100 hover:border-sky-200 hover:bg-sky-50 transition text-slate-700">
                <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-black leading-none">T</span>
                </div>
                <span>ارسال پیام در تلگرام</span>
              </a>

              <a href={`https://wa.me/98${getStandardPhone(contactClient.phoneNumber)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 w-full p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition text-slate-700" title="در صورت مشاهده خطای نامعتبر بودن شماره، یعنی این شماره در واتساپ حساب کاربری ندارد.">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-black leading-none">W</span>
                </div>
                <span>ارسال پیام در واتساپ</span>
              </a>

            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Register Client Profile */}
      {showClientForm && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fadeIn backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-lg w-full p-6 space-y-4 text-xs font-bold text-slate-700">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-500" />
                {editingClient ? "ویرایش پروفایل موکل" : "ثبت پروفایل موکل"}
              </h3>
              <button onClick={() => setShowClientForm(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500">نام و نام خانوادگی موکل</label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="مثال: زهرا حسینی"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 text-xs font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500">کد ملی ثنا (۱۰ رقم)</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={clientNatId}
                    onChange={(e) => setClientNatId(e.target.value)}
                    placeholder="مثال: ۰۰۸۷۶۵۴۳۲۱"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 font-mono text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1 col-span-1">
                  <label className="text-slate-500">تاریخ تولد</label>
                  <input
                    type="text"
                    value={clientBirthDate}
                    onChange={(e) => setClientBirthDate(formatDateWithSlash(e.target.value))}
                    placeholder="مثال: ۱۳۶۰/۰۱/۰۱"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 font-mono text-xs font-medium"
                  />
                </div>
                <div className="space-y-1 col-span-1">
                  <label className="text-slate-500">شماره موبایل</label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="مثال: ۰۹۱۹۸۷۶۵۴۳۲"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 font-mono text-xs font-medium"
                  />
                </div>
                <div className="space-y-1 col-span-1">
                  <label className="text-slate-500">نام پدر موکّل</label>
                  <input
                    type="text"
                    required
                    value={clientFather}
                    onChange={(e) => setClientFather(e.target.value)}
                    placeholder="مثال: علی"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500">نشانی قانونی پستی سکونت</label>
                <input
                  type="text"
                  required
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="مثال: تهران، یوسف آباد، خیابان چهاردهم..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500">یادداشت اداری / سوابق یا صنف موکل</label>
                <textarea
                  value={clientDesc}
                  onChange={(e) => setClientDesc(e.target.value)}
                  rows={2}
                  placeholder="توضیحات در مورد هویت، کار یا پیشینه..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 resize-none text-xs font-medium"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-3 bg-slate-900 hover:bg-amber-600 text-white rounded-xl font-bold transition select-none cursor-pointer">
                    {editingClient ? "ذخیره تغییرات" : "ثبت و ایجاد پرونده هویتی"}
                </button>
                <button type="button" onClick={() => { setEditingClient(null); setShowClientForm(false); }} className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition select-none cursor-pointer">انصراف</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Form New Case */}
      {showCaseForm && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fadeIn backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-5xl w-full p-5 space-y-4 text-xs font-bold text-slate-700 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FolderPlus className="w-5 h-5 text-amber-500" />
                  تشکیل پرونده جدید
                </h3>
                <span className="text-[10px] text-slate-400 mt-0.5">شماره‌های تماس دائمی: ۰۹۱۴۴۶۲۷۱۱۹ - ۰۹۹۰۱۰۹۵۳۹۳</span>
              </div>
              <button onClick={() => { setShowCaseForm(false); setEditingCase(null); }} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">✕</button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (editingCase) {
                // Update
                const totalContractAmountNum = parseDigits(caseTotalContractAmount);
                const downPaymentNum = parseDigits(caseDownPayment);
                const installmentsData = caseInstallments.map(ins => ({
                  id: ins.id || "ins_" + Date.now() + Math.random(),
                  amount: parseDigits(ins.amount),
                  dueDate: ins.dueDate,
                  isPaid: ins.isPaid,
                  paidDate: ins.paidDate
                }));
                const paymentsData = casePayments.map(p => ({
                  id: p.id, title: p.title, amount: parseDigits(p.amount), type: p.type, date: p.date, cardNumber: p.cardNumber
                }));

                const updatedCase: LegalCase = {
                  ...editingCase,
                  clientId: caseClientId,
                  clientName: clients.find(cl => cl.id === caseClientId)?.name || editingCase.clientName,
                  clientRole: caseClientRole,
                  opposingPartyName: caseOpposingName,
                  caseNumber: toPersianDigits(caseNo),
                  archiveNumber: caseArchiveNo ? toPersianDigits(caseArchiveNo) : undefined,
                  courtCaseNumber: courtCaseNo ? toPersianDigits(courtCaseNo) : undefined,
                  appealCaseNumber: appealCaseNo ? toPersianDigits(appealCaseNo) : undefined,
                  rejectionCaseNumber: rejectionCaseNo ? toPersianDigits(rejectionCaseNo) : undefined,
                  supremeCaseNumber: supremeCaseNo ? toPersianDigits(supremeCaseNo) : undefined,
                  executionCaseNumber: executionCaseNo ? toPersianDigits(executionCaseNo) : undefined,
                  executionCivilCaseNumber: executionCivilCaseNo ? toPersianDigits(executionCivilCaseNo) : undefined,
                  insolvencyCaseNumber: insolvencyCaseNo ? toPersianDigits(insolvencyCaseNo) : undefined,
                  investigationCaseNumber: investigationCaseNo ? toPersianDigits(investigationCaseNo) : undefined,
                  prosecutionCaseNumber: prosecutionCaseNo ? toPersianDigits(prosecutionCaseNo) : undefined,
                  filingDate: caseFilingDate ? toPersianDigits(caseFilingDate) : undefined,
                  title: caseTitle,
                  stage: caseStage,
                  branch: caseBranch,
                  status: caseStatus,
                  description: caseDesc,
                  payments: paymentsData,
                  totalContractAmount: totalContractAmountNum,
                  downPayment: downPaymentNum,
                  sanaPassword: caseSanaPassword,
                  installments: installmentsData,
                  associatedPersons: caseAssociatedPersons
                };
                onUpdateCase(updatedCase);
                setShowCaseForm(false);
                setEditingCase(null);
              } else {
                const isSaved = handleCreateCase(e);
                if (isSaved) {
                  setShowCaseForm(false);
                  setEditingCase(null);
                }
              }
            }} className="space-y-4">
              {/* تب‌های راهنما برای سهولت دسترسی کاربران به بخش مالی و پرونده */}
              <div className="flex border-b border-slate-100 pb-2 mb-2 gap-4">
                <button
                  type="button"
                  onClick={() => setCaseFormStep(1)}
                  className={`pb-2 text-xs font-bold transition-all relative ${caseFormStep === 1 ? 'text-amber-600 border-b-2 border-amber-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  ۱. مشخصات و مدارک پرونده
                </button>
                <button
                  type="button"
                  onClick={() => setCaseFormStep(2)}
                  className={`pb-2 text-xs font-bold transition-all relative ${caseFormStep === 2 ? 'text-amber-600 border-b-2 border-amber-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  ۲. مدیریت مالی، وجوه و اقساط
                </button>
              </div>

              {/* جدول مشخصات و اطلاعات پرونده‌ای موکل منتخب (بخش خودکار) */}
              {caseFormStep === 1 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    <div className="space-y-1 col-span-1 sm:col-span-2 lg:col-span-2">
                       <label className="text-slate-500">انتخاب موکل مرتبط (پرونده پایه)</label>
                       <select
                         required
                         value={caseClientId}
                         onChange={(e) => setCaseClientId(e.target.value)}
                         className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 text-xs font-medium"
                       >
                         <option value="">یک موکل انتخاب کنید...</option>
                         {clients.map(cl => (
                           <option key={cl.id} value={cl.id}>{cl.name} (کدملی: {toPersianDigits(cl.nationalId)})</option>
                         ))}
                       </select>
                    </div>

                    <div className="space-y-1 col-span-1 sm:col-span-2 lg:col-span-2">
                      <label className="text-slate-500">شماره پرونده ثنا (عدل ایران - ۱۶ الی ۱۸ رقمی) *</label>
                      <input
                        type="text"
                        required
                        maxLength={18}
                        value={caseNo}
                        onChange={(e) => setCaseNo(e.target.value)}
                        placeholder="مثلا: ۱۴۰۳۹۸۷۶۵۴۳۲۱۰۰۱"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 font-mono text-xs font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-500">تاریخ تشکیل پرونده</label>
                      <input
                        type="text"
                        placeholder="مثال: ۱۴۰۳/۰۱/۰۱"
                        value={caseFilingDate}
                        onChange={(e) => setCaseFilingDate(formatDateWithSlash(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 font-mono text-xs font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-500">شماره پرونده دیوان عالی / فرجام خواهی</label>
                      <input
                        type="text"
                        value={supremeCaseNo}
                        onChange={(e) => setSupremeCaseNo(e.target.value)}
                        placeholder="مثال: ۱۴۰۳۵۶۷۰۰۰"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 font-mono text-xs font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-500">شماره پرونده اجرای احکام کیفری</label>
                      <input
                        type="text"
                        value={executionCaseNo}
                        onChange={(e) => setExecutionCaseNo(e.target.value)}
                        placeholder="مثال: ۱۴۰۳۷۸۹۰۰۰"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 font-mono text-xs font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-500">شماره پرونده اجرای احکام مدنی</label>
                      <input
                        type="text"
                        value={executionCivilCaseNo}
                        onChange={(e) => setExecutionCivilCaseNo(e.target.value)}
                        placeholder="مثال: ۱۴۰۳۱۲۳۰۰۰"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 font-mono text-xs font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-500">شماره پرونده اعسار</label>
                      <input
                        type="text"
                        value={insolvencyCaseNo}
                        onChange={(e) => setInsolvencyCaseNo(e.target.value)}
                        placeholder="مثال: ۱۴۰۳۸۹۰۰۰۰"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 font-mono text-xs font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-500">شماره پرونده بازپرسی</label>
                      <input
                        type="text"
                        value={investigationCaseNo}
                        onChange={(e) => setInvestigationCaseNo(e.target.value)}
                        placeholder="مثال: ۱۴۰۳۱۲۳۰۰۱"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 font-mono text-xs font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-500">شماره پرونده دادیاری</label>
                      <input
                        type="text"
                        value={prosecutionCaseNo}
                        onChange={(e) => setProsecutionCaseNo(e.target.value)}
                        placeholder="مثال: ۱۴۰۳۱۲۳۰۰۲"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 font-mono text-xs font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-500">کد بایگانی دفتر</label>
                      <input
                        type="text"
                        value={caseArchiveNo}
                        onChange={(e) => setCaseArchiveNo(e.target.value)}
                        placeholder="اختیاری"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 font-mono text-xs font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-500">شماره پرونده دادگاه بدوی</label>
                      <input
                        type="text"
                        value={courtCaseNo}
                        onChange={(e) => setCourtCaseNo(e.target.value)}
                        placeholder="مثال: ۱۴۰۳۶۸۹۲۰۰"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 font-mono text-xs font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-500">شماره پرونده تجدید نظر</label>
                      <input
                        type="text"
                        value={appealCaseNo}
                        onChange={(e) => setAppealCaseNo(e.target.value)}
                        placeholder="مثال: ۱۴۰۳۹۸۷۰۰۰"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 font-mono text-xs font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-500">شماره پرونده واخواهی</label>
                      <input
                        type="text"
                        value={rejectionCaseNo}
                        onChange={(e) => setRejectionCaseNo(e.target.value)}
                        placeholder="مثال: ۱۴۰۳۴۵۶۰۰۰"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 font-mono text-xs font-medium"
                      />
                    </div>

                    {/* موضوع دعوی (خواسته) / موضوع شکایت */}
                    <div className="space-y-1 col-span-1 sm:col-span-2 lg:col-span-2">
                      <label className="text-slate-500">موضوع دعوی (خواسته) / موضوع شکایت *</label>
                      <input
                        type="text"
                        required
                        value={caseTitle}
                        onChange={(e) => setCaseTitle(e.target.value)}
                        placeholder="مثال: الزام به تنظیم سند رسمی..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 text-xs font-medium"
                      />
                    </div>

                    {/* نقش موکل در پرونده */}
                    <div className="space-y-1">
                      <label className="text-slate-500">نقش موکل در پرونده</label>
                      <select
                        value={caseClientRole}
                        onChange={(e) => setCaseClientRole(e.target.value as ClientPartyRole)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 font-medium text-xs text-slate-800"
                      >
                         <option value="خواهان">خواهان</option>
                         <option value="خوانده">خوانده</option>
                         <option value="شاکی">شاکی</option>
                         <option value="متشاکی">متشاکی</option>
                         <option value="متهم">متهم</option>
                      </select>
                    </div>

                    {/* طرف مقابل */}
                    <div className="space-y-1 col-span-1 sm:col-span-2 lg:col-span-2">
                      <label className="text-slate-500">طرف مقابل (نام طرف/طرف‌های دعوی - با کاما جدا کنید)</label>
                      <input
                        type="text"
                        value={caseOpposingName}
                        onChange={(e) => setCaseOpposingName(e.target.value)}
                        placeholder="مثال: دادستان عمومی، زهرا علوی..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 text-xs font-medium"
                      />
                    </div>

                    <div className="space-y-1 col-span-1 sm:col-span-2 lg:col-span-2">
                      <label className="text-slate-500">رمز شخصی سامانه ثنا</label>
                      <input
                        type="text"
                        value={caseSanaPassword}
                        onChange={(e) => setCaseSanaPassword(e.target.value)}
                        placeholder="رمز عبور ثنا"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 text-xs font-medium text-left"
                        dir="ltr"
                      />
                    </div>

                    {/* Associated Persons Section */}
                    <div className="space-y-2 col-span-1 sm:col-span-2 lg:col-span-4 border-t border-slate-100 pt-3">
                      <h4 className="text-[11px] font-black text-amber-700">افراد مرتبط با پرونده (نام و شماره تماس)</h4>
                      {caseAssociatedPersons.map((p, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input type="text" placeholder="نام" value={p.name} onChange={(e) => {
                              const newList = [...caseAssociatedPersons];
                              newList[idx].name = e.target.value;
                              setCaseAssociatedPersons(newList);
                          }} className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 text-xs" />
                          <input type="text" placeholder="شماره تماس" value={p.phone} onChange={(e) => {
                              const newList = [...caseAssociatedPersons];
                              newList[idx].phone = e.target.value;
                              setCaseAssociatedPersons(newList);
                          }} className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 text-xs" />
                          <button type="button" onClick={() => setCaseAssociatedPersons(caseAssociatedPersons.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700 px-2 cursor-pointer">✕</button>
                        </div>
                      ))}
                      <button type="button" onClick={() => setCaseAssociatedPersons([...caseAssociatedPersons, { name: "", phone: "" }])} className="text-xs bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700 font-bold hover:bg-slate-200 cursor-pointer">افزودن فرد مرتبط</button>
                    </div>

                    {/* مرحله رسیدگی */}
                    <div className="space-y-1 col-span-1 sm:col-span-1 lg:col-span-1">
                      <label className="text-slate-500">مرحله رسیدگی</label>
                      <select
                        value={caseStage}
                        onChange={(e) => setCaseStage(e.target.value as CaseStage)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 text-xs font-medium"
                      >
                        <option value="بدوی">بدوی</option>
                        <option value="تجدیدنظر">تجدیدنظر</option>
                        <option value="دیوان عالی">دیوان عالی</option>
                        <option value="دیوان عدالت اداری">دیوان عدالت اداری</option>
                        <option value="شورا">شورا</option>
                        <option value="دادگاه صلح">دادگاه صلح</option>
                        <option value="اجرای احکام کیفری">اجرای احکام کیفری</option>
                        <option value="اجرای احکام مدنی">اجرای احکام مدنی</option>
                        <option value="سایر">سایر</option>
                      </select>
                    </div>

                    {/* شعبه دادگاه */}
                    <div className="space-y-1 col-span-1 sm:col-span-2 lg:col-span-1">
                      <label className="text-slate-500">شعبه دادگاه</label>
                      <input
                        type="text"
                        value={caseBranch}
                        onChange={(e) => setCaseBranch(e.target.value)}
                        placeholder="مثال: شعبه ۱۰ دادگاه عمومی حقوقی..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 text-xs font-medium"
                      />
                    </div>

                  </div>
                </div>
              )}

              {caseFormStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-500">کل مبلغ قرارداد وکالت (تومان)</label>
                      <input
                        type="text"
                        value={formatNumberWithSeparator(caseTotalContractAmount)}
                        onChange={(e) => setCaseTotalContractAmount(parseDigits(e.target.value).toString())}
                        placeholder="مثال: ۱۰۰,۰۰۰,۰۰۰"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 font-mono text-xs font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-500">پیش‌پرداخت قرارداد (تومان)</label>
                      <input
                        type="text"
                        value={formatNumberWithSeparator(caseDownPayment)}
                        onChange={(e) => setCaseDownPayment(parseDigits(e.target.value).toString())}
                        placeholder="مثال: ۲۰,۰۰۰,۰۰۰"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 font-mono text-xs font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-[11px] font-black text-amber-700">حق الوکاله دریافتی، هزینه های دادرسی و اضافات</h4>
                        <p className="text-[9px] text-slate-400 font-bold mt-1">امکان ثبت دقیق مبالغ، تاریخ روز، نوع تراکنش، هدایا و اضافات پرداختی</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setCasePayments([...casePayments, { id: "p_" + Date.now(), title: "حق الوکاله", amount: "0", type: "کارت به کارت", date: "", cardNumber: "" }])}
                        className="text-[10px] bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700 font-bold hover:bg-slate-200 cursor-pointer flex gap-1 items-center"
                      >
                        <Plus className="w-3 h-3" /> افزودن پرداختی
                      </button>
                    </div>

                    <div className="space-y-3">
                      {casePayments.map((p, idx) => (
                        <div key={p.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-150">
                          <div className="md:col-span-2">
                            <input type="text" placeholder="بابت (مثلا حق‌الوکاله یا هدیه)" value={p.title} onChange={(e) => {
                                const newList = [...casePayments];
                                newList[idx].title = e.target.value;
                                setCasePayments(newList);
                            }} className="w-full px-2 py-2 border border-slate-200 rounded-xl outline-none text-xs" />
                          </div>
                          <div className="md:col-span-2">
                             <input type="text" placeholder="مبلغ (تومان)" value={formatNumberWithSeparator(p.amount)} onChange={(e) => {
                                const newList = [...casePayments];
                                newList[idx].amount = parseDigits(e.target.value).toString();
                                setCasePayments(newList);
                            }} className="w-full px-2 py-2 border border-slate-200 rounded-xl outline-none text-xs font-mono" />
                          </div>
                          <div className="md:col-span-2">
                            <select value={p.type} onChange={(e) => {
                                const newList = [...casePayments];
                                newList[idx].type = e.target.value;
                                setCasePayments(newList);
                            }} className="w-full px-2 py-2 border border-slate-200 rounded-xl outline-none text-xs">
                              <option value="کارت به کارت">کارت به کارت</option>
                              <option value="نقدی">نقدی</option>
                              <option value="چک">چک</option>
                              <option value="حواله">حواله</option>
                            </select>
                          </div>
                          <div className="md:col-span-2">
                             <input type="text" placeholder="تاریخ (روز/ماه/سال)" value={p.date} onChange={(e) => {
                                const newList = [...casePayments];
                                newList[idx].date = formatDateWithSlash(e.target.value);
                                setCasePayments(newList);
                            }} className="w-full px-2 py-2 border border-slate-200 rounded-xl outline-none text-xs font-mono" />
                          </div>
                          <div className="md:col-span-3">
                             <input type="text" placeholder="شماره کارت/شبا مقصد (اختیاری)" value={p.cardNumber || ""} onChange={(e) => {
                                const newList = [...casePayments];
                                newList[idx].cardNumber = e.target.value;
                                setCasePayments(newList);
                            }} className="w-full px-2 py-2 border border-slate-200 rounded-xl outline-none text-xs font-mono" />
                          </div>
                          <div className="md:col-span-1 flex items-center justify-center">
                            <button type="button" onClick={() => setCasePayments(casePayments.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700 p-1 bg-red-50 rounded-lg cursor-pointer">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {casePayments.length === 0 && <div className="text-center py-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-[10px] font-bold">هیچ تراکنشی افزوده نشده است.</div>}
                    </div>
                  </div>

                  {/* Installments section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-500">مدیریت اقساط (اختیاری)</label>
                      <button
                        type="button"
                        onClick={() => setCaseInstallments([...caseInstallments, { id: "ins_" + Date.now(), amount: "0", dueDate: "", isPaid: false, paidDate: "" }])}
                        className="text-[10px] font-bold text-amber-600 hover:text-amber-700 bg-amber-50 px-2 py-1 rounded-lg flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> افزودن قسط
                      </button>
                    </div>
                    {caseInstallments.map((ins, index) => {
                      // simple overdue check
                      const todayStr = new Date().toLocaleDateString("fa-IR", { year: "numeric", month: "2-digit", day: "2-digit" });
                      const d1 = parseDigits(ins.dueDate).toString();
                      const d2 = parseDigits(todayStr).toString();
                      let isOverdue = false;
                      if (!ins.isPaid && d1.length === 8 && d2.length === 8) {
                        isOverdue = parseInt(d1) < parseInt(d2);
                      }

                      return (
                        <div key={index} className={`grid grid-cols-1 md:grid-cols-12 gap-2 p-3 rounded-2xl border ${isOverdue ? 'bg-red-50/50 border-red-200' : 'bg-slate-50 border-slate-150'}`}>
                          <div className="md:col-span-3">
                            <input
                              type="text"
                              placeholder="مبلغ قسط (تومان)"
                              value={formatNumberWithSeparator(ins.amount)}
                              onChange={(e) => {
                                const newInstallments = [...caseInstallments];
                                newInstallments[index].amount = parseDigits(e.target.value).toString();
                                setCaseInstallments(newInstallments);
                              }}
                              className={`w-full px-3 py-2 border rounded-xl outline-none font-mono text-xs font-medium ${isOverdue ? 'bg-white border-red-200 focus:ring-1 focus:ring-red-400' : 'bg-white border-slate-200 focus:ring-1 focus:ring-slate-900'}`}
                            />
                          </div>
                          <div className="md:col-span-3">
                            <input
                              type="text"
                              placeholder="سررسید (پیش‌فرض: ۱۴۰۴/۰۱/۰۱)"
                              value={ins.dueDate}
                              onChange={(e) => {
                                const newInstallments = [...caseInstallments];
                                newInstallments[index].dueDate = formatDateWithSlash(e.target.value);
                                setCaseInstallments(newInstallments);
                              }}
                              className={`w-full px-3 py-2 border rounded-xl outline-none font-mono text-xs font-medium ${isOverdue ? 'bg-white border-red-200 focus:ring-1 focus:ring-red-400' : 'bg-white border-slate-200 focus:ring-1 focus:ring-slate-900'}`}
                            />
                            {isOverdue && <span className="text-[9px] font-black text-red-600 block mt-1 pr-1 flex items-center justify-start gap-1"><AlertCircle className="w-3 h-3" /> معوق (موعد گذشته)</span>}
                          </div>
                          <div className="md:col-span-2 flex flex-col justify-center gap-1">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 select-none px-2">
                               <input type="checkbox" checked={ins.isPaid || false} onChange={e => {
                                 const newInstallments = [...caseInstallments];
                                 newInstallments[index].isPaid = e.target.checked;
                                 if (!e.target.checked) newInstallments[index].paidDate = "";
                                 setCaseInstallments(newInstallments);
                               }} className="w-4 h-4 rounded text-amber-500 focus:ring-0 cursor-pointer accent-amber-500" />
                               پرداخت شد
                            </label>
                          </div>
                          <div className="md:col-span-3">
                            {ins.isPaid && (
                               <input
                                  type="text"
                                  placeholder="تاریخ دریافت وجه..."
                                  value={ins.paidDate || ""}
                                  onChange={(e) => {
                                    const newInstallments = [...caseInstallments];
                                    newInstallments[index].paidDate = formatDateWithSlash(e.target.value);
                                    setCaseInstallments(newInstallments);
                                  }}
                                  className="w-full px-3 py-2 bg-white border border-green-200 rounded-xl outline-none focus:ring-1 focus:ring-green-500 font-mono text-xs font-medium text-green-700 placeholder-green-300"
                                />
                            )}
                          </div>
                          <div className="md:col-span-1 flex items-center justify-center">
                            <button type="button" onClick={() => setCaseInstallments(caseInstallments.filter((_, i) => i !== index))} className={`p-1.5 rounded-lg cursor-pointer ${isOverdue ? 'bg-red-100/50 text-red-600 hover:bg-red-100' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}>
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
           <div className="flex gap-2 pt-2">
                {caseFormStep === 1 ? (
                  <>
                    <button type="submit" className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition select-none cursor-pointer">
                      {editingCase ? "ذخیره اطلاعات صفحه" : "ثبت سریع پرونده"}
                    </button>
                    <button type="button" onClick={() => setCaseFormStep(2)} className="flex-1 py-3 bg-indigo-900 hover:bg-slate-900 text-white rounded-xl font-bold transition select-none cursor-pointer">
                      ادامه: ثبت اطلاعات مالی
                    </button>
                  </>
                ) : (
                  <button type="submit" className="flex-1 py-3 bg-slate-900 hover:bg-amber-600 text-white rounded-xl font-bold transition select-none cursor-pointer">
                    {editingCase ? "ذخیره تغییرات پرونده" : "ثبت و برپایی پرونده"}
                  </button>
                )}
                <button type="button" onClick={() => { 
                    if(caseFormStep === 2) setCaseFormStep(1);                
                    else { setShowCaseForm(false); setEditingCase(null); setCaseFormStep(1); }
                }} className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition select-none cursor-pointer">
                    {caseFormStep === 2 ? "بازگشت" : "انصراف"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3-B: Printable Case View */}
      {printableCase && (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-50 animate-fadeIn backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full p-8 font-sans text-right" dir="rtl">
            {/* Printable Content - Detailed View */}
            <div id="printable-content" className="text-xs text-slate-900 space-y-4">

                <h1 className="text-lg font-black text-center border-b pb-2">پرونده: <span className="text-blue-600 font-extrabold">{toPersianDigits(printableCase.title)}</span></h1>
                
                <div className="space-y-4 text-right" dir="rtl">
                  {/* ۱. مشخصات هویتی موکل */}
                  <div className="mb-4">
                    <h3 className="text-xs font-bold text-slate-850 mb-2 border-r-4 border-amber-500 pr-2 pb-0.5">۱. مشخصات هویتی موکل</h3>
                    <div className="grid grid-cols-2 gap-4 border border-slate-200 p-4 rounded-2xl text-xs bg-slate-50/30">
                      {hasValue(printableCase.clientName) && (
                        <p><strong>نام موکل:</strong> <span className="text-blue-600 font-semibold">{printableCase.clientName}</span></p>
                      )}
                      {hasValue(printableCase.clientRole) && (
                        <p><strong>نقش موکل:</strong> <span className="text-blue-600 font-semibold">{printableCase.clientRole}</span></p>
                      )}
                    </div>
                  </div>

                  {/* ۲. اطلاعات پرونده */}
                  <div className="mb-4">
                    <h3 className="text-xs font-bold text-slate-850 mb-2 border-r-4 border-amber-500 pr-2 pb-0.5">۲. اطلاعات پرونده</h3>
                    <div className="grid grid-cols-2 gap-4 border border-slate-200 p-4 rounded-2xl text-xs bg-slate-50/30">
                      {hasValue(printableCase.title) && (
                        <p><strong>موضوع پرونده (خواسته):</strong> <span className="text-blue-600 font-semibold">{toPersianDigits(printableCase.title)}</span></p>
                      )}
                      {hasValue(printableCase.caseNumber) && (
                        <p><strong>شماره پرونده (ثنا):</strong> <span className="text-blue-600 font-semibold font-mono">{toPersianDigits(printableCase.caseNumber)}</span></p>
                      )}
                      {hasValue(printableCase.branch) && (
                        <p><strong>شعبه دادگاه:</strong> <span className="text-blue-600 font-semibold">{toPersianDigits(printableCase.branch)}</span></p>
                      )}
                      {hasValue(printableCase.sanaPassword) && (
                        <p><strong>رمز شخصی ثنا:</strong> <span className="text-blue-600 font-semibold font-mono">{printableCase.sanaPassword}</span></p>
                      )}
                      {hasValue(printableCase.opposingPartyName) && (
                        <p><strong>طرف مقابل پرونده:</strong> <span className="text-blue-600 font-semibold">{printableCase.opposingPartyName}</span></p>
                      )}
                      {hasValue(printableCase.filingDate) && (
                        <p><strong>تاریخ تشکیل پرونده:</strong> <span className="text-blue-600 font-semibold font-mono">{toPersianDigits(printableCase.filingDate)}</span></p>
                      )}
                      {hasValue(printableCase.createdAt) && (
                        <p><strong>تاریخ ثبت پرونده:</strong> <span className="text-blue-600 font-semibold font-mono">{toPersianDigits(printableCase.createdAt)}</span></p>
                      )}
                      {hasValue(printableCase.stage) && (
                        <p><strong>مرحلۀ پرونده:</strong> <span className="text-blue-600 font-semibold">{printableCase.stage}</span></p>
                      )}
                      {hasValue(printableCase.status) && (
                        <p><strong>وضعیت پرونده:</strong> <span className="text-blue-600 font-semibold">{printableCase.status}</span></p>
                      )}
                      {hasValue(printableCase.courtCaseNumber) && (
                        <p><strong>شماره دادگاه بدوی:</strong> <span className="text-blue-600 font-semibold font-mono">{toPersianDigits(printableCase.courtCaseNumber)}</span></p>
                      )}
                      {hasValue(printableCase.archiveNumber) && (
                        <p><strong>کلاسه بایگانی دفتر:</strong> <span className="text-blue-600 font-semibold font-mono">{toPersianDigits(printableCase.archiveNumber)}</span></p>
                      )}
                      {hasValue(printableCase.appealCaseNumber) && (
                        <p><strong>شماره تجدید نظر:</strong> <span className="text-blue-600 font-semibold font-mono">{toPersianDigits(printableCase.appealCaseNumber)}</span></p>
                      )}
                      {hasValue(printableCase.rejectionCaseNumber) && (
                        <p><strong>شماره واخواهی:</strong> <span className="text-blue-600 font-semibold font-mono">{toPersianDigits(printableCase.rejectionCaseNumber)}</span></p>
                      )}
                      {hasValue(printableCase.supremeCaseNumber) && (
                        <p><strong>فرجام خواهی/دیوان:</strong> <span className="text-blue-600 font-semibold font-mono">{toPersianDigits(printableCase.supremeCaseNumber)}</span></p>
                      )}
                      {hasValue(printableCase.executionCaseNumber) && (
                        <p><strong>اجرای احکام کیفری:</strong> <span className="text-blue-600 font-semibold font-mono">{toPersianDigits(printableCase.executionCaseNumber)}</span></p>
                      )}
                      {hasValue(printableCase.executionCivilCaseNumber) && (
                        <p><strong>اجرای احکام مدنی:</strong> <span className="text-blue-600 font-semibold font-mono">{toPersianDigits(printableCase.executionCivilCaseNumber)}</span></p>
                      )}
                      {hasValue(printableCase.insolvencyCaseNumber) && (
                        <p><strong>شماره پرونده اعسار:</strong> <span className="text-blue-600 font-semibold font-mono">{toPersianDigits(printableCase.insolvencyCaseNumber)}</span></p>
                      )}
                      {hasValue(printableCase.investigationCaseNumber) && (
                        <p><strong>شماره پرونده بازپرسی:</strong> <span className="text-blue-600 font-semibold font-mono">{toPersianDigits(printableCase.investigationCaseNumber)}</span></p>
                      )}
                      {hasValue(printableCase.prosecutionCaseNumber) && (
                        <p><strong>شماره پرونده دادیاری:</strong> <span className="text-blue-600 font-semibold font-mono">{toPersianDigits(printableCase.prosecutionCaseNumber)}</span></p>
                      )}
                    </div>
                  </div>

                  {/* ۳. وضعیت مالی و قرارداد */}
                  {(hasValue(printableCase.totalContractAmount) || hasValue(printableCase.downPayment) || hasValue(printableCase.receivedFee) || hasValue(printableCase.paidExpenses) || (printableCase.installments && printableCase.installments.length > 0) || (printableCase.payments && printableCase.payments.length > 0)) && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-slate-850 border-r-4 border-amber-500 pr-2 pb-0.5">۳. وضعیت مالی و قرارداد</h3>
                        <label className="no-print flex items-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors">
                          <input 
                            type="checkbox" 
                            checked={includeFinancialInPrint} 
                            onChange={(e) => setIncludeFinancialInPrint(e.target.checked)}
                            className="w-4 h-4 accent-amber-500 rounded border-slate-300"
                          />
                          <span className="text-[10px] font-bold text-slate-700">آیا این موارد چاپ شود؟</span>
                        </label>
                      </div>
                      
                      {includeFinancialInPrint ? (
                        <>
                          <div className="grid grid-cols-2 gap-4 border border-slate-200 p-4 rounded-2xl text-xs bg-slate-50/30">
                            {hasValue(printableCase.totalContractAmount) && (
                              <p><strong>کل مبلغ قرارداد:</strong> <span className="text-blue-600 font-semibold">{toPersianDigits((printableCase.totalContractAmount ?? 0).toLocaleString())} تومان</span></p>
                            )}
                            {hasValue(printableCase.downPayment) && (
                              <p><strong>پیش‌پرداخت:</strong> <span className="text-blue-600 font-semibold">{toPersianDigits((printableCase.downPayment ?? 0).toLocaleString())} تومان</span></p>
                            )}
                            {hasValue(printableCase.receivedFee) && (
                              <p><strong>حق‌الوکاله دریافتی:</strong> <span className="text-blue-600 font-semibold">{toPersianDigits((printableCase.receivedFee ?? 0).toLocaleString())} تومان</span></p>
                            )}
                            {hasValue(printableCase.paidExpenses) && (
                              <p><strong>هزینه‌های انجام شده:</strong> <span className="text-blue-600 font-semibold">{toPersianDigits((printableCase.paidExpenses ?? 0).toLocaleString())} تومان</span></p>
                            )}
                          </div>
                          
                          {printableCase.installments && printableCase.installments.length > 0 && (
                            <div className="mt-3 overflow-hidden border border-slate-200 rounded-2xl">
                              <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                                <h4 className="text-[10px] font-black text-slate-700">جدول اقساط حق‌الوکاله</h4>
                              </div>
                              <table className="w-full text-right text-xs border-collapse" dir="rtl">
                                <thead>
                                  <tr className="bg-slate-50/50 font-bold text-slate-600 border-b border-slate-200">
                                    <th className="p-2 border-l border-slate-150 text-center w-12">ردیف</th>
                                    <th className="p-2 border-l border-slate-150">مبلغ قسط</th>
                                    <th className="p-2 border-l border-slate-150">تاریخ سررسید</th>
                                    <th className="p-2">وضعیت پرداخت</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {printableCase.installments.map((ins, idx) => (
                                    <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                                      <td className="p-2 border-l border-slate-100 text-slate-500 font-mono text-[10px] text-center">{toPersianDigits(idx + 1)}</td>
                                      <td className="p-2 border-l border-slate-100 text-blue-600 font-semibold">{toPersianDigits((ins.amount ?? 0).toLocaleString())} تومان</td>
                                      <td className="p-2 border-l border-slate-100 text-slate-600 font-mono">{toPersianDigits(ins.dueDate)}</td>
                                      <td className="p-2">
                                        {ins.isPaid ? (
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-green-50 border border-green-200 text-[10px] font-bold text-green-600">
                                            پرداخت شده {ins.paidDate ? `(در ` + toPersianDigits(ins.paidDate) + `)` : ``}
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-600">
                                            معوق / در انتظار پرداخت
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {printableCase.payments && printableCase.payments.length > 0 && (
                            <div className="mt-3 overflow-hidden border border-slate-200 rounded-2xl">
                              <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                                <h4 className="text-[10px] font-black text-slate-700">تراکنش‌ها و وجوه دریافتی</h4>
                              </div>
                              <table className="w-full text-right text-xs border-collapse" dir="rtl">
                                <thead>
                                  <tr className="bg-slate-50/50 font-bold text-slate-600 border-b border-slate-200">
                                    <th className="p-2 border-l border-slate-150 text-center w-12">ردیف</th>
                                    <th className="p-2 border-l border-slate-150">بابت / شرح</th>
                                    <th className="p-2 border-l border-slate-150">مبلغ دریافتی</th>
                                    <th className="p-2 border-l border-slate-150">نوع پرداخت</th>
                                    <th className="p-2">تاریخ پرداخت</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {printableCase.payments.map((p, idx) => (
                                    <tr key={p.id || idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                                      <td className="p-2 border-l border-slate-100 text-slate-500 font-mono text-[10px] text-center">{toPersianDigits(idx + 1)}</td>
                                      <td className="p-2 border-l border-slate-100 text-slate-700">{p.title}</td>
                                      <td className="p-2 border-l border-slate-100 text-green-600 font-semibold">{toPersianDigits((p.amount ?? 0).toLocaleString())} تومان</td>
                                      <td className="p-2 border-l border-slate-100 text-slate-600">{p.type}</td>
                                      <td className="p-2 font-mono text-slate-600">{toPersianDigits(p.date)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="border border-dashed border-slate-300 p-4 rounded-2xl text-center">
                          <p className="text-[10px] text-slate-400 font-medium">بخش مالی در نسخه چاپی حذف خواهد شد.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ۴. افراد مرتبط با پرونده */}
                  {printableCase.associatedPersons && printableCase.associatedPersons.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-xs font-bold text-slate-850 mb-2 border-r-4 border-amber-500 pr-2 pb-0.5">۴. افراد مرتبط با پرونده</h3>
                      <table className="w-full border-collapse border border-slate-200 text-xs text-right rounded-2xl overflow-hidden" dir="rtl">
                        <thead>
                          <tr className="bg-slate-50 font-bold">
                            <th className="border border-slate-200 p-2 text-right">نام و نام خانوادگی</th>
                            <th className="border border-slate-200 p-2 text-right">شماره تماس (تلفن همراه)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {printableCase.associatedPersons.map((person, i) => (
                            <tr key={i} className="hover:bg-slate-50/50">
                              <td className="border border-slate-200 p-2 text-blue-600 font-semibold">{person.name || "-"}</td>
                              <td className="border border-slate-200 p-2 font-mono text-blue-600 font-semibold">{person.phone ? toPersianDigits(person.phone) : "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* ۵. شرح خلاصه و مبانی وضعیت پرونده */}
                  {hasValue(printableCase.description) && (
                    <div className="mb-4">
                      <h3 className="text-xs font-bold text-slate-850 mb-2 border-r-4 border-amber-500 pr-2 pb-0.5">۵. شرح خلاصه و مبانی وضعیت پرونده</h3>
                      <div className="border border-slate-200 p-4 rounded-2xl text-xs bg-slate-50/30 text-blue-600 font-semibold whitespace-pre-line">{toPersianDigits(printableCase.description)}</div>
                    </div>
                  )}
                </div>
            </div>

            {/* Bottom Actions row (Visible on screen only) */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 no-print" dir="rtl">
              <span className="text-xs text-slate-500 font-bold">پایان پیش‌نمایش اطلاعات پرونده فوق</span>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handlePrint(printableCase, includeFinancialInPrint)}
                  className="flex-1 sm:flex-initial px-6 py-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-xl text-xs font-extrabold transition-all duration-150 cursor-pointer select-none touch-manipulation flex items-center justify-center gap-2 shadow-md active:shadow-inner"
                >
                  <Printer className="w-4 h-4 shrink-0" />
                  چاپ و ذخیره سنَد پرونده
                </button>
                <button
                  type="button"
                  onClick={() => setPrintableCase(null)}
                  className="flex-1 sm:flex-initial px-6 py-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer select-none touch-manipulation text-center"
                >
                  بازگشت
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3-C: Printable Client View */}
      {printableClient && (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-50 animate-fadeIn backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 font-sans text-right" dir="rtl">
            <div className="flex justify-between items-center mb-4 no-print border-b border-slate-100 pb-3">
              <h2 className="text-xs font-black text-slate-800">پیش نمایش اطلاعات هویتی موکل</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePrintClient(printableClient)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-xl text-[11px] font-bold transition-all duration-150 cursor-pointer select-none touch-manipulation flex items-center gap-1.5 shadow-md active:shadow-inner"
                >
                  <Printer className="w-3.5 h-3.5 shrink-0" />
                  چاپ و ذخیره PDF
                </button>
                <button
                  onClick={() => setPrintableClient(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-800 rounded-xl text-[11px] font-bold transition-all duration-150 cursor-pointer select-none touch-manipulation"
                >
                  بستن
                </button>
              </div>
            </div>
            {/* Printable Content - Detailed View */}
            <div className="text-[11px] text-slate-800 space-y-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-b border-slate-100 pb-3 text-xs">
                    <p><strong>نام موکل:</strong> {printableClient.name}</p>
                    <p><strong>کد ملی / شناسه ملی:</strong> <span className="font-mono">{toPersianDigits(printableClient.nationalId)}</span></p>
                    <p><strong>نام پدر:</strong> {printableClient.fatherName || "-"}</p>
                    <p><strong>تاریخ تولد:</strong> <span className="font-mono">{printableClient.birthDate ? toPersianDigits(printableClient.birthDate) : "-"}</span></p>
                </div>

                <div className="bg-amber-50/20 p-4 rounded-xl border border-amber-100/60 space-y-2.5">
                    <h3 className="font-black text-slate-800 text-xs border-r-2 border-amber-500 pr-2">اطلاعات تماس و نشانی قانونی موکل</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1">
                        <div className="bg-white p-2 rounded-lg border border-slate-100">
                            <span className="text-[10px] text-slate-500 block font-bold mb-0.5">تلفن همراه ثنا:</span>
                            <span className="font-mono text-amber-700 font-extrabold text-xs">{toPersianDigits(printableClient.phoneNumber)}</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-100">
                            <span className="text-[10px] text-slate-500 block font-bold mb-0.5">یادداشت اداری / صنف:</span>
                            <span className="text-slate-800 font-bold">{printableClient.description || "توضیحی ثبت نشده است."}</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-100 md:col-span-2">
                            <span className="text-[10px] text-slate-500 block font-bold mb-0.5">نشانی قانونی پستی اقامتگاه:</span>
                            <span className="text-slate-800 font-semibold">{toPersianDigits(printableClient.address || "آدرسی ثبت نشده است.")}</span>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: MASTER CASE VISUAL EXPLORER FILE (Notes & documents & uploads) */}
      {selectedCase && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-40 animate-fadeIn backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-4xl w-full p-6 text-xs text-slate-700 font-semibold space-y-6 my-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-800">
                    پرونده
                  </h2>

                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePrint(selectedCase || undefined)}
                  className="px-4 py-2 bg-amber-50 hover:bg-slate-900 active:scale-95 border border-amber-200 hover:border-slate-800 text-amber-900 hover:text-white font-bold rounded-xl flex items-center gap-2 transition-all duration-150 select-none cursor-pointer touch-manipulation text-[11px] shadow-sm active:shadow-inner"
                  title="چاپ یا ذخیره نسخه PDF پرونده"
                >
                  <Printer className="w-4 h-4 text-amber-600 shrink-0" />
                  چاپ و PDF
                </button>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="w-8 h-8 rounded-full border border-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center hover:bg-slate-50 cursor-pointer text-xs font-black shrink-0 active:scale-90 transition-transform duration-100"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Files & Attachments explorer (12 cols) */}
              <div className="md:col-span-12 space-y-6">
                <div>
                  {/* Drag drop zone container */}
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition relative ${
                      dragActive
                        ? "border-amber-500 bg-amber-50/50"
                        : "border-slate-200 hover:border-amber-400 bg-slate-50/50"
                    }`}
                  >
                    <input
                      type="file"
                      id="case_file_upload"
                      multiple={false}
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf, image/*, audio/*"
                    />
                    <label htmlFor="case_file_upload" className="cursor-pointer block space-y-2">
                      <FileUp className="w-8 h-8 text-slate-400 mx-auto" />
                      <div className="text-[11px] font-bold text-slate-700">رها کردن فایل در این ناحیه یا کلیک جهت بارگذاری</div>
                      <p className="text-[9px] text-slate-400">اسناد مربوطه، تصاویر عوارض، فرمت‌های تصویر، صدا و PDF (حداکثر ۲۰ مگابایت)</p>
                    </label>
                  </div>
                </div>

                {/* Attachments List */}
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold block">مجموع پرونده‌های پیوست ({toPersianDigits(activeCaseDocs.length)}):</span>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto">
                    {activeCaseDocs.length === 0 ? (
                      <p className="text-[10px] text-slate-400 text-center py-6 bg-slate-50/10 border border-dotted border-slate-100 rounded-xl">سندی الصاق نشده است.</p>
                    ) : (
                      activeCaseDocs.map(doc => (
                        <div key={doc.id} className="p-2 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between group hover:border-amber-200">
                          <div className="flex items-center gap-2 min-w-0">
                            {doc.type === "image" && doc.dataUrl ? (
                              <img src={doc.dataUrl} alt={doc.name} className="w-8 h-8 rounded object-cover border border-slate-200 shrink-0" />
                            ) : doc.type === "image" ? (
                              <div className="w-8 h-8 rounded bg-amber-50 border border-amber-100 text-amber-500 flex items-center justify-center shrink-0">
                                <ImageIcon className="w-4 h-4" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded bg-blue-50 border border-blue-100 text-blue-500 flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                            )}
                            <div className="min-w-0 text-[10px] flex-1">
                              {editingDocId === doc.id ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={editDocName}
                                    onChange={(e) => setEditDocName(e.target.value)}
                                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold outline-none focus:ring-1 focus:ring-amber-500"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveEditedDocName(doc.id);
                                      if (e.key === 'Escape') setEditingDocId(null);
                                    }}
                                  />
                                  <button
                                    onClick={() => handleSaveEditedDocName(doc.id)}
                                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                                  >
                                    ✓
                                  </button>
                                  <button
                                    onClick={() => setEditingDocId(null)}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <p className="font-bold text-slate-800 truncate" title={doc.name}>{doc.name}</p>
                                  <p className="text-[8px] text-slate-400 mt-0.5">{doc.size} | {toPersianDigits(doc.uploadedAt)}</p>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => moveDocument(doc.id, "up")}
                              disabled={activeCaseDocs.indexOf(doc) === 0}
                              className={`p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded cursor-pointer disabled:opacity-20 ${activeCaseDocs.indexOf(doc) === 0 ? "cursor-not-allowed" : ""}`}
                              title="انتقال به بالا"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => moveDocument(doc.id, "down")}
                              disabled={activeCaseDocs.indexOf(doc) === activeCaseDocs.length - 1}
                              className={`p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded cursor-pointer disabled:opacity-20 ${activeCaseDocs.indexOf(doc) === activeCaseDocs.length - 1 ? "cursor-not-allowed" : ""}`}
                              title="انتقال به پایین"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleViewDocument(doc)}
                              className="text-slate-600 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
                              title="مشاهده"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {editingDocId !== doc.id && (
                              <button
                                onClick={() => {
                                  setEditingDocId(doc.id);
                                  setEditDocName(doc.name);
                                }}
                                className="text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-50 cursor-pointer"
                                title="ویرایش نام سند"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => onDeleteDocument(doc.id)}
                              className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
                              title="امحا و حذف سند"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            {onNavigateToAlarms && (
                              <button
                                onClick={onNavigateToAlarms}
                                className="text-purple-600 hover:text-purple-800 p-1.5 rounded-lg hover:bg-purple-50 cursor-pointer border border-purple-100"
                                title="ثبت در آلارم‌های قضایی"
                              >
                                <Bell className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Back button container */}
                <div className="mt-8 bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-xs font-bold text-slate-600">پایان مشاهده مدارک پرونده</span>
                  <button
                    onClick={() => setSelectedCase(null)}
                    className="px-6 py-2 bg-slate-900 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center gap-2 transition select-none cursor-pointer text-xs"
                  >
                    بازگشت به فهرست پرونده‌ها
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Document View / Preview Overlay */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-950/85 z-[60] flex flex-col items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-850 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <div className="text-right">
                  <h3 className="text-xs font-bold text-slate-100 truncate max-w-md">{previewDoc.name}</h3>
                  <p className="text-[9px] text-slate-400 mt-0.5">{previewDoc.size} | بارگذاری شده در {toPersianDigits(previewDoc.uploadedAt)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closePreview}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer text-xs font-black"
              >
                ✕
              </button>
            </div>

            {/* Document Body View Area */}
            <div className="p-6 flex-1 flex items-center justify-center min-h-[300px] max-h-[500px] overflow-auto bg-slate-950/20">
              {(previewDoc.type === "image" || previewDoc.dataUrl?.startsWith("data:image/")) && previewDoc.dataUrl ? (
                <img
                  src={previewDoc.dataUrl}
                  alt={previewDoc.name}
                  className="max-w-full max-h-96 rounded-2xl border border-slate-800 object-contain shadow-lg"
                  referrerPolicy="no-referrer"
                />
              ) : (previewDoc.type === "pdf" || previewDoc.dataUrl?.startsWith("data:application/pdf") || previewDoc.dataUrl?.startsWith("blob:") || previewDoc.name?.toLowerCase().endsWith(".pdf")) ? (
                <object
                  data={previewDoc.dataUrl}
                  type="application/pdf"
                  className="w-full min-h-[400px] h-full rounded-2xl border border-slate-800 shadow bg-white"
                >
                  <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center text-slate-300 mx-auto">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-slate-200 font-bold mb-2">مرورگر شما قادر به نمایش مستقیم PDF نیست</p>
                      <p className="text-[11px] text-slate-400 mb-4">لطفاً فایل را از طریق دکمه‌های زیر بارگیری یا باز کنید.</p>
                      <a href={previewDoc.dataUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition inline-block">
                        باز کردن در صفحه جدید
                      </a>
                    </div>
                  </div>
                </object>
              ) : (previewDoc.type as string) === "audio" || previewDoc.dataUrl?.startsWith("data:audio/") || previewDoc.dataUrl?.startsWith("blob:") && (previewDoc.type as string) === "audio" ? (
                <div className="flex flex-col items-center justify-center w-full max-w-md p-8 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
                  <div className="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.15)] mx-auto relative overflow-hidden">
                    <div className="absolute inset-0 bg-indigo-500/20 blur-xl animate-pulse"></div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400 relative z-10"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line></svg>
                  </div>
                  <div className="w-full text-center space-y-1">
                    <p className="text-slate-200 font-bold text-sm truncate px-4" dir="ltr">{previewDoc.name}</p>
                    <p className="text-indigo-400 text-[10px] uppercase tracking-widest font-black">Audio File</p>
                  </div>
                  <audio 
                    controls 
                    src={previewDoc.dataUrl} 
                    className="w-full outline-none"
                    controlsList="nodownload"
                  />
                </div>
              ) : previewDoc.dataUrl ? (
                <div className="text-center space-y-4 py-12 text-slate-400">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mx-auto">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-200">این نوع فایل قابلیت پیش‌نمایش ندارد</p>
                    <p className="text-[10px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                      لطفا فایل را با استفاده از دکمه تعبیه شده پایین دانلود کرده و باز کنید.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4 py-12 text-slate-400">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mx-auto">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-200">فایل یافت نشد یا محتوایی ندارد</p>
                    <p className="text-[10px] text-red-400 max-w-sm mx-auto leading-relaxed">
                      به نظر می‌رسد این فایل فاقد محتوای نمایشی است (احتمالاً در حین بارگذاری به دلیل محدودیت حجم، ذخیره نشده است). لطفاً فایل را مجدداً با حجم کمتر بارگذاری کنید.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-850 flex items-center justify-between gap-4">
              <p className="text-[9px] text-slate-500">پورتال هوشمند وکالت - نمایش امن پیش‌نمایش اسناد</p>
              <div className="flex gap-2">
                {previewDoc.dataUrl && (
                  <a
                    href={previewDoc.dataUrl}
                    download={previewDoc.name}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl transition flex items-center gap-1.5"
                  >
                    بارگیری و دانلود
                  </a>
                )}
                <button
                  type="button"
                  onClick={closePreview}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  بستن پیش‌نمایش
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal 3: Notes Manager */}
      {showNotesManager && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-2 sm:p-4 z-50 animate-fadeIn backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-5xl w-full h-[90vh] md:h-[85vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-800">مدیریت یادداشت‌های تخصصی پرونده</h3>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold mt-0.5">پرونده: {showNotesManager.title} ({showNotesManager.clientName})</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowNotesManager(null);
                  setNoteContent("");
                  setEditNoteTitle("");
                  setEditingNoteId(null);
                }} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Sidebar: List of notes */}
              <div className="w-full md:w-64 border-b md:border-b-0 md:border-l border-slate-100 bg-slate-50/30 overflow-y-auto p-3 sm:p-4 space-y-2 sm:space-y-3 h-36 md:h-auto shrink-0 animate-fadeIn">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-slate-400">تاریخچه یادداشت‌ها</span>
                  <button 
                    onClick={() => {
                      setEditingNoteId(null);
                      setEditNoteTitle("");
                      setNoteContent("");
                    }}
                    className="p-1 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                    title="یادداشت جدید"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                {notes.filter(n => n.caseId === showNotesManager.id).length === 0 ? (
                  <div className="text-center py-4 opacity-40">
                    <Edit2 className="w-6 h-6 mx-auto mb-1 stroke-1" />
                    <p className="text-[8px] font-bold">هنوز یادداشتی ثبت نشده است</p>
                  </div>
                ) : (
                  notes.filter(n => n.caseId === showNotesManager.id).map(note => (
                    <button
                      key={note.id}
                      onClick={() => {
                        setEditingNoteId(note.id);
                        setEditNoteTitle(note.title);
                        setNoteContent(note.content);
                      }}
                      className={`w-full text-right p-2 sm:p-2.5 rounded-xl border transition group block ${
                        editingNoteId === note.id 
                          ? "bg-amber-50 border-amber-200 shadow-sm" 
                          : "bg-white border-slate-100 hover:border-amber-100 hover:bg-slate-50"
                      }`}
                    >
                      <h4 className={`text-[9px] sm:text-[10px] font-black truncate ${editingNoteId === note.id ? "text-amber-900" : "text-slate-700"}`}>
                        {note.title}
                      </h4>
                      <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold mt-1">
                        {(() => {
                           const parts = note.createdAt?.split('/');
                           if (parts && parts.length === 3) {
                             const lookup = ["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];
                             const eDigits = parts[1].replace(/[۰-۹]/g, c => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(c)]);
                             const mIdx = parseInt(eDigits, 10) - 1;
                             if (lookup[mIdx]) return `${parts[2]} ${lookup[mIdx]} ${parts[0]}`;
                           }
                           return note.createdAt;
                        })()}
                      </p>
                      <div className="flex justify-between items-center mt-2 group-hover:opacity-100 transition">
                         <Trash2 
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteNote(note.id);
                            if (editingNoteId === note.id) {
                              setEditingNoteId(null);
                              setEditNoteTitle("");
                              setNoteContent("");
                            }
                          }}
                          className="w-4 h-4 text-slate-300 hover:text-red-600 transition" 
                         />
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Main Content: Editor */}
              <div className="flex-1 p-4 sm:p-6 flex flex-col space-y-3 sm:space-y-4 bg-white overflow-hidden">
                <div className="space-y-1 shrink-0">
                  <label className="text-[9px] sm:text-[10px] font-black text-slate-400 mr-1">عنوان یادداشت (موضوعی)</label>
                  <input
                    type="text"
                    value={editNoteTitle}
                    onChange={(e) => setEditNoteTitle(e.target.value)}
                    placeholder="مثال: گزارش ابلاغیه، نکات لایحه تجدیدنظر..."
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl font-bold text-xs outline-none focus:ring-2 focus:ring-amber-500/10 transition"
                  />
                </div>
                
                <div className="flex-1 flex flex-col space-y-1 overflow-hidden">
                  <label className="text-[9px] sm:text-[10px] font-black text-slate-400 mr-1 shrink-0">متن تفصیلی یادداشت</label>
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="تمامی جزئیات، شماره کلاسه، مفاد رای یا اقدامات لازم را اینجا به صورت مفصل یادداشت نمایید..."
                    className="flex-1 w-full px-3 py-3 sm:px-4 sm:py-4 bg-slate-50 border border-slate-200 rounded-2xl sm:rounded-3xl font-bold text-xs outline-none focus:ring-2 focus:ring-amber-500/10 resize-none leading-relaxed overflow-y-auto"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-slate-100 shrink-0">
                  <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold bg-slate-50 px-2.5 py-1 sm:py-1.5 rounded-full border border-slate-100 self-start sm:self-auto">
                    <Clock className="w-3 h-3 inline-block ml-1" />
                    تاریخ سیستم: {toPersianDigits(new Date().toLocaleDateString("fa-IR"))}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 justify-end">
                    {editingNoteId && (
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteNote(editingNoteId);
                          setEditingNoteId(null);
                          setEditNoteTitle("");
                          setNoteContent("");
                        }}
                        className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded-lg sm:rounded-xl font-bold hover:bg-red-600 hover:text-white transition text-[10px] sm:text-[11px] flex justify-center items-center gap-1 cursor-pointer shrink-0"
                        title="حذف این یادداشت"
                      >
                         <Trash2 className="w-3.5 h-3.5" />
                         حذف
                      </button>
                    )}
                    <button 
                      type="button" 
                      onClick={() => {
                        setShowNotesManager(null);
                        setNoteContent("");
                        setEditNoteTitle("");
                        setEditingNoteId(null);
                      }} 
                      className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg sm:rounded-xl font-bold hover:bg-slate-200 transition text-[10px] sm:text-[11px] cursor-pointer shrink-0"
                    >
                      بستن پنجره
                    </button>
                    
                    <button 
                      type="button" 
                      onClick={() => {
                        if (noteContent.trim()) {
                          if (editingNoteId) {
                            onUpdateNote(editingNoteId, editNoteTitle.trim() || "یادداشت ویرایش شده", noteContent);
                          } else {
                            const newNote = {
                               id: "no_" + Date.now(),
                               caseId: showNotesManager.id,
                               title: editNoteTitle.trim() || "یادداشت جدید",
                               content: noteContent,
                               createdAt: new Date().toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })
                            };
                            onAddNote(newNote);
                          }
                          // Keep the modal open but maybe clear or select the note
                          setNoteContent("");
                          setEditNoteTitle("");
                          setEditingNoteId(null);
                        }
                      }} 
                      className="px-4 py-1.5 bg-slate-900 text-white rounded-lg sm:rounded-xl font-black hover:bg-amber-600 shadow-md shadow-slate-250/20 transition text-[10px] sm:text-[11px] shrink-0"
                    >
                      ذخیره یادداشت
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
