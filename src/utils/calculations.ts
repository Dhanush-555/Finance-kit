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

export const calculateEMI = (principal: number, annualRate: number, tenureMonths: number) => {
  const r = annualRate / (12 * 100); // monthly interest rate
  const n = tenureMonths;
  
  if (r === 0) return principal / n;

  // EMI = [P x r x (1+r)^n] / [(1+r)^n - 1]
  const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return emi;
};

export const generateAmortizationSchedule = (
  principal: number,
  annualRate: number,
  tenureMonths: number,
  startDate: Date = new Date(),
  interestType: 'reducing' | 'flat' = 'reducing'
) => {
  const r = annualRate / (12 * 100);
  
  let emi = 0;
  if (interestType === 'flat') {
    const totalInterest = (principal * annualRate * (tenureMonths / 12)) / 100;
    emi = (principal + totalInterest) / tenureMonths;
  } else {
    emi = calculateEMI(principal, annualRate, tenureMonths);
  }
  
  const schedule = [];
  let balance = principal;

  for (let i = 1; i <= tenureMonths; i++) {
    let interest = 0;
    let principalPaid = 0;

    if (interestType === 'flat') {
       interest = ((principal * annualRate * (tenureMonths / 12)) / 100) / tenureMonths;
       principalPaid = emi - interest;
       balance -= principalPaid;
    } else {
       interest = balance * r;
       principalPaid = emi - interest;
       balance -= principalPaid;
    }

    const dueDate = new Date(startDate);
    // Ensure we correctly add months without timezone shift issues
    dueDate.setUTCMonth(dueDate.getUTCMonth() + i);

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
