import fs from 'fs/promises';

async function readFile(filePath) {
    return fs.readFile(filePath, 'utf-8');
}

// console.log(await readFile('Hello.txt'));
export default readFile;