const puppeteer = require("puppeteer");

async function wa_ScraperData() {
  try {
    const browser = await puppeteer.launch({
      headless: false,
    });

    const page = await browser.newPage();

    await page.goto(
      "https://www.tenders.wa.gov.au/watenders/tender/search/tender-search.do?action=advanced-tender-search-new-tenders&CSRFNONCE=90529E78D0444F1A953E111CD1E03CC4&noreset=yes"
    );

    // Wait for the main data body to load
    await page.waitForSelector("#tenderSearchResultsTable > tbody");

    // Select the "All" option from the dropdown
    await page.select('select[name="tenderSearchResultsTable_length"]', "-1");

    // Wait for the page to load all results (since "All" will show all results)
    await page.waitForSelector("#tenderSearchResultsTable_info");

    // Extract all links within td elements with class "top"
    const links = await page.evaluate(() => {
      const linkElements = document.querySelectorAll(
        "#tenderSearchResultsTable tbody tr td.top a"
      );
      const hrefs = Array.from(linkElements)
        .map((linkElement) => linkElement.href)
        .filter((href) =>
          href.startsWith(
            "https://www.tenders.wa.gov.au/watenders/tender/display/"
          )
        );
      return hrefs;
    });

    // Initialize an array to store objects with title and link
    const scrapedData = [];

    // Visit each link and collect title and link
    for (const link of links) {
      await page.goto(link);

      // Extract the title from the page
      const title = await page.evaluate(() => {
        const titleElement = document.querySelector(
          "#id-45 > table > tbody > tr > th"
        );
        return titleElement ? titleElement.textContent.trim() : "";
      });

      // Push the title and link into the scrapedData array
      scrapedData.push({ title, link });
    }

    // Print the extracted data
    console.log(scrapedData);

    await browser.close();
  } catch (err) {
    console.log(err);
  }
}

wa_ScraperData();
