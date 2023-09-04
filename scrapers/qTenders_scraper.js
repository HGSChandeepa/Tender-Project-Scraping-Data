const { initializeApp } = require("firebase/app");
const firebase = require("firebase/database");
const puppeteer = require("puppeteer");
const fs = require("fs");

const firebaseConfig = {
  apiKey: "AIzaSyCh0SMAVznYtQGyvAMDOM7Gp44ccP0obBg",
  authDomain: "bixbe-569b8.firebaseapp.com",
  projectId: "bixbe-569b8",
  storageBucket: "bixbe-569b8.appspot.com",
  messagingSenderId: "295388156463",
  appId: "1:295388156463:web:52a1067c902a3a0e0e6cda",
  databaseURL:
    "https://bixbe-569b8-default-rtdb.asia-southeast1.firebasedatabase.app/",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

async function scrapeData() {
  try {
    const browser = await puppeteer.launch({
      headless: false,
    });
    const page = await browser.newPage();

    // Navigate to the tender
    await page.goto(
      "https://qtenders.epw.qld.gov.au/qtenders/tender/search/tender-search.do?action=advanced-tender-search-open-tender&orderBy=closeDate&CSRFNONCE=49F003A9DDC190F17DD339DBF0150A39z"
    );

    // Wait for the main data body to load
    await page.waitForSelector(
      "#content_content > table:nth-child(2) > tbody > tr > td:nth-child(2) > table:nth-child(5) > tbody"
    );

    // Evaluate and extract the links from the table
    const links = await page.$$eval("#MSG", (linkElements) => {
      // Extract href values from link elements
      const hrefs = linkElements.map((element) => element.href);

      // Remove duplicate href values
      const uniqueHrefs = [...new Set(hrefs)];
      return uniqueHrefs;
    });

    const tenderData = [];

    // Loop through each link and navigate to the tender page
    for (const link of links) {
      const tenderPage = await browser.newPage();
      await tenderPage.goto(link);

      // Wait for the tender data to load
      await tenderPage.waitForSelector(
        "#content_content > table:nth-child(3) > tbody > tr:nth-child(1) > td:nth-child(2) > table:nth-child(5) > tbody"
      );

      // Extra  ct and store the tender information
      const agency = await tenderPage.$eval(
        "#content_content > table:nth-child(3) > tbody > tr:nth-child(1) > td:nth-child(2) > table:nth-child(2) > tbody > tr > td > span:nth-child(2)",
        (element) => element.textContent.trim()
      );

      const atmId = await tenderPage.$eval(
        "#content_content > table:nth-child(3) > tbody > tr:nth-child(1) > td:nth-child(2) > table:nth-child(5) > tbody > tr:nth-child(3) > td:nth-child(2)",
        (element) => element.textContent.trim()
      );

      const category = await tenderPage.$eval(
        "#content_content > table:nth-child(3) > tbody > tr:nth-child(1) > td:nth-child(2) > table:nth-child(5) > tbody > tr:nth-child(2) > td:nth-child(2)",
        (element) => element.textContent.trim()
      );

      const idNumber = await tenderPage.$eval(
        "#content_content > table:nth-child(3) > tbody > tr:nth-child(1) > td:nth-child(2) > table:nth-child(5) > tbody > tr:nth-child(3) > td:nth-child(2)",
        (element) => element.textContent.trim()
      );

      //dates converter
      function extractDatePart(inputString) {
        const startIndex = inputString.indexOf(",") + 1;
        const endIndex = inputString.indexOf(" at");
        if (startIndex !== -1 && endIndex !== -1) {
          return inputString.slice(startIndex, endIndex).trim();
        }
        return null; // Return null if the format is not as expected
      }

      const publishedDateTime = await tenderPage.$eval(
        "#content_content > table:nth-child(3) > tbody > tr:nth-child(1) > td:nth-child(2) > table:nth-child(5) > tbody > tr:nth-child(4) > td:nth-child(2)",
        (element) => element.textContent.trim()
      );

      const publishedDate = extractDatePart(publishedDateTime);

      const closingDateTime = await tenderPage.$eval(
        "#content_content > table:nth-child(3) > tbody > tr:nth-child(1) > td:nth-child(2) > table:nth-child(5) > tbody > tr:nth-child(5) > td:nth-child(2)",
        (element) => element.textContent.trim()
      );

      const closingDate = extractDatePart(closingDateTime);

      const description = await tenderPage.$eval(
        "#content_content > table:nth-child(5) > tbody > tr > td:nth-child(1)",
        (element) => element.textContent.trim().replace(/[\n\t]+/g, " ")
      );

      const title = await tenderPage.$eval(".TITLE", (element) =>
        element.textContent.trim()
      );

      //Region/s

      const region = await tenderPage.$eval(
        "#content_content > table:nth-child(3) > tbody > tr:nth-child(1) > td:nth-child(2) > table:nth-child(5) > tbody > tr:nth-child(7) > td:nth-child(2)",
        (element) =>
          element.textContent
            .trim()
            .split("\n")
            .map((item) => item.trim())
      );

      // All the locations are QLD
      const location = ["QLD"];

      const tender = {
        title,
        agency,
        atmId,
        category,
        location,
        region,
        idNumber,
        publishedDate,
        closingDate,
        description,
        link,
      };

      //store in firebase
      // Store the tender data in Firebase
      try {
        const database = firebase.getDatabase(app);
        const tenderRef = firebase.ref(database, "tenders");
        await firebase.set(
          firebase.child(tenderRef, "qld-" + idNumber),
          tender
        ); // Store under "qld-idNumber"
        console.log("Tender data stored in Firebase:", "qld-" + idNumber);
      } catch (firebaseError) {
        console.error("Error storing tender data in Firebase:", firebaseError);
      }

      tenderData.push(tender);

      await tenderPage.close();
    }

    // Store the tender data in a JSON file
    const data = JSON.stringify(tenderData, null, 2);
    fs.writeFile("QT-tenderData.json", data, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Data saved to QT-tenderData.json");
      }
    });

    await browser.close();
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

scrapeData();
