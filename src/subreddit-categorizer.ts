import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Define the schema with descriptions for each category
const PostCategories = z.object({
    categories: z.object({
        solution_request: z.boolean().describe('Posts where people are seeking tools or solutions for specific problems'),
        pain_anger: z.boolean().describe('Posts expressing frustration, pain points, or negative emotions about a situation'),
        advice_request: z.boolean().describe('Posts seeking guidance, recommendations, or resources from the community'),
        money_talk: z.boolean().describe('Posts discussing financial aspects, costs, or monetary considerations')
    })
});

export type CategoryResponse = z.infer<typeof PostCategories>;

export async function categorizePost(postContent: string): Promise<CategoryResponse> {
    try {
        const completion = await openai.beta.chat.completions.parse({
            model: "gpt-4o",
            // model: "gpt-4o-2024-08-06",
            messages: [
                {
                    role: "system",
                    content: "Analyze the post content and categorize it based on the defined categories in the schema."
                },
                {
                    role: "user",
                    content: postContent
                }
            ],
            response_format: zodResponseFormat(PostCategories, "categories")
        });

        const parsed = completion.choices[0].message.parsed;
        if (!parsed) {
            throw new Error('Failed to parse the response from OpenAI');
        }
        
        return parsed;
    } catch (error) {
        console.error('Error categorizing post:', error);
        throw error;
    }
}

// Example usage
async function main() {
    const samplePost = `"I'm happy with my current project management tool. but want to see how can i get my dog happier and im looking for a product to feed dog while im away";`;

    try {
        const result = await categorizePost(samplePost);
        console.log('Categorization result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error in main:', error);
    }
}

// Run the example if this file is run directly
if (require.main === module) {
    main();
} 