#!/usr/bin/env node

/**
 * Script to extract bytecode from Foundry compilation artifacts
 * Usage: node scripts/get-bytecode.js
 * 
 * This script reads the compiled contract JSON from Foundry's out directory
 * and extracts the bytecode for use in the frontend.
 */

const fs = require('fs');
const path = require('path');

// Path to the Foundry artifact
const artifactPath = path.join(__dirname, '../../contract/out/UZRLeverage.sol/UZRLeverage.json');

try {
  if (!fs.existsSync(artifactPath)) {
    console.error('❌ Artifact not found!');
    console.error('Please compile the contract first:');
    console.error('  cd contract && forge build');
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  
  // Get the bytecode (deployedBytecode is the runtime bytecode, bytecode includes constructor)
  const bytecode = artifact.bytecode?.object;
  
  if (!bytecode) {
    console.error('❌ Bytecode not found in artifact!');
    process.exit(1);
  }

  console.log('✅ Bytecode extracted successfully!\n');
  console.log('Full bytecode:');
  console.log(bytecode);
  console.log('\n' + '='.repeat(80) + '\n');
  console.log('Bytecode length:', bytecode.length, 'characters');
  console.log('Bytecode length (bytes):', (bytecode.length - 2) / 2); // Subtract 0x, divide by 2
  
  // Show first and last bytes for verification
  console.log('\nFirst 32 bytes:', bytecode.substring(0, 66));
  console.log('Last 32 bytes:', '...' + bytecode.substring(bytecode.length - 64));

  // Create a TypeScript snippet to update contracts.ts
  console.log('\n' + '='.repeat(80) + '\n');
  console.log('📋 Copy this to frontend/lib/contracts.ts:\n');
  console.log(`export const UZRLeverageBytecode = "${bytecode}" as const;`);
  
} catch (error) {
  console.error('❌ Error reading artifact:', error.message);
  process.exit(1);
}