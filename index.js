const puppeteer = require('puppeteer');
const { scrollPageToTop } = require('puppeteer-autoscroll-down')
const prompt = require('prompt-sync')();
const cheerio = require('cheerio');
const nodemailer = require('nodemailer');

const url = 'https://www.amazon.in';

const itemName = prompt('Please enter the product name: ');
const budgetPrice = prompt('Please enter your budget: ');

try {

    async function configureBrowser() {



        let browserLaunch = await puppeteer.launch({

            headless: false,
            defaultViewport: null,
            args: ['--start-maximized']
        });

        let page = await browserLaunch.newPage();

        await page.goto(url);

        return page;


    };

    async function startTracking() {

        let page = await configureBrowser();

        await checkPrices(page);
    }

    async function checkPrices(page) {

        await page.type('#twotabsearchtextbox', itemName, { delay: 100 });

        await page.click('input[value="Go"]', { delay: 100 });

        await page.waitForSelector('.s-card-container');

        const lastPosition = await scrollPageToTop(page, {
            size: 500,
            delay: 250
        })

        let sectionArr = await page.$$('.s-card-container', { delay: 3000 });

        let html = await page.evaluate(() => document.body.innerHTML);

        let $ = cheerio.load(html);

        for (let i = 0; i < 2; i++) {

            let priceArr = $('.s-card-container .a-price-whole');
            let splitArr = $(priceArr[i]).text().split(",");
            let finalVal = parseInt(splitArr[0] + splitArr[1]);

            let aTag = $('.s-card-container h2 a');
            let ref = $(aTag[i]).attr('href');
            let fullLink = url + ref;

            console.log(finalVal);

            if (finalVal < budgetPrice)
                await sendNotification(finalVal, fullLink);

            else
                console.log("Oops! You are out of budget!!");
        }

    }

    async function sendNotification(price, fullLink) {

        const transporter = nodemailer.createTransport({

            host: 'smtp-mail.outlook.com',
            port: 587,
            auth: {

                user: "temp2-harsh@outlook.com",
                pass: "P@ssw0rD5576"
            }
        });

        let textToSend = 'Price dropped to ' + price;
        let htmlText = `<a href=\"${fullLink}\">Link</a>`;

        const options = {

            from: "temp2-harsh@outlook.com",
            to: "hsangwan2002@gmail.com",
            subject: "Sending email with node-mailer!",
            text: textToSend,
            html: htmlText
        };

        const info = await transporter.sendMail(options);

        console.log("Please check your email for the link!!");
        console.log(info.messageId);
    }

    startTracking();


} catch (error) {

    console.log(error);
}