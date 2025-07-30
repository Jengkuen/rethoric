# Rethoric - Technical Specification Document

## Executive Summary

**Product:** Rethoric - Critical thinking platform with AI-powered reasoning coach
**Architecture:** Next.js frontend with Convex backend and Gemini 2.5 Flash API integration
**Core Experience:** Real-time chat interface for daily critical thinking challenges

---

## System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │  Convex Backend │    │ Gemini 2.5 Flash│
│                 │    │                 │    │                 │
│ • Chat UI       │◄──►│ • Convex Agents │◄──►│ • LLM Reasoning │
│ • Reports       │    │ • Real-time DB  │    │ • Content Gen   │
│ • Auth          │    │ • Functions     │    │ • Analysis      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

**Frontend**

- **Framework:** Next.js 14+ (App Router)
- **Styling:** Shadcn
- **State Management:** Convex
- **Authentication:** Clerk Auth integrated into convex
- **Real-time:** Convex

**Backend**

- **Database & Functions:** Convex
- **AI Integration:** Convex Agents SDK
- **LLM Provider:** Google Gemini 2.5 Flash API
- **Real-time:** Convex

**Development**

- **Language:** TypeScript
- **Package Manager:** npm
- **Deployment:** Vercel (frontend) + Convex (backend)

---

## Database Schema

### Core Tables

```typescript
// conversations.ts
export default defineTable({
  userId: v.id("users"),
  questionId: v.id("questions"),
  status: v.union(v.literal("active"), v.literal("completed")),
  startedAt: v.number(),
  completedAt: v.optional(v.number()),
  messageCount: v.number(),
}).index("by_user", ["userId"]);

// messages.ts
export default defineTable({
  conversationId: v.id("conversations"),
  role: v.union(v.literal("user"), v.literal("assistant")),
  content: v.string(),
  timestamp: v.number(),
}).index("by_conversation", ["conversationId"]);

// questions.ts
export default defineTable({
  title: v.string(),
  question: v.string(),
  category: v.union(
    v.literal("politics"),
    v.literal("economics"),
    v.literal("technology"),
    v.literal("society"),
    v.literal("ethics"),
  ),
  tags: v.array(v.string()),
  isActive: v.boolean(),
  createdAt: v.number(),
}).index("by_active", ["isActive"]);

// reports.ts
export default defineTable({
  conversationId: v.id("conversations"),
  userId: v.id("users"),
  originalQuestion: v.string(),
  userConclusion: v.string(),
  strengths: v.array(v.string()),
  improvements: v.array(v.string()),
  followUpQuestions: v.array(v.string()),
  generatedAt: v.number(),
}).index("by_user", ["userId"]);

// users.ts
export default defineTable({
  email: v.string(),
  name: v.string(),
  stats: v.object({
    totalConversations: v.number(),
    streakDays: v.number(),
    lastActivityAt: v.optional(v.number()),
  }),
}).index("by_email", ["email"]);

// user_answered_questions.ts
export default defineTable({
  userId: v.id("users"),
  questionId: v.id("questions"),
  answeredAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_user_question", ["userId", "questionId"]) // O(log n) individual question lookup
  .index("by_question", ["questionId"]); // For analytics and admin features
```

---

## API Architecture

### Convex Functions

**Mutations**

```typescript
// conversations.ts
export const startNewConversation = mutation({
  args: {},
  handler: async (ctx, args) => {
    // Check if user has existing conversation with 0 messages
    // If yes, return that conversation ID
    // If no, create new conversation with selected question
    // Question selection: daily question if not answered, else random unAnswered
    // Return conversation ID and question data
  },
});

export const addMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
  },
  handler: async (ctx, args) => {
    // Add message to conversation
    // Update conversation metadata
    // Trigger AI response if user message
  },
});

export const endConversation = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    // Mark conversation as completed
    // Add entry to user_answered_questions table
    // Trigger report generation
    // Update user stats
  },
});
```

**Queries**

