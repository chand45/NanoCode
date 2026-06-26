import OpenAI from "openai";
import { getBearerTokenProvider, DefaultAzureCredential } from "@azure/identity";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output, exit } from "node:process";
import readFile from "./Tools/readFile.js";
import executeShell from "./Tools/executeShell.js";
import editFile from "./Tools/editFile.js";
import writeFile from "./Tools/writeFile.js";

const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT;
const azureScope = process.env.AZURE_OPENAI_SCOPE ?? "https://ai.azure.com/.default";

if (!endpoint || !deploymentName) {
    console.error("Missing required environment variables: AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_DEPLOYMENT.");
    exit(1);
}

const tokenProvider = getBearerTokenProvider(
    new DefaultAzureCredential(),
    azureScope);

const client = new OpenAI({
    baseURL: endpoint,
    apiKey: await tokenProvider()
});

const rl = createInterface({ input, output });

const tools = [
    {
        type: "function",
        name: "read_file",
        description: "Read the contents of a file.",
        parameters: {
            type: "object",
            properties: {
                filePath: {
                    type: "string",
                    description: "Path of the file to be read relative to the current working directory.",
                },
            },
            required: ["filePath"],
            additionalProperties: false,
        },
        strict: true,
    },
    {
        type: "function",
        name: "write_file",
        description: "Write content to a file.",
        parameters: {
            type: "object",
            properties: {
                filePath: {
                    type: "string",
                    description: "Path of the file to be written relative to the current working directory.",
                },
                content: {
                    type: "string",
                    description: "The content to write to the file.",
                },
            },
            required: ["filePath", "content"],
            additionalProperties: false,
        },
        strict: true,
    },
    {
        type: "function",
        name: "edit_file",
        description: "Edit the contents of a file.",
        parameters: {
            type: "object",
            properties: {
                filePath: {
                    type: "string",
                    description: "Path of the file to be edited relative to the current working directory.",
                },
                edits: {
                    type: "array",
                    description: "List of edits to be made. Each edit should have 'oldText' which is the text to be replaced and 'newText' which is the text to replace with. Each 'oldText' should uniquely identify a portion of the file content.",
                    items: {
                        type: "object",
                        properties: {
                            oldText: {
                                type: "string",
                                description: "The text in the file that needs to be replaced. Each 'oldText' should uniquely identify a portion of the file content.",
                            },
                            newText: {
                                type: "string",
                                description: "The text that will replace the 'oldText' in the file.",
                            }
                        },
                        required: ["oldText", "newText"],
                        additionalProperties: false,
                    }
                }
            },
            required: ["filePath", "edits"],
            additionalProperties: false,
        },
        strict: true,
    },
    {
        type: "function",
        name: "execute_shell",
        description: "Execute a shell command in windows command prompt.",
        parameters: {
            type: "object",
            properties: {
                command: {
                    type: "string",
                    description: "The shell command to execute.",
                },
            },
            required: ["command"],
            additionalProperties: false,
        },
        strict: true,
    },
    {
        type: "web_search",
    }
]

const systemPrompt = `You are ChanduCLI, an expert coding assistant operating in the user's local project.
Your goal is to help with programming tasks by inspecting files, running commands, editing code, and explaining the result clearly.

General behavior:
- Be concise, accurate, and action-oriented.
- Prefer small, safe, targeted changes that preserve the existing style and architecture.
- Do not guess file contents, command output, or tool results. Inspect first, then act.
- Ask a clarifying question only when the request cannot be completed safely or the intent is genuinely ambiguous.
- Do not reveal secrets, credentials, tokens, or private environment details.

Available tools and how to use them:
- read_file(filePath): Read a UTF-8 text file. Use this before editing or when you need exact file contents.
- write_file(filePath, content): Create a file or intentionally replace a whole file. Do not overwrite existing user work unless the user asked for it or you have inspected the file first.
- edit_file(filePath, edits): Make precise replacements in an existing file. Each oldText must match exactly one unique, non-overlapping region in the original file. Keep oldText as small as possible while still unique, and combine multiple independent edits for the same file in one call.
- execute_shell(command): Run Windows-compatible shell commands from the current working directory. Use it for listing files, searching, installing dependencies when appropriate, running builds/tests/linters, and inspecting project state.
- web_search: Use when current external information is needed, such as library documentation, API changes, versions, or recent errors.

Workflow:
1. Understand the user's request and inspect relevant files/directories with read_file or execute_shell.
2. Make a short plan internally before changing code.
3. Use edit_file for targeted modifications and write_file for new files or deliberate full rewrites.
4. After code changes, run the most relevant verification command available, such as tests, build, lint, or a focused smoke check. If you cannot run verification, say why.
5. Final responses should summarize what changed, list affected files, mention verification results, and note any follow-up steps.

Safety rules:
- Avoid destructive commands such as deleting files, resetting branches, or overwriting broad directories unless explicitly requested.
- Ask before installing packages, running long-running services, performing migrations, or using commands that may affect external systems.
- If a tool fails, explain the failure briefly, adjust your approach, and continue when possible.`;

async function executeTool(toolName, args) {
    if (toolName === "read_file") {
        const { filePath } = JSON.parse(args);
        return await readFile(filePath);
    }
    else if (toolName === "execute_shell") {
        const { command } = JSON.parse(args);
        return await executeShell(command);
    }
    else if (toolName === "edit_file") {
        const { filePath, edits } = JSON.parse(args);
        return await editFile(filePath, edits);
    }
    else if (toolName === "write_file") {
        const { filePath, content } = JSON.parse(args);
        return await writeFile(filePath, content);
    }
    else {
        throw new Error(`Unknown tool: ${toolName}`);
    }
}

async function main() {
    let input = null;
    let pendingToolCall = false;
    let messageHistory = [];

    while (true) {
        if (input == null && pendingToolCall == false) {
            input = await rl.question("Enter a question or ask a follow up question: ");
            messageHistory.push({
                role: "user",
                content: input,
            })
            input = null;
        }

        const responseStream = await client.responses.create({
            model: deploymentName,
            instructions: systemPrompt,
            tools: tools,
            input: messageHistory,
            stream: true,
        })

        let toolCalls = {};
        for await (const event of responseStream) {
            if (event.type == "response.output_text.delta") {
                process.stdout.write(event.delta);
            }
            else if (event.type == "response.output_item.done") {
                if (event.item.type == "function_call") {
                    toolCalls[event.output_index] = event.item;
                }

                messageHistory.push(event.item);
            }
        }

        pendingToolCall = Object.keys(toolCalls).length > 0;

        for (const key in toolCalls) {
            const toolCall = toolCalls[key];
            process.stdout.write(`\nTool called: ${toolCall.name}\n arguments: ${toolCall.arguments}\n`);
            let result = await executeTool(toolCall.name, toolCall.arguments);
            process.stdout.write(`Result: ${result}\n\n`);

            messageHistory.push({
                type: "function_call_output",
                call_id: toolCall.call_id,
                output: result,
            })
        }

        process.stdout.write("\n\n");
    }
}

await main();