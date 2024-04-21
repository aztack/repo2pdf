const fs = require('fs');
const path = require('path');
const marked = require('marked');
const puppeteer = require('puppeteer');

const directoryPath = process.argv[2];
const pdfName = process.argv[3];
console.log(process.argv);
if (!fs.existsSync(directoryPath)) {
  process.exit(-1);
}
let markdownContent = '';

const includes = ['.js', '.ts', '.jsx'];
const excludes = ['tests', '__mocks__', '/lottie_', 'standalone.js', 'canvaskit', '/server/'];
const excludeExts = ['.jpg', '.png', '.lock', '.exe', '.log', '.json'];

function isExcluted(p) {
    if (path.basename(p).startsWith('.')
        || excludeExts.some(ext => p.endsWith(ext))) return true;
    return excludes.some(exclude => p.includes(exclude));
}

const scanDirectory = async (directory) => {
    const files = fs.readdirSync(directory);

    for (const file of files) {
        const filePath = path.join(directory, file);
        const stat = fs.lstatSync(filePath);

        if (stat.isDirectory()) {
            await scanDirectory(filePath);
        } else if (includes.some(ext => filePath.toLowerCase().endsWith(ext))) {
            if (isExcluted(filePath)) continue;
            const content = fs.readFileSync(filePath, 'utf-8');
            console.log(filePath);
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
    await page.pdf({ path: `${pdfName.replace(/\.pdf$/i, '') || 'noname'}.pdf`, format: 'A4', timeout: 10 * 60 * 1000 });

    await browser.close();
};

run();