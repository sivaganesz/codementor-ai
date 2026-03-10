export interface GenerateTopicDto {
  topic: string
  preferredDepth?: 'beginner' | 'intermediate' | 'advanced'
}

export interface TopicContent {
  id: string
  topic: string
  overview: string
  realWorldExamples: RealWorldExample[]
  codeExamples: TopicCodeExample[]
  whenToUse: string
  commonPitfalls: string[]
  keyTakeaways: string[]
  relatedTopics: string[]
  createdAt: string
}

export interface RealWorldExample {
  title: string
  scenario: string
  solution: string
  outcome: string
}

export interface TopicCodeExample {
  language: string
  code: string
  description: string
}

export interface TopicSummary {
  id: string
  topic: string
  createdAt: string
}
