import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
const envPath = path.resolve(__dirname, '..', '.env');
console.log(`🔍 Loading environment from: ${envPath}`);

// Read the .env file directly
const envContent = fs.readFileSync(envPath, 'utf8');
console.log('📄 .env file content:');
console.log(envContent);

// Parse the .env file
const envConfig = dotenv.parse(envContent);
console.log('\n🔑 Parsed environment variables:');
console.log(envConfig);

// Verify specific variables
console.log('\n🔍 Verifying specific variables:');
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_PROJECT_REF',
  'SUPABASE_SERVICE_ROLE_KEY'
];

for (const varName of requiredVars) {
  console.log(`${varName}: ${envConfig[varName] ? '✅ Found' : '❌ Missing'}`);
}

// Extract project ID from URL
if (envConfig.NEXT_PUBLIC_SUPABASE_URL) {
  const match = envConfig.NEXT_PUBLIC_SUPABASE_URL.match(/https?:\/\/([^.]+)\.supabase\.co/);
  if (match) {
    console.log(`\n🔗 Extracted project ID from URL: ${match[1]}`);
  } else {
    console.log('\n❌ Could not extract project ID from NEXT_PUBLIC_SUPABASE_URL');
  }
}
