
export type Language = 'en' | 'fr' | 'ar';
export type Theme = 'light' | 'dark';

export interface Client {
  id: string;
  lastName: string;
  firstName: string;
  phoneNumber: string;
  dob: string;
  passportNumber: string;
  issueDate: string;
  expiryDate: string;
  placeOfIssue: string;
  previousVisaNumber?: string;
  visaFrom?: string;
  visaTo?: string;
  category: string;
  appointmentDate: string; // ISO date string (YYYY-MM-DD)
  photoUrl?: string;
  payment: {
    cardMask: string;
    expiryDate: string;
    cardHolderName: string;
    cardNumber: string; // Store raw for copying
    cvv: string; // Store raw for copying
  };
}

export interface PaymentData {
  cardNumber: string;
  cardHolderName: string;
  expiryDate: string;
  cvv: string;
}

export interface ClientFormData extends Omit<Client, 'id' | 'payment'> {
  payment: PaymentData;
}
