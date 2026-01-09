# OpenRouter API Setup

## Getting Started

1. **Get your OpenRouter API Key**:
   - Visit [https://openrouter.ai/keys](https://openrouter.ai/keys)
   - Sign in with your Google or GitHub account
   - Create a new API key
   - Copy the API key

2. **Create `.env.local` file**:
   - In the root directory of the project, create a file named `.env.local`
   - Add the following line:
     ```
     OPENROUTER_API_KEY=your_actual_api_key_here
     ```
   - Replace `your_actual_api_key_here` with your actual OpenRouter API key

3. **Restart the development server**:
   - Stop the current server (Ctrl+C)
   - Run `npm run dev` again to load the new environment variable

## Usage

Once set up, the conjugation feature will automatically use OpenRouter's GPT-4o model to:
- Generate Hebrew verb conjugations for all 10 pronouns
- Provide Spanish translations
- Include transliterations and example sentences
- Support past, present, and future tenses

## Troubleshooting

- **"Invalid API key" error**: Make sure your `.env.local` file exists and contains the correct API key
- **Rate limit errors**: You may have exceeded your API usage limits. Check your OpenRouter dashboard
- **Network errors**: Ensure you have an active internet connection
