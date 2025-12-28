
import React, { useState, useEffect, useRef } from 'react';
import { Camera, CreditCard, User, ClipboardPaste, Calendar as CalendarIcon, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { ClientFormData, Language } from '../types';
import { CATEGORIES } from '../constants';
import { validateLuhn, formatCardNumber, formatExpiryDate, isExpired, isValidDate, normalizeToDashDate } from '../utils/helpers';

interface ClientFormProps {
  lang: Language;
  t: any;
  onSubmit: (data: ClientFormData) => Promise<void>;
  initialData?: Partial<ClientFormData>;
  onCancel?: () => void;
}

const CalendarPicker: React.FC<{ 
  onSelect: (date: string) => void; 
  onClose: () => void;
  lang: Language;
  t: any;
}> = ({ onSelect, onClose, lang, t }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
  
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  
  const monthNames = {
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    fr: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
    ar: ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
  };

  const weekDays = {
    en: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    fr: ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'],
    ar: ['أح', 'اث', 'ثل', 'أر', 'خم', 'جم', 'سب']
  };

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const startDay = firstDayOfMonth(year, month);
  const totalDays = daysInMonth(year, month);

  const days = [];
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
  }

  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push(
      <button
        key={d}
        type="button"
        onClick={() => {
          onSelect(dateStr);
          onClose();
        }}
        className="h-8 w-8 flex items-center justify-center text-sm font-bold rounded-lg hover:bg-blue-600 hover:text-white transition-colors text-slate-700 dark:text-slate-200"
      >
        {d}
      </button>
    );
  }

  return (
    <div className="absolute z-50 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-4 w-64 animate-in fade-in zoom-in duration-200 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
          <ChevronLeft className="w-4 h-4 text-slate-500" />
        </button>
        <span className="text-sm font-black text-slate-900 dark:text-white">
          {(monthNames as any)[lang][month]} {year}
        </span>
        <button type="button" onClick={handleNextMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {(weekDays as any)[lang].map((d: string) => (
          <div key={d} className="h-8 w-8 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase">
            {d}
          </div>
        ))}
        {days}
      </div>
    </div>
  );
};

