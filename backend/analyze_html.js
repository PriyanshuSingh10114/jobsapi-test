const fs = require('fs');
const html = fs.readFileSync('greenhouse_diagnostic.html', 'utf8');

// Find all matches for "apply" (case insensitive) with a bit of context
const applyRegex = /.{0,50}apply.{0,50}/gi;
const matches = [...html.matchAll(applyRegex)];
console.log(`Found ${matches.length} instances of 'apply'`);

for (let i = 0; i < Math.min(10, matches.length); i++) {
  console.log(`Match ${i+1}: ${matches[i][0]}`);
}

// Check if there are any iframes
const iframeRegex = /<iframe[^>]*>/gi;
const iframes = [...html.matchAll(iframeRegex)];
console.log(`Found ${iframes.length} iframes`);
for (let i = 0; i < Math.min(5, iframes.length); i++) {
  console.log(`Iframe ${i+1}: ${iframes[i][0]}`);
}
