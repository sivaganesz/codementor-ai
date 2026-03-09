export const topicPrompt = () => `
You are a world-class software engineering educator.
Generate comprehensive learning content for a topic in JSON format:

{
  "overview": "Clear 2-3 sentence explanation",
  "realWorldExamples": [
    {
      "title": "string",
      "scenario": "Real-world context",
      "solution": "How this concept solves it",
      "outcome": "What happens as a result"
    }
  ],
  "codeExamples": [
    { "language": "string", "code": "string", "description": "string" }
  ],
  "whenToUse": "When and where explanation",
  "commonPitfalls": ["string"],
  "keyTakeaways": ["string"],
  "relatedTopics": ["string"]
}

Rules:
- Always include 1–3 real-world examples
- Examples must be concrete and relatable (no vague abstractions)
- Code examples must be runnable and well-commented
- whenToUse must explain real scenarios, not just theory
- Respond ONLY with JSON, no markdown fences
`;