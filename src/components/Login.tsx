import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import dotenv from 'dotenv';
dotenv.config();

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        const response = await fetch(`${process.env.VITE_API_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Registration failed');
        }
      }
      await login(email, password);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || (isRegistering ? 'Failed to register' : 'Failed to login'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 p-10 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl"
      >
        <div>
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-center text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600"
          >
            {isRegistering ? 'Create your account' : 'Welcome back'}
          </motion.h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isRegistering ? 'Start your journey with TAIR Chat' : 'Sign in to continue to TAIR Chat'}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-50 text-red-500 p-4 rounded-lg text-center text-sm"
            >
              {error}
            </motion.div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <label htmlFor="email" className="text-sm font-medium text-gray-700 mb-1 block">
                Email address
              </label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                type="email"
                required
                id="email"
                className="appearance-none relative block w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="text-sm font-medium text-gray-700 mb-1 block">
                Password
              </label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                type="password"
                required
                id="password"
                className="appearance-none relative block w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isRegistering ? 'Create Account' : 'Sign in'}
            </motion.button>
          </div>
        </form>
        
        <div className="text-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors duration-200"
          >
            {isRegistering 
              ? 'Already have an account? Sign in' 
              : 'Need an account? Register'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default Login; 