```typescript
// conversations.ts
export const getActiveConversation = query({
  args: {},
  handler: async (ctx) => {
    // Get user's current active conversation
    // Include messages and question data
  },
});

export const getConversationHistory = query({
  args: {
    cursor: v.optional(v.id("conversations")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get user's conversation history with cursor-based pagination
    // Default limit: 50 conversations per page
    // Include basic metadata only (no messages)
    // Returns: { conversations, nextCursor, hasMore }
  },
});

// questions.ts
export const getQuestionForUser = query({
  args: {},
  handler: async (ctx) => {
    // Get today's featured question
    // Use compound index to check if user answered it: O(log n) lookup
    // If answered, get all user's answered questions via index
    // Filter question bank to exclude answered questions
    // Return random unAnswered question
  },
});

export const getDailyFeaturedQuestion = query({
  args: {},
  handler: async (ctx) => {
    // Get today's featured question (rotates daily)
    // Used for determining which question to show new users
  },
});

// user_answered_questions.ts
export const hasUserAnsweredQuestion = query({
  args: { questionId: v.id("questions") },
  handler: async (ctx, { questionId }) => {
    // Efficient O(log n) lookup using compound index
    // Returns boolean - leverages Convex indexing optimization
  },
});

export const getUserAnsweredQuestions = query({
  args: {},
  handler: async (ctx) => {
    // Efficient lookup of all user's answered questions
    // Uses by_user index for fast retrieval
    // Cached by Convex for subsequent calls
  },
});

// reports.ts
export const getConversationReport = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    // Get detailed report for completed conversation
  },
});
```

**Actions (Convex Agents)**

```typescript
// ai.ts
export const generateAIResponse = action({
  args: {
    conversationId: v.id("conversations"),
    userMessage: v.string(),
  },
  handler: async (ctx, args) => {
    // Use Convex Agents SDK to:
    // 1. Get conversation context
    // 2. Call Gemini API for response
    // 3. Store AI message
    // 4. Return response
  },
});

export const generateReport = action({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    // Use Convex Agents SDK to:
    // 1. Analyze entire conversation
    // 2. Generate structured report
    // 3. Store report in database
  },
});
```

---

## Frontend Architecture

### App Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── page.tsx              # Home page with chat interface and reports
│   └── layout.tsx            # Main layout with sidebar
├── components/
│   ├── ui/                   # Shadcn/UI components
│   ├── layout/
│   │   ├── Sidebar.tsx       # Left sidebar with conversations
│   │   └── MainContent.tsx   # Main chat area
│   ├── chat/
│   │   ├── ConversationList.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── MessageInput.tsx
│   │   └── ChatArea.tsx
│   ├── reports/
│   │   ├── ReportDisplay.tsx # Dedicated report component
│   │   └── ReportSection.tsx # Individual report sections
│   └── auth/
│       └── UserProfile.tsx
├── lib/
│   ├── convex.ts
│   └── utils.ts
└── styles/
    └── globals.css
```

### Key Components

**Sidebar Component**

```typescript
export function Sidebar() {
  // "New Chat" button at top
  // Conversation history list with timestamps
  // User profile/login section at bottom
  // Minimalist dark theme matching screenshot
}
```

**MainContent Component**

```typescript
interface MainContentProps {
  conversationId?: Id<"conversations">;
  viewMode: "conversation" | "report";
}

export function MainContent({ conversationId, viewMode }: MainContentProps) {
  // Welcome state when no conversation
  // Toggle view: Chat messages OR report display
  // Toggle tabs at top: [Conversation] [📊 Report]
  // Message input only shown in conversation mode
  // Auto-switches to report mode when conversation ends
}
```

**MessageInput Component**

```typescript
export function MessageInput() {
  // Single text input field
  // Send button (Enter key support)
  // End conversation button (fire switch style, requires confirmation)
  // No model selection or additional buttons
  // Matches minimalist design from screenshot
}
```

**ConversationList Component**

```typescript
export function ConversationList() {
  // List of previous conversations
  // Grouped by time periods ("Last 30 Days", etc.)
  // Click to load conversation
  // Simple text-based list items
}
```

**MessageBubble Component**

```typescript
interface MessageBubbleProps {
  message: {
    role: "user" | "assistant";
    content: string;
    timestamp: number;
  };
}

export function MessageBubble({ message }: MessageBubbleProps) {
  // Conditional styling (white for user, sage green for AI)
  // Clean bubble design matching screenshot
  // Proper spacing and typography
}
```

---

## UI Design & Layout

### Design Philosophy

The interface follows a minimalist design inspired by modern chat applications, emphasizing clean typography and ample whitespace for focused conversations.

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Main Application Layout                   │
├─────────────┬───────────────────────────────────────────────┤
│   Sidebar   │              Main Content Area              │
│             │                                             │
│ • New Chat  │  ┌─────────────────────────────────────────┐ │
│ • History   │  │         Chat Messages Area              │ │
│   - AI Exp..│  │                                         │ │
│   - Greeting│  │  [AI Message Bubble - Sage Green]      │ │
│             │  │  [User Message Bubble - White]         │ │
│             │  │                                         │ │
│             │  └─────────────────────────────────────────┘ │
│             │                                             │
│ • Login     │  ┌─────────────────────────────────────────┐ │
│             │  │  Type your message here...              │ │
│             │  │                              [Send] │ │
│             │  └─────────────────────────────────────────┘ │
└─────────────┴───────────────────────────────────────────────┘
```

