const puppeteer = require("puppeteer");

async function scrapeData() {
  try {
    const browser = await puppeteer.launch({
      headless: false,
    });

    const page = await browser.newPage();

    const baseUrl =
      "https://www.tenders.vic.gov.au/tender/search?preset=open&page=";

    const totalPages = 4; // Define the total number of pages to scrape

    const allData = [];

    for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
      // Navigate to the current page
      const pageUrl = `${baseUrl}${currentPage}`;
      await page.goto(pageUrl);

      // Wait for the main data body to load
      await page.waitForSelector("#content > div.tender-table");

      // Get the links, opening date, and closing date from each row
      const data = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll("tbody tr"));
        return rows.map((row) => {
          const linkElement = row.querySelector("td:nth-child(2) a");
          const openingDateElement = row.querySelector(".opening_date");
          const closingDateElement = row.querySelector(".closing_date");

          return {
            link: linkElement ? linkElement.href : "",
            openingDate: openingDateElement
              ? openingDateElement.textContent.trim()
              : "",
            closingDate: closingDateElement
              ? closingDateElement.textContent.trim()
              : "",
          };
        });
      });

      // Add the data from the current page to the overall list
      allData.push(...data);
    }

    // Print all scraped data
    console.log(allData);

    await browser.close();
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

scrapeData();
