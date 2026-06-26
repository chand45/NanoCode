# NanoCode

A local coding assistant CLI built with the OpenAI SDK and Azure identity.

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

Run:

```bash
npm start
```
