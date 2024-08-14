const express = require('express');
const fs = require('fs').promises;
const puppeteer = require('puppeteer');
const path = require('path');

// Paths to the config and log files
const configPath = path.join(__dirname, 'public', 'config.json');
const logPath = path.join(__dirname, 'logs', 'update.log');

let browser;
let page;

// Function to read the config file and visit the website
async function visitWebsite() {
  const config = await fs.readFile(configPath, 'utf-8');
  const { website } = JSON.parse(config);

  console.log(`Visiting: ${website}`);

  if (browser) await browser.close();

  browser = await puppeteer.launch({ headless: true });
  page = await browser.newPage();
  await page.goto(website, { waitUntil: 'networkidle2' });
}

// Function to log updates to the log file
async function logUpdate(newWebsite) {
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} - Website updated to: ${newWebsite}\n`;
  await fs.appendFile(logPath, logEntry, 'utf-8');
}

// Express server setup
const app = express();
app.use(express.json());

app.post('/update-website', async (req, res) => {
  const { website } = req.body;

  if (!website) {
    return res.status(400).send('Website URL is required');
  }

  // Update the config file
  const newConfig = JSON.stringify({ website }, null, 2);
  await fs.writeFile(configPath, newConfig, 'utf-8');

  // Log the update
  await logUpdate(website);

  // Restart Puppeteer with the new website
  await visitWebsite();

  res.send(`Website updated to ${website} and browser restarted.`);
});

// Start the Express server and initial Puppeteer visit
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  await visitWebsite();
});
