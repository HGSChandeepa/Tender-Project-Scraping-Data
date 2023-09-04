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

    const allLinks = [];

    for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
      // Navigate to the current page
      const pageUrl = `${baseUrl}${currentPage}`;
      await page.goto(pageUrl);

      // Wait for the main data body to load
      await page.waitForSelector("#content > div.tender-table");

      // Get the links from the 2nd <td> tag in each table row
      const links = await page.evaluate(() => {
        const linkElements = document.querySelectorAll(
          "tbody tr td:nth-child(2) a"
        );
        const hrefs = Array.from(linkElements).map(
          (linkElement) => linkElement.href
        );
        return hrefs;
      });

      // Add the links from the current page to the overall list
      allLinks.push(...links);
    }

    // Print all scraped links
    console.log(allLinks);

    await browser.close();
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

scrapeData();
