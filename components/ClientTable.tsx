
import React, { useState } from 'react';
import { Search, RefreshCcw, Edit, Copy, Trash2, ChevronLeft, ChevronRight, User, Check, Calendar, Clock } from 'lucide-react';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const itemsPerPage = 5;

  const filteredClients = clients.filter(c => 
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    c.passportNumber.includes(search) ||
    c.phoneNumber.includes(search) ||
    c.category.toLowerCase().includes(search.toLowerCase()) ||
    c.id.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
      `${t.appointmentDate}: ${client.appointmentDate}`,
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

  const getStatusBadge = (dateStr: string) => {
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

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={t.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 rtl:pr-10 rtl:pl-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>
        <button onClick={() => setCurrentPage(1)} className="flex items-center justify-center space-x-2 rtl:space-x-reverse px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
          <RefreshCcw className="w-4 h-4" />
          <span className="text-sm font-bold">{t.refresh}</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left rtl:text-right border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
              <th className="px-6 py-4">{t.photo}</th>
              <th className="px-6 py-4">{t.id}</th>
              <th className="px-6 py-4">{t.firstName} & {t.lastName}</th>
              <th className="px-6 py-4">{t.passportNumber}</th>
              <th className="px-6 py-4">{t.category}</th>
              <th className="px-6 py-4">{t.dayStatus}</th>
              <th className="px-6 py-4">{t.payment}</th>
              <th className="px-6 py-4 text-center">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {paginatedClients.length > 0 ? (
              paginatedClients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden flex items-center justify-center border border-slate-200 dark:border-slate-600">
                      {client.photoUrl ? <img src={client.photoUrl} alt="" className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-slate-400" />}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-blue-600 dark:text-blue-400">{client.id}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold">{client.firstName} {client.lastName}</div>
                    <div className="text-xs text-slate-500">{client.dob}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{client.passportNumber}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-md text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      {client.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(client.appointmentDate)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{client.payment.cardMask || 'N/A'}</div>
                    <div className="text-[10px] text-slate-500 font-medium">{client.payment.expiryDate}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                      <button onClick={() => onEdit(client)} title={t.edit} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleCopyAction(client)} title={t.copy} className={`p-1.5 rounded-lg transition-colors ${copiedId === client.id ? 'text-green-500 bg-green-50 dark:bg-green-900/20' : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'}`}>
                        {copiedId === client.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button onClick={() => onDelete(client.id)} title={t.delete} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-500 italic">No clients found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="p-4 md:p-6 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <p className="text-sm text-slate-500 font-medium">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredClients.length)} of {filteredClients.length} entries</p>
          <div className="flex space-x-1 rtl:space-x-reverse">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 disabled:opacity-50 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>{i + 1}</button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 disabled:opacity-50 transition-colors"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientTable;
