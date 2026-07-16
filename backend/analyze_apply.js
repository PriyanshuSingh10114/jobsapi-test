const fs = require('fs');
const html = fs.readFileSync('greenhouse_apply_page.html', 'utf8');

const appFormRegex = /id="application_form"/gi;
const appFormMatches = [...html.matchAll(appFormRegex)];
console.log(`Found ${appFormMatches.length} #application_form instances`);

const iframeRegex = /<iframe[^>]*>/gi;
const iframes = [...html.matchAll(iframeRegex)];
console.log(`Found ${iframes.length} iframes`);
for (let i = 0; i < Math.min(5, iframes.length); i++) {
  console.log(`Iframe ${i+1}: ${iframes[i][0]}`);
}
