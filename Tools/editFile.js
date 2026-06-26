import fs from 'fs/promises';

function findAllOccurrences(content, searchText) {
    let pos = -1;
    let positions = [];
    do {
        pos = content.indexOf(searchText, pos + 1);
        if (pos !== -1) {
            positions.push(pos);
        }
    } while (pos !== -1);
    return positions;
}

async function editFile(filePath, edits) {
    const originalContent = await fs.readFile(filePath, 'utf-8');

    const spans = edits.map((edit, index) => {
        let matches = findAllOccurrences(originalContent, edit.oldText);

        if (matches.length != 1) {
            throw new Error(`Expected exactly one occurrence of "${edit.oldText}" in the file, but found ${matches.length}. Edit index: ${index}`);
        }

        return {
            index,
            start: matches[0],
            end: matches[0] + edit.oldText.length,
            edit
        }
    });

    spans.sort((a, b) => a.start - b.start);
    for (let i = 1; i < spans.length; i++) {
        if (spans[i].start < spans[i - 1].end) {
            throw new Error(`Overlapping edits detected between edit index ${spans[i - 1].index} and edit index ${spans[i].index}`);
        }
    }

    let cursor = 0;
    let output = "";
    for (const span of spans) {
        output += originalContent.slice(cursor, span.start);
        output += span.edit.newText;
        cursor = span.end;
    }
    output += originalContent.slice(cursor);

    await fs.writeFile(filePath, output, 'utf-8');

    return "File edited successfully.";
}

export default editFile;