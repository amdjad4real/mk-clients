
import React, { useState, useMemo } from 'react';
import { Search, RefreshCcw, Edit, Copy, Trash2, User, Check, CreditCard, Calendar as CalendarIcon, Tag, Clock, Plane, CreditCard as CardIcon, Database, CheckSquare, Square, CheckCircle, ShieldAlert, FileText, Wallet, X } from 'lucide-react';
import { Client, Language } from '../types';

interface ClientTableProps {
  clients: Client[];
  t: any;
  lang: Language;
  isAdmin: boolean;
  onEdit: (c: Client) => void;
  onDelete: (id: string) => void;
  onConfirmModification?: (id: string) => void;
  onCopy: (c: Client) => void;
  isFetching?: boolean;
  selectedClientIds?: string[];
  onToggleClientSelect?: (id: string) => void;
  onSelectAllVisible?: (ids: string[]) => void;
}

const ClientTable: React.FC<ClientTableProps> = ({ 
  clients, t, lang, isAdmin, onEdit, onDelete, onConfirmModification, onCopy, isFetching, 
  selectedClientIds = [], onToggleClientSelect, onSelectAllVisible 
}) => {
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedPaymentId, setCopiedPaymentId] = useState<string | null>(null);

  /**
   * CRITICAL FIX: Always group by Registration Date (createdAt)
   * This prevents records from jumping to "Today" just because they were modified.
   */
  const getRegistrationDate = (client: Client) => {
    // We use createdAt because that defines when the client was "added"
    const d = new Date(client.createdAt);
    if (isNaN(d.getTime())) return 'Unknown';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  /**
   * Header format: DD/MM/YYYY
   */
  const formatDisplayDate = (dateStr: string) => {
    if (dateStr === 'Unknown') return t.uncategorizedHistory;
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const getCategoryStyles = (category: string) => {
    const maps: Record<string, { row: string, badge: string }> = {
      'ALG1': { row: '', badge: 'bg-green-100 text-green-800 border border-green-200' },
      'ALG2': { row: '', badge: 'bg-blue-100 text-blue-800 border border-blue-200' },
      'ALG3': { row: '', badge: 'bg-indigo-100 text-indigo-800 border border-indigo-200' },
      'ORN1': { row: '', badge: 'bg-orange-100 text-orange-800 border border-orange-200' },
      'ORN2': { row: '', badge: 'bg-lime-100 text-lime-800 border border-lime-200' },
      'ORN3': { row: '', badge: 'bg-purple-100 text-purple-800 border border-purple-200' },
    };
    return maps[category] || { row: '', badge: 'bg-gray-100 text-gray-800 border border-gray-200' };
  };

  // Filter based on Search and the Registration Date
  const filteredVisibleClients = useMemo(() => {
    const searchTerm = search.toLowerCase().trim();
    return clients.filter(c => {
      const regDate = getRegistrationDate(c);
      
      const matchesSearch = !searchTerm || 
        c.firstName.toLowerCase().includes(searchTerm) || 
        c.lastName.toLowerCase().includes(searchTerm) || 
        c.passportNumber.toLowerCase().includes(searchTerm);
      
      const matchesDate = !dateFilter || regDate === dateFilter;
      
      return matchesSearch && matchesDate;
    });
  }, [clients, search, dateFilter]);

  // Group filtered results into historical dates
  const groupedClients = useMemo(() => {
    const sortedList = [...filteredVisibleClients].sort((a, b) => {
      const tA = new Date(a.createdAt).getTime();
      const tB = new Date(b.createdAt).getTime();
      return tB - tA; // Newest registration first
    });

    const groups: Record<string, Client[]> = {};
    sortedList.forEach(client => {
      const dateKey = getRegistrationDate(client);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(client);
    });
    return groups;
  }, [filteredVisibleClients]);

  const handleCopyClientDetails = (client: Client) => {
    let raw = `Last Name: ${client.lastName.toUpperCase()}\n`;
    raw += `First Name: ${client.firstName.toUpperCase()}\n`;
    raw += `Date of Birth: ${client.dob}\n`;
    raw += `Passport Number: ${client.passportNumber}\n`;
    raw += `Issue Date: ${client.issueDate}\n`;
    raw += `Expiry Date: ${client.expiryDate}\n`;
    raw += `Place of Issue: ${client.placeOfIssue.toUpperCase()}\n`;
    raw += `Category: ${client.category}`;

    if (client.previousVisaNumber || client.visaFrom || client.visaTo) {
      raw += `\nPrevious Visa Number: ${client.previousVisaNumber || ''}\n`;
      raw += `Visa Valid From: ${client.visaFrom || ''}\n`;
      raw += `Visa Valid To: ${client.visaTo || ''}`;
    }

    navigator.clipboard.writeText(raw).then(() => {
      setCopiedId(client.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleCopyPaymentDetails = (client: Client) => {
    const p = client.payment;
    let raw = `Last Name: ${client.lastName.toUpperCase()}\n`;
    raw += `First Name: ${client.firstName.toUpperCase()}\n`;
    raw += `Card Number: ${p.cardNumber || ''}\n`;
    raw += `Card Holder Name: ${(p.cardHolderName || '').toUpperCase()}\n`;
    raw += `Expiry Date: ${p.expiryDate || ''}\n`;
    raw += `CVV: ${p.cvv || ''}`;

    navigator.clipboard.writeText(raw).then(() => {
      setCopiedPaymentId(client.id);
      setTimeout(() => setCopiedPaymentId(null), 2000);
    });
  };

  const handleToggleSelectAll = () => {
    if (!onSelectAllVisible) return;
    const visibleIds = filteredVisibleClients.map(c => c.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedClientIds.includes(id));
    onSelectAllVisible(allSelected ? selectedClientIds.filter(id => !visibleIds.includes(id)) : [...new Set([...selectedClientIds, ...visibleIds])]);
  };

  const sortedGroupKeys = Object.keys(groupedClients).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white dark:bg-[#0f172a] p-5 border border-slate-200 dark:border-slate-800/60 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder={t.search} 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 h-11 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-slate-200" 
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-52 group">
            <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
            <input 
              type="date" 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)} 
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 h-11 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-slate-200" 
            />
          </div>
          <button 
            onClick={() => { setSearch(''); setDateFilter(''); }} 
            className="h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-all active:scale-95 border border-slate-200 dark:border-slate-800 flex items-center gap-2 font-medium text-sm"
            title={t.clearFilters}
          >
            <RefreshCcw className="w-4 h-4" />
            <span className="hidden sm:inline">{t.clearFilters || 'Clear'}</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {!isFetching && sortedGroupKeys.length > 0 ? (
          sortedGroupKeys.map(dateKey => (
            <div key={dateKey} className="space-y-4">
              <div className="flex items-center gap-4 px-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center border border-blue-100 dark:border-blue-800/50">
                    <CalendarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                    {formatDisplayDate(dateKey)}
                  </h3>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 rounded-full text-[11px] font-semibold border border-slate-200/60 dark:border-slate-700/50">
                    <Database className="w-3 h-3" />
                    {groupedClients[dateKey].length} {t.files}
                  </div>
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-slate-200 dark:from-slate-800 to-transparent" />
              </div>

              <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/60 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left rtl:text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800/60">
                        <th className="p-4 w-12 text-center">
                          <button 
                            onClick={handleToggleSelectAll} 
                            className="flex items-center justify-center w-5 h-5 rounded border border-slate-300 dark:border-slate-700 hover:border-blue-500 transition-colors"
                          >
                            {filteredVisibleClients.length > 0 && filteredVisibleClients.every(c => selectedClientIds.includes(c.id)) 
                              ? <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" /> 
                              : <div className="w-2.5 h-2.5 rounded-sm bg-transparent" />
                            }
                          </button>
                        </th>
                        <th className="p-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.photo}</th>
                        <th className="p-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.lastName} & {t.firstName}</th>
                        <th className="p-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.passportNumber}</th>
                        <th className="p-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.category}</th>
                        <th className="p-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.logistics}</th>
                        <th className="p-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.payment}</th>
                        <th className="p-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">{t.protocol}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {groupedClients[dateKey].map((client) => {
                        const isModified = isAdmin && client.isModified;
                        const styles = getCategoryStyles(client.category);
                        const isSelected = selectedClientIds.includes(client.id);
                        const regTime = new Date(client.createdAt);
                        const regTimeStr = regTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                        return (
                          <tr 
                            key={client.id} 
                            className={`group transition-all hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${
                              isSelected ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''
                            } ${isModified && !isSelected ? 'bg-red-50/20 dark:bg-red-950/10' : ''}`}
                          >
                            <td className="p-4 text-center">
                              <button 
                                onClick={() => onToggleClientSelect?.(client.id)} 
                                className={`flex items-center justify-center w-5 h-5 rounded border transition-all ${
                                  isSelected 
                                    ? 'border-blue-500 bg-blue-500 text-white' 
                                    : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3" />}
                              </button>
                            </td>
                            <td className="p-4">
                              <div className="w-10 h-12 rounded-lg bg-slate-100 dark:bg-slate-900 overflow-hidden flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-sm transition-transform group-hover:scale-105">
                                {client.photoUrl1 ? (
                                  <img src={client.photoUrl1} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-5 h-5 text-slate-300" />
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                                    {client.firstName} {client.lastName}
                                  </span>
                                  {isModified && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-[10px] font-bold rounded-full">
                                      <ShieldAlert className="w-3 h-3" /> {t.updated}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mt-1">
                                  <Clock className="w-3 h-3" /> {regTimeStr}
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-900/80 rounded-lg font-mono text-[11px] font-bold text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-800/50">
                                {client.passportNumber}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles.badge}`}>
                                {client.category}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                                  <Plane className="w-3.5 h-3.5 text-blue-500/70" /> 
                                  {client.previousVisaNumber || '---'}
                                </div>
                                <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                                  <CalendarIcon className="w-3 h-3" />
                                  {client.visaFrom || '---'} • {client.visaTo || '---'}
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                                  <CardIcon className="w-3.5 h-3.5 text-emerald-500/70" /> 
                                  {client.payment.cardMask || '---'}
                                </div>
                                <div className="text-[11px] text-slate-400 font-medium flex items-center gap-2">
                                  <span className="bg-slate-100 dark:bg-slate-900 px-1.5 rounded text-[9px] font-bold">EXP: {client.payment.expiryDate || '--'}</span>
                                  <span className="bg-slate-100 dark:bg-slate-900 px-1.5 rounded text-[9px] font-bold">CVV: {client.payment.cvv ? '***' : '--'}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                <button 
                                  onClick={() => onEdit(client)} 
                                  className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all" 
                                  title={t.edit}
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                
                                <button 
                                  onClick={() => handleCopyClientDetails(client)} 
                                  className={`p-2 rounded-lg transition-all ${
                                    copiedId === client.id 
                                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                                  }`}
                                  title={t.copy}
                                >
                                  {copiedId === client.id ? <Check className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                </button>
 
                                <button 
                                  onClick={() => handleCopyPaymentDetails(client)} 
                                  className={`p-2 rounded-lg transition-all ${
                                    copiedPaymentId === client.id 
                                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
                                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                                  }`}
                                  title={t.copyPayment}
                                >
                                  {copiedPaymentId === client.id ? <Check className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
                                </button>
                                
                                <button 
                                  onClick={() => onDelete(client.id)} 
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all" 
                                  title={t.delete}
                                >
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
          <div className="bg-white dark:bg-[#0f172a] py-20 flex flex-col items-center justify-center text-center border border-slate-200 dark:border-slate-800/60 rounded-2xl shadow-sm">
            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-full mb-6 border border-slate-100 dark:border-slate-800">
              <Database className="w-12 h-12 text-slate-200 dark:text-slate-700" />
            </div>
            <h4 className="text-base font-bold text-slate-700 dark:text-slate-200 mb-2">
              {t.noRecordsFound}
            </h4>
            <p className="text-sm text-slate-400 max-w-xs mx-auto">
              {clients.length === 0 ? t.emptyPool : t.filterNoMatch}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientTable;