const ClientForm: React.FC<ClientFormProps> = ({ lang, t, onSubmit, initialData, onCancel }) => {
  const [formData, setFormData] = useState<ClientFormData>({
    lastName: '',
    firstName: '',
    phoneNumber: '',
    dob: '',
    passportNumber: '',
    issueDate: '',
    expiryDate: '',
    placeOfIssue: '',
    previousVisaNumber: '',
    visaFrom: '',
    visaTo: '',
    category: '',
    appointmentDate: '',
    photoUrl: '',
    payment: {
      cardNumber: '',
      cardHolderName: '',
      expiryDate: '',
      cvv: ''
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ 
        ...prev, 
        ...initialData,
        payment: { ...prev.payment, ...(initialData.payment || {}) }
      }));
    }
  }, [initialData]);

  // Handle click outside calendar to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const lines = text.split('\n');
      const newFormData = { ...formData };

      lines.forEach(line => {
        const [key, ...rest] = line.split(':');
        if (!rest.length) return;
        const value = rest.join(':').replace('📋', '').trim();
        const keyLower = key.toLowerCase();

        if (keyLower.includes('name')) {
          const names = value.split(' ');
          if (names.length >= 2) {
            newFormData.lastName = names[0];
            newFormData.firstName = names.slice(1).join(' ');
          } else {
            newFormData.lastName = value;
          }
        } else if (keyLower.includes('dob')) {
          newFormData.dob = normalizeToDashDate(value);
        } else if (keyLower.includes('passport')) {
          newFormData.passportNumber = value.replace(/\D/g, '').substring(0, 9);
        } else if (keyLower.includes('issue')) {
          newFormData.issueDate = normalizeToDashDate(value);
        } else if (keyLower.includes('expiry')) {
          newFormData.expiryDate = normalizeToDashDate(value);
        } else if (keyLower.includes('place')) {
          newFormData.placeOfIssue = value;
        } else if (keyLower.includes('category')) {
          const cat = value.toUpperCase();
          if (CATEGORIES.includes(cat)) {
            newFormData.category = cat;
          }
        } else if (keyLower.includes('appointment date') || keyLower.includes('date de rendez-vous')) {
          newFormData.appointmentDate = normalizeToDashDate(value);
        } else if (keyLower.includes('previous visa')) {
          newFormData.previousVisaNumber = value;
        } else if (keyLower.includes('visa from')) {
          newFormData.visaFrom = normalizeToDashDate(value);
        } else if (keyLower.includes('visa to')) {
          newFormData.visaTo = normalizeToDashDate(value);
        }
      });

      setFormData(newFormData);
      setErrors({});
    } catch (err) {
      console.error('Failed to read clipboard', err);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const requiredDateFields = ['dob', 'issueDate', 'expiryDate'];
    
    if (!formData.lastName.trim()) newErrors.lastName = t.validation.required;
    if (!formData.firstName.trim()) newErrors.firstName = t.validation.required;
    
    requiredDateFields.forEach(field => {
      const val = (formData as any)[field];
      if (!val.trim()) {
        newErrors[field] = t.validation.required;
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) {
        newErrors[field] = 'Format: YYYY-MM-DD';
      } else if (!isValidDate(val)) {
        newErrors[field] = t.validation.invalidExpiry;
      }
    });

    if (formData.appointmentDate.trim()) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.appointmentDate)) {
            newErrors.appointmentDate = 'Format: YYYY-MM-DD';
        } else if (!isValidDate(formData.appointmentDate)) {
            newErrors.appointmentDate = t.validation.invalidExpiry;
        }
    }

    if (!formData.passportNumber.trim()) {
      newErrors.passportNumber = t.validation.required;
    } else if (!/^\d{9}$/.test(formData.passportNumber)) {
      newErrors.passportNumber = t.validation.passportLength;
    }

    if (!formData.placeOfIssue.trim()) newErrors.placeOfIssue = t.validation.required;
    if (!formData.category) newErrors.category = t.validation.required;
    
    if (formData.visaFrom && !/^\d{4}-\d{2}-\d{2}$/.test(formData.visaFrom)) newErrors.visaFrom = 'Format: YYYY-MM-DD';
    if (formData.visaTo && !/^\d{4}-\d{2}-\d{2}$/.test(formData.visaTo)) newErrors.visaTo = 'Format: YYYY-MM-DD';

    const p = formData.payment;
    const hasSomePaymentInfo = p.cardNumber || p.cardHolderName || p.expiryDate || p.cvv;
    if (hasSomePaymentInfo) {
      if (p.cardNumber && !validateLuhn(p.cardNumber)) newErrors.cardNumber = t.validation.invalidCard;
      if (p.expiryDate && isExpired(p.expiryDate)) newErrors.paymentExpiry = t.validation.cardExpired;
      if (p.cvv && !/^\d{3,4}$/.test(p.cvv)) newErrors.cvv = t.validation.cvvLength;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (validate()) {
      setIsSubmitting(true);
      try {
        await onSubmit(formData);
        handleClear();
      } catch (err) {
        console.error('Form submission failed:', err);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      const firstError = document.querySelector('.text-red-500');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleClear = () => {
    setFormData({
      lastName: '',
      firstName: '',
      phoneNumber: '',
      dob: '',
      passportNumber: '',
      issueDate: '',
      expiryDate: '',
      placeOfIssue: '',
      previousVisaNumber: '',
      visaFrom: '',
      visaTo: '',
      category: '',
      appointmentDate: '',
      photoUrl: '',
      payment: {
        cardNumber: '',
        cardHolderName: '',
        expiryDate: '',
        cvv: ''
      }
    });
    setErrors({});
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const renderInput = (
    label: string, 
    field: string, 
    type: string = 'text', 
    required = true, 
    placeholder = '',
    options?: string[]
  ) => {
    const error = errors[field];
    const isPayment = ['cardNumber', 'cardHolderName', 'paymentExpiry', 'cvv'].includes(field);
    const isDateField = ['dob', 'issueDate', 'expiryDate', 'visaFrom', 'visaTo', 'appointmentDate'].includes(field);
    
    const value = isPayment 
      ? (field === 'paymentExpiry' ? formData.payment.expiryDate : (formData.payment as any)[field])
      : (formData as any)[field];

    const inputClasses = `w-full px-4 py-2 rounded-lg border ${
      error ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300 dark:border-slate-600'
    } bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all`;

    return (
      <div className="space-y-1 relative">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center">
          {label} {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {options ? (
          <select
            value={value}
            disabled={isSubmitting}
            onChange={(e) => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
            className={inputClasses}
          >
            <option value="" disabled>{t.select}</option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        ) : (
          <div className="relative">
            <input
              type="text"
              value={value}
              disabled={isSubmitting}
              placeholder={isDateField ? 'YYYY-MM-DD' : placeholder}
              onChange={(e) => {
                const val = e.target.value;
                if (isPayment) {
                  let formatted = val;
                  if (field === 'cardNumber') formatted = formatCardNumber(val);
                  if (field === 'paymentExpiry') formatted = formatExpiryDate(val);
                  setFormData(prev => ({
                    ...prev,
                    payment: { ...prev.payment, [field === 'paymentExpiry' ? 'expiryDate' : field]: formatted }
                  }));
                } else {
                  setFormData(prev => ({ ...prev, [field]: val }));
                }
              }}
              className={`${inputClasses} ${field === 'appointmentDate' ? 'pr-10 rtl:pl-10' : ''}`}
            />
            {field === 'appointmentDate' && (
              <div ref={calendarRef}>
                <button
                  type="button"
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors"
                >
                  <CalendarIcon className="w-4 h-4" />
                </button>
                {showCalendar && (
                  <CalendarPicker 
                    lang={lang} 
                    t={t} 
                    onSelect={(d) => setFormData(prev => ({ ...prev, appointmentDate: d }))} 
                    onClose={() => setShowCalendar(false)} 
                  />
                )}
              </div>
            )}
          </div>
        )}
        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.addNewClient}</span>
        <button
          type="button"
          onClick={handlePaste}
          disabled={isSubmitting}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-black hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all border border-blue-100 dark:border-blue-800 disabled:opacity-50"
        >
          <ClipboardPaste className="w-3.5 h-3.5" />
          {t.paste}
        </button>
      </div>
      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
        <div className="space-y-6">
          <div className="flex items-center space-x-2 rtl:space-x-reverse border-b dark:border-slate-700 pb-2">
            <User className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold">{t.clientDetails}</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="lg:row-span-2 flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50">
              <div className="relative w-32 h-32 rounded-lg bg-slate-200 dark:bg-slate-800 overflow-hidden flex items-center justify-center mb-4">
                {formData.photoUrl ? (
                  <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-12 h-12 text-slate-400" />
                )}
                <input type="file" ref={photoInputRef} disabled={isSubmitting} onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
                    reader.readAsDataURL(file);
                  }
                }} accept="image/png, image/jpeg" className="hidden" />
              </div>
              <button 
                type="button" 
                disabled={isSubmitting}
                onClick={() => photoInputRef.current?.click()} 
                className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-2 disabled:opacity-50"
              >
                <Camera className="w-4 h-4" /> {t.photo}
              </button>
            </div>

            {renderInput(t.lastName, 'lastName')}
            {renderInput(t.firstName, 'firstName')}
            {renderInput(t.dob, 'dob', 'text', true, 'YYYY-MM-DD')}
            {renderInput(t.passportNumber, 'passportNumber', 'text', true, '123456789')}
            {renderInput(t.issueDate, 'issueDate', 'text', true, 'YYYY-MM-DD')}
            {renderInput(t.expiryDate, 'expiryDate', 'text', true, 'YYYY-MM-DD')}
            {renderInput(t.placeOfIssue, 'placeOfIssue')}
            {renderInput(t.category, 'category', 'select', true, '', CATEGORIES)}
            {renderInput(t.appointmentDate, 'appointmentDate', 'text', false, 'YYYY-MM-DD')}
            {renderInput(t.prevVisa, 'previousVisaNumber', 'text', false)}
            {renderInput(t.visaFrom, 'visaFrom', 'text', false, 'YYYY-MM-DD')}
            {renderInput(t.visaTo, 'visaTo', 'text', false, 'YYYY-MM-DD')}
            {renderInput(t.phoneNumber, 'phoneNumber', 'tel', false)}
          </div>
        </div>

        <div className="space-y-6 pt-4">
          <div className="flex items-center space-x-2 rtl:space-x-reverse border-b dark:border-slate-700 pb-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold">{t.paymentDetails}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {renderInput(t.cardNumber, 'cardNumber', 'text', false, '#### #### #### ####')}
            {renderInput(t.cardHolder, 'cardHolderName', 'text', false)}
            {renderInput(t.expiryDate, 'paymentExpiry', 'text', false, 'MM/YYYY')}
            {renderInput(t.cvv, 'cvv', 'text', false, '***')}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end space-y-3 sm:space-y-0 sm:space-x-4 rtl:space-x-reverse pt-6 border-t dark:border-slate-700">
          <button 
            type="button" 
            onClick={handleClear} 
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            {t.clear}
          </button>
          {onCancel && (
            <button 
              type="button" 
              onClick={onCancel} 
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-bold border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              {t.cancel}
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              initialData && initialData.firstName ? t.saveChanges : t.register
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientForm;
