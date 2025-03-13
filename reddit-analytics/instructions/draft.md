**# Project overview**
You are building a Reddit analytics platform, where users can get analytics of different sub reddits, where they can see top contents & see category of posts;

You will be using NextJS 14, shaden, tailwind, Lucid icon

**# Core Functionalities**

1. See list of available sub reddits & add new sub reddits
  1. Users can-see list of available sub-reddits that already created-display in cards, common ones Like "ollama", "openai"
  2. Users can clicking on an add reddit button, which should open a modal for users to paste in reddit url and add
  3. After users adding a new reddit, a new card should be added
2. Subreddit page
  1. Clicking on each subreddit, should goes to a reddit page
  1. With 2 tabs: "Top posts", "Themes"
3. Fetch reddit posts data in "Top posts"
  1. Under "Top posts" page, we want to display fetched reddit posts from past 24 hrs
  2. We will use snoowrap as Library to fetch reddit data
  3. Each post, including title, score, content, url, created_utc, num_comments
  4. Display the reddits in a table component. Sort based on num of score
4. Analyse reddit posts data in "Themes"
  1. For each post, we should send post data to OpenAI using structured output to categorise "Solution requests", "Pain & anger", "Advice r talk";
    1. "Solution requests": Posts where people are seeking solutions for problems
    2. "Pain & anger": Posts where people are expressing pains or anger
    3. "Advice requests": Posts where people are seeking advice
    4. "Money talk": Posts where people are talking about spending money
  2. This process needs to be ran concurrently for posts, so it will be faster
  3. "Themes" page, we should display each category as a card, with title, description & num of counts
  4. Clicking on the card will open side panel to display all posts under this category

**# Docs**
## Documentation for how to fetch reddit posts using Snoowrap (For 3. Fetch reddit posts data in "Top posts") 
### Code example:
```
import Snoowrap from 'snoowrap';
import dotenv from 'dotenv';
import { DateTime } from 'luxon';

// Load environment variables
dotenv.config();

// Interface for our post data
interface RedditPost {
    title: string;
    url: string;
    selftext: string;
    score: number;
    num_comments: number;
    created_utc: number;
}

// Initialize the Reddit client
const reddit = new Snoowrap({
    userAgent: process.env.REDDIT_USER_AGENT!,
    clientId: process.env.REDDIT_CLIENT_ID!,
    clientSecret: process.env.REDDIT_CLIENT_SECRET!,
    username: process.env.REDDIT_USERNAME!,
    password: process.env.REDDIT_PASSWORD!
});

async function fetchRecentDogPosts() {
    try {
        // Get posts from r/dog
        const subreddit = reddit.getSubreddit('dog');
        const posts = await subreddit.getNew();
        
        // Calculate timestamp for 24 hours ago
        const oneDayAgo = DateTime.now().minus({ hours: 24 }).toUnixInteger();
        
        // Filter and map posts
        const recentPosts = posts
            .filter(post => post.created_utc > oneDayAgo)
            .map((post): RedditPost => ({
                title: post.title,
                url: post.url,
                selftext: post.selftext,
                score: post.score,
                num_comments: post.num_comments,
                created_utc: post.created_utc
            }));

        // Print the results
        console.log(`Found ${recentPosts.length} posts from the last 24 hours:`);
        recentPosts.forEach(post => {
            console.log('\n-------------------');
            console.log(`Title: ${post.title}`);
            console.log(`URL: ${post.url}`);
            console.log(`Content: ${post.selftext.substring(0, 100)}...`);
            console.log(`Score: ${post.score}`);
            console.log(`Comments: ${post.num_comments}`);
        });

    } catch (error) {
        console.error('Error fetching posts:', error);
    }
}

// Run the function
fetchRecentDogPosts(); 
```

## Documentation for how to categorise reddit posts using OpenAI structured output 
### Code example:
```
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
```

Expected response:
```
Categorization result: {
  "categories": {
    "solution_request": true,
    "pain_anger": false,
    "advice_request": true,
    "money_talk": false
  }
}
```


**# Current file structure**
.
├── README.md
├── app
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components
│   └── ui
├── components.json
├── eslint.config.mjs
├── lib
│   └── utils.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── public
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
└── tsconfig.json

**# Aditional Requirements**
1. Project Setup
   - All new components should go in /components at the root (not in the app folder) and be named Like example-component.tsx unless otherwise specified
   - All new pages go in /app
   - Use the Next.js 14 app router
   - All data fetching should be done in a server component and pass the data down as props.
   - Client components (useState, hooks, etc) require that 'use client' is set at the top of the file

2. Server-Side API Calls:

   - All interactions with external APIs (e.g., Reddit, OpenAI) should be performed server-side.
   - Create dedicated API routes in the `pages/api` directory for each external API interaction.
   - Client-side components should fetch data through these API routes, not directly from external APIs.

3. Environment Variables:
   - Store all sensitive information (API keys, credentials) in environment variables.
   - Use a `.env.local` file for local development and ensure it's listed in `.gitignore`.
   - For production, set environment variables in the deployment platform (e.g., Vercel).
   - Access environment variables only in server-side code or API routes.

4. Error Handling and Logging:

   - Implement comprehensive error handling in both client-side components and server-side API routes.
   - Log errors on the server-side for debugging purposes.
   - Display user-friendly error messages on the client-side.

5. Type Safety:
   - Use TypeScript interfaces for all data structures, especially API responses.
   - Avoid using `any` type; instead, define proper types for all variables and function parameters.

6. API Client Initialization:
   - Initialize API clients (e.g., Snoowrap for Reddit, OpenAI) in server-side code only.
   - Implement checks to ensure API clients are properly initialized before use.

7. Data Fetching in Components:
   - Use React hooks (e.g., `useEffect`) for data fetching in client-side components.
   - Implement loading states and error handling for all data fetching operations.

8. Next.js Configuration:
   - Utilize `next.config.mjs` for environment-specific configurations.
   - Use the `env` property in `next.config.mjs` to make environment variables available to the application.

9. CORS and API Routes:

   - Use Next.js API routes to avoid CORS issues when interacting with external APIs.
   - Implement proper request validation in API routes.

10. Component Structure:

- Separate concerns between client and server components.
- Use server components for initial data fetching and pass data as props to client components.

11. Security:
    - Never expose API keys or sensitive credentials on the client-side.
    - Implement proper authentication and authorization for API routes if needed.
