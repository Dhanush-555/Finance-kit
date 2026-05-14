-- Create tables for Finance Kit
-- Copy and paste this into the Supabase SQL Editor

-- LOANS TABLE
CREATE TABLE IF NOT EXISTS public.loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL, -- 'given' or 'taken'
  "borrowerOrLenderName" text NOT NULL,
  principal numeric NOT NULL,
  "interestRate" numeric NOT NULL,
  "loanDate" text NOT NULL,
  "tenureMonths" integer NOT NULL, -- This stores the count of installments (days/weeks/months)
  "tenureType" text NOT NULL DEFAULT 'monthly', -- NEW COLUMN: 'daily', 'weekly', 'monthly'
  "interestType" text NOT NULL, -- 'flat' or 'reducing'
  "interestRatePeriod" text NOT NULL DEFAULT 'monthly', -- 'monthly' or 'annual'
  "emiAmount" numeric NOT NULL,
  "totalRepaymentAmount" numeric NOT NULL,
  status text NOT NULL DEFAULT 'active', -- 'active' or 'closed'
  "penaltyRate" numeric,
  notes text,
  emis jsonb NOT NULL DEFAULT '[]'::jsonb, -- Store the EMIPayment array here
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- CHITS TABLE
CREATE TABLE IF NOT EXISTS public.chits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  "totalValue" numeric NOT NULL,
  "monthlySubscription" numeric NOT NULL,
  "durationMonths" integer NOT NULL,
  "currentMonth" integer NOT NULL DEFAULT 1,
  "startDate" text NOT NULL,
  status text NOT NULL DEFAULT 'active', -- 'active' or 'completed'
  "foremanCommissionPercentage" numeric NOT NULL,
  members jsonb NOT NULL DEFAULT '[]'::jsonb,
  payments jsonb NOT NULL DEFAULT '[]'::jsonb,
  auctions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date text NOT NULL,
  amount numeric NOT NULL,
  type text NOT NULL,
  person text NOT NULL,
  "referenceId" text,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn off RLS for simplicity in development
ALTER TABLE public.loans DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chits DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
