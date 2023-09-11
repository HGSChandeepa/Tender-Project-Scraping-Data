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

        const idNumber = await page.$eval(
          "#mainContent > div > div.row > div.col-sm-8 > div.box.boxW.listInner > div:nth-child(1) > div",
          (idElement) => idElement.textContent.trim()
        );

        // Extract the closing date from the page and clean it
        const closingDateRaw = await page.$eval(
          "#mainContent > div > div.row > div.col-sm-8 > div.box.boxW.listInner > div:nth-child(4) > div",
          (closingDateElement) => closingDateElement.textContent.trim()
        );

        // Extract only the date part from the closingDateRaw
        const closingDateMatch = closingDateRaw.match(
          /(\d{1,2}-[A-Za-z]{3}-\d{4})/
        );
        const closingDate = closingDateMatch
          ? closingDateMatch[0]
          : "Not specified";

        const openingDate = await page.$eval(
          "#mainContent > div > div.row > div.col-sm-8 > div.box.boxW.listInner > div:nth-child(5) > div",
          (openingDateElement) => openingDateElement.textContent.trim()
        );
        // Extract the location from the page
        const locationRaw = await page.$eval(
          "#mainContent > div > div.row > div.col-sm-8 > div.box.boxW.listInner > div:nth-child(6) > div",
          (locationElement) => locationElement.textContent.trim()
        );

        // Split the raw location text into an array based on ","
        const location = locationRaw
          .split(",")
          .map((location) => location.trim())
          .join(", ");

        // Extract the description from the page
        const description = await page.$eval(
          "#mainContent > div > div.row > div.col-sm-8 > div.box.boxW.listInner > div:nth-child(14), #mainContent > div > div.row > div.col-sm-8 > div.box.boxW.listInner > div:nth-child(15)",
          (descriptionElement) => {
            const paragraphs = Array.from(
              descriptionElement.querySelectorAll("p")
            );
            const descriptionText = paragraphs
              .map((paragraph) => paragraph.textContent.trim())
              .join(" ");
            return descriptionText || "Not specified";
          }
        );

        // Create an object with title and link and push it to the allLinks array
        allLinks.push({
          title,
          link,
          idNumber,
          closingDate,
          openingDate,
          description,
          location,
        });
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
