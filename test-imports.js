// Test importing core and llm packages
const core = require('./packages/core/dist');
const llm = require('./packages/llm/dist');

console.log('Core package exports:', Object.keys(core));
console.log('LLM package exports:', Object.keys(llm));

// Test creating a digest item
const digestItem = {
  id: 'test-1',
  title: 'Test Item',
  content: 'This is a test digest item',
  source: 'test',
  url: 'https://example.com/test',
  createdAt: new Date().toISOString()
};

console.log('Test digest item:', digestItem);

// Test LLM summarizer (will need proper OpenAI key to actually run)
if (process.env.OPENAI_API_KEY) {
  const summarizer = new llm.OpenAISummarizer(process.env.OPENAI_API_KEY);
  console.log('LLM summarizer initialized');
} else {
  console.log('Set OPENAI_API_KEY environment variable to test LLM summarizer');
}
