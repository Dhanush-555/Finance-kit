import type { Loan } from '../types';

export interface FinanceSuggestion {
  id: string;
  type: 'saving' | 'warning' | 'optimization' | 'health';
  title: string;
  message: string;
  actionLabel?: string;
  impact?: string;
}

export interface FinanceHealth {
  score: number; // 0-100
  status: 'Good' | 'Moderate' | 'Risky';
  color: string;
}

export const analyzeLoanHealth = (loan: Loan): FinanceHealth => {
  const overdueEmis = loan.emis.filter(e => e.status === 'pending' && new Date() > new Date(e.dueDate));
  const paidEmis = loan.emis.filter(e => e.status === 'paid');
  
  let score = 100;
  
  // Deduct for overdue
  score -= overdueEmis.length * 20;
  
  // Deduct for penalty frequency
  const totalPenalty = loan.emis.reduce((acc, curr) => acc + (curr.penalty || 0), 0);
  if (totalPenalty > 0) score -= 10;

  // Deduct for inconsistency (if any)
  if (paidEmis.length > 0 && overdueEmis.length > 0) score -= 5;

  score = Math.max(0, score);

  if (score >= 80) return { score, status: 'Good', color: 'text-emerald-500' };
  if (score >= 50) return { score, status: 'Moderate', color: 'text-amber-500' };
  return { score, status: 'Risky', color: 'text-red-500' };
};

export const generateSmartSuggestions = (loan: Loan): FinanceSuggestion[] => {
  const suggestions: FinanceSuggestion[] = [];
  const health = analyzeLoanHealth(loan);
  
  const overdueEmis = loan.emis.filter(e => e.status === 'pending' && new Date() > new Date(e.dueDate));
  const pendingEmis = loan.emis.filter(e => e.status === 'pending');
  const paidPrincipal = loan.emis
    .filter(e => e.status === 'paid')
    .reduce((acc, curr) => acc + (curr.principalPaid || 0), 0);
  const remainingPrincipal = loan.principal - paidPrincipal;
  
  // 1. Penalty Warning
  if (overdueEmis.length > 0) {
    const dailyPenalty = loan.penaltyRate || 0;
    suggestions.push({
      id: `penalty-${loan.id}`,
      type: 'warning',
      title: 'Action Required: Penalty Alert',
      message: `You have ${overdueEmis.length} overdue payment(s). Penalty charges are increasing by ₹${dailyPenalty} every day.`,
      actionLabel: 'Pay Now',
      impact: 'Stops daily loss'
    });
  }

  // 2. Extra Payment Suggestion (Prepayment)
  if (loan.interestType === 'reducing' && remainingPrincipal > (loan.principal * 0.2)) {
    const extraAmount = Math.round(loan.principal * 0.05); // Suggest paying 5% extra
    const monthlyRate = loan.interestRatePeriod === 'monthly' ? loan.interestRate / 100 : loan.interestRate / 1200;
    // Rough saving calculation: Interest saved on extraAmount over remaining tenure
    const remainingTenure = pendingEmis.length;
    const estimatedSavings = Math.round(extraAmount * monthlyRate * remainingTenure * 0.7); // 0.7 as a factor for reducing balance
    
    if (estimatedSavings > 500) {
      suggestions.push({
        id: `extra-${loan.id}`,
        type: 'saving',
        title: 'Save on Interest',
        message: `Paying ₹${extraAmount.toLocaleString()} extra towards principal this month can save approximately ₹${estimatedSavings.toLocaleString()} in future interest.`,
        actionLabel: 'Pay Extra',
        impact: `Saves ₹${estimatedSavings}`
      });
    }
  }

  // 3. EMI Optimization
  if (health.status === 'Good' && pendingEmis.length > 6) {
    const suggestedEmiIncrease = Math.round(loan.emiAmount * 0.15); // Suggest 15% increase
    const monthsSaved = Math.floor(pendingEmis.length * 0.2); // Rough estimate: 20% tenure reduction
    
    if (monthsSaved >= 1) {
      suggestions.push({
        id: `opt-${loan.id}`,
        type: 'optimization',
        title: 'Close Loan Faster',
        message: `Increasing your EMI by ₹${suggestedEmiIncrease.toLocaleString()} can help you close this loan ${monthsSaved} months earlier and improve your debt-to-income ratio.`,
        actionLabel: 'View Plan',
        impact: `${monthsSaved}mo early`
      });
    }
  }

  // 4. Progress Reinforcement
  const progressPercent = Math.round((paidPrincipal / loan.principal) * 100);
  if (progressPercent > 0 && progressPercent < 100) {
    suggestions.push({
      id: `progress-${loan.id}`,
      type: 'health',
      title: 'Great Progress!',
      message: `You have successfully cleared ₹${paidPrincipal.toLocaleString()} (${progressPercent}%) of your total principal. You are ${100 - progressPercent}% away from being debt-free!`,
    });
  }

  // 5. Interest Type Tip
  if (loan.interestType === 'flat') {
    const flatInterest = loan.totalRepaymentAmount - loan.principal;
    suggestions.push({
      id: `flat-tip-${loan.id}`,
      type: 'optimization',
      title: 'Interest Saving Tip',
      message: `You are paying ₹${Math.round(flatInterest).toLocaleString()} in flat interest. Switching to "Reducing Balance" for your next loan could save you up to 30% of this amount.`,
    });
  }

  // 6. Gold Loan Specific
  if (loan.category === 'gold' || loan.notes?.toLowerCase().includes('gold') || loan.notes?.toLowerCase().includes('jewel')) {
    const interestSavedPer10k = Math.round(10000 * (loan.interestRatePeriod === 'monthly' ? loan.interestRate / 100 : loan.interestRate / 1200) * pendingEmis.length * 0.5);
    suggestions.push({
      id: `gold-${loan.id}`,
      type: 'optimization',
      title: 'Gold Loan Strategy',
      message: `For every ₹10,000 extra you pay towards principal now, you save approximately ₹${interestSavedPer10k.toLocaleString()} in interest over the remaining tenure.`,
      actionLabel: 'Partial Pay'
    });
  }

  // 7. General Health Warning
  if (health.status === 'Risky') {
    const totalOverdue = overdueEmis.reduce((acc, curr) => acc + curr.amount, 0);
    suggestions.push({
        id: `health-risk-${loan.id}`,
        type: 'health',
        title: 'Urgent: Debt Health',
        message: `You have ₹${Math.round(totalOverdue).toLocaleString()} currently overdue. Paying this immediately will stop penalty accumulation and restore your financial health.`,
        actionLabel: 'Clear Dues'
    });
  }

  return suggestions;
};
