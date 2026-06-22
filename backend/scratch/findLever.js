const axios = require('axios');
const possible = [
  'leverdemo', 'auth0', 'figma', 'notion', 'canva', 'shopify', 'stripe', 'plaid', 
  'replit', 'vercel', 'supabase', 'render', 'fly', 'hashicorp', 'databricks', 
  'snowflake', 'confluent', 'mongodb', 'elastic', 'redis', 'neo4j', 'datadog', 
  'newrelic', 'dynatrace', 'sentry', 'launchdarkly', 'optimizely', 'amplitude', 
  'mixpanel', 'segment', 'twilio', 'sendgrid', 'mailchimp', 'intercom', 'zendesk', 
  'freshworks', 'hubspot', 'salesforce', 'marketo', 'gong', 'outreach', 'calendly', 
  'zoom', 'slack', 'discord', 'asana', 'monday', 'smartsheet', 'airtable', 
  'miro', 'lucid', 'invision', 'framer', 'webflow', 'wix', 'squarespace', 
  'godaddy', 'namecheap', 'digitalocean', 'linode', 'vultr', 'heroku', 'aws', 
  'gcp', 'azure', 'ibm', 'oracle', 'sap', 'workday', 'servicenow', 'atlassian', 
  'okta', 'crowdstrike', 'paloaltonetworks', 'fortinet', 'zscaler', 'cloudflare', 
  'fastly', 'akamai', 'f5', 'cisco', 'juniper', 'arista', 'vmware', 'redhat', 
  'canonical', 'suse', 'docker', 'kubernetes', 'gitlab', 'github', 'bitbucket', 
  'jira', 'confluence', 'trello'
];

async function test() {
  const valid = [];
  for (const c of possible) {
    if (valid.length >= 5) break;
    try {
      await axios.head(`https://api.lever.co/v0/postings/${c}?mode=json`);
      valid.push(c);
      console.log(`Found valid: ${c}`);
    } catch (e) {
      // skip
    }
  }
  console.log("Valid Lever Companies:", valid);
}
test();
