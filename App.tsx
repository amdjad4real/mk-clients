
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Language, Theme, Client, ClientFormData } from './types';
import { TRANSLATIONS } from './constants';
import Navbar from './components/Navbar';
import ClientForm from './components/ClientForm';
import ClientTable from './components/ClientTable';
import Auth from './components/Auth';
import { maskCard } from './utils/helpers';
import { supabase } from './lib/supabase';
import { Users, Plus, LayoutGrid, Filter, CheckCircle2, Trash2, ShieldAlert, UserCheck, Layers, CheckSquare, Square, RefreshCw, X, ShieldCheck, UserPlus, Database, User, Pencil } from 'lucide-react';

interface Agent {
  id: string;
  email: string;
}

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(() => {
    const stored = localStorage.getItem('lang');
    return (stored === 'en' || stored === 'fr' || stored === 'ar') ? stored as Language : 'en';
  });
  
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme');
    return (stored === 'light' || stored === 'dark') ? stored as Theme : 'light';
  });

  const [session, setSession] = useState<any>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isFetchingClients, setIsFetchingClients] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [copyingClient, setCopyingClient] = useState<Partial<ClientFormData> | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [isBulkMode, setIsBulkMode] = useState(false);

  const initialFetchDone = useRef(false);
  const isAdmin = useMemo(() => session?.user?.email === 'admin@mkservice.com', [session]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session && session.user?.email !== 'admin@mkservice.com') {
        setIsFormOpen(true);
      }
      setIsLoadingSession(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const mapFromDB = (dbItem: any): Client => ({
    id: dbItem.id,
    lastName: dbItem.last_name,
    firstName: dbItem.first_name,
    phoneNumber: dbItem.phone_number,
    dob: dbItem.dob,
    passportNumber: dbItem.passport_number,
    previousVisaNumber: dbItem.previous_visa_number,
    visaFrom: dbItem.visa_from,
    visaTo: dbItem.visa_to,
    category: dbItem.category,
    appointmentDate: dbItem.appointment_date,
    photoUrl1: dbItem.photo_url_1 || dbItem.photo_url,
    createdAt: dbItem.created_at,
    updatedAt: dbItem.updated_at || dbItem.created_at,
    isModified: !!dbItem.is_modified,
    user_id: dbItem.user_id,
    issueDate: dbItem.issue_date,
    expiryDate: dbItem.expiry_date,
    placeOfIssue: dbItem.place_of_issue,
    payment: dbItem.payment || { cardMask: 'N/A', expiryDate: '', cardHolderName: '', cardNumber: '', cvv: '' }
  });

  const fetchAgents = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const { data, error } = await supabase.from('profiles').select('id, email').order('email');
      if (!error && data) {
        setAgents(data);
      }
    } catch (err) {
      console.error('Failed to fetch agents:', err);
    }
  }, [isAdmin]);

  const fetchClients = useCallback(async (isManual = false) => {
    if (!session?.user) return;
    
    // If not a manual refresh and we already fetched once, skip to avoid "refreshing on tab leave"
    if (!isManual && initialFetchDone.current) return;

    setIsFetchingClients(true);
    try {
      let query = supabase.from('clients').select('*');
      if (!isAdmin) {
        query = query.eq('user_id', session.user.id);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setClients((data || []).map(mapFromDB));
      initialFetchDone.current = true;
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setIsFetchingClients(false);
    }
  }, [session, isAdmin]);

  useEffect(() => {
    if (session?.user) {
      fetchClients(false);
      if (isAdmin) fetchAgents();
    }
  }, [session, fetchClients, fetchAgents, isAdmin]);

  const agentMetrics = useMemo(() => {
    const counts: Record<string, number> = {};
    clients.forEach(c => {
      if (c.user_id) counts[c.user_id] = (counts[c.user_id] || 0) + 1;
    });
    return counts;
  }, [clients]);

  const filteredClients = useMemo(() => {
    if (!isAdmin || selectedUserIds.length === 0) return clients;
    return clients.filter(c => c.user_id && selectedUserIds.includes(c.user_id));
  }, [clients, selectedUserIds, isAdmin]);

  const handleLogout = async () => {
    initialFetchDone.current = false;
    await supabase.auth.signOut();
  };

  const handleRegisterClient = async (formData: ClientFormData) => {
    const t = TRANSLATIONS[lang];
    if (!session?.user) return;
    try {
      const payload = {
        user_id: session.user.id,
        last_name: formData.lastName.toUpperCase(),
        first_name: formData.firstName.toUpperCase(),
        phone_number: formData.phoneNumber,
        dob: formData.dob,
        passport_number: formData.passportNumber.toUpperCase(),
        issue_date: formData.issueDate,
        expiry_date: formData.expiryDate,
        place_of_issue: formData.placeOfIssue.toUpperCase(),
        previous_visa_number: formData.previousVisaNumber,
        visa_from: formData.visaFrom,
        visa_to: formData.visaTo,
        category: formData.category,
        appointment_date: formData.appointmentDate,
        photo_url_1: formData.photoUrl1,
        is_modified: false,
        payment: {
          cardMask: formData.payment.cardNumber ? maskCard(formData.payment.cardNumber) : 'N/A',
          expiryDate: formData.payment.expiryDate,
          cardHolderName: formData.payment.cardHolderName.toUpperCase(),
          cardNumber: formData.payment.cardNumber,
          cvv: formData.payment.cvv
        }
      };
      const { data, error } = await supabase.from('clients').insert([payload]).select();
      if (error) throw error;
      if (data && data.length > 0) {
        setClients(prev => [mapFromDB(data[0]), ...prev]);
      }
    } catch (err: any) {
      alert(`${t.registrationFailed}: ${err.message}`);
      throw err;
    }
  };

  const handleUpdateClient = async (id: string, formData: ClientFormData) => {
    const t = TRANSLATIONS[lang];
    if (!session?.user) return;
    try {
      const payload = {
        last_name: formData.lastName.toUpperCase(),
        first_name: formData.firstName.toUpperCase(),
        phone_number: formData.phoneNumber,
        dob: formData.dob,
        passport_number: formData.passportNumber.toUpperCase(),
        issue_date: formData.issueDate,
        expiry_date: formData.expiryDate,
        place_of_issue: formData.placeOfIssue.toUpperCase(),
        previous_visa_number: formData.previousVisaNumber,
        visa_from: formData.visaFrom,
        visa_to: formData.visaTo,
        category: formData.category,
        appointment_date: formData.appointmentDate,
        photo_url_1: formData.photoUrl1,
        is_modified: true, 
        updated_at: new Date().toISOString(),
        payment: {
          cardMask: formData.payment.cardNumber ? maskCard(formData.payment.cardNumber) : 'N/A',
          expiryDate: formData.payment.expiryDate,
          cardHolderName: formData.payment.cardHolderName.toUpperCase(),
          cardNumber: formData.payment.cardNumber,
          cvv: formData.payment.cvv
        }
      };
      const { data, error } = await supabase.from('clients').update(payload).eq('id', id).select();
      if (error) throw error;
      if (data && data.length > 0) {
        setClients(prev => prev.map(c => c.id === id ? mapFromDB(data[0]) : c));
      }
      setEditingClient(null);
    } catch (err: any) {
      alert(`${t.updateFailed}: ${err.message}`);
      throw err;
    }
  };

  const handleConfirmModification = async (id: string) => {
    try {
      const { data, error } = await supabase.from('clients').update({ is_modified: false }).eq('id', id).select();
      if (error) throw error;
      if (data && data.length > 0) {
        setClients(prev => prev.map(c => c.id === id ? mapFromDB(data[0]) : c));
      }
    } catch (err) {
      console.error('Failed to confirm modification review:', err);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!window.confirm(TRANSLATIONS[lang].confirmDelete)) return;
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
      setClients(prev => prev.filter(c => c.id !== id));
      setSelectedClientIds(prev => prev.filter(cid => cid !== id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedClientIds.length === 0) return;
    const count = selectedClientIds.length;
    if (!window.confirm(TRANSLATIONS[lang].confirmBulkDelete.replace('{count}', count.toString()))) return;
    try {
      const { error } = await supabase.from('clients').delete().in('id', selectedClientIds);
      if (error) throw error;
      setClients(prev => prev.filter(c => !selectedClientIds.includes(c.id)));
      setSelectedClientIds([]);
    } catch (err) {
      console.error('Batch deletion failed:', err);
      alert('Batch deletion failed. Please check your connection.');
    }
  };

  const toggleClientSelection = (id: string) => {
    setSelectedClientIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleAgentClick = (agentId: string) => {
    if (isBulkMode) {
      setSelectedUserIds(prev => prev.includes(agentId) ? prev.filter(id => id !== agentId) : [...prev, agentId]);
    } else {
      setSelectedUserIds(prev => (prev.length === 1 && prev[0] === agentId) ? [] : [agentId]);
    }
  };

  const t = TRANSLATIONS[lang];

  if (isLoadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) return <Auth lang={lang} t={t} theme={theme} setTheme={setTheme} setLang={setLang} />;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#0f172a] text-slate-900 dark:text-slate-200 font-sans">
      <Navbar 
        lang={lang} 
        setLang={setLang} 
        theme={theme} 
        setTheme={setTheme} 
        t={t} 
        onLogout={handleLogout}
        userEmail={session.user.email || ''}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        {/* Stats Section */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="premium-card p-6 flex items-center gap-5 group">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <Users className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white font-display tracking-tight leading-none">{clients.length}</p>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-2">{t.totalClients}</p>
            </div>
          </div>
          <div className="premium-card p-6 flex items-center gap-5 group">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/30 rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <ShieldCheck className="w-7 h-7 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white font-display tracking-tight leading-none">
                {clients.filter(c => c.isModified).length}
              </p>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-2">Modified</p>
            </div>
          </div>
          {isAdmin && (
            <div className="premium-card p-6 flex items-center gap-5 group">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <UserCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white font-display tracking-tight leading-none">{agents.length}</p>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-2">Active Agents</p>
              </div>
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Form Section */}
          <section className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
            <div className="premium-card overflow-hidden border-indigo-500/10 dark:border-indigo-500/20">
              <div className="bg-slate-50 dark:bg-slate-950 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-indigo-500" />
                  </div>
                  <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">{t.addNewClient}</h2>
                </div>
              </div>
              <div className="p-6">
                <ClientForm 
                  onSubmit={handleRegisterClient} 
                  t={t} 
                  lang={lang}
                  initialData={copyingClient || undefined}
                  onCancel={() => setCopyingClient(null)}
                />
              </div>
            </div>
          </section>

          {/* Table Section */}
          <section className="lg:col-span-8 space-y-8">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center border border-indigo-100 dark:border-indigo-800/50 shadow-sm">
                  <Filter className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest leading-none">{t.registeredClients}</h2>
                  <p className="text-[11px] text-slate-400 font-medium mt-1 uppercase tracking-wider">{clients.length} Total Records</p>
                </div>
              </div>
              <button 
                onClick={() => fetchClients(true)} 
                className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center"
              >
                <RefreshCw className={`w-4 h-4 ${isFetchingClients ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <ClientTable
              clients={filteredClients}
              onDelete={handleDeleteClient}
              onEdit={setEditingClient}
              onCopy={(c) => { setCopyingClient(c); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              onConfirmModification={handleConfirmModification}
              selectedClientIds={selectedClientIds}
              onToggleClientSelect={toggleClientSelection}
              onSelectAllVisible={(ids) => setSelectedClientIds(ids)}
              t={t}
              lang={lang}
              isAdmin={isAdmin}
              isFetching={isFetchingClients}
            />
          </section>
        </div>
      </main>

      {/* Bulk Action Bar */}
      {selectedClientIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4">
          <div className="bg-slate-900 dark:bg-slate-800 px-6 py-4 rounded-2xl shadow-2xl border border-slate-800 dark:border-slate-700 flex items-center justify-between gap-6 backdrop-blur-lg bg-opacity-95">
            <div className="flex items-center gap-5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow-lg shadow-blue-500/30">
                {selectedClientIds.length}
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-sm tracking-tight">{t.nodesSelected}</span>
                <button onClick={() => setSelectedClientIds([])} className="text-slate-400 hover:text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors mt-0.5">
                  <X className="w-3.5 h-3.5" /> {t.deselectAll}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleBulkDelete} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-red-500/20 active:scale-95">
                <Trash2 className="w-4 h-4" />
                {t.deleteSelected}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingClient && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" onClick={() => setEditingClient(null)} />
          <div className="relative bg-white dark:bg-[#0f172a] rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col animate-in fade-in zoom-in duration-300">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                  <Pencil className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">{t.editClient}</h3>
                  <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">ID: {editingClient.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingClient(null)} 
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <ClientForm 
                lang={lang} 
                t={t} 
                onSubmit={(data) => handleUpdateClient(editingClient.id, data)} 
                initialData={editingClient} 
                onCancel={() => setEditingClient(null)} 
                isEditing
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
