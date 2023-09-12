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

      // ----------------------------------------

      const descriptionElement = await page.$('textarea[name="desc"]');
      let description = "";

      if (descriptionElement) {
        description = await page.evaluate((element) => {
          // Extract text content without HTML tags
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = element.value;
          return tempDiv.textContent || tempDiv.innerText || "";
        }, descriptionElement);

        // Remove newline characters and extra spaces
        description = description
          .replace(/\n/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      }

      //  ----------------------------------------

      let idNumber = await page.evaluate(() => {
        const idElement = document.querySelector(
          "#hcontent > div.pcontent > table:nth-child(7) > tbody > tr:nth-child(3) > td:nth-child(2)"
        );
        return idElement ? idElement.textContent.trim() : "";
      });

      idNumber = "wa-" + idNumber;

      // Extract the closing date or set it to "No date found"
      let closingDate = "No date found";
      const closingDateElement = await page.$('span[style="color: #990000"]');

      if (closingDateElement) {
        const text = await closingDateElement.evaluate((span) =>
          span.textContent.trim()
        );

        const dateAndTimeMatch = text.match(/Closes (.+?) at (.+)/);

        if (dateAndTimeMatch && dateAndTimeMatch.length >= 3) {
          const rawDate = dateAndTimeMatch[1].trim();
          const formattedClosingDate = new Date(rawDate).toLocaleDateString(
            "en-GB",
            {
              day: "numeric",
              month: "short",
              year: "numeric",
            }
          );

          closingDate = formattedClosingDate;
        }
      }

      const publishedDate = new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      const location = ["WA"];
      const region = [];

      // Push the title and link into the scrapedData array
      scrapedData.push({
        title,
        link,
        idNumber,
        closingDate,
        description,
        publishedDate,
        location,
        region,
      });

      // Wait for 2 seconds before visiting the next link
    }

    // Print the extracted data
    console.log(scrapedData);

    await browser.close();
  } catch (err) {
    console.log(err);
  }
}

wa_ScraperData();
