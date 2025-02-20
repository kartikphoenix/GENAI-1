import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Middleware to verify JWT token
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  console.log('Auth header:', authHeader);
  console.log('JWT_SECRET:', process.env.JWT_SECRET);
  
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verification result:', verified);
    req.user = verified;
    next();
  } catch (error) {
    console.log('Token verification failed:', error.message);
    console.log('Token received:', token);
    res.status(400).json({ error: 'Invalid token.' });
  }
};

// Login handler
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.log('Database error:', error);
      return res.status(400).json({ error: 'Database error: ' + error.message });
    }

    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log('Invalid password for:', email);
      return res.status(400).json({ error: 'Invalid password' });
    }

    console.log('Login successful for:', email);
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Error logging in: ' + error.message });
  }
}

// Register handler
export async function register(req, res) {
  try {
    // Force role to be 'user' for registration
    const { email, password } = req.body;
    const role = 'user'; // Always set role to 'user' for registration
    
    console.log('Registration attempt for:', email);

    if (!email || !password) {
      console.log('Missing required fields');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (checkError) {
      console.log('Error checking existing user:', checkError);
      if (checkError.code !== 'PGRST116') { // Not found error is ok
        return res.status(500).json({ error: 'Error checking user existence' });
      }
    }
    
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log('Attempting to create user in Supabase...');
    
    // Create user
    const { data: user, error: createError } = await supabase
      .from('users')
      .insert([{
        email,
        password: hashedPassword,
        role
      }])
      .select()
      .single();

    if (createError) {
      console.log('Error creating user:', createError);
      return res.status(500).json({ error: 'Failed to create user: ' + createError.message });
    }

    console.log('User created successfully:', email);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Error registering user: ' + error.message });
  }
} 