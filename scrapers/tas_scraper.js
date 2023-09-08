const puppeteer = require("puppeteer");

async function tas_ScraperData() {
  try {
    const browser = await puppeteer.launch({
      headless: false,
    });

    const page = await browser.newPage();

    await page.goto(
      "https://www.tenders.tas.gov.au/OpenForBids/List/Public/ClosingDate"
    );

    // Wait for the main data body to load
    await page.waitForSelector("#content table tbody");

    // Extract all links within rightDiv elements
    const links = await page.evaluate(() => {
      const rightDivs = document.querySelectorAll(
        "#content table tbody .downloadImagesCell #rightDiv a"
      );
      const linkArray = [];

      rightDivs.forEach((link) => {
        const href = link.href;
        const formattedHref = href.replace("/ConditionsOfUse/", "/Details/");
        linkArray.push({
          text: link.textContent.trim(),
          link: formattedHref,
        });
      });

      return linkArray;
    });

    // Create an array to store title and link objects
    const data = [];

    // Iterate through the links and fetch titles
    for (const linkInfo of links) {
      const link = linkInfo.link;
      await page.goto(link);
      await page.waitForSelector(
        "#content form fieldset:nth-child(2) .titleheader li"
      );

      const title = await page.$eval(
        "#content form fieldset:nth-child(2) .titleheader li",
        (titleElement) => titleElement.textContent.trim()
      );

      data.push({ title: title, link: link });
    }

    // Print the extracted data
    console.log(data);

    await browser.close();
  } catch (err) {
    console.log(err);
  }
}

tas_ScraperData();
