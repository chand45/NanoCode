# NanoCode

NanoCode is a local coding assistant CLI built with the OpenAI SDK and Azure identity.

It runs in your terminal, keeps conversation history across follow-up questions, and can use local tools to inspect and modify the current project.

## What this agent can do

NanoCode can help with common software development tasks inside the current repository, including:

- Explaining the structure and purpose of a codebase
- Reading files from the local project
- Writing new files
- Editing existing files with precise text replacements
- Running shell commands in the current working directory
- Answering follow-up questions with full chat context
- Streaming responses live in the terminal while it works

## Built-in tools

The agent is configured with the following tools:

- `read_file(filePath)`
  - Reads the contents of a UTF-8 text file
- `write_file(filePath, content)`
  - Creates or overwrites a file with the provided content
- `edit_file(filePath, edits)`
  - Applies targeted text replacements to an existing file
- `execute_shell(command)`
  - Runs a shell command in the current working directory
- `web_search`
  - Intended for retrieving current external information when needed

## Typical use cases

You can ask NanoCode to do things like:

- "Explain this repo"
- "Read `package.json` and summarize the scripts"
- "Update this function to handle errors"
- "Create a new README section for setup"
- "Run tests and tell me what failed"
- "Search the codebase for where a function is used"

## How it works

- You enter a prompt in the terminal
- The agent sends your request, along with prior conversation history, to the model
- The model can decide to answer directly or call one of the available tools
- Tool results are fed back into the conversation so the agent can continue reasoning and respond

## Setup

Install dependencies:

```bash
npm install
```

Configure Azure OpenAI settings with environment variables. Do not commit real secrets or private endpoint values.

```bash
export AZURE_OPENAI_ENDPOINT="<your-azure-openai-endpoint>"
export AZURE_OPENAI_DEPLOYMENT="<your-deployment-name>"
# Optional; defaults to https://ai.azure.com/.default
# export AZURE_OPENAI_SCOPE="https://ai.azure.com/.default"
```

On PowerShell:

```powershell
$env:AZURE_OPENAI_ENDPOINT="<your-azure-openai-endpoint>"
$env:AZURE_OPENAI_DEPLOYMENT="<your-deployment-name>"
```

## Run

```bash
npm start
```

## Notes

- This agent is designed for local project assistance.
- It is best suited for coding, repo inspection, file updates, and command execution.
- Be careful when allowing shell commands or file writes in important repositories.
