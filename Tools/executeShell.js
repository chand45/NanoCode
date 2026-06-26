import { exec } from 'node:child_process';

async function executeShell(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(`error: ${error.message}`);
            }
            else if (stderr) {
                resolve(`stderr: ${stderr}`);
            }
            else {
                resolve(`stdout: ${stdout}`);
            }
        });
    });
};

export default executeShell;