export interface Member {
  id: string;
  name: string;
  phone: string;
  aadhaar?: string;
  address?: string;
  kycStatus: 'pending' | 'verified' | 'rejected';
  assignedMonth?: number; // Month they won the auction
}

export interface PaymentStatus {
  month: number;
  status: 'paid' | 'pending' | 'partial' | 'late';
  amount: number;
  dividend?: number;
  lateFee?: number;
  paidDate?: string;
}

export interface MemberPayment {
  memberId: string;
  payments: PaymentStatus[];
}

export interface Auction {
  month: number;
  winningMemberId: string;
  bidAmount: number;
  dividend: number;
  commission: number;
  date: string;
}

export interface ChitGroup {
  id: string;
  user_id?: string;
  name: string;
  totalValue: number;
  durationMonths: number;
  memberCount: number;
  monthlyContribution: number;
  commissionPercentage: number; // e.g. 5
  currentMonth: number;
  startDate: string; // ISO
  members: Member[];
  payments: MemberPayment[];
  auctions: Auction[];
  status: 'active' | 'completed';
  notes?: string;
}

export interface Loan {
  id: string;
  user_id?: string;
  type: 'given' | 'taken';
  borrowerOrLenderName: string;
  principal: number;
  interestRate: number;
  loanDate: string; // ISO
  tenureMonths: number; // For compatibility, this will store total installments
  tenureType: 'daily' | 'weekly' | 'monthly';
  interestType: 'reducing' | 'flat';
  interestRatePeriod?: 'monthly' | 'annual';
  emiAmount: number;
  totalRepaymentAmount: number;
  status: 'active' | 'closed';
  emis: EMIPayment[];
  penaltyRate?: number; // percentage for late fee
  category?: 'personal' | 'gold' | 'business' | 'other';
  notes?: string;
}

export interface EMIPayment {
  id: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'pending' | 'late';
  paidDate?: string;
  penalty?: number;
  principalPaid?: number;
  interest?: number;
}

export interface Transaction {
  id: string;
  user_id?: string;
  date: string; // ISO
  amount: number;
  type: 'chit_contribution' | 'chit_receive' | 'loan_emi_paid' | 'loan_emi_received' | 'loan_principal_given' | 'loan_principal_taken' | 'foreman_commission';
  person: string;
  referenceId: string; // Chit ID or Loan ID
  notes?: string;
}

