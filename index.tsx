/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// This file is now a backend server for a Telegram bot. It does not create a webpage.
// It connects to Telegram and waits for messages to respond to.

import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config'; // Loads environment variables from a .env file
import http from 'http';

// --- Initialization & Safety Check ---
// IMPORTANT: You need to create a .env file with your API keys for local testing.
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error("ERROR: TELEGRAM_BOT_TOKEN is not defined. Please check your environment variables.");
  (process as any).exit(1);
}
if (!process.env.API_KEY) {
  console.error("ERROR: API_KEY is not defined. Please check your environment variables.");
  (process as any).exit(1);
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
    `Hello ${ctx.from.first_name}! ??\n\nI'm here to listen. This is a safe and anonymous space for you to vent or confess anything on your mind. Just send me a message.\n\n*Disclaimer:* I am an AI bot and not a replacement for a mental health professional. If you are in crisis, please seek professional help immediately.\n\nType /resources to see a list of helpful organizations.`
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
bot.on(message('text'), async (ctx) => {
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

// --- Launch Bot (Webhook for Production, Polling for Development) ---

// A secret path to ensure only Telegram is calling our webhook
const secretPath = `/telegraf/${bot.secretPathComponent()}`;

// Production Environment (e.g., Render)
if (process.env.RENDER_EXTERNAL_URL) {
  const webhookUrl = `${process.env.RENDER_EXTERNAL_URL}${secretPath}`;

  // Set the webhook
  bot.telegram.setWebhook(webhookUrl)
    .then(() => console.log(`Webhook successfully set to ${webhookUrl}`))
    .catch(console.error);
    
  // Create an HTTP server to listen for Telegram's requests
  const server = http.createServer(bot.webhookCallback(secretPath));
  
  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`Bot is online, listening for webhooks on port ${port}...`);
  });

} else {
  // Development Environment (local machine)
  console.log("Running in development mode using long polling...");
  bot.launch().then(() => {
    console.log("Bot is online and listening for messages...");
  });
}

// These lines help the bot shut down gracefully if the server is stopped.
(process as any).once('SIGINT', () => bot.stop('SIGINT'));
(process as any).once('SIGTERM', () => bot.stop('SIGTERM'));