export const calculateSimpleInterest = (principal: number, rate: number, timeYears: number) => {
  const interest = (principal * rate * timeYears) / 100;
  return {
    interest,
    total: principal + interest,
  };
};

export const calculateCompoundInterest = (
  principal: number,
  rate: number,
  timeYears: number,
  frequency: number = 12 // n = times compounded per year
) => {
  // A = P(1 + r/n)^(nt)
  const r = rate / 100;
  const amount = principal * Math.pow(1 + r / frequency, frequency * timeYears);
  const interest = amount - principal;
  return {
    interest,
    total: amount,
  };
};

export const calculateEMI = (
  principal: number, 
  rate: number, 
  tenure: number, 
  isMonthlyRate: boolean = false,
  frequency: 'daily' | 'weekly' | 'monthly' = 'monthly'
) => {
  let r = 0;
  if (isMonthlyRate) {
    if (frequency === 'monthly') r = rate / 100;
    else if (frequency === 'weekly') r = (rate / (30/7)) / 100;
    else r = (rate / 30) / 100;
  } else {
    if (frequency === 'monthly') r = rate / (12 * 100);
    else if (frequency === 'weekly') r = rate / (52 * 100);
    else r = rate / (365 * 100);
  }

  const n = tenure;
  if (r === 0) return principal / n;

  // EMI = [P x r x (1+r)^n] / [(1+r)^n - 1]
  const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return emi;
};

export const generateAmortizationSchedule = (
  principal: number,
  rate: number,
  tenure: number,
  startDate: Date = new Date(),
  interestType: 'reducing' | 'flat' = 'reducing',
  isMonthlyRate: boolean = false,
  frequency: 'daily' | 'weekly' | 'monthly' = 'monthly'
) => {
  let r = 0;
  if (isMonthlyRate) {
    if (frequency === 'monthly') r = rate / 100;
    else if (frequency === 'weekly') r = (rate / (30/7)) / 100;
    else r = (rate / 30) / 100;
  } else {
    if (frequency === 'monthly') r = rate / (12 * 100);
    else if (frequency === 'weekly') r = rate / (52 * 100);
    else r = rate / (365 * 100);
  }
  
  let emi = 0;
  if (interestType === 'flat') {
    const totalInterest = isMonthlyRate 
        ? principal * (rate / 100) * (frequency === 'monthly' ? tenure : (frequency === 'weekly' ? (tenure / (30/7)) : (tenure / 30)))
        : (principal * rate * (tenure / (frequency === 'monthly' ? 12 : (frequency === 'weekly' ? 52 : 365)))) / 100;
    emi = (principal + totalInterest) / tenure;
  } else {
    emi = calculateEMI(principal, rate, tenure, isMonthlyRate, frequency);
  }
  
  const schedule = [];
  let balance = principal;

  for (let i = 1; i <= tenure; i++) {
    let interest = 0;
    let principalPaid = 0;

    if (interestType === 'flat') {
       interest = (emi * tenure - principal) / tenure;
       principalPaid = emi - interest;
       balance -= principalPaid;
    } else {
       interest = balance * r;
       principalPaid = emi - interest;
       balance -= principalPaid;
    }

    const dueDate = new Date(startDate);
    if (frequency === 'monthly') {
      const targetMonth = dueDate.getUTCMonth() + i;
      dueDate.setUTCMonth(targetMonth);
      if (dueDate.getUTCMonth() !== (targetMonth % 12)) {
        dueDate.setUTCDate(0);
      }
    } else if (frequency === 'weekly') {
      dueDate.setUTCDate(dueDate.getUTCDate() + (i * 7));
    } else {
      dueDate.setUTCDate(dueDate.getUTCDate() + i);
    }

    schedule.push({
      month: i,
      dueDate: dueDate.toISOString(),
      emi,
      principal: principalPaid,
      interest,
      balance: Math.max(0, balance),
    });
  }

  return schedule;
};
export const calculateChitDividend = (
  bidAmount: number,
  totalValue: number,
  memberCount: number,
  commissionPercentage: number
) => {
  // Discount = Total amount - Winning bid amount
  const discount = totalValue - bidAmount;
  
  // Foreman Commission = Percentage of total chit value
  const commission = (totalValue * commissionPercentage) / 100;
  
  // Dividend pool = Discount - Foreman commission
  const totalDividend = Math.max(0, discount - commission);
  
  // Dividend per member = Dividend pool ÷ Total members
  const dividendPerMember = totalDividend / memberCount;

  return {
    discount,
    commission,
    totalDividend,
    dividendPerMember,
  };
};

export const calculateMonthlyPayable = (
  baseContribution: number,
  dividendPerMember: number
) => {
  return baseContribution - dividendPerMember;
};
