# Rethoric - Implementation Plan

## Overview

This document outlines a phased implementation plan for building Rethoric, a critical thinking platform with AI-powered reasoning coach. Each phase is designed to be distinct, isolated, and suitable for AI-driven development with clear testing boundaries.

---

## Phase 1: Core Foundation & Database Setup

**Duration: 1-2 sprints | Dependencies: None**

### Objectives

- Set up project structure and development environment
- Implement database schema and core data models
- Establish authentication system
- Create basic project scaffolding

### Deliverables

#### 1.1 Project Setup

- [x] Initialize Next.js 14+ project with TypeScript
- [x] Configure Convex backend with proper environment setup
- [x] Install and configure Shadcn/UI components
- [x] Set up development scripts and linting

#### 1.2 Database Schema Implementation

- [x] Implement `conversations` table with proper indexing
- [x] Implement `messages` table with conversation relationships
- [x] Implement `questions` table with category and tag support
- [x] Implement `reports` table for AI-generated analysis
- [x] Implement `users` table with stats tracking
- [x] Implement `user_answered_questions` junction table with compound indexing
- [x] Create database validation schemas using Convex validators

#### 1.3 Authentication Setup

- [x] Configure Clerk Auth integration with Convex
- [x] Create Clerk sign-in and sign-up pages using Clerk components
- [x] Implement lazy user creation pattern in Convex queries/mutations
- [x] Configure route protection using Next.js middleware
- [x] Build user profile components with direct Convex queries

#### 1.4 Basic Convex Functions

- [x] Set up proper error handling and validation
- [x] Implement user session management
- [x] Defer CRUD operations to feature-specific implementations (Phase 2+)

### Testing Strategy

- Unit tests for database schema validation
- Integration tests for authentication flows
- End-to-end tests for user registration/login
- Database migration and rollback procedures

### Success Criteria

- All database tables created with proper relationships
- User can register, login, and access protected areas
- Development environment fully functional
- Basic data operations working correctly

---

## Phase 2: Question Management & Selection Logic

**Duration: 1 sprint | Dependencies: Phase 1**

### Objectives

- Implement intelligent question selection algorithm
- Create question management system
- Build efficient question filtering and tracking
- Establish daily question rotation system

### Deliverables

#### 2.1 Core Data Models & Schema Updates

- [x] Add `isDaily` and `dailyDate` fields to questions table
- [x] Implement compound indexes: `by_user_answered` on `[userId, questionId]`
- [x] Add `by_daily` index on `[isDaily, dailyDate]` for daily question queries

#### 2.2 Question Selection Engine

- [x] Implement `getNextQuestionForUser(userId)` as primary query function
- [x] Build daily question priority check with date-based filtering
- [x] Create efficient unanswered question lookup using compound indexes
- [x] Implement deterministic randomization using user ID + date seed
- [x] Add completion state handling for when all questions are answered

#### 2.3 Question Database Operations

- [x] Create basic CRUD functions: createQuestion, getQuestion, updateQuestion, deleteQuestion
- [x] Implement listAllQuestions query for admin dashboard
- [x] Build single-page admin dashboard at /app/admin/questions
- [x] Create modal-based question management (CreateQuestionModal, EditQuestionModal, DeleteConfirmModal)
- [x] Implement QuestionTable component with edit/delete actions

#### 2.4 Optimized Query Patterns

- [x] Implement O(log n) compound index lookups for user answered questions
- [x] Create batch retrieval for user's answered question IDs
- [x] Add client-side filtering for available question randomization
- [x] Implement caching strategy for daily questions with date-based invalidation

### Testing Strategy

- Unit tests for question selection algorithms
- Performance tests for compound index queries
- Integration tests for question-user relationship tracking
- Load tests for question selection under high user volume

### Success Criteria

- Primary `getNextQuestionForUser` function returns correct question in O(log n) time
- Daily questions take priority and rotate correctly with date-based logic
- Compound index queries perform efficiently under load
- Deterministic randomization ensures fair question distribution
- All questions completion state handled gracefully
- No duplicate questions served to users within same completion cycle

---

## Phase 3: Chat Interface & Convex-Powered Messaging

**Duration: 2 sprints | Dependencies: Phase 1, 2**

### Objectives

- Build responsive chat interface leveraging Convex reactivity
- Implement real-time messaging using Convex subscriptions
- Create conversation management with Convex queries/mutations
- Prepare foundation for AI Agent integration

### Deliverables

#### 3.1 Convex Backend Functions

