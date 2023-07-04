const puppeteer = require("puppeteer");
const fs = require("fs");

async function scrapeData() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Navigate to the tender search page
  await page.goto("https://www.tenders.gov.au/atm");

  // Wait for the main section to load
  await page.waitForSelector("#mainContent");

  // Extract the links within the specified selector
  const links = await page.$$eval(
    "#mainContent > div > div:nth-child(11) > div a",
    (linkElements) => linkElements.map((element) => element.href)
  );

  const data = []; // Initialize an empty array to store the scraped data

  // Process each link separately
  for (const link of links) {
    const newPage = await browser.newPage();
    await newPage.goto(link);

    // Wait for the data section to load
    await newPage.waitForSelector(".box.boxW.listInner");

    // Extract data from the box.boxW.listInner section
    const sectionData = await newPage.$$eval(
      ".box.boxW.listInner",
      (sections) =>
        sections.map((section) => {
          const titleElement = section.querySelector("p.lead");
          const title = titleElement ? titleElement.textContent.trim() : "";

          const atmIdElement = section.querySelector(
            ".list-desc:nth-child(2) > .list-desc-inner > a"
          );
          const atmId = atmIdElement ? atmIdElement.textContent.trim() : "";

          const closeDateTimeElement = section.querySelector(
            ".list-desc:nth-child(3) > .list-desc-inner"
          );
          const closeDateTime = closeDateTimeElement
            ? closeDateTimeElement.textContent.trim()
            : "";

          const agencyElement = section.querySelector(
            ".list-desc:nth-child(4) > .list-desc-inner"
          );
          const agency = agencyElement ? agencyElement.textContent.trim() : "";

          const categoryElement = section.querySelector(
            ".list-desc:nth-child(5) > .list-desc-inner"
          );
          const category = categoryElement
            ? categoryElement.textContent.trim()
            : "";

          const descriptionElement = section.querySelector(
            ".list-desc:nth-child(6) > .list-desc-inner"
          );
          const description = descriptionElement
            ? descriptionElement.textContent.trim()
            : "";

          return {
            title,
            atmId,
            closeDateTime,
            agency,
            category,
            description,
          };
        })
    );

    data.push(...sectionData); // Add the scraped data to the array

    await newPage.close();
  }

  // Store the data in the JSON file
  fs.writeFile("tenders.json", JSON.stringify(data, null, 2), (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Data saved to tenders.json");
    }
  });

  console.log(data);
  await browser.close();
}

scrapeData();
