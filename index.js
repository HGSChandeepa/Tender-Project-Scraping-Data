const puppeteer = require("puppeteer");
const fs = require("fs");

async function run() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto("https://www.australiantenders.com.au/search/tenders/");

  const tenders = await page.evaluate(() => {
    const tds = Array.from(
      document.querySelectorAll("#searchApp > div > div > div > a")
    );
    return tds.map((td) => {
      const title = td.querySelector(
        "div > div > div.col-lg-9 > div > strong"
      ).innerText;
      const description = td.querySelector(
        "div > div > div.col-lg-9 > span"
      ).innerText;
      const link = td.getAttribute("href");
      return {
        title,
        description,
        link,
      };
    });
  });

  //store data in json file
  await fs.writeFile("tenders.json", JSON.stringify(tenders), (err) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log("Great Success");
  });

  console.log(tenders);
  await browser.close();
}

run();
