const puppeteer = require("puppeteer");

async function scrapeData() {
  try {
    const browser = await puppeteer.launch({
      headless: false,
    });
    const page = await browser.newPage();
    await page.goto("https://tendersonline.nt.gov.au/Tender/List/#!/Current");

    // Wait for the table to load
    await page.waitForSelector(
      "#mainContent > div.ng-scope > div.ng-scope > div.panel-group.ng-scope > div:nth-child(2) > div.collapse.in > div > div > table"
    );

    // Extract links inside <tr> elements
    const links = await page.evaluate(() => {
      const trElements = Array.from(document.querySelectorAll("tbody tr"));
      const uniqueLinks = new Set();

      for (const trElement of trElements) {
        const linkElement = trElement.querySelector("a");
        if (linkElement) {
          const href = linkElement.getAttribute("href");
          if (href) {
            uniqueLinks.add("https://tendersonline.nt.gov.au" + href);
          }
        }
      }

      return Array.from(uniqueLinks);
    });

    // Create an array to store the title and link for each page
    const results = [];

    // Iterate through each link and get the title and link
    for (const link of links) {
      const page = await browser.newPage();
      await page.goto(link);

      // Wait for the title to load
      await page.waitForSelector(".form-control-static");

      // Extract the title
      const title = await page.$eval(
        ".form-control-static",
        (element) => element.textContent
      );

      results.push({ title, link });

      await page.close();
    }

    // Print the results
    console.log(results);

    await browser.close();
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

scrapeData();
