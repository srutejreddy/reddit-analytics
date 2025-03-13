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