# UI Changes Documentation

## New Conversation UI Revamp

### Overview

Replace the current modal-based "Start New Conversation" flow with a Claude-inspired main content area interface.

### Current State

- **Sidebar** (`Sidebar.tsx:39-46`): "Start New Conversation" button opens a modal
- **NewConversationModal**: Shows either daily/random question with option to start conversation
- **MainContent**: Shows either "no conversation selected" state or actual conversation

### New Implementation Plan

#### 1. **Create New Main Content State**

- Replace the "no conversation selected" state in `MainContent.tsx` with a new "start conversation" UI
- Add a new state to track when user wants to start a new conversation vs. selecting existing ones

#### 2. **Design Two-Section Layout** (Inspired by Claude's UI)

- **Section 1: Single Suggested Question**
  - Show ONE suggested question at a time (daily question or random question from `getNextQuestionForUser()`)
  - Display as an elegant card with only title
  - Clickable to start conversation immediately
  - Clean, minimal design with hover states
- **Section 2: Custom Question Input**
  - Large text area similar to Claude's input
  - Placeholder text like "Enter your own question to explore..."
  - "Start Conversation" button below the input

#### 3. **Update Component Architecture**

- **Modify `ChatInterface.tsx`**: Add new state for "new conversation mode"
- **Update `Sidebar.tsx`**: Change button behavior to set new conversation mode instead of opening modal
- **Enhance `MainContent.tsx`**: Add new component for the start conversation UI
- **Remove `NewConversationModal.tsx`**: Replace modal-based flow entirely

#### 4. **API Usage**

- Reuse existing `getNextQuestionForUser()` function for the suggested question
- Use existing `startNewConversation()` for suggested questions
- **For custom questions**: Create new atomic mutation `startConversationWithCustomQuestion()`
  - Single transaction that creates question and starts conversation atomically
  - No validation required - assume all user input is valid
  - Auto-generate question metadata (tags: ["custom"], isDaily: false, etc.)
  - Follows Convex best practices by avoiding two-step operations

#### 5. **UI/UX Design Philosophy**

- **Clean & Minimal**: Following Claude's aesthetic with lots of whitespace
- **Card-based Layout**: Single question in elegant card with subtle shadow
- **Consistent Typography**: Clear hierarchy with titles and descriptions
- **Smooth Interactions**: Hover effects and smooth transitions
- **Responsive Design**: Works well on both desktop and mobile
- **Simplicity**: One suggested question to avoid choice paralysis

#### 6. **User Flow**

1. User clicks "Start New Conversation" → Main content shows new UI (two sections)
2. User can either:
   - Click on the single suggested question → Starts conversation immediately with existing question
   - Type custom question → Click "Start Conversation" button → Single atomic operation creates question and starts conversation
3. Once conversation starts → Switch to normal conversation view

#### 7. **Custom Question Handling**

- **No Validation**: All user input is assumed to be valid and appropriate
- **Atomic Operation**: Single `startConversationWithCustomQuestion()` mutation handles:
  - Creating question in database with metadata:
    - `title`: User's input text
    - `description`: Same as title
    - `tags`: ["custom"]
    - `isDaily`: false
    - `dailyDate`: null
  - Starting conversation with the newly created question
  - All within a single Convex transaction for consistency
- **No Deduplication**: For MVP, each custom question creates a new database entry

### Benefits

- Eliminates modal interruption
- More integrated and elegant experience
- Consistent with modern AI chat interfaces
- Maintains all existing functionality while improving UX
- Simplified choice with single suggested question
