const puppeteer = require("puppeteer");

async function scrapeData() {
  try {
    const browser = await puppeteer.launch({
      headless: false,
    });
    const page = await browser.newPage();

    const baseUrl =
      "https://suppliers.buy.nsw.gov.au/opportunity/search?types=Tenders";
    let currentPage = 1;
    const allLinks = [];

    while (currentPage <= 9) {
      // Navigate to the current page
      const pageUrl = `${baseUrl}&page=${currentPage}`;
      await page.goto(pageUrl);

      // Wait for the main data body to load
      await page.waitForSelector("#search-results > ul > li");

      // Get the links from the first <a> tag within each <li> element
      const links = await page.evaluate(() => {
        const listItems = document.querySelectorAll(
          "#search-results > ul > li"
        );
        const linkArray = Array.from(listItems).map((listItem) => {
          const firstLink = listItem.querySelector("a");
          return firstLink ? firstLink.href : null;
        });
        return linkArray;
      });

      // If no links were found on the current page, exit the loop
      if (links.length === 0) {
        break;
      }

      // Add the links from the current page to the overall list
      allLinks.push(...links);

      // Move to the next page
      currentPage++;
    }

    // Print all scraped links
    console.log(allLinks);

    await browser.close();
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

scrapeData();
