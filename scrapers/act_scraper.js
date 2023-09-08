const puppeteer = require("puppeteer");

async function act_ScraperData() {
  try {
    const browser = await puppeteer.launch({
      headless: false,
    });

    const page = await browser.newPage();

    // Define the base URL
    const baseUrl =
      "https://www.tenders.act.gov.au/tender/search?preset=open&page=";

    // Define the total number of pages to scrape
    const totalPages = 2;

    const allData = [];

    for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
      const pageUrl = `${baseUrl}${currentPage}`;

      await page.goto(pageUrl);

      // Wait for the main data body to load
      await page.waitForSelector("tbody");

      // Extract links with href starting with "https://www.tenders.act.gov.au/tender/"
      const links = await page.evaluate(() => {
        const linkElements = Array.from(
          document.querySelectorAll("span.tablesaw-cell-content a")
        );
        const filteredLinks = linkElements
          .map((linkElement) => linkElement.href)
          .filter((href) =>
            href.startsWith("https://www.tenders.act.gov.au/tender/")
          );
        return filteredLinks;
      });

      for (const link of links) {
        await page.goto(link);

        // Wait for the title element to load
        await page.waitForSelector("#tenderTitle");

        // Extract the title
        const title = await page.$eval("#tenderTitle", (titleElement) =>
          titleElement.textContent.trim()
        );

        // Push the title and link to the data array
        allData.push({ title, link });
      }
    }

    // Print all scraped data
    console.log(allData);

    await browser.close();
  } catch (err) {
    console.log(err);
  }
}

act_ScraperData();
