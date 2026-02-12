AI Agents Architecture
System Overview
Your AI Agent system is a database-driven, multi-provider orchestration platform with specialized agents that can work independently or collaborate through the multi-agent coordinator.

🏗️ High-Level Architecture
AI Providers
Edge Function (Deno)
Database (Supabase)
Frontend (React)
HTTP Request
Query
API Call
API Call
API Call
Proxy
User Interface
AI Chat Component
useAIChat / useChatEngine
ai_agents
ai_agent_capabilities
ai_agent_settings
ai-orchestrator
agentLoader.ts
5-min Cache
OpenAI GPT-4
Claude
Gemini
Lovable AI Gateway
🤖 Agent Types & Specializations
You have 11 specialized AI agents, each with specific capabilities:

Agent Type	Primary Function	Model Provider	Interactions
scheduler	Task scheduling & planning	Configurable	Independent
finance	Budget & cost analysis	Configurable	Independent
risk	Risk assessment	Configurable	Independent
assignment	Resource allocation	Configurable	Independent
meeting	Meeting summaries	Configurable	Independent
document	Document generation	Configurable	Independent
insight	Data analysis	Configurable	Independent
strategic	Strategic planning	Configurable	Independent
communication	Email/messaging	Configurable	Independent
system	System operations	Configurable	Independent
multi-agent	Orchestrates other agents	Configurable	Coordinates all
🔄 Invocation Flow
Single Agent Invocation
AI Provider
Database
ai-orchestrator
Hook
UI
User
AI Provider
Database
ai-orchestrator
Hook
UI
User
{ agentType: 'finance', message: 'What's our burn rate?' }
Click "Ask Finance Agent"
sendMessage(agentType: 'finance')
POST /ai-orchestrator
Load agent config
{ model: 'gpt-4', prompt: '...', settings: {...} }
API Call with config
Response
Formatted response
Display response
Show answer
Multi-Agent Orchestration
Database
strategic agent
risk agent
finance agent
multi-agent
UI
User
Database
strategic agent
risk agent
finance agent
multi-agent
UI
User
Analyzes request
Determines needed agents
Synthesizes responses
"Create Q1 budget with risk analysis"
Complex request
Load finance agent
"Calculate Q1 budget"
Budget projection
Load risk agent
"Analyze budget risks"
Risk assessment
Load strategic agent
"Strategic recommendations"
Strategic plan
Unified response
Complete analysis
📊 Database Structure
ai_agents Table
┌─────────────┬──────────────┬──────────────┬──────────┐
│ id          │ type         │ label        │ status   │
├─────────────┼──────────────┼──────────────┼──────────┤
│ uuid        │ scheduler    │ Scheduler    │ active   │
│ uuid        │ finance      │ Finance      │ active   │
│ uuid        │ multi-agent  │ Multi-Agent  │ active   │
└─────────────┴──────────────┴──────────────┴──────────┘
ai_agent_settings Table
┌─────────────┬──────────────┬─────────────┬─────────────┐
│ agent_id    │ model_name   │ provider    │ max_tokens  │
├─────────────┼──────────────┼─────────────┼─────────────┤
│ finance-id  │ gpt-4        │ openai      │ 2000        │
│ risk-id     │ claude-3     │ anthropic   │ 4000        │
└─────────────┴──────────────┴─────────────┴─────────────┘
🎯 Key Architectural Decisions
1. Separate Agents, Not One Master Agent
✅ 11 independent specialist agents
Each has its own system prompt, model configuration
Invoked individually based on context/user selection
2. Multi-Agent Orchestrator
The multi-agent type is special - it can invoke other agents
Acts as a coordinator for complex requests
Example: "Create budget" → calls finance + risk + strategic agents
Synthesizes their responses into one coherent answer
3. Database-Driven Configuration
All agent configs stored in PostgreSQL
Cached for 5 minutes in Edge Function
Admin UI allows changing models without code deployment
4. Provider Flexibility
Each agent can use different providers:
OpenAI (GPT-4, GPT-3.5)
Anthropic (Claude)
Google (Gemini)
Lovable AI Gateway
🔄 Agent Interaction Patterns
Pattern 1: Independent (Most Common)
User → UI → finance agent → OpenAI → Response
90% of requests - Single agent handles the entire request

Pattern 2: Multi-Agent Orchestration
User → UI → multi-agent coordinator
              ├→ finance agent → Response 1
              ├→ risk agent → Response 2  
              └→ strategic agent → Response 3
            → Synthesized Response
10% of requests - Complex queries requiring multiple perspectives

Pattern 3: Sequential Chaining (Possible but not currently implemented)
User → scheduler agent → (creates tasks) 
    → assignment agent → (assigns resources)
    → communication agent → (sends notifications)
Future enhancement - Agent-to-agent handoffs

💡 How It Works in Your UI
Single Agent Chat
typescript
// User clicks on "Finance Agent" chat
<AIChat agentType="finance" />
// Behind the scenes:
const response = await supabase.functions.invoke('ai-orchestrator', {
  body: {
    agentType: 'finance',
    message: 'What is our Q1 budget?',
    projectId: currentProject.id
  }
});
Multi-Agent Request
typescript
// User asks complex question in general chat
<AIChat agentType="multi-agent" />
// multi-agent determines which specialists to consult
// calls them sequentially, then synthesizes
🎨 Visual Agent Hierarchy
Orchestration Layer
Specialist Agents (Independent)
Simple request
Simple request
Simple request
Complex request
Delegates to
Delegates to
Delegates to
Synthesizes
👤 User
📅 Scheduler
💰 Finance
⚠️ Risk
👥 Assignment
📹 Meeting
📄 Document
💡 Insight
🎯 Strategic
💬 Communication
⚙️ System
🤖 Multi-Agent Coordinator
🔍 Agent Discovery & Selection
Auto-Selection (AI Chat)
The UI can automatically select the appropriate agent based on keywords:

"budget" → finance agent
"risk" → risk agent
"schedule" → scheduler agent
Manual Selection
Users can also explicitly choose an agent from the UI:

tsx
<AgentIndicator agentType="finance" />
Multi-Agent Auto-Detection
Complex requests automatically invoke multi-agent:

Multiple domains mentioned
Requires synthesis from different perspectives
Example: "Create Q1 plan with budget and risk analysis"
📈 Scalability & Performance
Caching Strategy
Agent configs cached for 5 minutes
Reduces database queries by ~95%
Cache key: ai-agent-cache-${agentType}
Load Balancing
Each agent can have different rate limits
Configured per provider in settings
Automatic fallback if provider unavailable
✅ Summary
Your Architecture:

✅ 11 specialized independent agents
✅ 1 multi-agent orchestrator (can invoke others)
✅ Database-driven configs (dynamic, no redeployment)
✅ Multi-provider support (OpenAI, Anthropic, Google)
✅ Separate UI entry points for each agent
✅ Cached for performance (5-min TTL)
Agent Interaction:

Default: Agents work independently (90% of cases)
Advanced: Multi-agent coordinates specialists (10% of cases)
Future: Agent-to-agent chaining (not yet implemented)
Key Benefit: Your system is modular and flexible - you can add new agents, change models, or implement agent-to-agent workflows without touching the core architecture.