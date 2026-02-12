
import React, { useState } from 'react';
import { Search, RefreshCcw, Edit, Copy, Trash2, ChevronLeft, ChevronRight, User, Check, Clock, CreditCard, Calendar as CalendarIcon, X, Tag } from 'lucide-react';
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

const ClientTable: React.FC<ClientTableProps> = ({ clients, t, lang, onEdit, onDelete, onCopy }) => {
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedPaymentId, setCopiedPaymentId] = useState<string | null>(null);
  const itemsPerPage = 10; 

  const filteredClients = clients.filter(c => {
    const matchesSearch = `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      c.passportNumber.includes(search) ||
      (c.phoneNumber && c.phoneNumber.includes(search)) ||
      c.category.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase());

    const matchesDate = !dateFilter || (c.createdAt && c.createdAt.startsWith(dateFilter));

    return matchesSearch && matchesDate;
  });

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = filteredClients.slice(
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

  const isNew = (createdAt: string) => {
    if (!createdAt) return false;
    const created = new Date(createdAt);
    const today = new Date();
    return created.toDateString() === today.toDateString();
  };

  const getStatusBadge = (dateStr: string) => {
    if (!dateStr) {
      return (
        <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-center bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500">
          ---
        </div>
      );
    }
    
    const diff = getDaysDiff(dateStr);
    const weekdayIdx = getWeekdayIndex(dateStr);
    const dayName = t.days[weekdayIdx];

    let colorClasses = 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
    
    if (diff === 0) {
      colorClasses = 'bg-red-500 text-white shadow-lg shadow-red-500/20';
    } else if (diff === 1) {
      colorClasses = 'bg-orange-500 text-white shadow-lg shadow-orange-500/20';
    } else if (diff > 1 && diff <= 2) {
      colorClasses = 'bg-green-500 text-white shadow-lg shadow-green-500/20';
    }

    return (
      <div className="flex flex-col gap-1.5 items-center sm:items-start">
        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-center transition-all ${colorClasses}`}>
          {dayName}
        </div>
        <div className="text-[10px] text-slate-600 dark:text-slate-400 font-bold flex items-center justify-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span className="tabular-nums">{dateStr}</span>
        </div>
      </div>
    );
  };

  const handleSetTodayFilter = () => {
    const today = new Date().toISOString().split('T')[0];
    setDateFilter(today);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          {/* Text Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={t.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 rtl:pr-10 rtl:pl-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium"
            />
          </div>

          {/* Date Filter */}
          <div className="relative flex-1 md:max-w-[240px]">
            <CalendarIcon className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-10 pr-10 rtl:pr-10 rtl:pl-10 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium uppercase text-xs"
            />
            {dateFilter && (
              <button 
                onClick={() => setDateFilter('')}
                className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>

          <button 
            onClick={handleSetTodayFilter}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${dateFilter === new Date().toISOString().split('T')[0] ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 border border-transparent'}`}
          >
            <Tag className="w-3 h-3" />
            TODAY
          </button>
        </div>

        <button onClick={() => { setSearch(''); setDateFilter(''); setCurrentPage(1); }} className="flex items-center justify-center space-x-2 rtl:space-x-reverse px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border border-slate-200 dark:border-slate-600">
          <RefreshCcw className="w-4 h-4" />
          <span className="text-xs font-black uppercase tracking-wider">{t.refresh}</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left rtl:text-right border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">
              <th className="px-6 py-4">{t.photo}</th>
              <th className="px-6 py-4">{t.firstName} & {t.lastName}</th>
              <th className="px-6 py-4">{t.passportNumber}</th>
              <th className="px-6 py-4">{t.registrationDate}</th>
              <th className="px-6 py-4">{t.category}</th>
              <th className="px-6 py-4">{t.dayStatus}</th>
              <th className="px-6 py-4">{t.payment}</th>
              <th className="px-6 py-4 text-center">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {paginatedClients.length > 0 ? (
              paginatedClients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden flex items-center justify-center border border-slate-200 dark:border-slate-600">
                        {client.photoUrl ? <img src={client.photoUrl} alt="" className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-slate-400" />}
                      </div>
                      {isNew(client.createdAt) && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-10">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full px-1.5 py-0.5 bg-blue-600 text-[8px] font-black text-white leading-none flex items-center justify-center shadow-lg">NEW</span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight uppercase">
                      {client.firstName} {client.lastName}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-bold uppercase tracking-tighter">
                      DOB: {client.dob}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                    {client.passportNumber}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-700 dark:text-slate-200 tabular-nums">
                        {formatDate(client.createdAt)}
                      </span>
                      {isNew(client.createdAt) && (
                        <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Added Today</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-md text-[10px] font-black bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 uppercase tracking-tight">
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
                      <button onClick={() => onEdit(client)} title={t.edit} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleCopyAction(client)} title={t.copy} className={`p-1.5 rounded-lg transition-colors ${copiedId === client.id ? 'text-green-500 bg-green-50 dark:bg-green-900/20' : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'}`}>
                        {copiedId === client.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button onClick={() => handleCopyPaymentAction(client)} title={t.copyPayment} className={`p-1.5 rounded-lg transition-colors ${copiedPaymentId === client.id ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'}`}>
                        {copiedPaymentId === client.id ? <Check className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                      </button>
                      <button onClick={() => onDelete(client.id)} title={t.delete} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={8} className="px-6 py-20 text-center text-slate-500 italic font-medium">No records found for the selected criteria.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="p-4 md:p-6 border-t border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredClients.length)} of {filteredClients.length} entries
          </p>
          <div className="flex space-x-1 rtl:space-x-reverse">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 disabled:opacity-50 transition-colors border border-slate-200 dark:border-slate-600"><ChevronLeft className="w-4 h-4 text-slate-500 dark:text-slate-400" /></button>
            {[...Array(totalPages)].map((_, i) => (
              <button 
                key={i} 
                onClick={() => setCurrentPage(i + 1)} 
                className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 border-blue-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'}`}
              >
                {i + 1}
              </button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 disabled:opacity-50 transition-colors border border-slate-200 dark:border-slate-600"><ChevronRight className="w-4 h-4 text-slate-500 dark:text-slate-400" /></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientTable;
