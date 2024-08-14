const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const app = express();
const PORT = 4000;

// Define the paths for the log file and the website URL file
const logFilePath = path.join(__dirname, 'public', 'browser-logs.txt');
const websiteFilePath = path.join(__dirname, 'public', 'website.txt');

// Ensure the 'public' folder exists
if (!fs.existsSync(path.dirname(logFilePath))) {
  fs.mkdirSync(path.dirname(logFilePath));
}

// Promisify file operations
const appendToLogFile = promisify(fs.appendFile);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

let browser, page;

// Function to start Puppeteer with the website from the text file
async function startBrowser() {
  // Read the website URL from the text file
  const website = await readFile(websiteFilePath, 'utf-8');
  
  // Launch a new browser instance
  browser = await puppeteer.launch({ headless: true });
  
  // Open a new page
  page = await browser.newPage();

  // Add an event listener for console messages
  page.on('console', async msg => {
    const text = msg.text();
    console.log('Browser console message:', text);
    await appendToLogFile(logFilePath, text + '\n');
  });

  // Go to the website
  await page.goto(website.trim(), {
    waitUntil: "networkidle0",
    timeout: 0
  });

  // Additional actions can go here...
}

// Function to restart the browser
async function restartBrowser() {
  if (browser) {
    await browser.close();
  }
  await startBrowser();
}

app.get('/', (req, res) => {
  res.send({ message: "Server running" });
});

// Route to download the log file
app.get('/download-logs', (req, res) => {
  res.download(logFilePath, 'browser-logs.txt', (err) => {
    if (err) {
      console.error('Error downloading file:', err);
      res.status(500).send('Error downloading file.');
    }
  });
});

// Route to update the website URL in the text file and restart the browser
app.post('/update-website', express.json(), async (req, res) => {
  const { website } = req.body;

  if (!website) {
    return res.status(400).send('Website URL is required.');
  }

  try {
    // Update the website URL in the text file
    await writeFile(websiteFilePath, website);

    // Restart the browser with the new URL
    await restartBrowser();

    res.send({ message: `Website updated to ${website} and browser restarted.` });
  } catch (error) {
    console.error('Error updating website:', error);
    res.status(500).send('Error updating website.');
  }
});

app.listen(PORT, () => {
  console.log(`Test server is running on http://localhost:${PORT}`);
});

// Start the browser initially
startBrowser().catch(error => {
  console.error('Error starting the browser:', error);
});
