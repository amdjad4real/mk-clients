
import React from 'react';
import { Clock, X, CheckCircle2, AlertCircle, User, ArrowRight } from 'lucide-react';
import { ActivityLog, Language } from '../types';

interface HistoryModalProps {
  logs: ActivityLog[];
  clientName: string;
  t: any;
  lang: Language;
  onClose: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ logs, clientName, t, lang, onClose }) => {
  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString(lang === 'ar' ? 'ar-EG' : lang === 'fr' ? 'fr-FR' : 'en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'Added': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'Modified': return <Clock className="w-5 h-5 text-blue-500" />;
      case 'Deleted': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const translateAction = (action: string) => {
    if (action === 'Added') return t.added;
    if (action === 'Modified') return t.modified;
    if (action === 'Deleted') return t.deleted;
    return action;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{t.activityLog}</h3>
              <p className="text-xs font-bold text-slate-500 uppercase">{clientName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Clock className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-bold uppercase tracking-widest text-xs">{t.noHistory}</p>
            </div>
          ) : (
            <div className="space-y-8 relative before:absolute before:inset-0 before:left-[19px] before:rtl:left-auto before:rtl:right-[19px] before:w-0.5 before:bg-slate-100 dark:before:bg-slate-700">
              {logs.map((log) => (
                <div key={log.id} className="relative pl-12 rtl:pl-0 rtl:pr-12 group">
                  <div className="absolute left-0 rtl:left-auto rtl:right-0 top-0 w-10 h-10 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 flex items-center justify-center z-10 transition-transform group-hover:scale-110">
                    {getActionIcon(log.action)}
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-900/30 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider">
                        {translateAction(log.action)}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                        {formatDateTime(log.created_at)}
                      </span>
                    </div>

                    {log.user_email && (
                      <div className="flex items-center gap-1.5 mb-3 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">
                        <User className="w-3 h-3" />
                        {log.user_email}
                      </div>
                    )}

                    {log.changes && Object.keys(log.changes).length > 0 && (
                      <div className="space-y-3 mt-3">
                        {/* Fix: Explicitly cast change details to fix unknown property errors for from/to */}
                        {Object.entries(log.changes).map(([field, diff]) => {
                          const { from, to } = diff as { from: any; to: any };
                          return (
                            <div key={field} className="text-xs">
                              <div className="font-black text-slate-500 dark:text-slate-400 uppercase text-[9px] tracking-widest mb-1">{field}</div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-1 rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold border border-red-100 dark:border-red-900/30 line-through decoration-red-400/50">
                                  {String(from)}
                                </span>
                                <ArrowRight className="w-3 h-3 text-slate-300 rtl:rotate-180" />
                                <span className="px-2 py-1 rounded bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-bold border border-green-100 dark:border-green-900/30">
                                  {String(to)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