### Color Scheme

- **Background:** Dark theme (#1a1a1a or similar)
- **Sidebar:** Darker shade for contrast
- **AI Messages:** Sage green bubble background
- **User Messages:** White/light bubble background
- **Text:** High contrast for readability
- **Accents:** Subtle highlights for interactive elements

### Typography

- Clean, readable font (Inter, System UI, or similar)
- Appropriate line height for comfortable reading
- Consistent text sizes across components

---

## Real-time Data Flow

### Conversation Flow

1. **Start New Conversation:**
   - User clicks "New Chat" button in sidebar
   - `startNewConversation` mutation checks for existing empty conversation
   - If empty conversation exists, returns that conversation ID
   - If none exists, creates new conversation with appropriate question:
     - Uses compound index to check if user answered today's featured question (O(log n))
     - If not answered: uses daily featured question
     - If answered: efficiently gets all answered questions via index, filters question bank, selects random unAnswered question
   - AI posts initial question in main content area
   - Conversation appears in sidebar history

2. **Active Chat:**
   - User types message in bottom input field → `addMessage` mutation
   - Triggers `generateAIResponse` action
   - AI response stored via `addMessage` mutation
   - Real-time subscription updates chat area

3. **End Conversation:**
   - User clicks "End Conversation" button (fire switch design in input area)
   - Requires confirmation to prevent accidental triggers
   - `endConversation` mutation marks conversation complete
   - Adds entry to user_answered_questions table with compound indexing
   - Triggers `generateReport` action
   - Auto-switches MainContent to report view mode (no route change)

### Real-time Subscriptions (Lazy Loading Pattern)

```typescript
// In MainContent component
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// CRITICAL: Only subscribe to active conversation messages for real-time updates
const activeMessages = useQuery(
  api.messages.getByConversation,
  activeConversationId ? { conversationId: activeConversationId } : "skip",
);

// Conversation list: metadata only, no real-time subscriptions
const conversationHistory = useQuery(api.conversations.getConversationHistory, {
  cursor: conversationCursor,
  limit: 50, // Paginated loading
});

// Auto-updates when new messages arrive in active conversation only
useEffect(() => {
  if (activeMessages?.length) {
    scrollToBottom();
  }
}, [activeMessages]);
```

### Convex Optimization Patterns

**Efficient Question Selection Logic:**

```typescript
// Optimized question selection leveraging Convex indexing
export const selectQuestionForUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = (await ctx.auth.getUserIdentity()).subject;

    // O(log n) check for today's featured question
    const dailyQuestion = await getDailyFeaturedQuestion(ctx);
    const hasAnsweredDaily =
      (await ctx.db
        .query("user_answered_questions")
        .withIndex("by_user_question", (q) =>
          q.eq("userId", userId).eq("questionId", dailyQuestion._id),
        )
        .first()) !== null;

    if (!hasAnsweredDaily) {
      return dailyQuestion;
    }

    // Efficient batch lookup of answered questions
    const answeredQuestionIds = new Set(
      (
        await ctx.db
          .query("user_answered_questions")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .collect()
      ).map((r) => r.questionId),
    );

    // Filter and select from remaining questions
    const availableQuestions = await ctx.db
      .query("questions")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect()
      .then((questions) =>
        questions.filter((q) => !answeredQuestionIds.has(q._id)),
      );

    return selectRandom(availableQuestions);
  },
});
```

**Key Optimizations:**

- **Compound indexes** for O(log n) individual question lookups
- **Batch queries** for collecting user's answered questions
- **Query caching** - Convex automatically caches these patterns
- **Reactive precision** - only relevant components re-render on data changes

### Report Display Flow (Toggle View Approach)

**Integrated Report Component:**

1. **Report Generation:** After conversation ends, `MainContent` auto-switches to report view mode
2. **Toggle Interface:** Users can switch between conversation and report views with tab controls
3. **Report Structure:** Full-screen report display with structured sections:
   - Original Question (restated for context)
   - Your Conclusion (AI's synthesis of user's final position)
   - Commendations (specific reasoning strengths)
   - Areas for Improvement (growth opportunities with examples)
   - Dive Deeper (3-4 follow-up questions for future conversations)
4. **Navigation Options:**
   - Toggle tabs: [Conversation] [📊 Report]
   - "Start New Chat" button to begin fresh conversation
   - Seamless context switching without route changes

**Report Component Structure:**

```typescript
interface ReportDisplayProps {
  conversationId: Id<"conversations">;
  onStartNewChat: () => void;
  onToggleView: () => void;
}

export function ReportDisplay({
  conversationId,
  onStartNewChat,
  onToggleView,
}: ReportDisplayProps) {
  // Fetch report data by conversationId
  // Full-screen layout with toggle controls
  // Interactive elements for follow-up questions
  // Integrated navigation within same content area
}
```

**Key Benefits:**

- **Seamless UX:** No route changes or context switching
- **Mobile-friendly:** Single content area works on all screen sizes
- **Natural flow:** Report appears immediately after conversation ends
- **Easy reference:** One-click toggle back to conversation messages

---

## AI Integration Patterns

### Convex Agents Setup

```typescript
// convex/ai.ts
import { ConvexAgents } from "@convex-dev/agents";

const agents = new ConvexAgents({
  model: "gemini-2.5-flash",
  apiKey: process.env.GEMINI_API_KEY,
});

export const generateResponse = action({
  args: { conversationId: v.id("conversations"), userMessage: v.string() },
  handler: async (ctx, { conversationId, userMessage }) => {
    // Get conversation context
    const conversation = await ctx.runQuery(api.conversations.get, {
      id: conversationId,
    });
    const messages = await ctx.runQuery(api.messages.getByConversation, {
      conversationId,
    });

    // Build prompt with context
    const prompt = buildMentorPrompt(
      conversation.question,
      messages,
      userMessage,
    );

    // Generate AI response
    const response = await agents.chat({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    // Store response
    await ctx.runMutation(api.messages.add, {
      conversationId,
      role: "assistant",
      content: response.content,
    });

    return response.content;
  },
});
```

### Prompt Engineering Patterns

```typescript
function buildMentorPrompt(
  question: Question,
  messages: Message[],
  userMessage: string,
) {
  return `
You are a thoughtful AI reasoning coach for Rethoric. Your role is to engage as a Socratic mentor, helping users develop critical thinking skills.

Question: ${question.question}
Category: ${question.category}

Conversation so far:
${messages.map((m) => `${m.role}: ${m.content}`).join("\n")}

User's latest message: ${userMessage}

Guidelines:
- Ask probing questions that deepen analysis
- Challenge assumptions respectfully
- Encourage perspective-taking
- Highlight reasoning strengths
- Use a warm, intellectually curious tone
- Keep responses concise (2-3 sentences max)
- Don't provide direct answers - guide discovery

Respond as the AI mentor:
  `;
}
```

---

## Security & Privacy Considerations

**Authentication**

- Convex Auth with email/password and social providers
- Session management with secure tokens
- Rate limiting on API endpoints
- Input validation and sanitization

**AI Safety**

- Content moderation for inappropriate responses
- Conversation logging for quality assurance
- Fallback responses for AI failures
- Clear AI disclosure in interface

---

## Future Optimizations

### Phase 4: Advanced Scalability (Future)

**Virtual Scrolling for Conversation Lists**

- Implement virtual scrolling in `ConversationList` component
- Render only visible conversation items (~10-15) regardless of total count
- Maintains smooth scroll performance with 1000+ conversations
- Libraries: `react-window` or `@tanstack/react-virtual`

**Search and Filtering**

- Full-text search across conversation messages
- Filter by date ranges, conversation topics, and question categories
- Advanced search with Convex text search or external search service integration
- Quick filters: "Last 7 days", "Favorites", "Unfinished conversations"

**Performance Monitoring**

- Client-side performance metrics for large conversation lists
- Database query performance tracking for users with extensive histories
- Memory usage monitoring for long-running chat sessions

---

This technical specification provides the foundation for building Rethoric as described in the PRD, with a focus on real-time chat experiences, AI-powered reasoning coaching, and scalable architecture using modern web technologies. Critical pagination and lazy loading patterns ensure the platform scales efficiently as users accumulate hundreds of conversations.
