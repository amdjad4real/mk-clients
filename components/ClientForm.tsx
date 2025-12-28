
import React, { useState, useEffect, useRef } from 'react';
import { Camera, CreditCard, User, ClipboardPaste, Calendar, Loader2 } from 'lucide-react';
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
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ 
        ...prev, 
        ...initialData,
        payment: { ...prev.payment, ...(initialData.payment || {}) }
      }));
    }
  }, [initialData]);

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
    const dateFields = ['dob', 'issueDate', 'expiryDate', 'appointmentDate'];
    
    if (!formData.lastName.trim()) newErrors.lastName = t.validation.required;
    if (!formData.firstName.trim()) newErrors.firstName = t.validation.required;
    
    dateFields.forEach(field => {
      const val = (formData as any)[field];
      if (!val.trim()) {
        newErrors[field] = t.validation.required;
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) {
        newErrors[field] = 'Format: YYYY-MM-DD';
      } else if (!isValidDate(val)) {
        newErrors[field] = t.validation.invalidExpiry;
      }
    });

    if (!formData.passportNumber.trim()) {
      newErrors.passportNumber = t.validation.required;
    } else if (!/^\d{9}$/.test(formData.passportNumber)) {
      newErrors.passportNumber = t.validation.passportLength;
    }

    if (!formData.placeOfIssue.trim()) newErrors.placeOfIssue = t.validation.required;
    if (!formData.category) newErrors.category = t.validation.required;
    
    // Optional date fields
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
      <div className="space-y-1">
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
            className={inputClasses}
          />
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
            {renderInput(t.appointmentDate, 'appointmentDate', 'text', true, 'YYYY-MM-DD')}
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
