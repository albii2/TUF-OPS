#!/usr/bin/env node
const { Client } = require('pg');
require('dotenv').config();

function formatUserDisplay(user) {
  if (user.role === 'ADMIN') {
    return `Admin · ${user.region || 'National'}`;
  }
  if (user.role === 'REGIONAL_DIRECTOR') {
    return `Regional Director · ${user.region || 'Midwest'}`;
  }
  if (user.role === 'DIRECTOR') {
    const parts = ['Director'];
    if (user.state_market) {
      if (user.division) {
        parts.push(`${user.state_market} ${user.division}`);
      } else {
        parts.push(user.state_market);
      }
    }
    if (user.subterritory) parts.push(user.subterritory);
    return parts.join(' · ');
  }
  // REP:
  const parts = ['Rep'];
  if (user.state_market) {
    if (user.division) {
      parts.push(`${user.state_market} ${user.division}`);
    } else {
      parts.push(user.state_market);
    }
  }
  const territoryPart = user.subterritory || user.territory;
  if (territoryPart) parts.push(territoryPart);
  return parts.join(' · ');
}

async function validateLaunchUserDisplay() {
  const databaseUrl = process.env.DATABASE_URL || process.env.TEST_DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ Error: Neither DATABASE_URL nor TEST_DATABASE_URL is set in environment.');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  try {
    await client.connect();
    console.log('Connected to database for launch user display validation...');

    // Fetch users
    const res = await client.query('SELECT * FROM users');
    const users = res.rows;

    const brad = users.find(u => lowerIncludes(u.name, 'bradshaw') || u.email === 'owner@tuf.local');
    const primeau = users.find(u => lowerIncludes(u.name, 'primeau') || u.email === 'primeau.hill@tufsports.us');

    if (!brad) throw new Error('Bradshaw user not found in database.');
    if (!primeau) throw new Error('Primeau user not found in database.');

    const bradDisplay = formatUserDisplay(brad);
    const primeauDisplay = formatUserDisplay(primeau);

    console.log(`Brad Display: "${bradDisplay}"`);
    console.log(`Primeau Display: "${primeauDisplay}"`);

    // Verify Bradshaw display
    if (bradDisplay !== 'Admin · National') {
      throw new Error(`Brad Bradshaw display formatted incorrectly: "${bradDisplay}". Expected "Admin · National".`);
    }

    // Verify Primeau display
    // Support "Director · MN General · Metro + North"
    if (primeauDisplay !== 'Director · MN General · Metro + North') {
      throw new Error(`Primeau Hill display formatted incorrectly: "${primeauDisplay}". Expected "Director · MN General · Metro + North".`);
    }

    console.log('✅ User displays formatted correctly according to launch rules.');
    console.log('🎉 Launch user display validations passed!');
  } catch (err) {
    console.error('❌ Validation Failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

function lowerIncludes(str, search) {
  return String(str || '').toLowerCase().includes(search.toLowerCase());
}

validateLaunchUserDisplay();
