# OpenRouter Model Benchmark Tests

This test suite benchmarks different OpenRouter models for Hebrew verb conjugation and practice exercise generation.

## Prerequisites

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file in the project root with your OpenRouter API key:
   ```
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```

   To get your OpenRouter API key:
   - Visit [https://openrouter.ai/keys](https://openrouter.ai/keys)
   - Sign in with your Google or GitHub account
   - Create a new API key
   - Copy the API key to your `.env.local` file

## Running the Tests

Run the benchmark tests with:

```bash
npm run test:models
```

## What Gets Tested

The test suite evaluates 5 different OpenRouter models:

- `google/gemini-2.5-flash`
- `xiaomi/mimo-v2-flash:free`
- `x-ai/grok-4.1-fast`
- `openai/gpt-5-mini`
- `deepseek/deepseek-v3.2`

For each model, the tests:

### 1. Conjugation Tests
- Test with 5 common Hebrew verbs: לכתוב, לקרוא, ללמוד, לשחק, לאכול
- Measure response time
- Validate JSON structure:
  - Presence of `spanishTranslation` field
  - Array of exactly 10 conjugations
  - Required fields: `pronoun`, `past`, `present`, `future`
  - Optional fields: transliterations and examples

### 2. Practice Exercise Tests
- Test with the same 5 Hebrew verbs
- Measure response time
- Validate JSON structure:
  - Array of exactly 10 conjugations
  - Array of 12-15 exercises
  - Each exercise has required fields: `id`, `type`, `tense`, `sentence`, `correctAnswer`
  - Exercise types are either "multiple_choice" or "input"
  - Multiple choice exercises have 4 options
  - Exercises are distributed across tenses (past, present, future)

## Output

The test provides:

1. **Real-time progress**: Shows each test as it runs with success/failure indicators
2. **Summary tables**: 
   - Average response times per model
   - Success rates per model
   - Rankings by speed
3. **Quality rankings**: Overall rankings considering both success rate and speed
4. **Detailed error information**: Lists all failed tests with specific validation errors

## Example Output

```
CONJUGATION TEST RESULTS
--------------------------------------------------------------------------------
Model                               Avg Time (ms)   Success Rate    Success/Total
--------------------------------------------------------------------------------
google/gemini-2.5-flash                     1250           100.0%        5/5
x-ai/grok-code-fast-1                       1580            80.0%        4/5
...

Ranking by Speed (Fastest First):
  1. google/gemini-2.5-flash - 1250ms (100.0% success)
  2. x-ai/grok-code-fast-1 - 1580ms (80.0% success)
  ...
```

## Notes

- Tests run sequentially to avoid rate limiting
- A 500ms delay is added between requests
- If a model fails with a rate limit error, the test continues with other models
- Total test time depends on model response times (typically 5-10 minutes for all tests)

## Troubleshooting

**"OPENROUTER_API_KEY environment variable is not set"**
- Make sure you've created `.env.local` in the project root
- Verify the file contains: `OPENROUTER_API_KEY=your_key_here`
- The key should not have quotes around it

**Rate limit errors**
- The test will continue with other models
- You may need to wait and re-run the tests later
- Check your OpenRouter usage limits

**JSON parse errors**
- Some models may occasionally return invalid JSON
- These are tracked and reported in the detailed error section
- Consider retrying failed models
