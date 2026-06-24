import { safeStorage } from "../utils/safeStorage";
import React, { useState, useEffect } from "react";
import { Save, FileText, CheckCircle2, Plus, Trash2, Edit, ChevronRight, Eye, Calendar, Clock } from "lucide-react";
import { toPersianDigits } from "../utils/shamsi";

interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

export default function QuickNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeView, setActiveView] = useState<"list" | "editor" | "view">("list");
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    try {
      const saved = safeStorage.getItem("r_quick_notes_v2");
      if (saved) {
        setNotes(JSON.parse(saved));
      } else {
        // Migration from old single note version
        const oldNote = safeStorage.getItem("r_quick_notes");
        if (oldNote && oldNote.trim() !== "") {
          const newNote: Note = {
            id: Date.now().toString(),
            title: oldNote.split("\n")[0].substring(0, 50) || "یادداشت بدون عنوان",
            content: oldNote,
            updatedAt: Date.now()
          };
          setNotes([newNote]);
          safeStorage.setItem("r_quick_notes_v2", JSON.stringify([newNote]));
          safeStorage.removeItem("r_quick_notes");
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleSaveNotes = (updatedNotes: Note[]) => {
    setNotes(updatedNotes);
    safeStorage.setItem("r_quick_notes_v2", JSON.stringify(updatedNotes));
  };

  const createNote = () => {
    setCurrentNote({ id: Date.now().toString(), title: "", content: "", updatedAt: Date.now() });
    setActiveView("editor");
  };

  const openNoteEditor = (note: Note) => {
    setCurrentNote({ ...note });
    setActiveView("editor");
  };

  const openNoteView = (note: Note) => {
    setCurrentNote(note);
    setActiveView("view");
  };

  const deleteNote = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    handleSaveNotes(notes.filter((n) => n.id !== id));
    if (currentNote?.id === id) {
      setActiveView("list");
      setCurrentNote(null);
    }
  };

  const saveCurrentNote = () => {
    if (!currentNote) return;
    
    // Auto generate title from content if empty
    const lines = currentNote.content.split("\n").filter(l => l.trim().length > 0);
    const generatedTitle = currentNote.title.trim() === "" 
        ? (lines.length > 0 ? lines[0].substring(0, 50) : "یادداشت جدید")
        : currentNote.title;

    const newNote = {
      ...currentNote,
      title: generatedTitle,
      updatedAt: Date.now()
    };

    const existingIndex = notes.findIndex(n => n.id === currentNote.id);
    let updatedNotes;
    if (existingIndex >= 0) {
      updatedNotes = [...notes];
      updatedNotes[existingIndex] = newNote;
    } else {
      updatedNotes = [newNote, ...notes];
    }

    handleSaveNotes(updatedNotes);
    setCurrentNote(newNote);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return new Intl.DateTimeFormat('fa-IR', { 
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }).format(d);
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 flex flex-col h-[calc(100vh-140px)] animate-in fade-in zoom-in-95 duration-300">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 min-h-[60px]">
        <div className="flex items-center gap-4">
          {activeView !== "list" && (
            <button 
              onClick={() => setActiveView("list")}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-600 rounded-full transition-all border border-slate-200/50"
            >
               <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {activeView === "list" && (
          <div className="flex-1 flex justify-center">
            <button
              onClick={createNote}
              className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-[1rem] text-sm font-black transition-all shadow-md shadow-amber-500/20"
            >
              <Plus className="w-5 h-5" />
              یادداشت جدید
            </button>
          </div>
        )}

        {activeView === "editor" && (
          <button
            onClick={saveCurrentNote}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-2xl text-xs md:text-sm font-black transition-all shadow-md shadow-emerald-500/20"
          >
            {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {isSaved ? "ذخیره شد" : "ذخیره یادداشت"}
          </button>
        )}

        {activeView === "view" && currentNote && (
          <div className="flex items-center gap-2">
             <button
              onClick={() => deleteNote(currentNote.id)}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 active:scale-95 text-red-600 rounded-xl text-xs font-black transition-all border border-red-100"
            >
              <Trash2 className="w-4 h-4" />
              حذف
            </button>
          </div>
        )}
      </div>

      {/* LIST VIEW */}
      {activeView === "list" && (
         <div className="flex-1 overflow-y-auto pb-6 pr-2 custom-scrollbar">
            {notes.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full space-y-4 text-slate-400">
                  <FileText className="w-16 h-16 text-slate-200" />
                  <p className="font-bold text-sm">هیچ یادداشتی ثبت نشده است.</p>
                  <button onClick={createNote} className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl font-bold text-xs pointer">
                     ثبت اولین یادداشت
                  </button>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {notes.map(note => (
                     <div 
                        key={note.id}
                        onClick={() => openNoteView(note)}
                        className="py-3 px-4 min-h-[48px] border border-slate-200 bg-slate-50 hover:bg-amber-50/50 hover:border-amber-200 rounded-[1.2rem] cursor-pointer transition-all duration-200 flex items-center justify-between group shadow-sm"
                     >
                        <div className="flex flex-col overflow-hidden pr-2">
                           <h3 className="font-black text-slate-800 text-sm truncate group-hover:text-amber-700 transition-colors">{note.title || "بدون عنوان"}</h3>
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                           <button onClick={(e) => { e.stopPropagation(); deleteNote(note.id, e); }} className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors" title="حذف">
                              <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                     </div>
                  ))}
               </div>
            )}
         </div>
      )}

      {/* EDITOR VIEW */}
      {activeView === "editor" && currentNote && (
        <div className="flex-1 flex flex-col gap-4 animate-in fade-in duration-200">
           <input 
              type="text" 
              value={currentNote.title}
              onChange={(e) => setCurrentNote({...currentNote, title: e.target.value})}
              placeholder="عنوان یادداشت (اختیاری)"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 font-black text-slate-800 transition-all text-sm"
           />
           <div className="flex-1 relative">
             <textarea
               value={currentNote.content}
               onChange={(e) => {
                 setCurrentNote({...currentNote, content: e.target.value});
                 if (isSaved) setIsSaved(false);
               }}
               placeholder="یادداشت خود را اینجا بنویسید..."
               className="w-full h-full p-5 text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all font-sans leading-loose resize-none text-sm font-medium"
             />
           </div>
        </div>
      )}

      {/* READ ONLY VIEW */}
      {activeView === "view" && currentNote && (
         <div 
            onClick={() => openNoteEditor(currentNote)}
            className="flex-1 overflow-y-auto pr-2 custom-scrollbar bg-slate-50 hover:bg-slate-100 cursor-pointer rounded-2xl p-6 border border-slate-100 animate-in fade-in duration-200 transition-colors"
         >
            <h1 className="text-xl font-black text-slate-900 mb-4">{currentNote.title || "بدون عنوان"}</h1>
            <div className="flex items-center gap-4 text-[11px] text-slate-400 font-bold font-mono mb-8 pb-4 border-b border-slate-200/50">
               <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {toPersianDigits(formatDate(currentNote.updatedAt))}
               </span>
            </div>
            <div className="text-slate-700 leading-loose text-sm whitespace-pre-wrap font-medium">
               {currentNote.content}
            </div>
         </div>
      )}

    </div>
  );
}

