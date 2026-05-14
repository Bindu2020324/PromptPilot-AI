# 🛫 PromptPilot AI

### Navigate Better Prompts. Unlock Better AI.

<p align="center">
  <img src="https://img.shields.io/badge/AI-Powered-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Open%20Source-Project-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Prompt-Engineering-purple?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Chrome-Extension-orange?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Free%20API-Supported-brightgreen?style=for-the-badge" />
</p>

---

# 🌌 What is PromptPilot AI?

**PromptPilot AI** is an intelligent prompt enhancement platform that helps users transform ordinary prompts into powerful AI instructions.

Instead of struggling with:

- vague outputs ❌
- incomplete responses ❌
- poorly structured prompts ❌

PromptPilot helps you generate:

- context-aware prompts ✅
- optimized AI instructions ✅
- structured outputs ✅
- smarter conversations with AI ✅

Think of it as your **AI Prompt Navigation System**.

---

# ⚡ Why PromptPilot?

AI is only as smart as the prompt you give it.

PromptPilot bridges the gap between:  
🧠 _human ideas_  
and  
🤖 _high-quality AI responses_

Whether you're writing code, generating content, researching, designing, or brainstorming — PromptPilot helps you communicate with AI more effectively.

---

# ✨ Core Features

## 🧠 Prompt Enhancement Engine

Transform simple prompts into:

- Detailed prompts
- Goal-oriented prompts
- Structured instructions
- Role-based prompts
- Output-controlled prompts

---

## 🎯 Smart Prompt Engineering

Supports advanced prompting techniques:

- Zero-shot prompting
- Few-shot prompting
- Chain-of-thought prompting
- Context injection
- Prompt refinement

---

## 🚀 AI Productivity Booster

Improve:

- response quality
- creativity
- accuracy
- structure
- contextual understanding

---

## 🌍 Multi-AI Compatibility

Compatible with:

- ChatGPT
- Gemini
- Claude
- Llama
- Open-source LLMs

---

## 🎨 Clean & Responsive Interface

✔ Modern UI  
✔ Smooth UX  
✔ Mobile Responsive  
✔ Fast Performance  
✔ Minimalistic Design

---

# 🔑 API Setup Guide

PromptPilot AI supports **3 AI providers**. You need an API key from at least one provider to use the extension.

> 💡 **Recommendation for beginners:** Start with **Groq** — it's completely free, no credit card required, and very fast.

---

## Provider Comparison

| Provider             | Cost                      | Speed      | Best For             |
| -------------------- | ------------------------- | ---------- | -------------------- |
| 🟢 **Groq**          | **Free forever**          | ⚡ Fastest | Beginners, daily use |
| 🔵 **Google Gemini** | **Free tier** (generous)  | ⚡ Fast    | General use          |
| 🟠 **OpenAI**        | Paid ($5 credit to start) | Medium     | GPT-4o quality       |

---

## 🟢 Option 1: Groq API Key (Recommended — Free)

Groq offers **free API access** to powerful open-source models like LLaMA 3.3 70B — no credit card needed.

### Steps to get your Groq API key:

