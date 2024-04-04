const fs = require('fs');
const path = require('path');
const marked = require('marked');
const puppeteer = require('puppeteer');

const directoryPath = process.argv[2];
console.log(process.argv);
if (!fs.existsSync(directoryPath)) {
  process.exit(-1);
}
let markdownContent = '';

const scanDirectory = async (directory) => {
    const files = fs.readdirSync(directory);

    for (const file of files) {
        const filePath = path.join(directory, file);
        const stat = fs.lstatSync(filePath);

        if (stat.isDirectory()) {
            await scanDirectory(filePath);
        } else if (filePath.endsWith('.js') || filePath.endsWith('.ts')) {
            const content = fs.readFileSync(filePath, 'utf-8');
            markdownContent += `# ${filePath}\n\`\`\`${filePath.split('.').pop()}\n${content}\n\`\`\`\n`;
        }
    }
};

const run = async () => {
    await scanDirectory(directoryPath);

    // Convert Markdown to HTML
    const htmlContent = marked(markdownContent);

    // Save the HTML as a PDF
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    await page.pdf({ path: 'output.pdf', format: 'A4' });

    await browser.close();
};

run();