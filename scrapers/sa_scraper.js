const puppeteer = require("puppeteer");

async function scrapeData() {
  try {
    const browser = await puppeteer.launch({
      headless: false,
    });

    const page = await browser.newPage();

    const pageUrls = [
      "https://www.tenders.sa.gov.au/tender/search?preset=new&page=1",
      "https://www.tenders.sa.gov.au/tender/search?preset=new&page=2",
    ];

    const allData = [];

    for (const pageUrl of pageUrls) {
      await page.goto(pageUrl);

      //wait for the table to load
      await page.waitForSelector("tbody tr");

      // Get the links and text from the second <td> in each row
      const data = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll("tbody tr"));
        const rowData = rows.map((row) => {
          const secondTd = row.querySelector("td:nth-child(2)");
          const link = secondTd.querySelector("a");
          const linkText = link ? link.textContent.trim() : "";
          const linkHref = link ? link.href : "";

          // Check if both linkText and linkHref are not empty before including in the result
          if (linkText && linkHref) {
            return { text: linkText, link: linkHref };
          }

          // If both linkText and linkHref are empty, skip this row
          return null;
        });

        // Filter out rows with empty results
        return rowData.filter((item) => item !== null);
      });

      // Add the data from the current page to the overall list
      allData.push(...data);
    }

    // Print the scraped data
    console.log(allData);

    await browser.close();
  } catch (error) {
    console.log(error);
  }
}

scrapeData();
