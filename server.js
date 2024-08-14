const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const app = express();
const PORT = 4000;

// Define the path to the log file in the 'public' folder
const logFilePath = path.join(__dirname, 'public', 'browser-logs.txt');

// Ensure the 'public' folder exists
if (!fs.existsSync(path.dirname(logFilePath))) {
  fs.mkdirSync(path.dirname(logFilePath));
}

// Function to append data to the log file
const appendToLogFile = promisify(fs.appendFile);

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

app.listen(PORT, () => {
  console.log(`Test server is running on http://localhost:${PORT}`);
});

// Function to simulate a delay
function delay(time) {
  return new Promise(resolve => { 
    setTimeout(resolve, time);
  });
}

(async () => {
  // Launch a new browser instance
  const browser = await puppeteer.launch({ headless: true });

  // Open a new page
  const page = await browser.newPage();

  // Add an event listener for console messages
  page.on('console', async msg => {
    const text = msg.text();
    console.log('Browser console message:', text);
    await appendToLogFile(logFilePath, text + '\n');
  });

  // Go to a webpage
  await page.goto('https://mewing-resolute-cardboard.glitch.me/', {
    waitUntil: "networkidle0",
    timeout: 0
  });

  // Function to introduce a delay
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  await delay(2000);

  const inputSelector = '#AddrField';
  const BOTID = '43WJQfGyaivhEZBr95TZGy3HGei1LVUY5gqyUCAAE4viCRwzJgMcCn3ZVFXtySFxwZLFtrjMPJXhAT9iA9KYf4LoPoKiwBc';

  await page.type(inputSelector, BOTID);
  await page.keyboard.press("Enter");
  await delay(2000);

  await page.click('#WebBtn');

  // Start monitoring the H value
  setInterval(async () => {
    try {
      const HValue = await page.$eval('#WebH', el => el.textContent);
      console.log(`Hs: ${HValue}`);
    } catch (error) {
      console.error('Error fetching Hvalue:', error.message);
    }
  }, 5000);

  const pageTitle = await page.title();
  console.log(pageTitle);
  console.log(`Started discord bot on server ${BOTID}`);

  // Close the browser
  // await browser.close();

})();
