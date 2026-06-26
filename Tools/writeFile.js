import fs from 'fs/promises';

async function writeFile(filePath, content) {
    await fs.writeFile(filePath, content, 'utf-8');
    return "File written successfully.";
}

export default writeFile;