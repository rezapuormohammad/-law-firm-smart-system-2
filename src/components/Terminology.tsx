import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { terminologyData, TerminologyEntry } from "../data/terminologyData";

export default function Terminology() {
  const [searchTerm, setSearchTerm] = useState("");
  const [entries, setEntries] = useState<TerminologyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setEntries(terminologyData);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const filteredEntries = entries.filter(
    (entry) =>
      entry.term.includes(searchTerm) || entry.definition.includes(searchTerm)
  );

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-slate-800">ترمینو‌لوژی حقوقی (دکتر جعفری لنگرودی)</h2>
      {loading ? (
          <div className="text-sm text-slate-500">در حال بارگزاری...</div>
      ) : (
        <>
            <div className="relative">
                <input
                type="text"
                placeholder="جستجو در اصطلاحات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-amber-500"
                />
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
            </div>
            <div className="space-y-3">
                {filteredEntries.map((entry, index) => (
                    <div key={entry.term + index} className="p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                        <h3 className="text-lg font-bold text-slate-900">{entry.term}</h3>
                        <p className="text-slate-600 font-sans mt-1">{entry.definition}</p>
                    </div>
                ))}
            </div>
        </>
      )}
    </div>
  );
}
