#!/usr/bin/env node

/**
 * Example script demonstrating how to use the Directus Template CLI API
 * 
 * Prerequisites:
 * 1. Start the API server: npm start
 * 2. Have a running Directus instance
 * 3. Have a template ready to apply or extract
 */

// Configuration
const API_BASE_URL = 'http://localhost:3000';
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || 'admin-token-here';

/**
 * Example 1: Health Check
 */
async function checkHealth() {
  console.log('\n📊 Checking API health...');
  const response = await fetch(`${API_BASE_URL}/health`);
  const data = await response.json();
  console.log('Health status:', data);
  return data;
}

/**
 * Example 2: Apply a template
 */
async function applyTemplate() {
  console.log('\n📦 Applying template...');
  
  const payload = {
    directusUrl: DIRECTUS_URL,
    directusToken: DIRECTUS_TOKEN,
    templateLocation: './my-template',
    templateType: 'local',
    // Optional: partial application
    partial: false,
    schema: true,
    permissions: true,
    content: true,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Template applied successfully!');
      console.log('Details:', data);
    } else {
      console.error('❌ Failed to apply template:', data.error);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

/**
 * Example 3: Extract a template
 */
async function extractTemplate() {
  console.log('\n📥 Extracting template...');
  
  const payload = {
    directusUrl: DIRECTUS_URL,
    directusToken: DIRECTUS_TOKEN,
    templateLocation: './extracted-template',
    templateName: 'My Extracted Template',
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Template extracted successfully!');
      console.log('Details:', data);
    } else {
      console.error('❌ Failed to extract template:', data.error);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

/**
 * Example 4: Apply with email/password authentication
 */
async function applyWithEmailAuth() {
  console.log('\n📦 Applying template with email/password...');
  
  const payload = {
    directusUrl: DIRECTUS_URL,
    userEmail: process.env.DIRECTUS_EMAIL || 'admin@example.com',
    userPassword: process.env.DIRECTUS_PASSWORD || 'admin',
    templateLocation: './my-template',
    templateType: 'local',
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Template applied successfully!');
    } else {
      console.error('❌ Failed to apply template:', data.error);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

/**
 * Example 5: Partial template application
 */
async function applyPartialTemplate() {
  console.log('\n📦 Applying template partially (only schema and permissions)...');
  
  const payload = {
    directusUrl: DIRECTUS_URL,
    directusToken: DIRECTUS_TOKEN,
    templateLocation: './my-template',
    templateType: 'local',
    partial: true,
    schema: true,
    permissions: true,
    content: false,
    users: false,
    files: false,
    flows: false,
    dashboards: false,
    extensions: false,
    settings: false,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Partial template applied successfully!');
      console.log('Details:', data);
    } else {
      console.error('❌ Failed to apply template:', data.error);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// Main execution
async function main() {
  console.log('🚀 Directus Template CLI API Examples\n');
  console.log('Configuration:');
  console.log('  API URL:', API_BASE_URL);
  console.log('  Directus URL:', DIRECTUS_URL);
  console.log('  Using token:', DIRECTUS_TOKEN ? '✓' : '✗');
  
  // Run health check
  await checkHealth();
  
  // Choose which example to run based on command line argument
  const example = process.argv[2];
  
  switch (example) {
    case 'apply':
      await applyTemplate();
      break;
    case 'extract':
      await extractTemplate();
      break;
    case 'email-auth':
      await applyWithEmailAuth();
      break;
    case 'partial':
      await applyPartialTemplate();
      break;
    case 'health':
      // Already ran health check
      break;
    default:
      console.log('\n📚 Available examples:');
      console.log('  node examples/api-usage.js health       - Check API health');
      console.log('  node examples/api-usage.js apply        - Apply a template');
      console.log('  node examples/api-usage.js extract      - Extract a template');
      console.log('  node examples/api-usage.js email-auth   - Apply with email/password');
      console.log('  node examples/api-usage.js partial      - Apply partial template');
      console.log('\n💡 Set environment variables:');
      console.log('  DIRECTUS_URL=http://localhost:8055');
      console.log('  DIRECTUS_TOKEN=your-token');
      console.log('  DIRECTUS_EMAIL=admin@example.com');
      console.log('  DIRECTUS_PASSWORD=admin');
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { checkHealth, applyTemplate, extractTemplate, applyWithEmailAuth, applyPartialTemplate };
