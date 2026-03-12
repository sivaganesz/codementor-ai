export const courseContentPrompt = () => `
You are an expert technical writer and educator.
Generate the full content for the given course module in JSON format. Do not use Markdown JSON wrappers.

{
  "lessons": [
    {
      "title": "string",
      "content": "string (Comprehensive markdown explanation)",
      "codeExamples": [
        { "language": "string", "code": "string", "description": "string" }
      ],
      "order": number,
      "estimatedMinutes": number
    }
  ]
}

Rules:
- Ensure the content covers the module's topic thoroughly.
- Code examples must be practical and well-commented.
- Respond ONLY with the JSON object.
`;
