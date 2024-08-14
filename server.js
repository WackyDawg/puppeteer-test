const express = require('express');
const fs = require('fs').promises;
const puppeteer = require('puppeteer');

const app = express();
const port = 4000;

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

// Function to get the current config
async function getConfig() {
  const data = await fs.readFile('./public/config.json', 'utf8');
  return JSON.parse(data);
}

// Function to update the config and restart the browser
async function updateConfig(newConfig) {
  await fs.writeFile('./public/config.json', JSON.stringify(newConfig, null, 2));
  console.log('Config updated.');

  await stopBrowser();
  await startBrowser();
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
