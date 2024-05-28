const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

async function extractFanDuelLinks() 
{
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://www.fanduel.com/research/nba');
  const html = await page.content();
  await browser.close();

  const $ = cheerio.load(html);
  const relevantLinks = [];

  $('a').each((index, element) => {
    const link = 'https://www.fanduel.com' + $(element).attr('href');
    const article = $(element).text();
    if (link && isArticleRelevant(article)) {
      relevantLinks.push(link);
    }
  });

  return relevantLinks;
}

function isArticleRelevant(title) 
{
  // Implement logic to determine if the article is relevant
  return title.toLowerCase().includes('betting picks') || title.toLowerCase().includes('predictions') || title.toLowerCase().includes('prop bets');
}

module.exports = { extractFanDuelLinks };
