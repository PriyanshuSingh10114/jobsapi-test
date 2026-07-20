const mongoose = require('mongoose');
const ApplicationStateMachine = require('./src/automation/engine/ApplicationStateMachine');
const ApplicationSession = require('./src/models/ApplicationSession');

async function runTests() {
  console.log('Testing state machine transitions...');
  
  const machine = new ApplicationStateMachine('dummy');
  // Mock the session
  machine.session = new ApplicationSession({
    jobId: new mongoose.Types.ObjectId(),
    connectorName: 'test',
    status: 'Pending'
  });

  const testTransition = (from, to, shouldPass) => {
    machine.session.status = from;
    const result = machine.canTransitionTo(to);
    if (result === shouldPass) {
      console.log(`✅ [${from}] -> [${to}]: ${shouldPass ? 'ALLOWED' : 'BLOCKED'} as expected.`);
    } else {
      console.error(`❌ [${from}] -> [${to}]: Expected ${shouldPass}, got ${result}`);
      process.exit(1);
    }
  };

  // Valid flow
  testTransition('Pending', 'BrowserStarted', true);
  testTransition('BrowserStarted', 'JobOpened', true);
  testTransition('JobOpened', 'AnalyzingForm', true);
  testTransition('AnalyzingForm', 'FillingProfile', true);
  testTransition('FillingProfile', 'UploadingResume', true);
  testTransition('UploadingResume', 'AnsweringQuestions', true);
  testTransition('AnsweringQuestions', 'PendingUserInput', true);
  testTransition('PendingUserInput', 'ReadyForSubmission', true);
  testTransition('ReadyForSubmission', 'Submitting', true);
  testTransition('Submitting', 'Submitted', true);
  testTransition('Submitted', 'Verified', true);
  testTransition('Verified', 'Completed', true);

  // Illegal transitions
  testTransition('Pending', 'Completed', false);
  testTransition('BrowserStarted', 'Submitted', false);
  testTransition('JobOpened', 'ReadyForSubmission', false);
  testTransition('FillingProfile', 'Pending', false);
  
  // Failure transitions
  testTransition('AnalyzingForm', 'Failed', true);
  testTransition('UploadingResume', 'Cancelled', true);
  testTransition('Failed', 'Pending', true);

  console.log('\nAll tests passed successfully!');
}

runTests();
