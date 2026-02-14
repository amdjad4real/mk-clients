
import React, { useState, useMemo } from 'react';
import { Search, RefreshCcw, Edit, Copy, Trash2, User, Check, CreditCard, Calendar as CalendarIcon, Tag, Clock, Plane, CreditCard as CardIcon, Database, CheckSquare, Square } from 'lucide-react';
import { Client, Language } from '../types';

interface ClientTableProps {
  clients: Client[];
  t: any;
  lang: Language;
  onEdit: (c: Client) => void;
  onDelete: (id: string) => void;
  onCopy: (c: Client) => void;
  isFetching?: boolean;
  selectedClientIds?: string[];
  onToggleClientSelect?: (id: string) => void;
  onSelectAllVisible?: (ids: string[]) => void;
}

const ClientTable: React.FC<ClientTableProps> = ({ 
  clients, t, lang, onEdit, onDelete, onCopy, isFetching, 
  selectedClientIds = [], onToggleClientSelect, onSelectAllVisible 
}) => {
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedPaymentId, setCopiedPaymentId] = useState<string | null>(null);

  const getActivityDate = (client: Client) => {
    const d = new Date(client.updatedAt || client.createdAt);
    if (isNaN(d.getTime())) return 'Unknown';
    return d.toISOString().split('T')[0];
  };

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'ALG1': return { row: 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-500', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300' };
      case 'ALG2': return { row: 'bg-sky-50/30 dark:bg-sky-950/10 border-sky-500', badge: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300' };
      case 'ALG3': return { row: 'bg-indigo-50/30 dark:bg-indigo-950/10 border-indigo-500', badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300' };
      case 'ORN1': return { row: 'bg-orange-50/30 dark:bg-orange-950/10 border-orange-500', badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' };
      case 'ORN2': return { row: 'bg-lime-50/30 dark:bg-lime-950/10 border-lime-500', badge: 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-300' };
      case 'ORN3': return { row: 'bg-fuchsia-50/30 dark:bg-fuchsia-950/10 border-fuchsia-500', badge: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-300' };
      default: return { row: 'bg-slate-50/30 dark:bg-slate-800/20 border-slate-400', badge: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300' };
    }
  };

  const filteredVisibleClients = useMemo(() => {
    return clients.filter(c => {
      const searchTerm = search.toLowerCase();
      const matchesSearch = !search || 
        c.firstName.toLowerCase().includes(searchTerm) || 
        c.lastName.toLowerCase().includes(searchTerm) || 
        c.passportNumber.toLowerCase().includes(searchTerm);

      const activityDate = getActivityDate(c);
      const matchesDate = !dateFilter || activityDate === dateFilter;

      return matchesSearch && matchesDate;
    });
  }, [clients, search, dateFilter]);

  const groupedClients = useMemo(() => {
    let list = [...filteredVisibleClients];
    list.sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt).getTime();
      if (a.isEdited && !b.isEdited) return -1;
      if (!a.isEdited && b.isEdited) return 1;
      return timeB - timeA;
    });

    const groups: Record<string, Client[]> = {};
    list.forEach(client => {
      const dateKey = getActivityDate(client);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(client);
    });

    return groups;
  }, [filteredVisibleClients]);

  const handleCopyAction = (client: Client) => {
    const details = [
      `Last Name: ${client.lastName}`,
      `First Name: ${client.firstName}`,
      `Date of Birth: ${client.dob}`,
      `Passport Number: ${client.passportNumber}`,
      `Issue Date: ${client.issueDate}`,
      `Expiry Date: ${client.expiryDate}`,
      `Place of Issue: ${client.placeOfIssue}`,
      `Category: ${client.category}`
    ];
    
    if (client.previousVisaNumber) details.push(`Previous Visa Number: ${client.previousVisaNumber}`);
    if (client.visaFrom) details.push(`Visa Valid From: ${client.visaFrom}`);
    if (client.visaTo) details.push(`Visa Valid To: ${client.visaTo}`);

    navigator.clipboard.writeText(details.join('\n')).then(() => {
      setCopiedId(client.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleCopyPaymentAction = (client: Client) => {
    const rawCard = client.payment.cardNumber.replace(/\s+/g, '');
    const details = [
      `Last Name: ${client.lastName}`,
      `First Name: ${client.firstName}`,
      `Card Number: ${rawCard}`,
      `Card Holder Name: ${client.payment.cardHolderName}`,
      `Expiry Date: ${client.payment.expiryDate}`,
      `CVV: ${client.payment.cvv}`
    ].join('\n');

    navigator.clipboard.writeText(details).then(() => {
      setCopiedPaymentId(client.id);
      setTimeout(() => setCopiedPaymentId(null), 2000);
    });
  };

  const formatDateLabel = (dateStr: string) => {
    if (dateStr === 'Unknown') return t.uncategorizedHistory;
    const date = new Date(dateStr);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (dateStr === today) return `${t.days[date.getDay()]} (${t.today})`;
    if (dateStr === yesterday) return `${t.days[date.getDay()]} (${t.yesterday})`;
    
    const locale = lang === 'ar' ? 'ar-EG' : (lang === 'fr' ? 'fr-FR' : 'en-US');
    return new Intl.DateTimeFormat(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(date);
  };

  const handleToggleSelectAll = () => {
    if (!onSelectAllVisible) return;
    const visibleIds = filteredVisibleClients.map(c => c.id);
    const allVisibleSelected = visibleIds.every(id => selectedClientIds.includes(id));
    
    if (allVisibleSelected) {
      onSelectAllVisible(selectedClientIds.filter(id => !visibleIds.includes(id)));
    } else {
      onSelectAllVisible([...new Set([...selectedClientIds, ...visibleIds])]);
    }
  };

  const sortedGroupKeys = Object.keys(groupedClients).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col md:flex-row gap-5">
        <div className="relative flex-1">
          <Search className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder={t.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 rtl:pr-12 rtl:pl-4 py-3.5 rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold transition-all"
          />
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-12 pr-6 py-3.5 rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-xs font-black uppercase tracking-widest"
            />
          </div>
          <button 
            onClick={() => { setSearch(''); setDateFilter(''); }}
            className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all border border-transparent active:scale-95 shadow-sm"
          >
            <RefreshCcw className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </div>

      <div className="space-y-10">
        {!isFetching && sortedGroupKeys.length > 0 ? (
          sortedGroupKeys.map(dateKey => (
            <div key={dateKey} className="space-y-4">
              <div className="flex items-center gap-6 px-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent" />
                <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                  <Tag className="w-4 h-4 text-indigo-500" />
                  {formatDateLabel(dateKey)}
                  <span className="bg-indigo-600 text-white px-3 py-1 rounded-xl text-[10px] shadow-lg shadow-indigo-500/20">
                    {groupedClients[dateKey].length} {t.files}
                  </span>
                </h3>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent" />
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left rtl:text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b dark:border-slate-700/50">
                        <th className="px-6 py-5 text-center w-12">
                           <button onClick={handleToggleSelectAll} className="hover:text-indigo-500 transition-colors">
                             {filteredVisibleClients.length > 0 && filteredVisibleClients.every(c => selectedClientIds.includes(c.id)) 
                               ? <CheckSquare className="w-5 h-5" /> 
                               : <Square className="w-5 h-5" />
                             }
                           </button>
                        </th>
                        <th className="px-6 py-5">{t.photo}</th>
                        <th className="px-6 py-5">{t.lastName} & {t.firstName}</th>
                        <th className="px-6 py-5">{t.passportNumber}</th>
                        <th className="px-6 py-5">{t.category}</th>
                        <th className="px-6 py-5">{t.logistics}</th>
                        <th className="px-6 py-5">{t.payment}</th>
                        <th className="px-6 py-5 text-center">{t.protocol}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {groupedClients[dateKey].map((client) => {
                        const isModified = client.isEdited || (new Date(client.updatedAt).getTime() > new Date(client.createdAt).getTime() + 1000);
                        const styles = getCategoryStyles(client.category);
                        const isSelected = selectedClientIds.includes(client.id);
                        
                        return (
                          <tr key={client.id} className={`group transition-all border-l-[8px] ${isSelected ? 'bg-indigo-50/40 dark:bg-indigo-900/20 border-indigo-600' : styles.row} ${isModified && !isSelected ? 'bg-red-50/20 dark:bg-red-950/10' : ''}`}>
                            <td className="px-6 py-5 text-center">
                               <button 
                                 onClick={() => onToggleClientSelect?.(client.id)}
                                 className={`${isSelected ? 'text-indigo-600 animate-in zoom-in-50' : 'text-slate-300 dark:text-slate-600'} hover:text-indigo-500 transition-all`}
                               >
                                 {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                               </button>
                            </td>
                            <td className="px-6 py-5">
                              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden flex items-center justify-center border-2 border-slate-100 dark:border-slate-700 shadow-xl group-hover:scale-110 transition-transform">
                                {client.photoUrl ? <img src={client.photoUrl} alt="" className="w-full h-full object-cover" /> : <User className="w-7 h-7 text-slate-300" />}
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-black uppercase tracking-tighter text-slate-900 dark:text-white">
                                    {client.firstName} {client.lastName}
                                  </span>
                                  {isModified && (
                                    <div className="px-2 py-0.5 bg-red-600 text-white text-[8px] font-black rounded uppercase tracking-tighter animate-pulse">{t.updated}</div>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mt-1">
                                  <Clock className="w-3 h-3" /> {new Date(client.updatedAt || client.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5 font-black text-slate-800 dark:text-slate-200 tabular-nums tracking-[0.2em]">{client.passportNumber}</td>
                            <td className="px-6 py-5">
                              <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase border shadow-sm ${styles.badge}`}>{client.category}</span>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2 text-[11px] font-black text-slate-900 dark:text-white">
                                  <Plane className="w-4 h-4 text-blue-500" /> {client.previousVisaNumber || '---'}
                                </div>
                                <div className="text-[9px] font-bold text-slate-400 tracking-wider">
                                  {client.visaFrom || '---'} &rarr; {client.visaTo || '---'}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2 text-[11px] font-black text-slate-900 dark:text-white tabular-nums">
                                  <CardIcon className="w-4 h-4 text-amber-500" /> {client.payment.cardMask || '---'}
                                </div>
                                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                  {client.payment.expiryDate || 'EXP: --'} | CVV: {client.payment.cvv ? '***' : '--'}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                <button onClick={() => onEdit(client)} className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm" title={t.edit}>
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleCopyAction(client)} className={`p-2.5 rounded-xl transition-all shadow-sm ${copiedId === client.id ? 'bg-emerald-600 text-white' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 hover:bg-emerald-600 hover:text-white'}`} title={t.copy}>
                                  {copiedId === client.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                                <button onClick={() => handleCopyPaymentAction(client)} className={`p-2.5 rounded-xl transition-all shadow-sm ${copiedPaymentId === client.id ? 'bg-amber-600 text-white' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 hover:bg-amber-600 hover:text-white'}`} title={t.copyPayment}>
                                  {copiedPaymentId === client.id ? <Check className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                                </button>
                                <button onClick={() => onDelete(client.id)} className="p-2.5 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm" title={t.delete}>
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-40 bg-white dark:bg-slate-800 rounded-[48px] border-4 border-dashed border-slate-100 dark:border-slate-700/50 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
            <div className="p-10 bg-slate-50 dark:bg-slate-900/50 rounded-full mb-8 relative">
              <Database className="w-20 h-20 text-slate-200 dark:text-slate-700" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-black text-6xl opacity-10">?</div>
            </div>
            <h4 className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white mb-2">{t.noRecordsFound}</h4>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em] max-w-sm mx-auto leading-loose">
              {clients.length === 0 ? t.emptyPool : t.filterNoMatch}
            </p>
            {(search || dateFilter) && (
              <button onClick={() => { setSearch(''); setDateFilter(''); }} className="mt-8 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all">{t.clearFilters}</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientTable;
