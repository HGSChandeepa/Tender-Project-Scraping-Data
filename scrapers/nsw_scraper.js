const puppeteer = require("puppeteer");

async function scrapeData() {
  try {
    const browser = await puppeteer.launch({
      headless: false,
    });
    const page = await browser.newPage();

    const baseUrl =
      "https://suppliers.buy.nsw.gov.au/opportunity/search?types=Tenders";
    let currentPage = 1;
    const allData = [];

    while (currentPage <= 9) {
      // Navigate to the current page
      const pageUrl = `${baseUrl}&page=${currentPage}`;
      await page.goto(pageUrl);

      // Wait for the main data body to load
      await page.waitForSelector("#search-results > ul > li");

      // Get the links from the first <a> tag within each <li> element
      const links = await page.evaluate(() => {
        const listItems = document.querySelectorAll(
          "#search-results > ul > li"
        );
        const linkArray = Array.from(listItems).map((listItem) => {
          const firstLink = listItem.querySelector("a");
          return firstLink ? firstLink.href : null;
        });
        return linkArray;
      });

      // If no links were found on the current page, exit the loop
      if (links.length === 0) {
        break;
      }

      // Loop through the links and scrape data from each linked page
      for (const link of links) {
        await page.goto(link);
        await page.waitForSelector("body > div.wrapper > div.main ");

        const title = await page.evaluate(() => {
          const headline = document.querySelector(
            "body > div.wrapper > div.main > div.headline > div > h1"
          );
          return headline ? headline.textContent.trim() : null;
        });

        let idNumber = await page.evaluate(() => {
          const id = document.querySelector(
            "#RFT-SB-ID > span.sidebarBlock-content"
          );
          return id ? id.textContent.trim() : null;
        });

        idNumber = "new-" + idNumber;

        const closingDate = await page.evaluate(() => {
          const date = document.querySelector(
            "#RFT-SB-Closes > span.sidebarBlock-content"
          );
          return date ? date.textContent.trim() : null;
        });

        const publishedDate = await page.evaluate(() => {
          const date = document.querySelector(
            "#RFT-SB-Published > span.sidebarBlock-content"
          );
          return date ? date.textContent.trim() : null;
        });

        const category = await page.evaluate(() => {
          const category = document.querySelector(
            "#RFT-SB-Category > span.sidebarBlock-content"
          );
          return category ? category.textContent.trim() : null;
        });

        // Check if the description selector exists on the page
        const description = await page.evaluate(() => {
          const desData = document.querySelector(".richtextblock-content");
          return desData ? desData.textContent.trim() : null;
        });

        // Check if the regions selector exists on the page
        const regionElement = await page.$("#RFT-Location");
        const regions = regionElement
          ? await page.$eval("#RFT-Location", (regionElement) => {
              const regionsText = regionElement.textContent.trim();
              // Split the text by commas and trim each region
              const regionsArray = regionsText
                .split(",")
                .map((region) => region.trim());
              return regionsArray;
            })
          : null;

        const Location = "NSW";

        // Add the scraped data to the overall list if title exists
        if (title) {
          const data = {
            link,
            title,
            idNumber,
            closingDate,
            publishedDate,
            category,
            Location,
            description,
          };

          // Add regions if they exist
          if (regions) {
            data.regions = regions;
          }

          allData.push(data);
        }
      }

      // Move to the next page
      currentPage++;
    }

    // Print all scraped data (links and titles)
    console.log(allData);

    // Close the browser after scraping 9 pages
    await browser.close();
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

scrapeData();
