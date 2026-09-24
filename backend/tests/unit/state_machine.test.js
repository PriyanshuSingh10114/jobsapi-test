const test = require('node:test');
const assert = require('node:assert');
const ApplicationStateMachine = require('../../src/automation/engine/ApplicationStateMachine');

test('ApplicationStateMachine allows valid forward linear transitions', () => {
  const sm = new ApplicationStateMachine('test-session-id');
  sm.session = {
    _id: 'test-session-id',
    status: 'Created',
    stateData: {},
    retryCount: 0,
    maxRetries: 3,
    save: async () => {}
  };

  assert.strictEqual(sm.canTransitionTo('Queued'), true);
  
  sm.session.status = 'Queued';
  assert.strictEqual(sm.canTransitionTo('WorkerAssigned'), true);

  sm.session.status = 'WorkerAssigned';
  assert.strictEqual(sm.canTransitionTo('LoadingProfile'), true);

  sm.session.status = 'Submitting';
  assert.strictEqual(sm.canTransitionTo('SubmissionVerification'), true);

  sm.session.status = 'SubmissionVerification';
  assert.strictEqual(sm.canTransitionTo('Completed'), true);
  assert.strictEqual(sm.canTransitionTo('CompletedWithWarnings'), true);
});

test('ApplicationStateMachine rejects invalid or skipped transitions', () => {
  const sm = new ApplicationStateMachine('test-session-id');
  sm.session = {
    _id: 'test-session-id',
    status: 'Created',
    stateData: {},
    save: async () => {}
  };

  // Cannot jump directly from Created to Submitting
  assert.strictEqual(sm.canTransitionTo('Submitting'), false);

  // Cannot jump from Created to Completed
  assert.strictEqual(sm.canTransitionTo('Completed'), false);

  // Once Failed, cannot transition to Completed
  sm.session.status = 'Failed';
  assert.strictEqual(sm.canTransitionTo('Completed'), false);
  assert.strictEqual(sm.canTransitionTo('Submitting'), false);

  // Once Completed, cannot transition backward
  sm.session.status = 'Completed';
  assert.strictEqual(sm.canTransitionTo('FillingFields'), false);
  assert.strictEqual(sm.canTransitionTo('Created'), false);
});

test('ApplicationStateMachine allows transition to Failed or Cancelled from active states', () => {
  const sm = new ApplicationStateMachine('test-session-id');
  sm.session = {
    _id: 'test-session-id',
    status: 'FillingFields',
    stateData: {},
    save: async () => {}
  };

  assert.strictEqual(sm.canTransitionTo('Failed'), true);
  assert.strictEqual(sm.canTransitionTo('Cancelled'), true);
});
