const puppeteer = require("puppeteer");

async function scrapeData() {
  try {
    const browser = await puppeteer.launch({
      headless: false,
    });
    const page = await browser.newPage();
    await page.goto("https://tendersonline.nt.gov.au/Tender/List/#!/Current");

    // Wait for the table to load
    await page.waitForSelector(
      "#mainContent > div.ng-scope > div.ng-scope > div.panel-group.ng-scope > div:nth-child(2) > div.collapse.in > div > div > table"
    );

    // Extract links inside <tr> elements
    const links = await page.evaluate(() => {
      const trElements = Array.from(document.querySelectorAll("tbody tr"));
      const uniqueLinks = new Set();

      for (const trElement of trElements) {
        const linkElement = trElement.querySelector("a");
        if (linkElement) {
          const href = linkElement.getAttribute("href");
          if (href) {
            uniqueLinks.add("https://tendersonline.nt.gov.au" + href);
          }
        }
      }

      return Array.from(uniqueLinks);
    });

    // Create an array to store the title and link for each page
    const results = [];

    // Iterate through each link and get the title and link
    for (const link of links) {
      const page = await browser.newPage();
      await page.goto(link);

      // Wait for the title to load
      await page.waitForSelector(".form-control-static");

      // Extract the title
      const title = await page.$eval(
        "#mainContent > div:nth-child(5) > div.col-lg-8 > div > div.panel-body.form-horizontal > div:nth-child(2) > div > div > p",
        (element) => element.textContent.replace(/\n/g, "")
      );

      let idNumber = await page.$eval(
        "#mainContent > div:nth-child(5) > div.col-lg-8 > div > div.panel-body.form-horizontal > div:nth-child(1) > div > div > p",
        (element) => element.textContent.replace(/\n/g, "")
      );

      idNumber = "nt-" + idNumber;

      const description = await page.$eval(
        "#qtol-description-container",
        (element) => element.textContent.replace(/\n/g, "")
      );
      const publishedDate = await page.$eval(
        "div.form-group:has(label[for='OpenDate']) p.form-control-static",
        (element) => {
          const text = element.textContent.trim();
          const dateMatch = text.match(/\d{2}\/\d{2}\/\d{4}/);
          if (dateMatch) {
            const [day, month, year] = dateMatch[0].split("/");
            const monthNames = [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ];
            return `${day} ${monthNames[parseInt(month, 10) - 1]} ${year}`;
          } else {
            return "Not specified";
          }
        }
      );

      const closingDate = await page.$eval(
        "div.form-group:has(label[for='CloseDate']) p.form-control-static",
        (element) => {
          const text = element.textContent.trim();
          const dateMatch = text.match(/\d{2}\/\d{2}\/\d{4}/);
          if (dateMatch) {
            const [day, month, year] = dateMatch[0].split("/");
            const monthNames = [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ];
            return `${day} ${monthNames[parseInt(month, 10) - 1]} ${year}`;
          } else {
            return "Not specified";
          }
        }
      );

      const category = await page.$eval(
        "div.form-group:has(label[for='Category']) p.form-control-static",
        (element) => {
          return element.textContent.trim();
        }
      );

      const location = ["NT"];

      results.push({
        title,
        link,
        idNumber,
        description,
        publishedDate,
        closingDate,
        category,
        location,
        regions: [],
      });

      await page.close();
    }

    // Print the results
    console.log(results);

    await browser.close();
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

scrapeData();
