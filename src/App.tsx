import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { authenticateUser } from './lib/supabase';
import Login from './components/Login';
import CRM from './components/CRM';
import BookingForm from './components/BookingForm';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    const success = await authenticateUser(email, password);
    if (success) {
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
    }
    return success;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
  };

  // Check if user was previously authenticated
  React.useEffect(() => {
    const wasAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (wasAuthenticated) {
      setIsAuthenticated(true);
    }
  }, []);

  return (
    <Router>
      <Routes>
        {/* Rota principal - Formulário de agendamento */}
        <Route path="/" element={<BookingForm />} />
        
        {/* Rota do CRM - Protegida por login */}
        <Route 
          path="/crm" 
          element={
            isAuthenticated ? (
              <CRM onLogout={handleLogout} />
            ) : (
              <Login onLogin={handleLogin} />
            )
          } 
        />
        
        {/* Redirecionar rotas não encontradas para a página principal */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;