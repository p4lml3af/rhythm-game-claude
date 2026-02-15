# MCP Servers Setup Guide

I've installed 4 MCP servers for your Claude projects. Some require API keys to function. Here's how to set them up:

## ✅ Already Working (No API Key Required)

### AWS Documentation Server
- **Status:** Ready to use immediately
- **What it does:** Provides access to AWS technical documentation and best practices
- **No setup needed!**

---

## 🔑 Requires API Keys (Optional but Recommended)

### 1. Context7 - Up-to-Date Documentation ⭐ HIGHLY RECOMMENDED

**What it does:** Fetches the latest version-specific documentation for any library or framework

**Setup:**
1. Visit [context7.com/dashboard](https://context7.com/dashboard)
2. Sign up for a free account
3. Copy your API key
4. Open [.mcp.json](.mcp.json)
5. Replace the empty `CONTEXT7_API_KEY` value with your key:
   ```json
   "CONTEXT7_API_KEY": "your-api-key-here"
   ```

**Free Tier:** Available with higher rate limits

---

### 2. GitHub MCP Server ⭐ RECOMMENDED

**What it does:** Manages issues, PRs, code analysis directly through Claude

**Setup:**
1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a name like "Claude MCP Server"
4. Select scopes: `repo`, `read:org`, `read:user`
5. Generate and copy the token
6. Open [.mcp.json](.mcp.json)
7. Replace the empty `GITHUB_PERSONAL_ACCESS_TOKEN` value:
   ```json
   "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_your_token_here"
   ```

---

### 3. Google Developer Knowledge API

**What it does:** Access official Google documentation (Firebase, Cloud, Android, Maps, etc.)

**Setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Developer Knowledge API
4. Go to "Credentials" and create an API key
5. Run this command to enable MCP:
   ```bash
   gcloud beta services mcp enable developerknowledge.googleapis.com --project=YOUR_PROJECT_ID
   ```
6. Open [.mcp.json](.mcp.json)
7. Replace the empty `GOOGLE_API_KEY` value:
   ```json
   "GOOGLE_API_KEY": "your-google-api-key"
   ```

---

## 🎮 Game Development Bonus Servers (Optional)

If you're using specific game engines, you can add these:

### Unity3D MCP Server
Add to [.mcp.json](.mcp.json):
```json
"unity3d": {
  "command": "npx",
  "args": ["-y", "unity3d-mcp"]
}
```

### Godot MCP Server
Add to [.mcp.json](.mcp.json):
```json
"godot": {
  "command": "npx",
  "args": ["-y", "godot-mcp"]
}
```

---

## 📋 How to Use

Once configured, you can ask Claude questions like:
- "Use Context7 to show me the latest React hooks documentation"
- "Search GitHub for similar issues in my repository"
- "Get Firebase authentication docs from Google Developer Knowledge"
- "Show me AWS Lambda best practices"

---

## 🔄 Restart Required

After adding API keys to [.mcp.json](.mcp.json), you may need to restart Claude Code for the changes to take effect.

---

## 🛠️ Troubleshooting

**MCP servers not showing up?**
- Make sure you've restarted Claude Code
- Check that the API keys are properly formatted (no extra quotes or spaces)
- Verify your [.mcp.json](.mcp.json) file has valid JSON syntax

**Need help with API keys?**
- Context7: [context7.com/docs](https://github.com/upstash/context7)
- GitHub: [GitHub Token Documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
- Google: [Developer Knowledge API Docs](https://developers.google.com/knowledge/api)

---

## 📚 Additional Resources

- [Official MCP Registry](https://registry.modelcontextprotocol.io/)
- [Awesome MCP Servers](https://github.com/wong2/awesome-mcp-servers)
- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
