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

      let idNumber = await page.$eval(
        "#content > form > div > div > fieldset > div:nth-child(6) > div.editor-field.displayhighlight > div > ul > li",
        (idElement) => idElement.textContent.trim()
      );
      idNumber = "tas-" + idNumber;

      const description = await page.$eval(
        ".richTextDisplay",
        (descriptionElement) => {
          let descriptionText = descriptionElement.textContent.trim();
          // Remove newlines and tabs
          descriptionText = descriptionText
            .replace(/\n/g, "")
            .replace(/\t/g, "");
          // Remove '+' characters
          descriptionText = descriptionText.replace(/\+/g, "");
          return descriptionText;
        }
      );

      const category = await page.$eval(
        "#content > form > div > div > fieldset > div:nth-child(11) > div.editor-field > div > ul > li",
        (element) => {
          return element.textContent.trim();
        }
      );

      // -------------------------------
      let closingDate;

      const closingDateElement = await page.$(
        "#content > form > div > div > fieldset > div:nth-child(8) > div.editor-field.displayhighlight > div > ul > li"
      );

      if (closingDateElement) {
        const text = await closingDateElement.evaluate((element) =>
          element.textContent.trim()
        );

        // Use regular expression to extract the date part
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
          closingDate = `${day} ${monthNames[parseInt(month, 10) - 1]} ${year}`;
        } else {
          closingDate = "Not specified"; // Set a default value when no date is found
        }
      } else {
        closingDate = "Not specified"; // Set a default value when the element is not found
      }

      // --------------------------

      const publishedDate = new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      const location = "TAS";
      const region = [];

      data.push({
        title,
        link,
        idNumber,
        description,
        category,
        publishedDate,
        closingDate,
        location,
        region,
      });
    }

    // Print the extracted data
    console.log(data);

    await browser.close();
  } catch (err) {
    console.log(err);
  }
}

tas_ScraperData();
