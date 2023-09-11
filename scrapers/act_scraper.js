const puppeteer = require("puppeteer");

async function act_ScraperData() {
  try {
    const browser = await puppeteer.launch({
      headless: false,
    });

    const page = await browser.newPage();

    // Define the base URL
    const baseUrl =
      "https://www.tenders.act.gov.au/tender/search?preset=open&page=";

    // Define the total number of pages to scrape
    const totalPages = 2;

    const allData = [];

    for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
      const pageUrl = `${baseUrl}${currentPage}`;

      await page.goto(pageUrl);

      // Wait for the main data body to load
      await page.waitForSelector("tbody");

      // Extract links with href starting with "https://www.tenders.act.gov.au/tender/"
      const links = await page.evaluate(() => {
        const linkElements = Array.from(
          document.querySelectorAll("span.tablesaw-cell-content a")
        );
        const filteredLinks = linkElements
          .map((linkElement) => linkElement.href)
          .filter((href) =>
            href.startsWith("https://www.tenders.act.gov.au/tender/")
          );

        return filteredLinks;
      });

      for (const link of links) {
        // Visit each link individually
        await page.goto(link);

        // Set the opening date to the current date
        const publishedDate = new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });

        // Extract the closing date from the page and clean it
        const closingDateRaw = await page.$eval(
          "#tenderClosingTime",
          (dateElement) => dateElement.textContent.trim()
        );
        const closingDateMatch = closingDateRaw.match(
          /(\d{1,2} \w+ \d{4} \d{2}:\d{2} [apAP][mM])/
        );
        const closingDate = closingDateMatch
          ? closingDateMatch[0]
          : "Not specified";

        // Format closing date to "30 June 2025" format
        const formattedClosingDate = closingDate
          .split(" ")
          .slice(0, 3)
          .join(" ");

        // Extract the title from the link page
        const title = await page.$eval("#tenderTitle", (titleElement) =>
          titleElement.textContent.trim()
        );

        // Extract the category and get the part after the "-"
        const categoryRaw = await page.$eval(
          "#opportunityGeneralDetails > div:nth-child(5)",
          (categoryElement) => categoryElement.textContent.trim()
        );
        const category = categoryRaw.split(" - ")[1].trim();

        const idNumberData = await page.$eval(
          "#opportunityGeneralDetails > div:nth-child(4) > div.col-sm-9.col-md-10",
          (idNumberElement) =>
            idNumberElement.textContent
              .trim()
              .replace(/[\t\n]/g, " ") // Remove tabs and newlines
              .replace(/\s+/g, " ") // Replace multiple spaces with a single space
              .trim()
        );
        idNumber = "act-" + idNumberData;

        const description = await page.$eval(
          "#tenderDescription > div:nth-child(2)",
          (descriptionElement) =>
            descriptionElement.textContent
              .trim()
              .replace(/[\t\n]/g, " ") // Remove tabs and newlines
              .replace(/\s+/g, " ") // Replace multiple spaces with a single space
              .trim()
        );

        const location = "ACT";
        const region = [];
        const updatedDateTime = new Date().toLocaleDateString();

        // Push the title, link, opening date, category, and formatted closing date to the data array
        allData.push({
          title,
          link,
          publishedDate,
          closingDate: formattedClosingDate,
          category,
          idNumber,
          description,
          location,
          region,
          updatedDateTime,
        });
      }
    }

    // Print all scraped data
    console.log(allData);

    await browser.close();
  } catch (err) {
    console.log(err);
  }
}

act_ScraperData();
