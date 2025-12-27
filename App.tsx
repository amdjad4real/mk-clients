
import React, { useState, useEffect } from 'react';
import { Language, Theme, Client, ClientFormData } from './types';
import { TRANSLATIONS } from './constants';
import Navbar from './components/Navbar';
import ClientForm from './components/ClientForm';
import ClientTable from './components/ClientTable';
import Auth from './components/Auth';
import { maskCard } from './utils/helpers';
import { supabase } from './lib/supabase';

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
    if (session?.user) {
      fetchClients();
    } else {
      setClients([]);
    }
  }, [session]);

  const fetchClients = async () => {
    setIsFetchingClients(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setIsFetchingClients(false);
    }
  };

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

  const t = TRANSLATIONS[lang];

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleRegisterClient = async (formData: ClientFormData) => {
    if (!session?.user) {
      alert('Session expired. Please log in again.');
      return;
    }

    try {
      // Prepare the data record for Supabase
      // We explicitly structure it to match our JSONB 'payment' column and the Omit<Client, 'id' | 'payment'> logic
      const { payment: rawPayment, ...restOfData } = formData;
      
      const paymentRecord = {
        cardMask: rawPayment.cardNumber ? maskCard(rawPayment.cardNumber) : 'N/A',
        expiryDate: rawPayment.expiryDate || 'N/A',
        cardHolderName: rawPayment.cardHolderName || 'N/A',
        cardNumber: rawPayment.cardNumber, // Store raw for copying feature
        cvv: rawPayment.cvv // Store raw for copying feature
      };

      const insertPayload = {
        ...restOfData,
        user_id: session.user.id,
        payment: paymentRecord
      };

      const { data: inserted, error } = await supabase
        .from('clients')
        .insert([insertPayload])
        .select();

      if (error) {
        console.error('Supabase registration error:', error);
        throw new Error(error.message);
      }
      
      if (inserted && inserted.length > 0) {
        setClients(prev => [inserted[0], ...prev]);
        setCopyingClient(null);
      } else {
        throw new Error('Registration failed: No data returned from server.');
      }
    } catch (err: any) {
      console.error('Registration failed:', err);
      alert(err.message || 'Failed to register client. Please check your internet and database settings.');
      throw err;
    }
  };

  const handleUpdateClient = async (id: string, formData: ClientFormData) => {
    try {
      const { payment: rawPayment, ...restOfData } = formData;
      
      const paymentRecord = {
        cardMask: rawPayment.cardNumber ? maskCard(rawPayment.cardNumber) : 'N/A',
        expiryDate: rawPayment.expiryDate || 'N/A',
        cardHolderName: rawPayment.cardHolderName || 'N/A',
        cardNumber: rawPayment.cardNumber,
        cvv: rawPayment.cvv
      };

      const { error } = await supabase
        .from('clients')
        .update({ ...restOfData, payment: paymentRecord })
        .eq('id', id);

      if (error) throw error;
      
      setClients(prev => prev.map(c => c.id === id ? { ...c, ...restOfData, payment: paymentRecord } : c));
      setEditingClient(null);
    } catch (err: any) {
      console.error('Update failed:', err);
      alert(err.message || 'Failed to update client');
      throw err;
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!window.confirm(t.confirmDelete)) return;
    
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setClients(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete client');
    }
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
  };

  const handleCopyClient = (client: Client) => {
    const copiedData: Partial<ClientFormData> = {
      lastName: client.lastName,
      firstName: client.firstName,
      phoneNumber: client.phoneNumber,
      dob: client.dob,
      placeOfIssue: client.placeOfIssue,
      category: client.category,
      appointmentDate: client.appointmentDate,
      photoUrl: client.photoUrl,
      passportNumber: '',
      visaFrom: '',
      visaTo: '',
      previousVisaNumber: '',
      payment: {
        cardNumber: '',
        cardHolderName: '',
        expiryDate: '',
        cvv: ''
      }
    };
    
    setCopyingClient(copiedData);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
    return (
      <Auth 
        lang={lang} 
        t={t} 
        theme={theme} 
        setTheme={setTheme} 
        setLang={setLang}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 pb-12 transition-colors duration-200">
      <Navbar 
        lang={lang} 
        setLang={setLang} 
        theme={theme} 
        setTheme={setTheme} 
        t={t} 
        onLogout={handleLogout}
        userEmail={session.user.email || ''}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        <section>
          <div className="flex items-center space-x-2 rtl:space-x-reverse mb-6">
            <h2 className="text-2xl font-bold">{t.addNewClient}</h2>
          </div>
          <ClientForm 
            key={copyingClient ? 'copy-active' : 'new-form'}
            lang={lang} 
            t={t} 
            onSubmit={handleRegisterClient}
            initialData={copyingClient || undefined}
          />
        </section>

        <section>
          <div className="flex items-center space-x-2 rtl:space-x-reverse mb-6">
            <h2 className="text-2xl font-bold">{t.registeredClients}</h2>
            {isFetchingClients && <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>}
          </div>
          <ClientTable 
            clients={clients} 
            t={t} 
            lang={lang}
            onEdit={handleEditClient}
            onDelete={handleDeleteClient}
            onCopy={handleCopyClient}
          />
        </section>
      </main>

      {editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-xl font-bold">{t.edit} - {editingClient.id}</h3>
              <button 
                onClick={() => setEditingClient(null)}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <ClientForm 
                lang={lang} 
                t={t} 
                onSubmit={(data) => handleUpdateClient(editingClient.id, data)}
                initialData={editingClient as any}
                onCancel={() => setEditingClient(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
