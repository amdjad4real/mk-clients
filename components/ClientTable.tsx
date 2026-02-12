
import React, { useState, useMemo } from 'react';
import { Search, RefreshCcw, Edit, Copy, Trash2, ChevronLeft, ChevronRight, User, Check, Clock, CreditCard, Calendar as CalendarIcon, X, Tag, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import { Client, Language } from '../types';
import { getDaysDiff, getWeekdayIndex } from '../utils/helpers';

interface ClientTableProps {
  clients: Client[];
  t: any;
  lang: Language;
  onEdit: (c: Client) => void;
  onDelete: (id: string) => void;
  onCopy: (c: Client) => void;
}

type SortOrder = 'asc' | 'desc' | null;

const ClientTable: React.FC<ClientTableProps> = ({ clients, t, lang, onEdit, onDelete, onCopy }) => {
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [categorySort, setCategorySort] = useState<SortOrder>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedPaymentId, setCopiedPaymentId] = useState<string | null>(null);
  const itemsPerPage = 20;

  const processedClients = useMemo(() => {
    let filtered = clients.filter(c => {
      const matchesSearch = `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        c.passportNumber.includes(search) ||
        (c.phoneNumber && c.phoneNumber.includes(search)) ||
        c.category.toLowerCase().includes(search.toLowerCase()) ||
        c.id.toLowerCase().includes(search.toLowerCase());

      const matchesDate = !dateFilter || (c.createdAt && c.createdAt.startsWith(dateFilter));

      return matchesSearch && matchesDate;
    });

    if (categorySort) {
      filtered.sort((a, b) => {
        if (categorySort === 'asc') return a.category.localeCompare(b.category);
        return b.category.localeCompare(a.category);
      });
    } else {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return filtered;
  }, [clients, search, dateFilter, categorySort]);

  const totalPages = Math.ceil(processedClients.length / itemsPerPage);
  const paginatedClients = processedClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '---';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : lang === 'fr' ? 'fr-FR' : 'en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const handleCopyAction = (client: Client) => {
    const details = [
      `${t.lastName}: ${client.lastName}`,
      `${t.firstName}: ${client.firstName}`,
      `${t.dob}: ${client.dob}`,
      `${t.passportNumber}: ${client.passportNumber}`,
      `${t.issueDate}: ${client.issueDate}`,
      `${t.expiryDate}: ${client.expiryDate}`,
      `${t.placeOfIssue}: ${client.placeOfIssue}`,
      `${t.category}: ${client.category}`,
      client.appointmentDate ? `${t.appointmentDate}: ${client.appointmentDate}` : '',
      client.previousVisaNumber ? `${t.prevVisa}: ${client.previousVisaNumber}` : '',
      client.visaFrom ? `${t.visaFrom}: ${client.visaFrom}` : '',
      client.visaTo ? `${t.visaTo}: ${client.visaTo}` : '',
      `\n[${t.paymentDetails}]`,
      `${t.cardNumber}: ${client.payment.cardNumber || client.payment.cardMask}`,
      `${t.cardHolder}: ${client.payment.cardHolderName}`,
      `${t.expiryDate}: ${client.payment.expiryDate}`,
      client.payment.cvv ? `${t.cvv}: ${client.payment.cvv}` : '',
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(details).then(() => {
      setCopiedId(client.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleCopyPaymentAction = (client: Client) => {
    const rawCard = client.payment.cardNumber || client.payment.cardMask || '';
    const cleanCard = rawCard.replace(/\s+/g, '');

    const details = [
      `${t.lastName}: ${client.lastName}`,
      `${t.firstName}: ${client.firstName}`,
      `${t.cardNumber}: ${cleanCard}`,
      `${t.cardHolder}: ${client.payment.cardHolderName}`,
      `${t.expiryDate}: ${client.payment.expiryDate}`,
      `${t.cvv}: ${client.payment.cvv || '***'}`,
    ].join('\n');

    navigator.clipboard.writeText(details).then(() => {
      setCopiedPaymentId(client.id);
      setTimeout(() => setCopiedPaymentId(null), 2000);
    });
  };

  const getStatusBadge = (dateStr: string) => {
    if (!dateStr) return <div className="text-slate-400">---</div>;
    
    const diff = getDaysDiff(dateStr);
    const weekdayIdx = getWeekdayIndex(dateStr);
    const dayName = t.days[weekdayIdx];

    let colorClasses = 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
    if (diff === 0) colorClasses = 'bg-red-500 text-white';
    else if (diff === 1) colorClasses = 'bg-orange-500 text-white';
    else if (diff > 1 && diff <= 2) colorClasses = 'bg-green-500 text-white';

    return (
      <div className="flex flex-col gap-1">
        <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase text-center ${colorClasses}`}>
          {dayName}
        </div>
        <div className="text-[10px] text-slate-500 font-bold tabular-nums">
          {dateStr}
        </div>
      </div>
    );
  };

  const toggleCategorySort = () => {
    setCategorySort(prev => {
      if (prev === null) return 'asc';
      if (prev === 'asc') return 'desc';
      return null;
    });
  };

  let lastDisplayedDate = '';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={t.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 rtl:pr-10 rtl:pl-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-medium"
            />
          </div>

          <div className="relative flex-1 md:max-w-[240px]">
            <CalendarIcon className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-10 pr-10 rtl:pr-10 rtl:pl-10 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-medium uppercase text-xs"
            />
            {dateFilter && (
              <button onClick={() => setDateFilter('')} className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                <X className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>

          <button 
            onClick={() => setDateFilter(new Date().toISOString().split('T')[0])}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${dateFilter === new Date().toISOString().split('T')[0] ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
          >
            <Tag className="w-3 h-3" />
            TODAY
          </button>
        </div>

        <button onClick={() => { setSearch(''); setDateFilter(''); setCategorySort(null); setCurrentPage(1); }} className="flex items-center justify-center space-x-2 rtl:space-x-reverse px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
          <RefreshCcw className="w-4 h-4" />
          <span className="text-xs font-black uppercase">{t.refresh}</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left rtl:text-right border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest border-b dark:border-slate-700">
              <th className="px-6 py-4">{t.photo}</th>
              <th className="px-6 py-4">{t.firstName} & {t.lastName}</th>
              <th className="px-6 py-4">{t.passportNumber}</th>
              <th className="px-6 py-4">
                <button 
                  onClick={toggleCategorySort}
                  className="flex items-center gap-1 hover:text-blue-600 transition-colors uppercase"
                >
                  {t.category}
                  {categorySort === 'asc' ? <ChevronUp className="w-3 h-3" /> : categorySort === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                </button>
              </th>
              <th className="px-6 py-4">{t.dayStatus}</th>
              <th className="px-6 py-4">{t.payment}</th>
              <th className="px-6 py-4 text-center">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {paginatedClients.length > 0 ? (
              paginatedClients.map((client) => {
                const currentDate = client.createdAt ? client.createdAt.split('T')[0] : '';
                const showDateHeader = !categorySort && currentDate !== lastDisplayedDate;
                const isOrn2 = client.category === 'ORN2';
                const isAlg2 = client.category === 'ALG2';
                
                if (showDateHeader) {
                  lastDisplayedDate = currentDate;
                }

                return (
                  <React.Fragment key={client.id}>
                    {showDateHeader && (
                      <tr className="bg-blue-50/50 dark:bg-blue-900/10">
                        <td colSpan={7} className="px-6 py-3 border-b border-blue-100 dark:border-blue-900/20">
                          <div className="flex items-center gap-3">
                            <CalendarIcon className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-black text-blue-700 dark:text-blue-400 uppercase tracking-tighter">
                              {formatDate(currentDate)}
                              {currentDate === new Date().toISOString().split('T')[0] && (
                                <span className="ml-2 px-1.5 py-0.5 bg-blue-600 text-white text-[9px] rounded-full shadow-lg shadow-blue-500/30">NEW</span>
                              )}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                    <tr className={`transition-colors group ${
                      isOrn2 
                        ? 'bg-amber-50/70 dark:bg-amber-900/20 hover:bg-amber-100/80 dark:hover:bg-amber-900/30 border-l-4 border-amber-500' 
                        : isAlg2
                        ? 'bg-emerald-50/70 dark:bg-emerald-900/20 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/30 border-l-4 border-emerald-500'
                        : 'hover:bg-slate-50/50 dark:hover:bg-slate-700/30'
                    }`}>
                      <td className="px-6 py-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden flex items-center justify-center border border-slate-200 dark:border-slate-600">
                          {client.photoUrl ? <img src={client.photoUrl} alt="" className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-slate-400" />}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-900 dark:text-white uppercase leading-tight">
                          {client.firstName} {client.lastName}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 font-bold uppercase">
                          DOB: {client.dob}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                        {client.passportNumber}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${
                          isOrn2 
                            ? 'bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100' 
                            : isAlg2
                            ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        }`}>
                          {client.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(client.appointmentDate)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase">{client.payment.cardMask || 'N/A'}</div>
                        <div className="text-[10px] text-slate-500 font-medium">{client.payment.expiryDate}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse opacity-40 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => onEdit(client)} title={t.edit} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleCopyAction(client)} title={t.copy} className={`p-1.5 rounded-lg ${copiedId === client.id ? 'text-green-500' : 'text-green-600 hover:bg-green-50'}`}>
                            {copiedId === client.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <button onClick={() => handleCopyPaymentAction(client)} title={t.copyPayment} className={`p-1.5 rounded-lg ${copiedPaymentId === client.id ? 'text-amber-500' : 'text-amber-600 hover:bg-amber-50'}`}>
                            {copiedPaymentId === client.id ? <Check className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                          </button>
                          <button onClick={() => onDelete(client.id)} title={t.delete} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })
            ) : (
              <tr><td colSpan={7} className="px-6 py-20 text-center text-slate-500 italic">No records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="p-4 md:p-6 border-t border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">
            {processedClients.length} entries total
          </p>
          <div className="flex space-x-1 rtl:space-x-reverse">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600'}`}>{i + 1}</button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientTable;
