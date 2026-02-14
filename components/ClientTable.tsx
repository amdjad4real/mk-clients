
import React, { useState, useMemo } from 'react';
import { Search, RefreshCcw, Edit, Copy, Trash2, User, Check, CreditCard, Calendar as CalendarIcon, Tag, AlertCircle, Clock, Plane, CreditCard as CardIcon } from 'lucide-react';
import { Client, Language } from '../types';

interface ClientTableProps {
  clients: Client[];
  t: any;
  lang: Language;
  onEdit: (c: Client) => void;
  onDelete: (id: string) => void;
  onCopy: (c: Client) => void;
  isFetching?: boolean;
}

const ClientTable: React.FC<ClientTableProps> = ({ clients, t, lang, onEdit, onDelete, onCopy, isFetching }) => {
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedPaymentId, setCopiedPaymentId] = useState<string | null>(null);

  // Helper to get activity date (latest of update or create)
  const getActivityDate = (client: Client) => {
    const d = new Date(client.updatedAt || client.createdAt);
    return d.toISOString().split('T')[0];
  };

  // Category Color Map - Entire Row Styling
  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'ALG1': return {
        row: 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500',
        badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300'
      };
      case 'ALG2': return {
        row: 'bg-sky-50/50 dark:bg-sky-950/20 border-sky-500',
        badge: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300'
      };
      case 'ALG3': return {
        row: 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-500',
        badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300'
      };
      case 'ORN1': return {
        row: 'bg-orange-50/50 dark:bg-orange-950/20 border-orange-500',
        badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      };
      case 'ORN2': return {
        row: 'bg-lime-50/50 dark:bg-lime-950/20 border-lime-500',
        badge: 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-300'
      };
      case 'ORN3': return {
        row: 'bg-fuchsia-50/50 dark:bg-fuchsia-950/20 border-fuchsia-500',
        badge: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-300'
      };
      default: return {
        row: 'bg-slate-50/50 dark:bg-slate-800/50 border-slate-400',
        badge: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
      };
    }
  };

  const groupedClients = useMemo(() => {
    // 1. Filter
    let filtered = clients.filter(c => {
      const searchTerm = search.toLowerCase();
      const matchesSearch = !search || 
        c.firstName.toLowerCase().includes(searchTerm) || 
        c.lastName.toLowerCase().includes(searchTerm) || 
        c.passportNumber.toLowerCase().includes(searchTerm);

      const activityDate = getActivityDate(c);
      const matchesDate = !dateFilter || activityDate === dateFilter;

      return matchesSearch && matchesDate;
    });

    // 2. Sort within all (to maintain relative order before grouping)
    filtered.sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt).getTime();
      
      // ABSOLUTE PRIORITY: Flagged as edited in current session
      if (a.isEdited && !b.isEdited) return -1;
      if (!a.isEdited && b.isEdited) return 1;

      return timeB - timeA;
    });

    // 3. Group by date
    const groups: Record<string, Client[]> = {};
    filtered.forEach(client => {
      const dateKey = getActivityDate(client);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(client);
    });

    return groups;
  }, [clients, search, dateFilter]);

  const handleCopyAction = (client: Client) => {
    const details = [
      `${t.lastName}: ${client.lastName}`,
      `${t.firstName}: ${client.firstName}`,
      `${t.passportNumber}: ${client.passportNumber}`,
      `${t.category}: ${client.category}`,
      `Card: ${client.payment.cardNumber || client.payment.cardMask}`,
    ].join('\n');

    navigator.clipboard.writeText(details).then(() => {
      setCopiedId(client.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleCopyPaymentAction = (client: Client) => {
    const rawCard = client.payment.cardNumber || client.payment.cardMask || '';
    const details = `${client.firstName} ${client.lastName}\n${rawCard.replace(/\s+/g, '')}\nEXP: ${client.payment.expiryDate}\nCVV: ${client.payment.cvv}`;
    
    navigator.clipboard.writeText(details).then(() => {
      setCopiedPaymentId(client.id);
      setTimeout(() => setCopiedPaymentId(null), 2000);
    });
  };

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (dateStr === today) return t.days[date.getDay()] + ' (Today)';
    if (dateStr === yesterday) return t.days[date.getDay()] + ' (Yesterday)';
    
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : lang, { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    }).format(date);
  };

  const sortedGroupKeys = Object.keys(groupedClients).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={t.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 rtl:pr-10 rtl:pl-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-medium"
          />
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold uppercase"
            />
          </div>
          <button 
            onClick={() => { setSearch(''); setDateFilter(''); }}
            className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <RefreshCcw className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </div>

      <div className="space-y-10">
        {!isFetching && sortedGroupKeys.length > 0 ? (
          sortedGroupKeys.map(dateKey => (
            <div key={dateKey} className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-300 dark:bg-slate-700" />
                <h3 className="text-sm font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest flex items-center gap-3">
                  <Tag className="w-4 h-4 text-blue-500" />
                  {formatDateLabel(dateKey)}
                  <span className="bg-blue-600 text-white px-2.5 py-0.5 rounded-full text-[10px]">
                    {groupedClients[dateKey].length}
                  </span>
                </h3>
                <div className="h-px flex-1 bg-slate-300 dark:bg-slate-700" />
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left rtl:text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider border-b dark:border-slate-700">
                        <th className="px-6 py-4">{t.photo}</th>
                        <th className="px-6 py-4">{t.firstName} & {t.lastName}</th>
                        <th className="px-6 py-4">{t.passportNumber}</th>
                        <th className="px-6 py-4">{t.category}</th>
                        <th className="px-6 py-4">{t.prevVisa}</th>
                        <th className="px-6 py-4">{t.paymentDetails}</th>
                        <th className="px-6 py-4 text-center">{t.actions}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {groupedClients[dateKey].map((client) => {
                        const isModified = client.isEdited || (new Date(client.updatedAt).getTime() > new Date(client.createdAt).getTime() + 1000);
                        const styles = getCategoryStyles(client.category);

                        return (
                          <tr 
                            key={client.id} 
                            className={`group transition-all border-l-[6px] ${styles.row} ${
                              isModified ? 'relative z-10 ring-2 ring-red-500 ring-inset bg-red-50/80 dark:bg-red-950/40' : ''
                            } hover:brightness-95 dark:hover:brightness-110`}
                          >
                            <td className="px-6 py-4">
                              <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center border-2 border-white dark:border-slate-600 shadow-sm">
                                {client.photoUrl ? <img src={client.photoUrl} alt="" className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-slate-400" />}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-black uppercase ${isModified ? 'text-red-700 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                                    {client.firstName} {client.lastName}
                                  </span>
                                  {isModified && (
                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-red-600 text-white text-[10px] font-black rounded-full shadow-lg shadow-red-500/40 animate-pulse border border-red-400">
                                      <AlertCircle className="w-3 h-3" />
                                      {t.modified.toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] font-bold flex items-center gap-2 mt-1">
                                  <div className="flex items-center gap-1 text-slate-500">
                                    <Clock className="w-3 h-3" />
                                    {new Date(client.updatedAt || client.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                  {isModified && <span className="text-red-600 dark:text-red-400 animate-bounce tracking-tighter">● RE-EDITED STATUS</span>}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-black text-slate-800 dark:text-slate-200 tabular-nums tracking-widest">
                              {client.passportNumber}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase shadow-sm border border-black/5 ${styles.badge}`}>
                                {client.category}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1 min-w-[120px]">
                                <div className="flex items-center gap-1 text-[11px] font-black text-slate-900 dark:text-white">
                                  <Plane className="w-3 h-3 text-blue-500" />
                                  {client.previousVisaNumber || '---'}
                                </div>
                                {(client.visaFrom || client.visaTo) && (
                                  <div className="flex flex-col text-[9px] font-bold text-slate-500 dark:text-slate-400 leading-tight">
                                    <span>{client.visaFrom || '?'} → {client.visaTo || '?'}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1 min-w-[140px]">
                                <div className="flex items-center gap-1 text-[11px] font-black text-slate-900 dark:text-white tabular-nums">
                                  <CardIcon className="w-3 h-3 text-amber-500" />
                                  {client.payment.cardMask || '---'}
                                </div>
                                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 dark:text-slate-400">
                                  <span>{client.payment.expiryDate || '--/--'}</span>
                                  <span className="bg-slate-200 dark:bg-slate-700 px-1 rounded">CVV: {client.payment.cvv ? '***' : '--'}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-1.5 opacity-20 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => onEdit(client)} className="p-2 hover:bg-blue-600 hover:text-white text-blue-600 rounded-xl transition-all"><Edit className="w-4 h-4" /></button>
                                <button onClick={() => handleCopyAction(client)} className={`p-2 rounded-xl transition-all ${copiedId === client.id ? 'bg-green-600 text-white shadow-lg' : 'text-green-600 hover:bg-green-600 hover:text-white'}`}>
                                  {copiedId === client.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                                <button onClick={() => handleCopyPaymentAction(client)} className={`p-2 rounded-xl transition-all ${copiedPaymentId === client.id ? 'bg-amber-500 text-white shadow-lg' : 'text-amber-600 hover:bg-amber-600 hover:text-white'}`}>
                                  {copiedPaymentId === client.id ? <Check className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                                </button>
                                <button onClick={() => onDelete(client.id)} className="p-2 hover:bg-red-600 hover:text-white text-red-600 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
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
          <div className="text-center py-32 bg-white dark:bg-slate-800 rounded-3xl border-4 border-dashed border-slate-200 dark:border-slate-700">
            <User className="w-20 h-20 text-slate-200 dark:text-slate-700 mx-auto mb-6" />
            <p className="text-slate-400 font-black text-xl uppercase tracking-widest">No activity found for this period</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientTable;