**Step 1** — Go to [console.groq.com](https://console.groq.com)

```
https://console.groq.com
```

**Step 2** — Click **"Sign Up"** and create a free account

- You can sign up with Google, GitHub, or email

**Step 3** — After logging in, click **"API Keys"** in the left sidebar

**Step 4** — Click **"Create API Key"**

```
Name your key: PromptPilot-Extension
```

**Step 5** — Copy the key — it starts with `gsk_`

```
Example: gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Step 6** — Open PromptPilot extension → click ⚙️ Settings → select **Groq** → paste your key → click **Save Settings**

> ⚠️ **Important:** Copy the key immediately after creation. Groq only shows it once.

---

## 🔵 Option 2: Google Gemini API Key (Free Tier)

Google AI Studio offers a **free tier** with generous daily limits — no credit card required for basic usage.

### Steps to get your Gemini API key:

**Step 1** — Go to [aistudio.google.com](https://aistudio.google.com)

```
https://aistudio.google.com
```

**Step 2** — Sign in with your **Google account**

**Step 3** — Click **"Get API Key"** in the left sidebar

**Step 4** — Click **"Create API key"**

- Choose **"Create API key in new project"** (recommended)

**Step 5** — Copy the generated key — it starts with `AIza`

```
Example: AIzaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Step 6** — Open PromptPilot extension → click ⚙️ Settings → select **Gemini** → paste your key → click **Save Settings**

> 💡 **Free tier limits:** 15 requests/minute, 1 million tokens/day — more than enough for personal use.

---

## 🟠 Option 3: OpenAI API Key (Paid)

OpenAI's GPT-4o Mini is available with a paid API key. New accounts get **$5 free credit** to start.

### Steps to get your OpenAI API key:

**Step 1** — Go to [platform.openai.com](https://platform.openai.com)

```
https://platform.openai.com
```

**Step 2** — Click **"Sign Up"** or **"Log In"**

**Step 3** — After logging in, click your profile icon (top right) → **"API keys"**

Or go directly to:

```
https://platform.openai.com/api-keys
```

**Step 4** — Click **"+ Create new secret key"**

```
Name: PromptPilot-Extension
```

**Step 5** — Copy the key — it starts with `sk-`

```
Example: sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Step 6** — Open PromptPilot extension → click ⚙️ Settings → select **OpenAI** → paste your key → click **Save Settings**

> ⚠️ **Note:** You need to add billing information and have credits available. New accounts get $5 free credit.

---

## 🔒 How Your API Key is Stored

Your API key is stored **securely in your browser only** using `chrome.storage.local`:

- ✅ Never sent to any server other than your chosen AI provider
- ✅ Never stored in the cloud
- ✅ Never shared with PromptPilot or any third party
- ✅ Only leaves your browser when you click "Forge Prompt"

---

## 🧪 Testing Your API Key

Once you've added your key:

1. Open the PromptPilot extension
2. Type a simple prompt: `write a hello world in Python`
3. Click **"✦ Forge Prompt"**
4. If you see an enhanced prompt → your key is working! ✅
5. If you see an error → double-check the key was copied correctly

### Common Errors

| Error                        | Cause             | Fix                              |
| ---------------------------- | ----------------- | -------------------------------- |
| `Invalid API key`            | Wrong key or typo | Re-copy from provider dashboard  |
| `Rate limit`                 | Too many requests | Wait 1 minute and try again      |
| `No API key set`             | Key not saved     | Go to Settings and save your key |
| `Model provider unreachable` | Network issue     | Check internet connection        |

---

## Project Structure

```
├── src/
│   ├── App.jsx           # Main React component
│   ├── background.js     # Extension background script
│   ├── content.js        # Content script for webpage integration
│   ├── main.jsx          # React entry point
│   └── index.css         # Styles
├── public/
│   └── icons/           # Extension icons (16x16, 48x48, 128x128)
├── index.html           # Main HTML file
├── manifest.json        # Extension manifest
├── package.json         # Project dependencies
├── vite.config.js       # Vite configuration
└── README.md           # This file
```

---

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Modern web browser (Chrome, Edge, Firefox)
- API key from Groq, Gemini, or OpenAI (see [API Setup Guide](#-api-setup-guide) above)

---

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Bindu2020324/PromptPilot-AI.git
   cd PromptPilot-AI
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

## Running from a shared ZIP

If you send someone the ZIP file, they must follow these steps:

1. unzip the project folder
2. open a terminal in the project folder
3. run `npm install`
4. run `npm run build`
5. load the extension from the generated `dist/` folder in the browser

### If you want the ZIP to work without requiring npm install

1. build the project locally first:
   ```bash
   npm install
   npm run build
   ```
2. include the entire `dist/` folder in the ZIP
3. the recipient can then load the unpacked extension directly from `dist/`

### Loading the built extension

1. Open your browser extension page:
   - Chrome/Edge: `chrome://extensions/`
   - Firefox: `about:debugging#/runtime/this-firefox`
2. Enable **Developer Mode** (Chrome/Edge)
3. Click **Load unpacked** and choose the `dist/` folder

### Free GitHub-built version

If your repository is public, this project automatically builds on every push to `main` and uploads a ready-to-download `dist` artifact.

To use it:

1. Open your repository on GitHub
2. Go to **Actions**
3. Open the latest `Build and package extension` workflow run
4. Download the `promptpilot-ai-dist` artifact
5. Unzip and load the `dist/` folder as an unpacked extension

This gives users a simple free way to try the extension without running `npm install` or `npm run build` themselves.

---

## Development

### Running in Development Mode

```bash
npm run dev
```

This will start the Vite development server and watch for changes.

### Loading the Extension

1. Open your browser and go to the extensions page:
   - **Chrome/Edge**: `chrome://extensions/` or `edge://extensions/`
   - **Firefox**: `about:debugging#/runtime/this-firefox`

2. Enable **Developer Mode** (top-right corner for Chrome/Edge)

3. Click **Load unpacked** and select the `dist` folder from your project

## Building

```bash
npm run build
```

This creates an optimized build in the `dist` folder ready for distribution.

### Code Quality

```bash
npm run lint        # Check for ESLint errors
npm run format      # Auto-format code with Prettier
npm run format:check # Check formatting without changing files
```

---

## Configuration

Edit `manifest.json` to customize:

- Extension name and description
- Permissions
- Icons and branding
- Content scripts and background behavior

---

## Technologies Used

- **React** - UI framework
- **Vite** - Build tool
- **JavaScript** - Core logic
- **CSS** - Styling
- **Groq / Gemini / OpenAI API** - AI providers

---

## File Descriptions

| File               | Purpose                                      |
| ------------------ | -------------------------------------------- |
| `manifest.json`    | Defines extension metadata and permissions   |
| `background.js`    | Handles background tasks and extension logic |
| `content.js`       | Injects functionality into web pages         |
| `App.jsx`          | Main React component                         |
| `vite.config.js`   | Build configuration                          |
| `eslint.config.js` | ESLint configuration                         |
| `.prettierrc`      | Prettier formatting rules                    |

---

## 🎯 Use Cases

- Content Writing
- Coding Assistance
- AI Research
- Resume & SOP Writing
- Marketing Content
- Academic Work
- Productivity Automation
- AI Workflow Optimization

---

## 🔥 Future Roadmap

- 🎙 Voice-to-Prompt
- 🧠 AI Memory System
- 📊 Prompt Analytics
- 🌐 Multi-language Support
- 📁 Prompt Marketplace
- 🤖 Multi-Agent Prompting
- 🔗 Browser Extension
- 📈 Prompt Scoring Engine

---

## Contributing

Contributions are welcome! Please feel free to submit issues and enhancement requests.

See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup, branch naming, PR checklist, and testing instructions.

---

## License

MIT License - see LICENSE file for details

---

## Support

For questions or issues, please open an issue on [GitHub](https://github.com/Bindu2020324/PromptPilot-AI/issues).

---

**Built with ❤️ using React and Vite**
