import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FinanceProvider } from './context/FinanceContext';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { ChitFunds } from './pages/ChitFunds';
import { LoanTracker } from './pages/LoanTracker';
import { Calculator } from './pages/Calculator';
import { History } from './pages/History';

function App() {
  return (
    <FinanceProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="chits" element={<ChitFunds />} />
            <Route path="loans" element={<LoanTracker />} />
            <Route path="calculator" element={<Calculator />} />
            <Route path="history" element={<History />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </FinanceProvider>
  );
}

export default App;
