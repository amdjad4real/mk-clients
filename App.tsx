
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Language, Theme, Client, ClientFormData } from './types.ts';
import { TRANSLATIONS } from './constants.tsx';
import Navbar from './components/Navbar.tsx';
import ClientForm from './components/ClientForm.tsx';
import ClientTable from './components/ClientTable.tsx';
import Auth from './components/Auth.tsx';
import { maskCard } from './utils/helpers.ts';
import { supabase } from './lib/supabase.ts';
import { Users, Plus, LayoutGrid, Filter, CheckCircle2, Trash2, ShieldAlert, UserCheck, Layers, CheckSquare, Square, RefreshCw } from 'lucide-react';

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
  const [isBulkMode, setIsBulkMode] = useState(false);

  const isAdmin = useMemo(() => session?.user?.email === 'admin@mkservice.com', [session]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
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
    issueDate: dbItem.issue_date,
    expiryDate: dbItem.expiry_date,
    placeOfIssue: dbItem.place_of_issue,
    previousVisaNumber: dbItem.previous_visa_number,
    visaFrom: dbItem.visa_from,
    visaTo: dbItem.visa_to,
    category: dbItem.category,
    appointmentDate: dbItem.appointment_date,
    photoUrl: dbItem.photo_url,
    createdAt: dbItem.created_at,
    updatedAt: dbItem.updated_at || dbItem.created_at,
    user_id: dbItem.user_id,
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

  const fetchClients = useCallback(async () => {
    if (!session?.user) return;
    setIsFetchingClients(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setClients((data || []).map(mapFromDB));
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setIsFetchingClients(false);
    }
  }, [session]);

  useEffect(() => {
    if (session?.user) {
      fetchClients();
      if (isAdmin) fetchAgents();
    }
  }, [session, fetchClients, fetchAgents, isAdmin]);

  const agentMetrics = useMemo(() => {
    const counts: Record<string, number> = {};
    clients.forEach(c => {
      if (c.user_id) {
        counts[c.user_id] = (counts[c.user_id] || 0) + 1;
      }
    });
    return counts;
  }, [clients]);

  const filteredClients = useMemo(() => {
    if (!isAdmin || selectedUserIds.length === 0) return clients;
    return clients.filter(c => c.user_id && selectedUserIds.includes(c.user_id));
  }, [clients, selectedUserIds, isAdmin]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleAgentClick = (agentId: string) => {
    if (isBulkMode) {
      setSelectedUserIds(prev => 
        prev.includes(agentId) 
          ? prev.filter(id => id !== agentId) 
          : [...prev, agentId]
      );
    } else {
      if (selectedUserIds.length === 1 && selectedUserIds[0] === agentId) {
        setSelectedUserIds([]);
      } else {
        setSelectedUserIds([agentId]);
      }
    }
  };

  const handleToggleAllAgents = () => {
    if (selectedUserIds.length === agents.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(agents.map(a => a.id));
    }
  };

  const handleRegisterClient = async (formData: ClientFormData) => {
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
        photo_url: formData.photoUrl,
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
        setIsFormOpen(false);
      }
    } catch (err: any) {
      alert('Registration failed: ' + err.message);
      throw err;
    }
  };

  const handleUpdateClient = async (id: string, formData: ClientFormData) => {
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
        photo_url: formData.photoUrl,
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
        const updated = { ...mapFromDB(data[0]), isEdited: true };
        setClients(prev => [updated, ...prev.filter(c => c.id !== id)]);
      }
      setEditingClient(null);
    } catch (err: any) {
      alert('Update failed: ' + err.message);
      throw err;
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!window.confirm(TRANSLATIONS[lang].confirmDelete)) return;
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
      setClients(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleDeleteAgentData = async (userId: string, email: string) => {
    if (!window.confirm(`DANGER: Delete all records for agent "${email}"? This cannot be undone.`)) return;
    try {
      const { error } = await supabase.from('clients').delete().eq('user_id', userId);
      if (error) throw error;
      setClients(prev => prev.filter(c => c.user_id !== userId));
      setSelectedUserIds(prev => prev.filter(id => id !== userId));
    } catch (err) {
      console.error('Failed to remove agent data:', err);
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

  if (!session) {
    return <Auth lang={lang} t={t} theme={theme} setTheme={setTheme} setLang={setLang} />;
  }

  return (
    <div className={`min-h-screen ${isAdmin ? 'bg-slate-100 dark:bg-[#0a0f1c]' : 'bg-slate-50 dark:bg-slate-900'} text-slate-900 dark:text-slate-100 pb-12 transition-colors duration-200`}>
      <Navbar lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t} onLogout={handleLogout} userEmail={session.user.email || ''} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {/* Admin Section: Active Agents Network */}
        {isAdmin && (
          <section className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-2xl border border-blue-100 dark:border-blue-900/20 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 relative z-10 gap-4">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-indigo-600 text-white rounded-[24px] shadow-xl shadow-indigo-500/30 ring-4 ring-indigo-500/10">
                  <Users className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-black uppercase tracking-tighter text-slate-900 dark:text-white text-2xl">Active Agents Network</h3>
                  <div className="flex items-center gap-3 mt-1.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5" /> {agents.length} Nodes Synchronized
                    </p>
                    <button 
                      onClick={fetchClients} 
                      className="flex items-center gap-1 text-[9px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                    >
                      <RefreshCw className={`w-3 h-3 ${isFetchingClients ? 'animate-spin' : ''}`} /> Force Sync
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
                 {isBulkMode && (
                   <button 
                    onClick={handleToggleAllAgents}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900"
                   >
                     {selectedUserIds.length === agents.length ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                     {selectedUserIds.length === agents.length ? 'Deselect All' : 'Select All'}
                   </button>
                 )}
                 <button 
                  onClick={() => { setIsBulkMode(!isBulkMode); if(isBulkMode) setSelectedUserIds(prev => prev.slice(0,1)); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                    isBulkMode 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                      : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                 >
                   <Layers className="w-3.5 h-3.5" />
                   Bulk Select {isBulkMode ? 'ON' : 'OFF'}
                 </button>
              </div>
            </div>
            
            <div className="flex items-center gap-5 overflow-x-auto pb-6 scrollbar-hide no-scrollbar relative z-10 px-2">
              <button
                onClick={() => setSelectedUserIds([])}
                className={`flex-shrink-0 px-10 py-5 rounded-3xl font-black text-xs uppercase transition-all flex items-center gap-4 border-4 ${
                  selectedUserIds.length === 0
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_20px_40px_rgba(79,70,229,0.3)] scale-105' 
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-500 border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="p-2 bg-white/10 rounded-xl">
                  <LayoutGrid className="w-6 h-6" />
                </div>
                <div className="flex flex-col items-start leading-none">
                  <span>Global Pool</span>
                  <span className={`text-[8px] mt-1 opacity-60`}>All Registered Data</span>
                </div>
                <span className={`px-2 py-1 rounded-lg text-[10px] ${selectedUserIds.length === 0 ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'}`}>
                  {clients.length}
                </span>
              </button>
              
              {agents.map((agent) => {
                const isSelected = selectedUserIds.includes(agent.id);
                const count = agentMetrics[agent.id] || 0;
                return (
                  <div key={agent.id} className="relative group flex-shrink-0">
                    <button
                      onClick={() => handleAgentClick(agent.id)}
                      className={`px-10 py-5 rounded-3xl font-black text-xs uppercase transition-all flex items-center gap-4 border-4 ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-400 shadow-[0_20px_40px_rgba(37,99,235,0.3)] scale-105' 
                          : 'bg-slate-50 dark:bg-slate-900 text-slate-500 border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full border-2 border-white/20 ${isSelected ? 'bg-white animate-pulse' : count > 0 ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                      <div className="flex flex-col items-start leading-none">
                        <span>{agent.email.split('@')[0]}</span>
                        <span className={`text-[8px] mt-1 opacity-60 ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                          {agent.email.split('@')[1]}
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-[10px] ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'}`}>
                        {count}
                      </span>
                      {isSelected && <CheckCircle2 className="w-5 h-5 ml-1" />}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteAgentData(agent.id, agent.email); }}
                      className="absolute -top-3 -right-3 p-3 bg-red-600 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-all shadow-2xl hover:scale-110 active:scale-90 z-20"
                      title="Wipe Agent Data"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Client Registration Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-6 rounded-[32px] shadow-xl border border-slate-200 dark:border-slate-700">
             <div className="flex items-center gap-5">
               <div className={`p-4 rounded-[22px] transition-all ${isAdmin ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 shadow-lg' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 shadow-lg'}`}>
                 <Plus className="w-8 h-8" />
               </div>
               <div>
                 <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white leading-none">{t.addNewClient}</h2>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2.5">Data Entry Node Protocol</p>
               </div>
             </div>
             <button 
               onClick={() => setIsFormOpen(!isFormOpen)}
               className={`px-12 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center gap-3 border-b-4 active:border-b-0 active:translate-y-1 ${
                 isFormOpen 
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600' 
                  : 'bg-indigo-600 text-white border-indigo-800 hover:bg-indigo-700 shadow-2xl shadow-indigo-500/30'
               }`}
             >
               {isFormOpen ? 'Deactivate Terminal' : 'Activate Terminal'}
             </button>
          </div>
          
          {isFormOpen && (
            <div className="animate-in slide-in-from-top-6 fade-in duration-500 ease-out">
              <ClientForm 
                key={copyingClient ? 'copy' : 'new'} 
                lang={lang} 
                t={t} 
                onSubmit={handleRegisterClient} 
                initialData={copyingClient || undefined} 
                onCancel={() => { setIsFormOpen(false); setCopyingClient(null); }}
              />
            </div>
          )}
        </section>

        {/* Client Database Table */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 px-3">
            <div className="flex items-center gap-5">
              <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">{t.registeredClients}</h2>
              {isFetchingClients && <div className="w-7 h-7 border-[5px] border-indigo-600 border-t-transparent rounded-full animate-spin"></div>}
            </div>
            {isAdmin && selectedUserIds.length > 0 && (
              <div className="flex items-center gap-4 bg-indigo-600 text-white px-8 py-3 rounded-2xl text-[11px] font-black uppercase shadow-[0_15px_30px_rgba(79,70,229,0.3)] border border-indigo-400 animate-in slide-in-from-right duration-500">
                <Filter className="w-5 h-5" />
                Aggregated View: {selectedUserIds.length} Nodes Selected
              </div>
            )}
          </div>
          <ClientTable 
            clients={filteredClients} 
            t={t} 
            lang={lang} 
            onEdit={setEditingClient} 
            onDelete={handleDeleteClient} 
            onCopy={(c) => { setCopyingClient(c); setIsFormOpen(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            isFetching={isFetchingClients}
          />
        </section>
      </main>

      {/* Edit Overlay */}
      {editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/98 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="bg-white dark:bg-slate-800 rounded-[64px] shadow-[0_40px_150px_rgba(0,0,0,0.8)] w-full max-w-6xl max-h-[94vh] overflow-hidden border border-white/20">
            <div className="p-12 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/40">
              <div className="flex items-center gap-6">
                <div className="p-5 bg-indigo-600/10 dark:bg-indigo-400/10 rounded-[32px]">
                  <ShieldAlert className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">Secure Edit Engine</h3>
                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">File Access Granted: {editingClient.passportNumber}</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingClient(null)} 
                className="w-16 h-16 rounded-[28px] bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:rotate-180 transition-all duration-700 font-black text-2xl hover:bg-red-500 hover:text-white shadow-lg"
              >✕</button>
            </div>
            <div className="p-12 overflow-y-auto max-h-[calc(94vh-180px)] custom-scrollbar">
              <ClientForm lang={lang} t={t} onSubmit={(data) => handleUpdateClient(editingClient.id, data)} initialData={editingClient} onCancel={() => setEditingClient(null)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
