# TAIR Chat

A real-time chat interface for TAIR (The Arabidopsis Information Resource) that provides intelligent responses about TAIR subscriptions and related information using AI.

## Features

- 🔐 Secure authentication system
- 💬 Real-time chat interface with AI responses
- 🤖 TAIR Assistant powered by OpenAI
- 📊 Admin dashboard for document management
- 🎨 Modern UI with animations using Framer Motion
- 🔄 Document processing and embedding system

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Backend**: Express.js
- **Database**: Supabase
- **Authentication**: JWT + Bcrypt
- **AI**: OpenAI API
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js (latest LTS version)
- npm or yarn
- Supabase account
- OpenAI API key

### Environment Setup

Create a `.env` file in the root directory:

```
JWT_SECRET=your_jwt_secret
VITE_API_URL=http://localhost:3001
SUPABASE_KEY=your_supabase_key
OPENAI_API_KEY=your_openai_key
SUPABASE_URL=your_supabase_url
```

### Database Setup

Run these SQL commands in your Supabase SQL editor:

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- Create users table
CREATE TABLE public.users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create embeddings table
CREATE TABLE public.embeddings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content TEXT NOT NULL,
    embedding vector(1536),
    filename TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
```

### Installation

```bash
# Install dependencies
npm install

# Start development servers (frontend + backend)
npm start

# Or run separately:
npm run dev      # Frontend only
npm run server   # Backend only
```

## Project Structure

```
├── src/
│   ├── components/        # React components
│   │   ├── ChatUI.tsx    # Main chat interface
│   │   ├── Login.tsx     # Authentication UI
│   │   └── AdminControls.tsx  # Admin features
│   ├── contexts/         # React contexts
│   │   └── AuthContext.tsx    # Authentication state
│   └── App.tsx          # Root component
├── server/
│   ├── server.js        # Express backend
│   ├── auth.js          # Authentication logic
│   └── index.js         # Core processing logic
└── scripts/             # Utility scripts
    ├── create-admin.js  # Admin user creation
    └── delete-user.js   # User management
```

## Key Components

### ChatUI

The main chat interface that handles:
- Message history and AI responses
- Real-time message updates
- Responsive design with animations
- Message type handling (user, TAIR Assistant, error)

### Authentication

- JWT-based authentication
- Protected routes for admin access
- Secure password hashing with bcrypt
- Login and registration functionality

### Admin Controls

- Document processing management
- Embedding generation and storage
- Clear embeddings functionality
- Reprocess documents capability

## Document Processing

The system processes documents in chunks:
- Maximum token size: 4000 tokens per chunk
- Special handling for different file types:
  - FAQ.txt: Splits by Q&A pairs
  - Subscriber lists: Splits by lines
  - Other files: Splits by paragraphs/sentences
- Automatic retry mechanism for failed processes

## Quick Start

1. Set up environment variables
2. Create an admin user:
   ```bash
   node scripts/create-admin.js
   ```
3. Start the application:
   ```bash
   npm start
   ```
4. Login with:
   - Email: admin@example.com
   - Password: admin123

## Support

For support, please email curator@arabidopsis.org