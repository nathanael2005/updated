/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// This file is a backend server for a Telegram bot. It does not create a webpage.
// It connects to Telegram and waits for messages to respond to.

import { Telegraf } from 'telegraf';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config'; // Loads environment variables from a .env file
import http from 'http';
import fs from 'fs';
import path from 'path';

// --- Initialization & Safety Check ---
// IMPORTANT: You need to create a .env file with your API keys.
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error("ERROR: TELEGRAM_BOT_TOKEN is not defined. Please create a .env file and add it.");
  process.exit(1);
}
if (!process.env.API_KEY) {
  console.error("ERROR: API_KEY is not defined. Please create a .env file and add it.");
  process.exit(1);
}

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';

// This is the core "personality" of your bot.
// It instructs the AI on how to behave in every conversation.
const systemInstruction = `You are a virtual companion for students named 'VentBot'. Your purpose is to be a warm, empathetic, and non-judgmental listener. You provide a safe space for students to vent their frustrations, fears, and thoughts.
RULES:
- Acknowledge the user's feelings with warmth and support.
- Keep your responses supportive but brief (2-3 sentences is ideal).
- NEVER give medical, legal, or financial advice. You are a listener, not an expert.
- If a user's message mentions self-harm, suicide, or immediate danger to themselves or others, you MUST respond with ONLY this exact text: "It sounds like you are going through a lot right now, and it takes courage to talk about it. Please know that you are not alone and help is available. I strongly encourage you to speak with a trusted professional. You can connect with someone who can support you by calling or texting 988 in the US and Canada, or 111 in the UK. Please reach out to them."
- Your main role is to listen and offer gentle encouragement. Avoid trying to solve their problems.`;

// --- Bot Commands & Logic ---

// This runs when a user first starts a chat with the bot.
bot.start((ctx) => {
  ctx.replyWithMarkdown(
    `Hello ${ctx.from.first_name}! 👋\n\nI'm here to listen. This is a safe and anonymous space for you to vent or confess anything on your mind. Just send me a message.\n\n*Disclaimer:* I am an AI bot and not a replacement for a mental health professional. If you are in crisis, please seek professional help immediately.\n\nType /resources to see a list of helpful organizations.`
  );
});

// This creates a custom command `/resources`.
bot.command('resources', (ctx) => {
    ctx.replyWithMarkdown(
        `*Here are some helpful resources:*\n\n` +
        `• *Crisis Text Line:* Text HOME to 741741 (US/Canada) or 85258 (UK)\n` +
        `• *988 Suicide & Crisis Lifeline:* Call or text 988 (US/Canada)\n` +
        `• *The Trevor Project (for LGBTQ youth):* 1-866-488-7386\n\n` +
        `Remember, reaching out for help is a sign of strength.`
    );
});

// This handles any regular text message a user sends.
bot.on('text', async (ctx) => {
  // Ignore text that is a command.
  if (ctx.message.text.startsWith('/')) {
    return;
  }

  const userInput = ctx.message.text;
  
  // Let the user know the bot is "thinking".
  await ctx.replyWithChatAction('typing');

  try {
    // Send the user's message to the Gemini API with our system instruction.
    const response = await ai.models.generateContent({
        model: model,
        contents: userInput,
        config: {
            systemInstruction: systemInstruction,
        },
    });

    const aiResponse = response.text;
    ctx.reply(aiResponse);

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    ctx.reply("I'm having a little trouble processing that right now. Please try again in a moment.");
  }
});

// --- Launch Bot & Web Server ---
bot.launch().then(() => {
    console.log("Bot is online and listening for messages...");
});

// This web server's job is to serve the landing page and keep the Render service alive.
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code == 'ENOENT') {
                res.writeHead(404);
                res.end('404 Not Found');
            } else {
                res.writeHead(500);
                res.end('Server error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Web server started on port ${PORT}. This is required to run on Render's free Web Service plan.`);
});


// These lines help the bot shut down gracefully if the server is stopped.
process.once('SIGINT', () => {
    bot.stop('SIGINT')
    server.close();
});
process.once('SIGTERM', () => {
    bot.stop('SIGTERM')
    server.close();
});
