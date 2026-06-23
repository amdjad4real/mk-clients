
import React, { useState, useEffect, useRef } from 'react';
import { Camera, CreditCard, User, ClipboardPaste, Calendar as CalendarIcon, Loader2, ChevronLeft, ChevronRight, X, Trash2, CheckCircle2, Upload } from 'lucide-react';
import { ClientFormData, Language } from '../types';
import { CATEGORIES } from '../constants';
import { validateLuhn, formatCardNumber, formatExpiryDate, isExpired, isValidDate, normalizeToDashDate, compressImage } from '../utils/helpers';

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
        className="h-6 w-6 flex items-center justify-center text-[10px] font-bold rounded-md hover:bg-blue-600 hover:text-white transition-colors text-slate-700 dark:text-slate-200"
      >
        {d}
      </button>
    );
  }

  return (
    <div className="absolute z-50 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl p-2 w-48 animate-in fade-in zoom-in duration-200 overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={handlePrevMonth} className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors">
          <ChevronLeft className="w-3 h-3 text-slate-500" />
        </button>
        <span className="text-[10px] font-black text-slate-900 dark:text-white">
          {(monthNames as any)[lang][month]} {year}
        </span>
        <button type="button" onClick={handleNextMonth} className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors">
          <ChevronRight className="w-3 h-3 text-slate-500" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {(weekDays as any)[lang].map((d: string) => (
          <div key={d} className="h-6 w-6 flex items-center justify-center text-[8px] font-black text-slate-400 uppercase">
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
    photoUrl1: '',
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
  const photo1InputRef = useRef<HTMLInputElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        lastName: (initialData.lastName || '').toUpperCase(),
        firstName: (initialData.firstName || '').toUpperCase(),
        phoneNumber: initialData.phoneNumber || '',
        dob: initialData.dob || '',
        passportNumber: initialData.passportNumber || '',
        issueDate: initialData.issueDate || '',
        expiryDate: initialData.expiryDate || '',
        placeOfIssue: (initialData.placeOfIssue || '').toUpperCase(),
        previousVisaNumber: initialData.previousVisaNumber || '',
        visaFrom: initialData.visaFrom || '',
        visaTo: initialData.visaTo || '',
        category: initialData.category || '',
        appointmentDate: initialData.appointmentDate || '',
        photoUrl1: initialData.photoUrl1 || '',
        payment: {
          cardNumber: initialData.payment?.cardNumber || '',
          cardHolderName: (initialData.payment?.cardHolderName || '').toUpperCase(),
          expiryDate: initialData.payment?.expiryDate || '',
          cvv: initialData.payment?.cvv || ''
        }
      });
    }
  }, [initialData]);

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
      const text = (await navigator.clipboard.readText()).trim();
      if (!text) return;

      const newFormData = { ...formData };

      // Case 1: Tab/Space separated format (e.g., HAMADI ABDELKRIM 1997-01-16 ...)
      const parts = text.split(/\t|\s{2,}/).map(p => p.trim()).filter(Boolean);
      
      if (parts.length >= 7 && !text.includes(':')) {
        const nameParts = parts[0].split(/\s+/);
        newFormData.lastName = (nameParts[0] || '').toUpperCase();
        newFormData.firstName = (nameParts.slice(1).join(' ') || '').toUpperCase();
        
        newFormData.dob = normalizeToDashDate(parts[1]);
        newFormData.passportNumber = parts[2].replace(/\D/g, '').substring(0, 9);
        newFormData.issueDate = normalizeToDashDate(parts[3]);
        newFormData.expiryDate = normalizeToDashDate(parts[4]);
        newFormData.placeOfIssue = parts[5].toUpperCase();
        
        const cat = parts[6].toUpperCase();
        if (CATEGORIES.includes(cat)) {
          newFormData.category = cat;
        }

        if (parts.length >= 8) newFormData.previousVisaNumber = parts[7];
        if (parts.length >= 9) newFormData.visaFrom = normalizeToDashDate(parts[8]);
        if (parts.length >= 10) newFormData.visaTo = normalizeToDashDate(parts[9]);

        setFormData(newFormData);
        setErrors({});
        return;
      }

      // Case 2: Standard Key:Value format
      const lines = text.split('\n');
      lines.forEach(line => {
        const [key, ...rest] = line.split(':');
        if (!rest.length) return;
        const value = rest.join(':').replace('📋', '').trim();
        const keyLower = key.toLowerCase();

        if (keyLower.includes('name')) {
          const names = value.split(/\s+/);
          newFormData.lastName = (names[0] || '').toUpperCase();
          newFormData.firstName = (names.slice(1).join(' ') || '').toUpperCase();
        } else if (keyLower.includes('dob')) {
          newFormData.dob = normalizeToDashDate(value);
        } else if (keyLower.includes('passport')) {
          newFormData.passportNumber = value.replace(/\D/g, '').substring(0, 9);
        } else if (keyLower.includes('issue')) {
          newFormData.issueDate = normalizeToDashDate(value);
        } else if (keyLower.includes('expiry')) {
          newFormData.expiryDate = normalizeToDashDate(value);
        } else if (keyLower.includes('place')) {
          newFormData.placeOfIssue = value.toUpperCase();
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
    
    if (!formData.photoUrl1) newErrors.photoUrl1 = t.validation.required;

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
        const capitalizedData: ClientFormData = {
          ...formData,
          lastName: formData.lastName.toUpperCase(),
          firstName: formData.firstName.toUpperCase(),
          placeOfIssue: formData.placeOfIssue.toUpperCase(),
          payment: {
            ...formData.payment,
            cardHolderName: formData.payment.cardHolderName.toUpperCase()
          }
        };
        await onSubmit(capitalizedData);
        if (!initialData) {
          handleClear();
        }
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
      photoUrl1: '',
      payment: {
        cardNumber: '',
        cardHolderName: '',
        expiryDate: '',
        cvv: ''
      }
    });
    setErrors({});
    if (photo1InputRef.current) photo1InputRef.current.value = '';
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
    const isCapitalizedField = ['lastName', 'firstName', 'placeOfIssue', 'cardHolderName'].includes(field);
    
    const value = isPayment 
      ? (field === 'paymentExpiry' ? formData.payment.expiryDate : (formData.payment as any)[field])
      : (formData as any)[field];

    const inputClasses = `input-field ${error ? 'border-red-500 ring-1 ring-red-500' : ''} ${isCapitalizedField ? 'uppercase' : ''}`;

    return (
      <div className="space-y-1.5 relative">
        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1 ml-1">
          {label} {required && <span className="text-red-500">*</span>}
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
              value={value || ''}
              disabled={isSubmitting}
              placeholder={isDateField ? 'YYYY-MM-DD' : placeholder}
              onChange={(e) => {
                const val = e.target.value;
                if (isPayment) {
                  let formatted = val;
                  if (field === 'cardNumber') formatted = formatCardNumber(val);
                  if (field === 'paymentExpiry') formatted = formatExpiryDate(val);
                  if (field === 'cardHolderName') formatted = val.toUpperCase();
                  setFormData(prev => ({
                    ...prev,
                    payment: { ...prev.payment, [field === 'paymentExpiry' ? 'expiryDate' : field]: formatted }
                  }));
                } else {
                  let newVal = val;
                  if (isCapitalizedField) newVal = val.toUpperCase();
                  setFormData(prev => ({ ...prev, [field]: newVal }));
                }
              }}
              className={`${inputClasses} ${field === 'appointmentDate' ? 'pr-10' : ''}`}
            />
            {field === 'appointmentDate' && (
              <div ref={calendarRef}>
                <button
                  type="button"
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
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
        {error && <p className="text-[10px] text-red-500 font-bold uppercase mt-1 ml-1">{error}</p>}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handlePaste}
          disabled={isSubmitting}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-[10px] font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50 uppercase tracking-widest"
        >
          <ClipboardPaste className="w-3.5 h-3.5" />
          {t.paste}
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 gap-8">
          {/* Photo Upload Section */}
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
              {t.photo} <span className="text-red-500">*</span>
            </label>
            <div 
              className={`relative aspect-square w-32 mx-auto rounded-3xl border-2 border-dashed transition-all cursor-pointer overflow-hidden group ${
                errors.photoUrl1 ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50 dark:bg-slate-900/50'
              }`}
              onClick={() => photo1InputRef.current?.click()}
            >
              {formData.photoUrl1 ? (
                <div className="relative w-full h-full">
                  <img src={formData.photoUrl1} alt="Client Photo" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormData(prev => ({ ...prev, photoUrl1: '' }));
                      if (photo1InputRef.current) photo1InputRef.current.value = '';
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-white text-slate-900 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-lg"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Upload className="w-6 h-6" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{t.uploadPhoto}</span>
                </div>
              )}
              <input 
                type="file" 
                ref={photo1InputRef}
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      const compressed = await compressImage(file, 200);
                      setFormData(prev => ({ ...prev, photoUrl1: compressed }));
                    } catch (err) {
                      console.error('Compression failed:', err);
                    }
                  }
                }}
                accept="image/png, image/jpeg"
              />
            </div>
            {errors.photoUrl1 && <p className="text-[10px] text-red-500 font-bold uppercase text-center mt-1">{errors.photoUrl1}</p>}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {renderInput(t.lastName, 'lastName')}
              {renderInput(t.firstName, 'firstName')}
              {renderInput(t.dob, 'dob')}
              {renderInput(t.passportNumber, 'passportNumber')}
              {renderInput(t.issueDate, 'issueDate')}
              {renderInput(t.expiryDate, 'expiryDate')}
              {renderInput(t.placeOfIssue, 'placeOfIssue')}
              {renderInput(t.category, 'category', 'select', true, '', CATEGORIES)}
              {renderInput(t.appointmentDate, 'appointmentDate', 'text', false)}
              {renderInput(t.prevVisa, 'previousVisaNumber', 'text', false)}
              {renderInput(t.visaFrom, 'visaFrom', 'text', false)}
              {renderInput(t.visaTo, 'visaTo', 'text', false)}
              {renderInput(t.phoneNumber, 'phoneNumber', 'tel', false)}
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <CreditCard className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </div>
            <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t.paymentDetails}</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {renderInput(t.cardNumber, 'cardNumber', 'text', false, '#### #### #### ####')}
            {renderInput(t.cardHolder, 'cardHolderName', 'text', false)}
            <div className="grid grid-cols-2 gap-4">
              {renderInput(t.expiryDate, 'paymentExpiry', 'text', false, 'MM/YYYY')}
              {renderInput(t.cvv, 'cvv', 'text', false, '***')}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm">{initialData ? t.update : t.register}</span>
              </>
            )}
          </button>
          
          <div className="flex gap-3">
            <button 
              type="button" 
              onClick={handleClear} 
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-2xl font-bold text-[11px] text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all uppercase tracking-widest"
            >
              {t.clear}
            </button>
            {onCancel && (
              <button 
                type="button" 
                onClick={onCancel} 
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-2xl font-bold text-[11px] text-slate-500 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all uppercase tracking-widest"
              >
                {t.cancel}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default ClientForm;
