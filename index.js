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
    (linkElements) => {
      // Extract href values from link elements
      const hrefs = linkElements.map((element) => element.href);

      // Remove duplicate href values
      const uniqueHrefs = [...new Set(hrefs)];

      return uniqueHrefs;
    }
  );

  const data = []; // Initialize an empty array to store the scraped data

  // Process each link separately
  for (const link of links) {
    const newPage = await browser.newPage();
    await newPage.goto(link);

    // Wait for the data section to load
    await newPage.waitForSelector("#mainContent > div > div.row");

    // Extract data from the post section
    const sectionData = await newPage.$eval(
      "#mainContent > div > div.row",
      (section, link) => {
        //title
        const titleElement = section.querySelector(
          "#mainContent > div > div.row > div.col-sm-4 > div.box.boxY.boxY1 > p"
        );
        const title = titleElement ? titleElement.textContent.trim() : "";

        //atmId
        const atmIdElement = section.querySelector(
          "#mainContent > div > div.row > div.col-sm-8 > div.box.boxW.listInner > div:nth-child(1) > div"
        );
        const atmId = atmIdElement ? atmIdElement.textContent.trim() : "";

        //agency
        const agencyElement = section.querySelector(
          "#mainContent > div > div.row > div.col-sm-8 > div.box.boxW.listInner > div:nth-child(2) > div"
        );
        const agency = agencyElement ? agencyElement.textContent.trim() : "";

        //category
        const categoryElement = section.querySelector(
          "#mainContent > div > div.row > div.col-sm-8 > div.box.boxW.listInner > div:nth-child(3) > div"
        );
        const category = categoryElement
          ? categoryElement.textContent.trim()
          : "";

        //closeDateTime
        const closeDateTimeElement = section.querySelector(
          "#mainContent > div > div.row > div.col-sm-8 > div.box.boxW.listInner > div:nth-child(4) > div"
        );
        const closeDateTime = closeDateTimeElement
          ? closeDateTimeElement.textContent.trim()
          : "";

        //publishDateTime
        const publishDateTimeElement = section.querySelector(
          "#mainContent > div > div.row > div.col-sm-8 > div.box.boxW.listInner > div:nth-child(5) > div"
        );
        const publishDateTime = publishDateTimeElement
          ? publishDateTimeElement.textContent.trim()
          : "";

        //location
        const locationElement = section.querySelector(
          "#mainContent > div > div.row > div.col-sm-8 > div.box.boxW.listInner > div:nth-child(6) > div"
        );
        const location = locationElement
          ? locationElement.textContent.trim()
          : "";

        //description
        const descriptionElement = section.querySelector(
          "#mainContent > div > div.row > div.col-sm-8 > div.box.boxW.listInner > div:nth-child(13) > div"
        );
        const description = descriptionElement
          ? descriptionElement.textContent.trim()
          : "";

        return {
          link,
          title,
          atmId,
          agency,
          category,
          closeDateTime,
          publishDateTime,
          location,
          description,
        };
      },
      link
    );

    data.push(sectionData); // Add the scraped data to the array

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

  await browser.close();
}

scrapeData();
