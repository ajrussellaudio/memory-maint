/**
 * Test script for memory-maint
 * Run this from an OpenClaw agent to test the review functionality
 */

const { runReview } = require('./lib/memoryMaint');
const path = require('path');

async function test() {
  const skillPath = path.join(__dirname);
  
  console.log('Testing memory-maint review...\n');
  console.log(`Skill path: ${skillPath}\n`);
  
  try {
    const result = await runReview({
      days: 3,
      skillPath: skillPath,
      sessions_spawn: sessions_spawn,  // Use OpenClaw's sessions_spawn
      logger: console.log
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('RESULT:');
    console.log('='.repeat(80));
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

test();
