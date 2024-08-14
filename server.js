const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const puppeteer = require('puppeteer');

const app = express();
const port = 3000;
const configPath = path.join(__dirname, 'public', 'config.json');
const logPath = path.join(__dirname, 'public', 'error.log');

let browser, page;

// Function to start the Puppeteer browser
async function startBrowser() {
  const config = await getConfig();
  browser = await puppeteer.launch({ headless: true });
  page = await browser.newPage();
  await page.goto(config.website);

  // Extract and log the page title
  const title = await page.title();
  console.log(`Visited ${config.website} | Page Title: ${title}`);
}

// Function to stop the Puppeteer browser
async function stopBrowser() {
  if (browser) {
    await browser.close();
    console.log('Browser closed.');
  }
}

// Function to get the current config or create a new one if it doesn't exist
async function getConfig() {
  try {
    const data = await fs.readFile(configPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    await logError(err);

    // If config.json doesn't exist or we don't have permission, create a new one
    const defaultConfig = { website: 'https://example.com' };
    await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
    console.log('New config.json created with default settings.');
    return defaultConfig;
  }
}

// Function to update the config and restart the browser
async function updateConfig(newConfig) {
  try {
    await fs.writeFile(configPath, JSON.stringify(newConfig, null, 2));
    console.log('Config updated.');

    await stopBrowser();
    await startBrowser();
  } catch (err) {
    await logError(err);
  }
}

// Function to log errors to a file
async function logError(err) {
  const errorLog = `[${new Date().toISOString()}] ${err.message}\n`;
  await fs.appendFile(logPath, errorLog);
  console.error('An error occurred:', err.message);
}

// Route to update the website in the config
app.use(express.json());
app.post('/update-website', async (req, res) => {
  const { website } = req.body;

  if (!website) {
    return res.status(400).send('Website URL is required.');
  }

  const newConfig = { website };
  await updateConfig(newConfig);

  res.send(`Website updated to ${website}`);
});

// Start the Express server and Puppeteer
app.listen(port, async () => {
  console.log(`Server running on http://localhost:${port}`);
  await startBrowser();
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await stopBrowser();
  process.exit();
});
