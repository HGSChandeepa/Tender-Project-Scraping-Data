const puppeteer = require("puppeteer");

async function formatDate(dateString) {
  const options = { year: "numeric", month: "short", day: "numeric" };
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", options);
}

async function scrapeData() {
  try {
    const browser = await puppeteer.launch({
      headless: false,
    });

    const page = await browser.newPage();

    const baseUrl =
      "https://www.tenders.vic.gov.au/tender/search?preset=open&page=";

    const totalPages = 4;

    const allData = [];

    for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
      // Navigate to the current page
      const pageUrl = `${baseUrl}${currentPage}`;
      await page.goto(pageUrl);

      await page.waitForSelector("#content > div.tender-table");

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

    for (const item of allData) {
      const link = item.link;
      const newPage = await browser.newPage();
      //
      await newPage.setDefaultNavigationTimeout(0);
      await newPage.goto(link);
      //
      await newPage.waitForSelector("#tenderTitle");

      const title = await newPage.$eval("#tenderTitle", (titleElement) =>
        titleElement.textContent.trim()
      );

      let idNumber = await newPage.$eval(
        "#opportunityGeneralDetails > div:nth-child(4) > div.col-sm-9.col-md-10",
        (idElement) => idElement.textContent.trim()
      );

      idNumber = "vic-" + idNumber;

      let category = await newPage.$eval(
        "#opportunityGeneralDetails > div:nth-child(5) > div.col-sm-9.col-md-10",
        (categoryElement) => categoryElement.textContent.trim()
      );

      // Clean up the category string
      category = category.replace(/\n|\t|\+/g, " ").trim();

      //wait for the description to load
      await newPage.waitForSelector("#tenderDescription");

      let description = "";

      try {
        description = await page.$$eval(
          "#tenderDescription .col-xs-12 > p",
          (paragraphs) => {
            return paragraphs.map((p) => p.textContent.trim());
          }
        );

        // Print the description paragraphs
      } catch (error) {
        console.log("No description found");
      }
      const location = ["VIC"];
      const region = [];

      await newPage.close();

      item.title = title;
      item.idNumber = idNumber;
      item.category = category;
      item.description = description;
      item.location = location;
      item.region = region;
    }

    // Format the dates
    for (const item of allData) {
      item.openingDate = await formatDate(item.openingDate);
      item.closingDate = await formatDate(item.closingDate);
    }

    console.log(allData);

    await browser.close();
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

scrapeData();
