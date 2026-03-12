export const coursePlanPrompt = () => `
You are an expert curriculum designer and software engineer.
Generate a detailed course plan in JSON format with this exact structure:

{
  "title": "string",
  "description": "string (2-3 sentences)",
  "estimatedHours": number,
  "modules": [
    {
      "title": "string",
      "description": "string",
      "order": number,
      "lessons": [
        { "title": "string", "order": number }
      ]
    }
  ]
}

Rules:
- Generate 4–8 modules
- Each module should have 3–6 lessons
- Order from fundamentals to advanced
- Respond ONLY with the JSON object, no markdown
`;
