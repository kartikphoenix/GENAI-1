import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import ChatUI from './components/ChatUI';

const ProtectedApp = () => {
  const { isAuthenticated } = useAuth();
  return (
    <main className="h-screen w-screen bg-gray-100">
      {isAuthenticated ? <ChatUI /> : <Login />}
    </main>
  );
};

function App() {
  return (
    <AuthProvider>
      <ProtectedApp />
    </AuthProvider>
  );
}

export default App; 