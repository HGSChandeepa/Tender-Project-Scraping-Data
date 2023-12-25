const puppeteer = require("puppeteer");

async function gympie_data() {
  try {
    const browser = await puppeteer.launch({
      headless: false,
    });

    const page = await browser.newPage();

    const baseUrl =
      "https://www.gympie.qld.gov.au/news/category/current-tenders";
    await page.goto(baseUrl);

    // Wait for the main data body to load
    await page.waitForSelector(".page-content");
    //get all the links form a tags
    const links = await page.evaluate(() => {
      const listItems = document.querySelectorAll(".card-a__link");
      const linkArray = Array.from(listItems).map((listItem) => {
        const firstLink = listItem.href;
        return firstLink ? firstLink : null;
      });
      return linkArray;
    });

    console.log(links);
    //close the browser
    await browser.close();
  } catch (error) {
    console.log(error);
  }
}

gympie_data();

module.exports = gympie_data;
