import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function createAdmin(email, password) {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  
  const { data, error } = await supabase
    .from('users')
    .insert([{
      email,
      password: hashedPassword,
      role: 'admin'
    }])
    .select();

  if (error) {
    console.error('Error creating admin:', error);
  } else {
    console.log('Admin created successfully:', data);
  }
}

createAdmin('admin@example.com', 'admin123'); 