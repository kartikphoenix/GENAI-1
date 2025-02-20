import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function deleteUser(email) {
  const { data, error } = await supabase
    .from('users')
    .delete()
    .eq('email', email);

  if (error) {
    console.error('Error deleting user:', error);
  } else {
    console.log('User deleted successfully');
  }
}

deleteUser('admin@example.com'); 