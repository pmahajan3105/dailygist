import { OpenAI } from 'openai';
import { ContentItem, DigestItem } from '@daily-digest/core';

export class Summarizer {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey,
    });
  }

  async summarizeContent(content: ContentItem): Promise<DigestItem> {
    const prompt = `Please summarize the following content concisely but informatively. 
    Focus on the key points and main ideas. Return the response as a JSON object with 
    the following structure: { "title": "...", "summary": "...", "importance": 1-5, "tags": [...] }
    
    Content to summarize:
    ${content.content.substring(0, 4000)}`; // Limit input size

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that summarizes content concisely.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{}');
      
      return {
        id: content.id,
        title: result.title || content.title,
        summary: result.summary || '',
        content: content.content,
        source: content.source,
        url: content.url,
        publishedAt: content.publishedAt,
        importance: Math.min(5, Math.max(1, result.importance || 3)),
        tags: result.tags || [],
      };
    } catch (error) {
      console.error('Error in summarizeContent:', error);
      throw new Error('Failed to summarize content');
    }
  }

  async generateDigest(items: DigestItem[], length: 'short' | 'medium' | 'long' = 'medium'): Promise<string> {
    const lengthMap = {
      short: '5 minutes',
      medium: '15 minutes',
      long: '25 minutes',
    };

    const prompt = `Create a well-structured daily digest from the following items. 
    The total reading time should be approximately ${lengthMap[length]}.
    
    Items (in order of importance):
    ${items
      .map(
        (item, i) =>
          `[${i + 1}] ${item.title} (Importance: ${item.importance}/5)\n${item.summary}`
      )
      .join('\n\n')}
    
    Please format the digest with clear sections and bullet points.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert at creating clear, engaging, and informative daily digests.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
      });

      return response.choices[0]?.message?.content || 'No content generated';
    } catch (error) {
      console.error('Error in generateDigest:', error);
      throw new Error('Failed to generate digest');
    }
  }
}
