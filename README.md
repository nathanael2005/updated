# Telegram Vent Bot - Setup and Run Instructions

This guide contains two parts:
*   **Part 1:** How to run the bot on your own computer for development and testing.
*   **Part 2:** How to deploy the bot to a free hosting service so it can run 24/7.

---

## Prerequisites

Before you start, you must have **[Node.js](https://nodejs.org/en/download)** installed on your machine. You can download it from the official website.

---

## Part 1: Running Locally (For Testing)

Follow these steps to run the bot on your own computer. This is useful for making sure everything works before you deploy it.

### Step 1: Open Your Terminal (Command Line)

You need to run commands from your project's main folder.

*   **On Windows:** Open the Start Menu, search for `Command Prompt` or `PowerShell`, and open it.
*   **On macOS:** Open Finder, go to `Applications` > `Utilities`, and open `Terminal`.
*   **On Linux:** Open your distribution's terminal application.

Once the terminal is open, navigate to your project folder using the `cd` command. For example:
```bash
cd path/to/your/project/folder
```

### Step 2: Install Project Dependencies

Your `package.json` file lists all the software libraries your bot needs to run. Run the following command in your terminal to download and install them. You only need to do this once.

```bash
npm install
```

This will create a `node_modules` folder in your project.

### Step 3: Get Your API Keys

Your bot needs two secret keys to connect to Telegram and Google's AI.

1.  **Telegram Bot Token:**
    *   Open Telegram and search for the user `BotFather` (it has a blue checkmark).
    *   Start a chat with `BotFather` and send the command `/newbot`.
    *   Follow the instructions. It will ask for a name and a username for your bot.
    *   At the end, `BotFather` will give you a long token. **Copy this token.**

2.  **Google Gemini API Key:**
    *   Go to the [Google AI Studio website](https://aistudio.google.com/app/apikey).
    *   Log in with your Google account.
    *   Click the "**Create API key**" button.
    *   **Copy the generated API key.**

### Step 4: Create the `.env` File

This is a critical step for keeping your secret keys safe.

1.  In your project's main folder (the same place as `index.js` and `package.json`), create a new file and name it **exactly** `.env` (the dot at the beginning is important).
2.  Open this `.env` file with a text editor and add the following content. Paste your keys where indicated.

```env
# Paste the token you got from BotFather on Telegram
TELEGRAM_BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN_HERE

# Paste the API key you got from Google AI Studio
API_KEY=YOUR_GOOGLE_API_KEY_HERE
```

Save and close the file.

### Step 5: Start Your Bot

Now you are ready to run the bot server. In your terminal, run the following command:

```bash
npm start
```

If everything is set up correctly, you will see this message in your terminal:
`Bot is online and listening for messages...`

Your bot is now running from your computer. To stop it, go back to your terminal window and press `Ctrl + C`.

---

## Part 2: Deploying for 24/7 Uptime (Recommended)

To make your bot available 24/7, you need to host it on a server. We will use a service called **Render**, which has a free plan perfect for this.

### Step 1: Upload Your Project to GitHub

Hosting services like Render connect to your code through a Git repository.

1.  **Create a GitHub Account:** If you don't have one, sign up for free at [GitHub.com](https://github.com).

2.  **Create a `.gitignore` file:** This file is crucial. It tells Git to ignore sensitive files and unnecessary folders. Create a file named `.gitignore` in your project's root folder and add the following content:
    ```
    # Dependencies
    /node_modules

    # Environment variables - VERY IMPORTANT
    .env
    ```

3.  **Create a New Repository:** On GitHub, click the `+` icon in the top-right and select "New repository". Give it a name (e.g., `telegram-vent-bot`) and create it.

4.  **Upload Your Code:** Follow the instructions on your new GitHub repository page under the section "...or push an existing repository from the command line". The commands will look something like this:
    ```bash
    # Connect your local folder to your GitHub repo
    git remote add origin https://github.com/your-username/your-repo-name.git

    # Prepare your files for upload
    git branch -M main
    git add .

    # Save your files with a message
    git commit -m "Initial commit"

    # Upload your files
    git push -u origin main
    ```

### Step 2: Deploy on Render.com

1.  **Sign Up:** Go to [Render.com](https://render.com) and sign up using your GitHub account.

2.  **Create a New Service:**
    *   On the Render Dashboard, click **New +** and select **Background Worker**.
    *   Connect your GitHub account and select the repository you just created.

3.  **Configure the Service:**
    *   **Name:** Give your service a name (e.g., `telegram-vent-bot`).
    *   **Region:** Choose a region close to you.
    *   **Branch:** Select `main`.
    *   **Start Command:** Enter `npm start`.

4.  **Add Your Secret Keys (Environment Variables):**
    *   Scroll down to the **Environment** section. This is where you'll put your API keys, just like you did with the `.env` file for local testing.
    *   Click **Add Environment Variable**.
    *   Create the first key:
        *   **Key:** `API_KEY`
        *   **Value:** Paste your Google Gemini API key.
    *   Click **Add Environment Variable** again.
    *   Create the second key:
        *   **Key:** `TELEGRAM_BOT_TOKEN`
        *   **Value:** Paste your Telegram Bot Token.

5.  **Launch:**
    *   Scroll to the bottom and click **Create Background Worker**.
    *   Render will now install your dependencies (`npm install`) and run your start command (`npm start`).
    *   You can watch the progress in the "Logs" tab. When it's finished, you'll see the message: `Bot is online and listening for messages...`

**Congratulations!** Your bot is now running on a server and will be online 24/7. Render will automatically redeploy your bot whenever you push new code changes to your GitHub repository's `main` branch.
