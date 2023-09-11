const puppeteer = require("puppeteer");

async function scrapeData() {
  try {
    const browser = await puppeteer.launch({
      headless: false,
    });

    const page = await browser.newPage();

    const pageUrls = [
      "https://www.tenders.sa.gov.au/tender/search?preset=open",
    ];

    const allData = [];

    for (const pageUrl of pageUrls) {
      await page.goto(pageUrl);

      // Wait for the table to load
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
            return { title: linkText, link: linkHref };
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

    // Iterate through the links and get the title from each page
    for (const dataItem of allData) {
      const { link } = dataItem;
      await page.goto(link);

      // Wait for the title to load
      await page.waitForSelector("#tenderTitle");

      // Extract the title
      const title = await page.$eval("#tenderTitle", (element) =>
        element.textContent.trim()
      );

      let idNumber = await page.$eval(
        "#opportunityGeneralDetails > div:nth-child(4) > div.col-sm-9.col-md-10",
        (element) => element.textContent.trim()
      );

      const category = await page.$eval(
        "#opportunityGeneralDetails > div:nth-child(5) > div.col-sm-9.col-md-10",
        (element) => element.textContent.trim()
      );

      let description = (
        await page.$$eval("#tenderDescription p", (paragraphs) => {
          return paragraphs.map((p) => p.textContent.trim());
        })
      ).join("\n");

      description = description.replace(/\n/g, "").replace(/\+/g, " ");

      const publishedDate = new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      idNumber = "sa-" + idNumber;
      const closingDate = await page.$eval("#tenderClosingTime", (element) => {
        const text = element.textContent.trim();
        const dateMatch = text.match(/(\d{1,2}\s\w+\s\d{4})/);

        if (dateMatch) {
          return dateMatch[0];
        } else {
          return "Not specified";
        }
      });

      const location = ["SA"];
      const regions = [];

      // Update dataItems
      dataItem.idNumber = idNumber;
      dataItem.title = title;
      dataItem.category = category;
      dataItem.description = description;
      dataItem.publishedDate = publishedDate;
      dataItem.closingDate = closingDate;
      dataItem.location = location;
      dataItem.regions = regions;
    }

    // Print the scraped data with titles
    console.log(allData);

    await browser.close();
  } catch (error) {
    console.log(error);
  }
}

scrapeData();
