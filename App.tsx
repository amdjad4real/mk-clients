import React, { useState, useEffect } from 'react';
import { Language, Theme, Client, ClientFormData } from './types.ts';
import { TRANSLATIONS } from './constants.tsx';
import Navbar from './components/Navbar.tsx';
import ClientForm from './components/ClientForm.tsx';
import ClientTable from './components/ClientTable.tsx';
import Auth from './components/Auth.tsx';
import { maskCard } from './utils/helpers.ts';
import { supabase } from './lib/supabase.ts';

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
  const [isFetchingClients, setIsFetchingClients] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [copyingClient, setCopyingClient] = useState<Partial<ClientFormData> | null>(null);

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

  const mapToDB = (data: ClientFormData, userId: string) => ({
    user_id: userId,
    last_name: (data.lastName || '').trim().toUpperCase(),
    first_name: (data.firstName || '').trim().toUpperCase(),
    phone_number: data.phoneNumber,
    dob: data.dob,
    passport_number: data.passportNumber,
    issue_date: data.issueDate,
    expiry_date: data.expiryDate,
    place_of_issue: (data.placeOfIssue || '').trim().toUpperCase(),
    previous_visa_number: data.previousVisaNumber,
    visa_from: data.visaFrom,
    visa_to: data.visaTo,
    category: data.category,
    appointment_date: data.appointmentDate,
    photo_url: data.photoUrl,
    payment: {
      cardMask: data.payment.cardNumber ? maskCard(data.payment.cardNumber) : 'N/A',
      expiryDate: data.payment.expiryDate || 'N/A',
      cardHolderName: (data.payment.cardHolderName || 'N/A').toUpperCase(),
      cardNumber: data.payment.cardNumber, 
      cvv: data.payment.cvv
    }
  });

  const mapFromDB = (dbItem: any): Client => ({
    id: dbItem.id,
    lastName: (dbItem.last_name || dbItem.lastName || '').trim().toUpperCase(),
    firstName: (dbItem.first_name || dbItem.firstName || '').trim().toUpperCase(),
    phoneNumber: dbItem.phone_number || dbItem.phoneNumber,
    dob: dbItem.dob,
    passportNumber: dbItem.passport_number || dbItem.passportNumber,
    issueDate: dbItem.issue_date || dbItem.issueDate,
    expiryDate: dbItem.expiry_date || dbItem.expiryDate,
    placeOfIssue: (dbItem.place_of_issue || dbItem.placeOfIssue || '').trim().toUpperCase(),
    previousVisaNumber: dbItem.previous_visa_number || dbItem.previousVisaNumber,
    visaFrom: dbItem.visa_from || dbItem.visaFrom,
    visaTo: dbItem.visa_to || dbItem.visaTo,
    category: dbItem.category,
    appointmentDate: dbItem.appointment_date || dbItem.appointmentDate,
    photoUrl: dbItem.photo_url || dbItem.photoUrl,
    payment: {
      ...dbItem.payment,
      cardHolderName: (dbItem.payment?.cardHolderName || '').toUpperCase()
    }
  });

  const fetchClients = async () => {
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
  };

  useEffect(() => {
    if (session?.user) {
      fetchClients();
    }
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleRegisterClient = async (formData: ClientFormData) => {
    if (!session?.user) return;
    try {
      const payload = mapToDB(formData, session.user.id);
      const { data, error } = await supabase
        .from('clients')
        .insert([payload])
        .select();

      if (error) throw error;
      if (data && data.length > 0) {
        setClients(prev => [mapFromDB(data[0]), ...prev]);
        setCopyingClient(null);
      }
    } catch (err: any) {
      console.error('Registration failed:', err);
      alert('Registration failed: ' + err.message);
      throw err;
    }
  };

  const handleUpdateClient = async (id: string, formData: ClientFormData) => {
    if (!session?.user) return;
    try {
      const payload = mapToDB(formData, session.user.id);
      const { data, error } = await supabase
        .from('clients')
        .update(payload)
        .eq('id', id)
        .select();

      if (error) throw error;
      
      if (data && data.length > 0) {
        const updatedClient = mapFromDB(data[0]);
        setClients(prev => prev.map(c => c.id === id ? updatedClient : c));
      }
      setEditingClient(null);
    } catch (err: any) {
      console.error('Update failed:', err);
      alert('Update failed: ' + err.message);
      throw err;
    }
  };

  const handleDeleteClient = async (id: string) => {
    const t = TRANSLATIONS[lang];
    if (!window.confirm(t.confirmDelete)) return;
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
      setClients(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
  };

  const handleCopyClient = (client: Client) => {
    const copiedData: Partial<ClientFormData> = {
      lastName: client.lastName.toUpperCase(),
      firstName: client.firstName.toUpperCase(),
      phoneNumber: client.phoneNumber,
      dob: client.dob,
      placeOfIssue: client.placeOfIssue.toUpperCase(),
      category: client.category,
      appointmentDate: client.appointmentDate,
      photoUrl: client.photoUrl,
      payment: { cardNumber: '', cardHolderName: '', expiryDate: '', cvv: '' }
    };
    setCopyingClient(copiedData);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const t = TRANSLATIONS[lang];

  if (isLoadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold animate-pulse">Initializing Portal...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth lang={lang} t={t} theme={theme} setTheme={setTheme} setLang={setLang} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 pb-12 transition-colors duration-200">
      <Navbar lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t} onLogout={handleLogout} userEmail={session.user.email || ''} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        <section>
          <div className="flex items-center space-x-2 rtl:space-x-reverse mb-6">
            <h2 className="text-2xl font-bold">{t.addNewClient}</h2>
          </div>
          <ClientForm key={copyingClient ? 'copy-active' : 'new-form'} lang={lang} t={t} onSubmit={handleRegisterClient} initialData={copyingClient || undefined} />
        </section>
        <section>
          <div className="flex items-center space-x-2 rtl:space-x-reverse mb-6">
            <h2 className="text-2xl font-bold">{t.registeredClients}</h2>
            {isFetchingClients && <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>}
          </div>
          <ClientTable clients={clients} t={t} lang={lang} onEdit={handleEditClient} onDelete={handleDeleteClient} onCopy={handleCopyClient} />
        </section>
      </main>
      {editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-xl font-bold">{t.edit} - {editingClient.firstName} {editingClient.lastName}</h3>
              <button onClick={() => setEditingClient(null)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-black text-2xl">✕</button>
            </div>
            <div className="p-6">
              <ClientForm lang={lang} t={t} onSubmit={(data) => handleUpdateClient(editingClient.id, data)} initialData={editingClient} onCancel={() => setEditingClient(null)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;