- [x] Implement `startNewConversation` mutation with question selection integration
- [x] Create `addMessage` mutation with proper validation and indexing
- [x] Build `getConversationMessages` query (simplified, no pagination needed)
- [x] Implement `getUserConversations` query with proper filtering
- [x] Create `updateConversationStatus` mutation for state management
- [x] Remove unnecessary messageCount tracking from schema and functions

#### 3.2 Authentication System Implementation

- [x] Install convex-helpers package for custom authentication functions
- [x] Create backend authenticated function helpers (authQuery, authMutation, authAction)
- [x] Implement AuthenticationRequired utility with proper error handling
- [x] Create validateConversationOwnership helper for access control
- [x] Refactor all conversation functions to use new authentication patterns
- [x] Create client-side authenticated query hooks (useAuthQuery) with race condition prevention
- [x] Eliminate authentication boilerplate code across all functions

#### 3.3 Core Chat Components with Convex Integration

- [x] Build `Sidebar` component using authenticated queries for real-time conversation list
- [x] Create `MainContent` component with Convex subscription management and auth guards
- [x] Implement `MessageBubble` with role-based styling and loading states
- [x] Build `MessageInput` with Convex mutation integration and optimistic updates
- [x] Create `ConversationList` using authenticated query patterns
- [x] Create `ChatInterface` main orchestrator component
- [x] Build `NewConversationModal` for question selection and conversation creation

#### 3.4 Convex Reactivity Implementation

- [x] Leverage Convex's automatic real-time updates for message display
- [x] Implement proper authenticated `useQuery` patterns with skip logic
- [x] Use Convex's built-in optimistic updates for message sending
- [x] Add proper loading and error states using Convex hooks with auth guards
- [x] Implement efficient re-rendering with Convex subscriptions and auth state

#### 3.5 Agent SDK Foundation Setup

- [x] Install and configure `@convex-dev/agent` package
- [x] Set up basic agent configuration in `convex.config.ts`
- [x] Create placeholder action for AI response generation
- [x] Implement conversation context building for agent calls
- [x] Add proper error handling for future agent integrations

#### 3.6 UI/UX Implementation

- [x] Implement dark theme with specified color scheme
- [x] Create responsive layout for mobile and desktop
- [x] Add smooth scrolling with auto-scroll to bottom on new messages
- [x] Implement Convex loading states and error boundaries
- [x] Add message retry functionality using Convex mutations

### Testing Strategy

- Convex function unit tests with proper mock data and authentication
- Authentication race condition testing with skip logic
- Real-time subscription testing across multiple clients
- UI component integration tests with authenticated Convex hooks
- Performance tests for Convex query efficiency with auth overhead
- Error handling tests for network failures, auth failures, and retries
- Cross-browser compatibility testing

### Success Criteria

- All Convex functions use consistent authentication patterns
- Client-side queries properly handle authentication race conditions
- Messages appear instantly using Convex reactivity with auth guards
- Chat interface leverages Convex's automatic optimistic updates
- Conversation list updates in real-time across all authenticated clients
- Proper error handling for auth failures and retry mechanisms
- Agent SDK foundation ready for Phase 4 integration
- Authentication helper functions reduce code duplication across the app

---

## Phase 4: AI Agent Integration with Convex Agent SDK

**Duration: 2 sprints | Dependencies: Phase 3**

### Objectives

- Implement Convex Agent SDK with Gemini 2.5 Flash
- Create AI reasoning coach using Agent patterns
- Build sophisticated conversation flow management
- Leverage Convex's agent tools and context management

### Deliverables

#### 4.1 Convex Agent SDK Configuration

- [x] Configure Gemini 2.5 Flash provider in `convex.config.ts`
- [x] Set up agent API key management using Convex environment variables
- [x] Create base agent configuration with proper model settings
- [x] Implement agent tool registration and validation
- [x] Add proper agent error handling and fallback strategies

#### 4.2 AI Agent Implementation

- [x] Create `reasoningCoachAgent` using Convex Agent SDK patterns
- [x] Implement agent system prompts for Socratic mentoring
- [x] Build agent tools for conversation analysis and guidance
- [x] Add agent memory management for conversation context
- [x] Create agent response streaming for real-time user experience

#### 4.3 Conversation Flow with Agent Integration

- [x] Implement `generateAIResponse` action using agent.run()
- [x] Build conversation context passing to agent calls
- [x] Add agent tools for follow-up question generation
- [x] Implement conversation flow state management with agents

#### 4.4 Convex Integration Patterns

- [x] Use Convex actions for agent execution with proper error boundaries
- [x] Add agent conversation history integration with Convex queries
- [x] Create agent tool access to Convex database functions
- [x] Build agent monitoring and logging using Convex patterns

#### 4.5 Real-time Agent Response Handling

