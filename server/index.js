import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function preprocessContent(filename, content) {
  // Remove extra whitespace and normalize quotes
  content = content.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
  
  if (filename === 'FAQ.txt') {
    // Parse QA pairs for FAQ
    const pairs = content.match(/\["([^"]+)",\s*"([^"]+)"\]/g) || [];
    return pairs.map(pair => {
      const [_, question, answer] = pair.match(/\["([^"]+)",\s*"([^"]+)"\]/) || [];
      return `Q: ${question}\nA: ${answer}`;
    }).join('\n\n');
  }
  
  if (filename === 'Knowledege Base QnA.txt') {
    // Special handling for Knowledge Base
    const match = content.match(/\["([^"]+)",\s*"([^"]+)"\]/);
    if (match) {
      const [_, question, answer] = match;
      // Split the answer into logical sections
      const sections = answer.split(/(\d+\.\s+)/);
      const processedSections = [];
      for (let i = 1; i < sections.length; i += 2) {
        if (sections[i + 1]) {
          processedSections.push(sections[i] + sections[i + 1].trim());
        }
      }
      
      // Create chunks with question context
      return processedSections.map(section => 
        `Q: ${question}\n\nRelevant Information:\n${section.trim()}`
      ).join('\n\n');
    }
    return content;
  }
  
  return content;
}

function splitIntoChunks(text, filename, maxTokens = 4000) {
  // Preprocess content based on file type
  const processedText = preprocessContent(filename, text);
  
  // Estimate tokens (rough approximation: 4 chars = 1 token)
  const estimateTokens = (text) => Math.ceil(text.length / 4);
  
  if (filename === 'china_subscribers.txt' || filename === 'subscriber-list.txt') {
    // Special handling for subscriber lists - split by lines and combine safely
    const lines = processedText.split('\n');
    const chunks = [];
    let currentChunk = [];
    let currentTokens = 0;
    
    for (const line of lines) {
      const lineTokens = estimateTokens(line);
      
      // If single line is too big, split it further
      if (lineTokens > maxTokens) {
        const subChunks = line.match(/.{1,4000}/g) || []; // Split by characters
        chunks.push(...subChunks);
        continue;
      }
      
      if (currentTokens + lineTokens > maxTokens && currentChunk.length > 0) {
        chunks.push(currentChunk.join('\n'));
        currentChunk = [];
        currentTokens = 0;
      }
      
      currentChunk.push(line);
      currentTokens += lineTokens;
    }
    
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join('\n'));
    }
    
    return chunks;
  }
  
  if (filename === 'FAQ.txt') {
    // Handle FAQ chunks - split by QA pairs
    const pairs = processedText.split('\n\n');
    const chunks = [];
    let currentChunk = [];
    let currentTokens = 0;
    
    for (const pair of pairs) {
      const pairTokens = estimateTokens(pair);
      
      if (currentTokens + pairTokens > maxTokens && currentChunk.length > 0) {
        chunks.push(currentChunk.join('\n\n'));
        currentChunk = [];
        currentTokens = 0;
      }
      
      currentChunk.push(pair);
      currentTokens += pairTokens;
    }
    
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join('\n\n'));
    }
    
    return chunks;
  }
  
  // For other files, split by paragraphs or sentences
  const paragraphs = processedText.split(/\n\n+/);
  const chunks = [];
  let currentChunk = [];
  let currentTokens = 0;
  
  for (const paragraph of paragraphs) {
    const paragraphTokens = estimateTokens(paragraph);
    
    if (paragraphTokens > maxTokens) {
      // Split large paragraphs into sentences
      const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
      for (const sentence of sentences) {
        const sentenceTokens = estimateTokens(sentence);
        if (currentTokens + sentenceTokens > maxTokens && currentChunk.length > 0) {
          chunks.push(currentChunk.join(' '));
          currentChunk = [];
          currentTokens = 0;
        }
        currentChunk.push(sentence);
        currentTokens += sentenceTokens;
      }
    } else {
      if (currentTokens + paragraphTokens > maxTokens && currentChunk.length > 0) {
        chunks.push(currentChunk.join('\n\n'));
        currentChunk = [];
        currentTokens = 0;
      }
      currentChunk.push(paragraph);
      currentTokens += paragraphTokens;
    }
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n\n'));
  }
  
  return chunks;
}

