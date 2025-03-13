# Reddit Analytics Platform - Project Requirements Document (PRD)

## 1. Project Overview

We are building a **Reddit Analytics Platform** using **Next.js 14** (App Router), **ShadCN/UI**, **Tailwind CSS**, and **Lucide Icons**. The platform allows users to:

- Manage subreddits (view and add new ones).
- View top Reddit posts from the past 24 hours for each subreddit.
- Categorize posts into themes using OpenAI APIs.

### Key Objectives

1. **Subreddit Management**:  
   - Display existing subreddits.  
   - Add a new subreddit via a modal.  

2. **Top Posts**:  
   - Fetch subreddit posts from the past 24 hours.  
   - Sort them by score.  
   - Display them in a table.  

3. **Themes**:  
   - Analyze and categorize posts into themes (e.g. “Solution requests”, “Pain & anger”, “Advice requests”, “Money talk”).  
   - Display theme categories with counts, and allow users to view posts under each category.

---

## 2. Core Functionalities

Below are the **core features** that must be implemented:

1. **List of Subreddits**  
   - Display available subreddits in cards.  
   - Common subreddits might be listed by default (e.g., r/ollama, r/openai).  
   - Add a new subreddit via a modal dialog where the user pastes the subreddit URL.  
   - Upon successful creation, a new card appears on the landing page.

2. **Subreddit Page**  
   - Each card links to a dynamic route dedicated to that subreddit.  
   - The subreddit page has two tabs:  
     - **Top Posts**  
     - **Themes**

3. **Fetch Reddit Posts (“Top Posts”)**  
   - Use **Snoowrap** to retrieve posts from the past 24 hours.  
   - Display post information (title, score, content, URL, created_utc, num_comments) in a table.  
   - Sort the table by `score`.

4. **Analyze Reddit Posts (“Themes”)**  
   - For each post, call OpenAI with a structured output request to categorize it into:  
     1. **Solution requests**  
     2. **Pain & anger**  
     3. **Advice requests**  
     4. **Money talk**  
   - This categorization should run concurrently to improve performance.  
   - Display categories in cards with the count of posts in each category.  
   - Clicking a category displays a side panel listing the relevant posts.

---

## 3. Implementation Structure

### 3.1 Next.js 14 (App Router)

- **All new pages** (i.e., the landing page, subreddit pages, etc.) live under the `app` directory.
- **Dynamic routes** (like `[subreddit]`) capture the subreddit parameter from the URL.
- **Server components** handle data fetching (from your own API routes).
- **Client components** handle interactive elements (e.g., modals, side panels, forms).

### 3.2 API Routes (Server-Side Only)

- External API calls (Reddit, OpenAI) happen via dedicated API routes in `pages/api`.  
- **`/pages/api/reddit.ts`**: A server-side route to fetch data using Snoowrap.  
- **`/pages/api/openai.ts`**: A server-side route to categorize post data using OpenAI.

### 3.3 Environment Variables

- Store **all** sensitive credentials in environment variables:
  - `REDDIT_USER_AGENT`
  - `REDDIT_CLIENT_ID`
  - `REDDIT_CLIENT_SECRET`
  - `REDDIT_USERNAME`
  - `REDDIT_PASSWORD`
  - `OPENAI_API_KEY`
- Keep these variables in `.env.local` (excluded from source control).  
- In production, set environment variables in your deployment platform.

### 3.4 Error Handling & Logging

- **Server-side**: Log errors for debugging. Return appropriate error statuses from API routes.  
- **Client-side**: Show user-friendly error messages or fallback UIs.

### 3.5 Type Safety

- Use **TypeScript** interfaces for all data structures (e.g., responses from your `/pages/api` endpoints).  
- Avoid `any`; define or import the correct interfaces from a shared `types.ts` file in `/lib`.

### 3.6 Minimal File Structure

Below is a **lean** file structure that meets all requirements:

```
.
├── README.md
├── .gitignore
├── .env.local.example
├── next.config.mjs
├── package.json
├── tsconfig.json

├── app
│   ├── layout.tsx           # Main layout (server component)
│   ├── globals.css          # Tailwind/reset/global styles
│   ├── page.tsx             # Landing page: lists subreddits & "Add Subreddit" button
│   └── [subreddit]          # Dynamic route for a specific subreddit
│       ├── page.tsx         # Server component for "Overview" or redirecting to top-posts/themes
│       ├── top-posts
│       │   └── page.tsx     # Server component; fetch top posts, pass to table
│       └── themes
│           └── page.tsx     # Server component; fetch & categorize, pass to theme cards

├── pages
│   └── api
│       ├── reddit.ts        # API route for fetching from Reddit (Snoowrap)
│       └── openai.ts        # API route for categorizing posts (OpenAI + Zod)

├── components
│   ├── subreddit-card.tsx       # Renders one subreddit card (client component)
│   ├── add-subreddit-modal.tsx  # Modal to add a new subreddit (client component)
│   ├── top-posts-table.tsx      # Displays posts in a table (client component)
│   ├── theme-card.tsx           # Displays category + count (client component)
│   └── theme-sidebar.tsx        # Side panel listing posts in a chosen category (client component)

├── lib
│   ├── snoowrap-client.ts   # Helper to initialize Snoowrap (server only)
│   ├── openai-client.ts     # Helper to initialize OpenAI (server only)
│   └── types.ts             # Shared TypeScript interfaces

├── postcss.config.mjs
├── tailwind.config.js
└── ...
```

---

## 4. Documentation & Code Examples

Below are the code samples (originally provided) to illustrate how the **Reddit fetch** and **OpenAI categorization** logic works. **Note**: These examples are for reference and **must be integrated** with the API route approach described above (via `pages/api/reddit.ts` and `pages/api/openai.ts`) to keep credentials server-side.

### 4.1 Fetching Reddit Posts (Snoowrap)

**Documentation for how to fetch reddit posts using Snoowrap (For “Top Posts”)**

```ts
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

**Important**: In the actual application, the above code belongs in a **server-side environment**, specifically your `pages/api/reddit.ts` route or a helper function in `lib/snoowrap-client.ts`, never directly in a client component.

---

### 4.2 Categorizing Reddit Posts (OpenAI + Zod)

**Documentation for how to categorize reddit posts using OpenAI structured output**

```ts
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

**Expected Response Example**:
```json
Categorization result: {
  "categories": {
    "solution_request": true,
    "pain_anger": false,
    "advice_request": true,
    "money_talk": false
  }
}
```

As with the Snoowrap code, the above logic must reside in server-side code only (e.g., `pages/api/openai.ts` or `lib/openai-client.ts`) to avoid exposing your API key.

---

## 5. Additional Requirements

1. **Project Setup**  
   - Use Next.js 14 with the **App Router** (`app` directory).  
   - Put new UI components in `/components` at the root, named like `example-component.tsx`.  
   - All sensitive data fetching is done in server components or API routes.  
   - Client components require `"use client"` at the top.

2. **API Client Initialization**  
   - **Snoowrap** and **OpenAI** must be initialized server-side only using environment variables.  
   - No direct calls to external APIs from client code.

3. **Error Handling & Logging**  
   - Comprehensive error handling in both API routes and the client.  
   - Server logs for debugging.  
   - User-friendly messages on the client.

4. **CORS**  
   - By default, Next.js API routes handle CORS for same-origin requests.  
   - External calls remain on the server side, so no additional CORS configuration is typically needed.

5. **Security**  
   - Never expose API keys in client JavaScript bundles.  
   - Environment variables remain in `.env.local` or the hosting environment.

6. **Type Safety**  
   - Use TypeScript **interfaces** and **Zod** for schema validation.

