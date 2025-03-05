import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, AlertCircle, Info, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminControls from './AdminControls';
import { useAuth } from '../contexts/AuthContext';
import dotenv from 'dotenv';
dotenv.config();

interface Message {
  id: string;
  text: string;
  type: 'system' | 'user' | 'assistant' | 'error';
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
  isSequential: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isSequential }) => {
  const isUser = message.type === 'user';
  
  const IconComponent = {
    user: User,
    assistant: Bot,
    system: Info,
    error: AlertCircle
  }[message.type];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} ${isSequential ? 'mt-2' : 'mt-6'}`}
    >
      {!isSequential && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`flex-shrink-0 ${
            message.type === 'user' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
            message.type === 'assistant' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' :
            message.type === 'system' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 
            'bg-gradient-to-r from-red-500 to-red-600'
          } p-2 rounded-full text-white shadow-lg`}
        >
          <IconComponent className="w-4 h-4" />
        </motion.div>
      )}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} ${isSequential ? 'ml-9' : ''}`}>
        {!isSequential && (
          <span className="text-xs text-gray-500 mb-1 font-medium">
            {message.type === 'user' ? 'You' : 
             message.type === 'assistant' ? 'TAIR Assistant' :
             message.type === 'system' ? 'TAIR Assistant' : 'Error'}
          </span>
        )}
        <motion.div 
          layout
          className={`
            px-4 py-2 rounded-2xl max-w-[80%] break-words shadow-sm
            ${isSequential ? 'rounded-tr-lg' : ''} 
            ${message.type === 'user' && 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'} 
            ${(message.type === 'assistant' || message.type === 'system') && 'bg-white border border-gray-100 text-gray-800'}
            ${message.type === 'error' && 'bg-red-50 text-red-800 border border-red-100'}
            transform transition-all duration-200 ease-out hover:shadow-md
          `}
        >
          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        </motion.div>
        <span className="text-xs text-gray-400 mt-1">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
};

const ChatUI: React.FC = () => {
  const { user, logout } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm the TAIR Assistant. I can help you find information about TAIR subscriptions. What would you like to know?",
      type: 'system',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const adjustTextareaHeight = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text: userMessage,
      type: 'user',
      timestamp: new Date()
    }]);
    
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.VITE_API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: data.answer,
        type: 'assistant',
        timestamp: new Date()
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: "Sorry, there was an error processing your request. Please try again.",
        type: 'error',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = (message: string, type: 'system' | 'error') => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text: message,
      type,
      timestamp: new Date()
    }]);
  };

  return (
    <div className="flex flex-col h-screen w-full px-4 animate-fadeIn bg-gradient-to-br from-gray-50 to-white">
      <div className="bg-white rounded-2xl shadow-xl flex flex-col h-full border border-gray-100 my-4">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 border-b border-gray-100 bg-white rounded-t-2xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                TAIR Chat Assistant
              </h1>
              <p className="text-sm text-gray-500">Ask questions about TAIR subscriptions</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-full">
                {user?.email}
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={logout}
                className="text-red-600 hover:text-red-700 transition-colors duration-200"
              >
                <LogOut className="w-5 h-5" />
              </motion.button>
              <AdminControls onStatusUpdate={handleStatusUpdate} />
            </div>
          </div>
        </motion.div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence>
            {messages.map((msg, index) => (
              <ChatMessage 
                key={msg.id}
                message={msg}
                isSequential={index > 0 && messages[index - 1].type === msg.type}
              />
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 text-gray-500"
            >
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2 rounded-full shadow-lg">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              </div>
              <span className="text-sm font-medium">Thinking...</span>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit} 
          className="p-6 border-t border-gray-100 bg-white rounded-b-2xl"
        >
          <div className="flex items-end gap-4">
            <div className="flex-1 relative">
              <motion.textarea
                whileFocus={{ scale: 1.01 }}
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  adjustTextareaHeight();
                }}
                onKeyDown={handleKeyPress}
                placeholder="Ask a question... (Press Enter to send)"
                className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none max-h-[150px] pr-12 shadow-sm transition-all duration-200"
                disabled={isLoading}
              />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type="submit"
                disabled={isLoading || !input.trim()}
                className="absolute right-3 bottom-3 p-2 text-blue-500 hover:text-blue-600 disabled:opacity-50 disabled:hover:text-blue-500 transition-colors duration-200"
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </motion.form>
      </div>
    </div>
  );
};

export default ChatUI;