async function processFiles(directoryPath) {
  try {
    const files = await fs.readdir(directoryPath);
    const batchSize = 10;

    for (const file of files) {
      const filePath = path.join(directoryPath, file);
      const stats = await fs.stat(filePath);
      
      if (stats.isFile()) {
        console.log(`Processing ${file}...`);
        const content = await fs.readFile(filePath, 'utf-8');
        
        const chunks = splitIntoChunks(content, file);
        console.log(`Split into ${chunks.length} chunks`);
        console.log(`Average chunk size: ${chunks.reduce((acc, chunk) => acc + chunk.length, 0) / chunks.length} characters`);
        
        for (let i = 0; i < chunks.length; i += batchSize) {
          const batch = chunks.slice(i, i + batchSize);
          const promises = batch.map(async (chunk, index) => {
            const chunkNum = i + index + 1;
            console.log(`Processing chunk ${chunkNum}/${chunks.length} of ${file} (${chunk.length} chars)`);
            try {
              const embedding = await getEmbedding(chunk);
              await storeEmbedding({
                content: chunk,
                embedding: embedding,
                filename: file
              });
              console.log(`✓ Chunk ${chunkNum} processed successfully`);
            } catch (error) {
              console.error(`Error processing chunk ${chunkNum}:`, error.message);
            }
          });
          
          await Promise.all(promises);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log(`✓ Completed processing ${file}\n`);
      }
    }
  } catch (error) {
    console.error('Error processing files:', error);
    throw error;
  }
}

async function storeEmbedding({ content, embedding, filename }) {
  try {
    // Check if content already exists
    const { data: existing } = await supabase
      .from('embeddings')
      .select('id')
      .eq('content', content)
      .eq('filename', filename)
      .maybeSingle();
      
    if (existing) {
      console.log('Content already embedded, skipping...');
      return existing;
    }
    
    const { data, error } = await supabase
      .from('embeddings')
      .insert([{
        content,
        embedding,
        filename,
        metadata: {
          chunk_length: content.length,
          created_at: new Date().toISOString(),
          embedding_model: 'text-embedding-ada-002'
        }
      }]);
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error storing embedding:', error);
    throw error;
  }
}


// In index.js, update the searchSimilarContent function
async function searchSimilarContent(question) {
  try {
    console.log('\n=== Search Query ===');
    console.log('Question:', question);
    
    const embedding = await getEmbedding(question);
    
    console.log('\n=== Searching Supabase ===');
    const { data: matches, error } = await supabase
      .rpc('match_documents', {
        query_embedding: embedding,
        match_threshold: 0.75, // Increased threshold for better precision
        match_count: 10 // Reduced for more focused results
      });
      
    if (error) throw error;

    console.log(`\nFound ${matches.length} matches`);
    
    // Log detailed match information
    matches.forEach((match, i) => {
      console.log(`\nMatch ${i + 1} (Similarity: ${match.similarity.toFixed(4)})`);
      console.log('Content:', match.content);
      console.log('Source:', match.filename);
      console.log('-------------------');
    });
    
    return matches;
  } catch (error) {
    console.error('Error in searchSimilarContent:', error);
    throw error;
  }
}

// Also add more logging to the getEmbedding function
async function getEmbedding(text, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log('Getting embedding for text length:', text.length);
      const response = await Promise.race([
        openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: text,
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('OpenAI API timeout')), 30000)
        )
      ]);
      console.log('Successfully got embedding from OpenAI');
      return response.data[0].embedding;
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(`Retry ${i + 1}/${retries} after error:`, error.message);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

async function generateAnswer(question, context, matches) {
  try {
    const prompt = `You are an AI assistant for The Arabidopsis Information Resource (TAIR). 
    Answer questions based ONLY on the provided context. 
    
    Important instructions:
    1. If you find specific institutions in the context, ALWAYS list them explicitly
    2. If you're stating a count, ALWAYS provide the specific names as well
    3. If information is not in the context, say "I don't have enough information to answer that question. Please email curator@arabidopsis.org."
    4. Format lists of institutions as numbered items

    Remember: Being specific and complete is crucial - if you mention a number, you must list the specific items.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: prompt
        },
        {
          role: 'user',
          content: `Question: ${question}\n\nContext:\n${context}`
        }
      ],
      temperature: 0.1,  // Very low temperature for consistent, precise responses
      max_tokens: 1000
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating answer:', error);
    throw error;
  }
}

export {
  searchSimilarContent,
  generateAnswer,
  processFiles
};