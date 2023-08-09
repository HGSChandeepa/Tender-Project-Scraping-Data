const puppeteer = require("puppeteer");
const fs = require("fs");

async function scrapeData() {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Navigate to the tender
    await page.goto(
      "https://qtenders.epw.qld.gov.au/qtenders/tender/search/tender-search.do?action=advanced-tender-search-open-tender&orderBy=closeDate&CSRFNONCE=49F003A9DDC190F17DD339DBF0150A39z"
    );

    // Wait for the main data body to load
    await page.waitForSelector(
      "#content_content > table:nth-child(2) > tbody > tr > td:nth-child(2) > table:nth-child(5) > tbody"
    );

    // Evaluate and extract the links from the table
    const links = await page.$$eval("#MSG", (linkElements) => {
      // Extract href values from link elements
      const hrefs = linkElements.map((element) => element.href);

      // Remove duplicate href values
      const uniqueHrefs = [...new Set(hrefs)];
      return uniqueHrefs;
    });

    const tenderTitles = [];

    // Loop through each link and navigate to the tender page
    for (const link of links) {
      const tenderPage = await browser.newPage();
      await tenderPage.goto(link);

      // Wait for the tender title to load
      await tenderPage.waitForSelector(
        "#content_content > table:nth-child(1) > tbody"
      );

      // Extract and store the tender title
      const tenderTitle = await tenderPage.$eval(".TITLE", (titleElement) =>
        titleElement.textContent.trim().replace(/\s+/g, " ")
      );

      tenderTitles.push(tenderTitle);

      await tenderPage.close(); // Close the tender page
    }

    // Store the tender titles in a JSON file
    const data = JSON.stringify(tenderTitles, null, 2);
    fs.writeFile("QT-tenderData.json", data, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Data saved to QT-tenderData.json");
      }
    });

    await browser.close();
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

scrapeData();
