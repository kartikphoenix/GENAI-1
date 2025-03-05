import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env first, with proper path resolution
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Log to debug
console.log('Environment loaded. SUPABASE_URL:', process.env.SUPABASE_URL);

// Now do the imports
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { searchSimilarContent, generateAnswer, processFiles } from './index.js';
import { login, register, authenticateToken } from './auth.js';

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Route to clear embeddings
app.post('/api/clear-embeddings', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('embeddings')
      .delete()
      .neq('id', 0); // Delete all rows
    
    if (error) throw error;
    
    res.json({ message: 'Embeddings cleared successfully' });
  } catch (error) {
    console.error('Error clearing embeddings:', error);
    res.status(500).json({ error: 'Failed to clear embeddings' });
  }
});

// Route to reprocess with current settings
app.post('/api/reprocess', authenticateToken, async (req, res) => {
  try {
    const documentsPath = path.join(__dirname, 'documents');
    console.log('Processing directory:', documentsPath);

    // Clear existing embeddings first
    console.log('Attempting to clear embeddings...');
    const { error: clearError } = await supabase
      .from('embeddings')
      .delete()
      .not('id', 'is', null); // Better approach than neq
    
    if (clearError) {
      console.error('Error clearing embeddings:', clearError);
      throw clearError;
    }
    console.log('Successfully cleared embeddings');

    // Verify embeddings were cleared
    const { data: remainingEmbeddings, error: checkError } = await supabase
      .from('embeddings')
      .select('count');
    
    if (checkError) {
      console.error('Error checking embeddings:', checkError);
    } else {
      console.log('Remaining embeddings:', remainingEmbeddings);
    }

    // Process files with current settings
    console.log('Starting file processing...');
    await processFiles(documentsPath);
    
    res.json({ 
      message: 'Documents reprocessed successfully',
      directory: documentsPath
    });
  } catch (error) {
    console.error('Error in reprocessing:', error);
    res.status(500).json({ error: 'Failed to reprocess documents: ' + error.message });
  }
});

// Route for chat
app.post('/api/chat', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    
    console.log('\nSearching for relevant information...');
    const similarContent = await searchSimilarContent(message);
    
    if (similarContent.length === 0) {
      return res.json({
        answer: 'No relevant information found in the documents.'
      });
    }
    
    console.log(`Found ${similarContent.length} relevant matches.`);
    
    // Combine relevant content
    const context = similarContent
      .map((item) => item.content)
      .join('\n\n');
    
    console.log('\nGenerating answer...');
    const answer = await generateAnswer(message, context, similarContent);
    
    res.json({ answer });
  } catch (error) {
    console.error('Error processing question:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add authentication routes
app.post('/api/auth/login', login);
app.post('/api/auth/register', register);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});