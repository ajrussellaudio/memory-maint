/**
 * Example: How an OpenClaw agent would use memory-maint
 * 
 * This is not a standalone script - it shows the code pattern
 * that an agent would use when calling this skill.
 */

// Example usage from an agent context
async function exampleAgentUsage() {
  const { runReview, applyReviewFile } = require('../lib/memoryMaint');
  const path = require('path');
  
  const skillPath = path.join(process.env.HOME, 'Documents/playground/memory-maint');
  
  try {
    // Run review
    const result = await runReview({
      days: 7,
      skillPath: skillPath,
      sessions_spawn: sessions_spawn,  // Agent's built-in function
      logger: console.log
    });
    
    if (!result.success) {
      console.log('No review needed:', result.reason);
      return;
    }
    
    if (result.totalItems === 0) {
      console.log('Nothing new to add to MEMORY.md');
      return;
    }
    
    console.log(`\n📋 Review complete: ${result.totalItems} items extracted`);
    console.log(`📄 Review file: ${result.reviewPath}`);
    console.log('\nNext steps:');
    console.log('1. Read and review the suggestions');
    console.log('2. Edit if needed');
    console.log('3. Call applyReviewFile() to update MEMORY.md');
    
    // Optionally auto-apply (after agent confirms)
    // await applyReviewFile({
    //   reviewPath: result.reviewPath,
    //   skillPath: skillPath,
    //   dryRun: false,
    //   logger: console.log
    // });
    
  } catch (error) {
    console.error('Error running memory review:', error.message);
  }
}

// This would be called by the agent when needed, e.g.:
// - During weekly heartbeat
// - When user asks "review my memory"
// - As part of maintenance routine
