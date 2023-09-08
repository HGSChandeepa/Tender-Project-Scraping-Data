const puppeteer = require("puppeteer");

async function scrapeData() {
  try {
    const browser = await puppeteer.launch({
      headless: false,
    });
    const page = await browser.newPage();

    // Initialize an array to store all the links
    const allLinks = [];

    // Loop through the pages
    for (let pageCounter = 1; pageCounter <= 8; pageCounter++) {
      const url = `https://www.tenders.gov.au/atm?page=${pageCounter}`;
      await page.goto(url);

      // Wait for the table or element containing links to load
      await page.waitForSelector(".boxEQH");

      // Extract links inside the div with class "list-desc-inner"
      const links = await page.evaluate(() => {
        const linkElements = Array.from(
          document.querySelectorAll(".list-desc-inner a")
        );
        const uniqueLinks = new Set();

        for (const linkElement of linkElements) {
          const href = linkElement.getAttribute("href");
          if (href) {
            uniqueLinks.add("https://www.tenders.gov.au" + href);
          }
        }

        return Array.from(uniqueLinks);
      });

      // Visit each link and collect title
      for (const link of links) {
        await page.goto(link);

        // Wait for the element with class "lead" to load
        await page.waitForSelector(".lead");

        // Extract title
        const title = await page.evaluate(() => {
          const titleElement = document.querySelector(".lead");
          return titleElement ? titleElement.textContent.trim() : "";
        });

        // Create an object with title and link and push it to the allLinks array
        allLinks.push({ title, link });
      }
    }

    // Print all the collected title and link objects
    console.log(allLinks);

    await browser.close();
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

scrapeData();