- [x] Add real-time agent thinking indicators
- [x] Build agent response interruption and retry mechanisms
- [x] Add agent response quality validation and filtering

### Testing Strategy

- Agent SDK integration tests with mock providers
- Agent tool functionality and conversation flow testing
- Agent response quality and consistency validation
- Performance testing for agent execution times
- Agent error handling and recovery testing
- Load testing for concurrent agent conversations
- Agent memory and context management testing
- Real-time thinking indicator UI testing

### Success Criteria

- Agent responses consistently embody Socratic mentor persona
- Agent execution times under 3 seconds for 95% of interactions
- Agent context maintained throughout complex conversations
- Agent tools properly integrated with Convex database operations
- Agent error handling provides graceful degradation
- Real-time thinking indicators provide clear user feedback
- Agent conversation analysis provides meaningful insights

---

## Phase 5: Conversation Completion & Report Generation

**Duration: 1-2 sprints | Dependencies: Phase 4**

### Objectives

- Implement conversation ending workflow
- Build AI-powered report generation system
- Create structured report display interface
- Establish user progress tracking

### Deliverables

#### 5.1 Conversation Completion System

- [ ] Build `endConversation` mutation with confirmation flow
- [ ] Implement conversation status transitions
- [ ] Create user stats updates (streak, total conversations)
- [ ] Add answered question tracking with compound indexing

#### 5.2 AI Report Generation

- [ ] Implement `generateReport` action for conversation analysis
- [ ] Design report analysis prompts for conversation evaluation
- [ ] Build structured report data extraction
- [ ] Create report quality validation

#### 5.3 Report Display Interface

- [ ] Build `ReportDisplay` component with structured sections
- [ ] Implement toggle view between conversation and report
- [ ] Create interactive follow-up question links

#### 5.4 User Progress Tracking

- [ ] Implement streak calculation and maintenance
- [ ] Create basic progress visualization components

### Testing Strategy

- End-to-end conversation completion flow testing
- AI report generation quality and consistency testing
- Report display component testing across devices
- User progress calculation accuracy testing
- Performance testing for report generation

### Success Criteria

- Conversation completion flow intuitive and reliable
- Reports provide meaningful insights and feedback
- Toggle view between conversation and report seamless
- User progress accurately tracked and displayed
- Report generation completes within 10 seconds

---

## Phase 6: Performance Optimization & Polish

**Duration: 1 sprint | Dependencies: Phase 5**

### Objectives

- Optimize application performance for scale
- Implement advanced UX enhancements
- Add comprehensive error handling
- Prepare for production deployment

### Deliverables

#### 6.1 Performance Optimization

- [ ] Implement virtual scrolling for large conversation lists
- [ ] Optimize Convex query patterns
- [ ] Implement code splitting and bundle optimization

#### 6.2 Error Handling & Polish

- [ ] Implement comprehensive error boundary system
- [ ] Add user feedback and bug reporting system
- [ ] Create user preferences and customization options

### Testing Strategy

- Performance profiling and optimization verification
- End-to-end testing of complete user journeys
- Error handling and recovery testing

### Success Criteria

- Smooth performance with optimized queries
- Page load times under 2 seconds
- Comprehensive error recovery mechanisms
- Polished user experience

---

## Development Guidelines

### Phase Isolation Principles

1. **Clear Dependencies**: Each phase has explicit dependencies on previous phases
2. **Testable Boundaries**: Each phase has well-defined testing criteria
3. **Incremental Value**: Each phase delivers working functionality
4. **Rollback Safety**: Each phase can be reverted without affecting others

### AI Development Considerations

1. **Atomic Commits**: Each feature should be implemented in focused, atomic commits
2. **Clear Documentation**: Every function and component should have clear purpose documentation
3. **Test-Driven Approach**: Write tests before implementing features where possible
4. **Modular Architecture**: Design components to be easily understood and modified by AI

### Quality Gates

- **Code Review**: All code must pass automated linting and type checking
- **Testing**: Each phase must achieve 80%+ test coverage
- **Performance**: All features must meet specified performance criteria
- **User Testing**: Each phase should be validated with real user scenarios

### Risk Mitigation

- **Parallel Development**: Some phases can be developed in parallel where dependencies allow
- **Fallback Plans**: Each critical feature should have fallback implementations
- **Monitoring**: Comprehensive monitoring should be implemented from Phase 1
- **Documentation**: All architectural decisions should be documented for future reference

---

## Conclusion

This implementation plan provides a structured approach to building Rethoric with clear phase boundaries, comprehensive testing strategies, and AI-friendly development practices. Each phase builds incrementally toward the complete product while maintaining isolation for easy development and testing.
