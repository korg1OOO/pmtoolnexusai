-- ============================================================
-- CMS Schema + Seed Data for Kiroxys
-- Run via: Supabase SQL Editor
-- ============================================================

-- 1. Content Categories
CREATE TABLE IF NOT EXISTS public.content_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('blog', 'faq', 'docs')),
    description TEXT,
    icon TEXT,
    color TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (slug, type)
);

-- 2. Blog Tags
CREATE TABLE IF NOT EXISTS public.blog_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Blog Posts
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    excerpt TEXT,
    content TEXT NOT NULL DEFAULT '',
    featured_image_url TEXT,
    category_id UUID REFERENCES public.content_categories(id) ON DELETE SET NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','published','archived')),
    view_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    reading_time_minutes INTEGER DEFAULT 5,
    meta_title TEXT,
    meta_description TEXT,
    meta_keywords TEXT[],
    tags TEXT[],
    published_at TIMESTAMPTZ,
    scheduled_for TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. FAQs
CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.content_categories(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    keywords TEXT[],
    display_order INTEGER DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Documentation
CREATE TABLE IF NOT EXISTS public.documentation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    meta_description TEXT,
    category_id UUID REFERENCES public.content_categories(id) ON DELETE SET NULL,
    version TEXT NOT NULL DEFAULT 'v1.0',
    order_index INTEGER DEFAULT 0,
    parent_id UUID REFERENCES public.documentation(id) ON DELETE SET NULL,
    is_published BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (slug, version)
);

-- 6. Media Library
CREATE TABLE IF NOT EXISTS public.media_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    storage_path TEXT,
    public_url TEXT,
    file_name TEXT,
    file_url TEXT,
    file_type TEXT,
    file_size BIGINT,
    mime_type TEXT,
    width INTEGER,
    height INTEGER,
    duration INTEGER,
    alt_text TEXT,
    caption TEXT,
    folder TEXT DEFAULT 'general',
    tags TEXT[],
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- VIEWS
-- ============================================================

CREATE OR REPLACE VIEW public.published_faqs AS
    SELECT f.*, c.name AS category_name, c.slug AS category_slug
    FROM public.faqs f
    LEFT JOIN public.content_categories c ON c.id = f.category_id
    WHERE f.is_published = true AND f.deleted_at IS NULL
    ORDER BY f.display_order, f.created_at;

CREATE OR REPLACE VIEW public.published_blog_posts AS
    SELECT p.*, c.name AS category_name
    FROM public.blog_posts p
    LEFT JOIN public.content_categories c ON c.id = p.category_id
    WHERE p.status = 'published' AND p.deleted_at IS NULL
    ORDER BY p.published_at DESC;

CREATE OR REPLACE VIEW public.published_documentation AS
    SELECT d.*, c.name AS category_name
    FROM public.documentation d
    LEFT JOIN public.content_categories c ON c.id = d.category_id
    WHERE d.is_published = true AND d.deleted_at IS NULL
    ORDER BY d.version, d.order_index;

-- ============================================================
-- RPC: increment_faq_feedback
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_faq_feedback(faq_id UUID, is_helpful BOOLEAN)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF is_helpful THEN
    UPDATE public.faqs SET helpful_count = helpful_count + 1 WHERE id = faq_id;
  ELSE
    UPDATE public.faqs SET not_helpful_count = not_helpful_count + 1 WHERE id = faq_id;
  END IF;
END;
$$;

-- ============================================================
-- RPC: increment_content_views
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_content_views(content_type TEXT, content_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF content_type = 'blog' THEN
    UPDATE public.blog_posts SET view_count = view_count + 1 WHERE id = content_id;
  ELSIF content_type = 'faq' THEN
    UPDATE public.faqs SET view_count = view_count + 1 WHERE id = content_id;
  ELSIF content_type = 'docs' THEN
    UPDATE public.documentation SET view_count = view_count + 1 WHERE id = content_id;
  END IF;
END;
$$;

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE public.content_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;

-- Public read for published content
CREATE POLICY "Public read categories" ON public.content_categories FOR SELECT USING (true);
CREATE POLICY "Public read published posts" ON public.blog_posts FOR SELECT USING (status = 'published' AND deleted_at IS NULL);
CREATE POLICY "Public read published faqs" ON public.faqs FOR SELECT USING (is_published = true AND deleted_at IS NULL);
CREATE POLICY "Public read published docs" ON public.documentation FOR SELECT USING (is_published = true AND deleted_at IS NULL);
CREATE POLICY "Public read blog tags" ON public.blog_tags FOR SELECT USING (true);

-- Authenticated admin write
CREATE POLICY "Admin write categories" ON public.content_categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write posts" ON public.blog_posts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write faqs" ON public.faqs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write docs" ON public.documentation FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write media" ON public.media_library FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- SEED: Categories
-- ============================================================

INSERT INTO public.content_categories (name, slug, type, description, display_order) VALUES
-- Blog categories
('Product Updates', 'product-updates', 'blog', 'New features and improvements to Kiroxys', 1),
('Project Management', 'project-management', 'blog', 'Tips and best practices for managing projects', 2),
('AI & Automation', 'ai-automation', 'blog', 'How AI is changing the way teams work', 3),
('Customer Stories', 'customer-stories', 'blog', 'Success stories from Kiroxys customers', 4),
('Engineering', 'engineering', 'blog', 'Behind the scenes at Kiroxys', 5),
-- FAQ categories
('Getting Started', 'getting-started', 'faq', 'New to Kiroxys? Start here.', 1),
('Billing & Plans', 'billing-plans', 'faq', 'Subscription, payments and plan questions', 2),
('Projects & Tasks', 'projects-tasks', 'faq', 'Managing projects, tasks and workflows', 3),
('AI Features', 'ai-features', 'faq', 'Questions about AI-powered features', 4),
('Integrations', 'integrations', 'faq', 'Connecting Kiroxys with your tools', 5),
-- Docs categories
('Getting Started', 'docs-getting-started', 'docs', 'Quickstart guides', 1),
('Core Concepts', 'core-concepts', 'docs', 'Understand the Kiroxys model', 2),
('API Reference', 'api-reference', 'docs', 'Complete API documentation', 3)
ON CONFLICT (slug, type) DO NOTHING;

-- ============================================================
-- SEED: Blog Posts
-- ============================================================

INSERT INTO public.blog_posts (title, slug, excerpt, content, status, tags, reading_time_minutes, meta_title, meta_description, published_at) VALUES

('Introducing Kiroxys: The AI-Native Project Management Platform',
 'introducing-kiroxys',
 'Today we''re officially launching Kiroxys — a project management platform built from the ground up with AI at its core.',
 E'We built Kiroxys because we were tired of project management tools that felt like glorified spreadsheets. Every feature was a checkbox, every update was a manual process, and every insight required a data analyst to generate.\n\nKiroxys changes that.\n\n## What makes Kiroxys different?\n\nKiroxys is the first project management platform with a deeply integrated AI engine that can:\n\n- **Predict schedule slippage** before it happens using ML models trained on your team''s velocity\n- **Generate morning briefings** that summarize what matters most to you today\n- **Auto-assign tasks** based on team capacity, skills, and current workload\n- **Surface risk signals** from unread comments, stalled tasks, and SLA breaches\n\n## Built for enterprise teams\n\nKiroxys is designed for teams of 5 to 50,000. Our multi-tenant architecture ensures complete data isolation between organizations, with SOC 2 compliance baked in from day one.\n\n## Available today\n\nSign up at kiroxys.com and start your 14-day free trial. No credit card required.',
 'published',
 ARRAY['launch', 'product', 'AI'],
 5,
 'Introducing Kiroxys: AI-Native Project Management',
 'Kiroxys is a project management platform built from the ground up with AI. Read about our launch.',
 NOW() - INTERVAL '30 days'),

('How Morning Briefings Save Teams 45 Minutes Every Day',
 'morning-briefings-save-time',
 'Our AI-powered Morning Briefing feature distills every project update, deadline, and risk signal into a single, personalized digest — delivered every morning.',
 E'Every morning, project managers open their inboxes to dozens of notifications. Slack messages, email threads, Jira tickets — all demanding attention before the first coffee has cooled.\n\nKiroxys''s Morning Briefing changes that.\n\n## What is a Morning Briefing?\n\nA Morning Briefing is a personalized AI-generated digest that appears every time you open Kiroxys. It shows you:\n\n- **Tasks due today and tomorrow** across all your projects\n- **Unresolved blockers** raised by your team in the last 24 hours\n- **Schedule variance** — which projects are drifting off track\n- **Team capacity** — who has bandwidth and who is overloaded\n- **SLA warnings** — client deliverables that are at risk\n\n## How the AI works\n\nThe briefing engine runs every morning at 6 AM in your timezone. It pulls data from all your active projects, applies severity scoring, deduplicates alerts, and generates a ranked list of items that need your attention.\n\nWe track which items you action vs. dismiss to improve personalization over time.\n\n## Real results\n\nIn our beta, teams reported saving an average of 45 minutes every morning that was previously spent clicking through dashboards and Slack threads to figure out what needed attention.',
 'published',
 ARRAY['AI', 'productivity', 'features'],
 6,
 'How Morning Briefings Save Teams 45 Minutes Every Day',
 'Kiroxys''s AI Morning Briefing gives you a personalized daily digest so you can start work immediately.',
 NOW() - INTERVAL '14 days'),

('Sprint Planning with AI: Goodbye Estimation Drama',
 'sprint-planning-with-ai',
 'Estimation meetings are one of the most wasteful rituals in software development. We built an AI estimation engine that ends the debate.',
 E'Every sprint planning session follows the same pattern. Someone suggests 3 points for a ticket. Someone else says 8. A 20-minute debate ensues. The team settles on 5 because that''s what compromise looks like.\n\nKiroxys''s AI estimation engine ends this.\n\n## How AI estimation works\n\nWhen you create or update a task, Kiroxys''s ML model analyzes:\n\n- Historical completion time for similar tasks\n- Current assignee''s velocity with this task type\n- Dependencies and blockers attached to the task\n- Sprint capacity and current workload\n\nIt then suggests an estimate with a confidence interval — so you know not just the guess, but how reliable it is.\n\n## The result\n\nTeams using AI estimation in our beta reported a **68% reduction in estimation variance** — meaning their actual delivery time matched their estimates far more closely.\n\nEstimation meetings went from 90 minutes to 20 minutes.',
 'published',
 ARRAY['AI', 'sprints', 'planning', 'estimation'],
 7,
 'Sprint Planning with AI: Goodbye Estimation Drama',
 'Kiroxys''s AI estimation engine eliminates planning poker debates with data-driven estimates.',
 NOW() - INTERVAL '7 days'),

('Introducing the Kiroxys API: Build Anything on Top of Your Project Data',
 'kiroxys-api-launch',
 'The Kiroxys REST API is now generally available. Connect your tools, automate your workflows, and build custom integrations.',
 E'Today we''re launching the Kiroxys public API.\n\nEvery piece of data in Kiroxys — tasks, projects, sprints, team members, timelines, budgets — is now accessible via a clean REST API with full CRUD support.\n\n## What you can build\n\n- **Custom dashboards** in your BI tool of choice (Power BI, Looker, Metabase)\n- **Bi-directional Jira sync** for teams migrating to Kiroxys\n- **Slack bots** that create tasks from messages\n- **GitHub webhooks** that automatically move tasks when PRs are merged\n- **Finance integrations** that pull actuals from your ERP into project budgets\n\n## Authentication\n\nThe API uses personal access tokens scoped to specific projects or your whole workspace. All tokens are rotatable and auditable from your Settings page.\n\n## Rate limits\n\nFree plans: 1,000 req/hour. Pro plans: 10,000 req/hour. Enterprise: unlimited.\n\nRead the full API docs at kiroxys.com/docs.',
 'published',
 ARRAY['API', 'integrations', 'developers', 'engineering'],
 8,
 'Introducing the Kiroxys API',
 'The Kiroxys REST API is now available. Build custom integrations on top of your project data.',
 NOW() - INTERVAL '3 days')

ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- SEED: FAQs
-- ============================================================

WITH cats AS (
    SELECT id, slug FROM public.content_categories WHERE type = 'faq'
)
INSERT INTO public.faqs (category_id, question, answer, keywords, display_order, is_published) VALUES

-- Getting Started
((SELECT id FROM cats WHERE slug = 'getting-started'),
 'How do I create my first project?',
 E'Creating a project is simple:\n\n1. Click the **+ New Project** button in the top right corner of your dashboard\n2. Give your project a name, select a type (Standard, Agile, Waterfall), and choose a start date\n3. Invite your team members by entering their email addresses\n4. Add your first tasks by clicking **+ Add Task** in the project board\n\nYour project will be live immediately. Kiroxys will automatically set up your default views (Board, List, Timeline, and Gantt) based on your project type.',
 ARRAY['create', 'project', 'start', 'new'],
 1, true),

((SELECT id FROM cats WHERE slug = 'getting-started'),
 'How do I invite team members to Kiroxys?',
 E'You can invite team members in two ways:\n\n**From a project:** Open your project → click **Team** in the left sidebar → enter email addresses and assign roles (Owner, Admin, Member, Viewer).\n\n**From workspace settings:** Go to Settings → Team → Invite Members. Workspace-level invites give access to all projects by default.\n\nInvitees will receive an email with a link to join. If they don''t have a Kiroxys account, they''ll be prompted to create one for free.',
 ARRAY['invite', 'team', 'members', 'add users'],
 2, true),

((SELECT id FROM cats WHERE slug = 'getting-started'),
 'Is there a mobile app?',
 E'Yes! Kiroxys is available on:\n\n- **iOS** (iPhone and iPad) — available on the App Store\n- **Android** — available on Google Play\n- **Web** — kiroxys.com works on any modern browser\n\nAll changes sync in real time across devices. The mobile app supports task management, notifications, time tracking, and AI briefings.',
 ARRAY['mobile', 'app', 'iOS', 'Android', 'phone'],
 3, true),

-- Billing
((SELECT id FROM cats WHERE slug = 'billing-plans'),
 'What plans does Kiroxys offer?',
 E'Kiroxys offers four plans:\n\n| Plan | Price | Users | Key features |\n|---|---|---|---|\n| **Free** | $0/month | Up to 5 | Projects, tasks, basic views |\n| **Pro** | $12/user/month | Unlimited | AI features, time tracking, reporting |\n| **Business** | $24/user/month | Unlimited | Advanced AI, budget management, SLAs |\n| **Enterprise** | Custom | Unlimited | SSO, dedicated support, custom SLA |\n\nAll paid plans include a 14-day free trial. No credit card required to start.',
 ARRAY['pricing', 'plans', 'cost', 'free', 'pro', 'enterprise'],
 1, true),

((SELECT id FROM cats WHERE slug = 'billing-plans'),
 'Can I change my plan at any time?',
 E'Yes. You can upgrade or downgrade your plan at any time from Settings → Billing.\n\n**Upgrading:** Changes take effect immediately. You''ll be charged a prorated amount for the remainder of your billing cycle.\n\n**Downgrading:** Changes take effect at the end of your current billing cycle. Any data that exceeds the lower plan''s limits will be read-only until you reduce usage.',
 ARRAY['change plan', 'upgrade', 'downgrade', 'billing'],
 2, true),

((SELECT id FROM cats WHERE slug = 'billing-plans'),
 'Do you offer annual billing?',
 E'Yes! Annual billing saves you **20% compared to monthly billing**.\n\nYou can switch to annual billing from Settings → Billing → Billing Cycle. The switch takes effect at your next billing date.\n\nAnnual plans are paid upfront and are non-refundable after 30 days.',
 ARRAY['annual', 'yearly', 'discount', 'billing'],
 3, true),

-- Projects & Tasks
((SELECT id FROM cats WHERE slug = 'projects-tasks'),
 'What is the difference between a Task, Subtask, and Story?',
 E'Kiroxys uses a flexible hierarchy:\n\n- **Task** — The atomic unit of work. Has an assignee, due date, status, and priority.\n- **Subtask** — A child of a Task. Useful for breaking down complex tasks. Subtasks roll up to the parent task''s completion %.\n- **Story** — An Agile container for related tasks within a Sprint. Maps to a user story.\n- **Epic** — A large body of work that contains multiple Stories, tracked across sprints.\n- **Milestone** — A significant checkpoint or deliverable in the project timeline.\n\nYou can use all of these or just Tasks — Kiroxys adapts to your workflow.',
 ARRAY['task', 'subtask', 'story', 'epic', 'hierarchy'],
 1, true),

((SELECT id FROM cats WHERE slug = 'projects-tasks'),
 'How does time tracking work?',
 E'Kiroxys has built-in time tracking at both the task and project level.\n\n**Logging a time entry:**\n1. Open a task\n2. Click the **Log Time** button (⏱ icon)\n3. Enter hours and select the date\n4. Add an optional note\n\n**Tracking in real time:** Use the built-in timer by clicking **Start Timer** on any task.\n\n**Reports:** Project time reports are available under Project → Reports → Time Tracking. You can export to CSV or connect to your payroll/billing system via API.',
 ARRAY['time tracking', 'log time', 'timer', 'hours'],
 2, true),

-- AI Features
((SELECT id FROM cats WHERE slug = 'ai-features'),
 'What AI features are included in each plan?',
 E'| Feature | Free | Pro | Business | Enterprise |\n|---|---|---|---|---|\n| Morning Briefing | ❌ | ✅ | ✅ | ✅ |\n| AI Task Suggestions | ❌ | ✅ | ✅ | ✅ |\n| Risk Detection | ❌ | Basic | Advanced | Advanced |\n| AI Estimation | ❌ | ❌ | ✅ | ✅ |\n| Custom AI Agents | ❌ | ❌ | ❌ | ✅ |\n\nAI features consume **AI Credits**. Pro plans include 1,000 credits/month. Business plans include 5,000 credits/month.',
 ARRAY['AI', 'features', 'plans', 'credits'],
 1, true),

((SELECT id FROM cats WHERE slug = 'ai-features'),
 'How does the AI Morning Briefing work?',
 E'Your Morning Briefing is a personalized daily digest generated by Kiroxys''s AI engine.\n\n**What it includes:**\n- Tasks due today and tomorrow\n- Blockers and escalations from the last 24 hours\n- Projects at risk of schedule slippage\n- Team capacity overview\n- Unread mentions and comments requiring your action\n\n**How to access it:** The briefing appears automatically when you log in each morning. You can also access it from the sidebar under **Morning Briefing**.\n\n**Customization:** Go to Settings → Preferences → Morning Briefing to choose which sections to show and configure your delivery time.',
 ARRAY['morning briefing', 'AI', 'digest', 'daily', 'personalized'],
 2, true),

-- Integrations
((SELECT id FROM cats WHERE slug = 'integrations'),
 'Which tools does Kiroxys integrate with?',
 E'Kiroxys currently integrates with:\n\n**Communication:** Slack, Microsoft Teams\n**Development:** GitHub, GitLab, Bitbucket, Jira\n**Calendar:** Google Calendar, Outlook Calendar\n**Storage:** Google Drive, Dropbox, OneDrive\n**Time & Billing:** Toggl, Harvest, Xero, QuickBooks\n**HR:** BambooHR, Workday (Enterprise only)\n\nAll integrations are configured from Settings → Integrations. Enterprise customers can also use our REST API and webhooks to build custom integrations.',
 ARRAY['integrations', 'Slack', 'GitHub', 'Jira', 'connect'],
 1, true)

ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED: Documentation
-- ============================================================

INSERT INTO public.documentation (title, slug, content, meta_description, version, order_index, is_published) VALUES

('Quick Start Guide',
 'quick-start',
 E'# Quick Start Guide\n\nWelcome to Kiroxys! This guide will have you running your first project in under 10 minutes.\n\n## Step 1: Create your workspace\n\nAfter signing up, you''ll be prompted to create a workspace. Your workspace is your organization''s home in Kiroxys — it contains all your projects, team members, and settings.\n\nChoose a name that represents your company or team (e.g. "Acme Corp" or "Product Team").\n\n## Step 2: Invite your team\n\nGo to **Settings → Team → Invite Members** and enter the email addresses of your colleagues. You can assign them as Admin, Member, or Viewer.\n\n## Step 3: Create your first project\n\nClick **+ New Project** in the sidebar. Choose a project type:\n\n- **Scrum** — Sprints, backlog, velocity tracking\n- **Kanban** — Continuous flow, WIP limits\n- **Waterfall** — Phases, milestones, Gantt chart\n- **Custom** — Mix and match views\n\n## Step 4: Add your first tasks\n\nIn your new project, click **+ Add Task**. Every task has:\n\n- **Title** — What needs to be done\n- **Assignee** — Who is responsible\n- **Due date** — When it''s needed\n- **Priority** — Critical, High, Medium, Low\n- **Status** — To Do, In Progress, In Review, Done\n\n## Step 5: View your Morning Briefing\n\nLog out and back in the next morning — your AI Morning Briefing will be ready, showing you exactly what needs your attention today.\n\n## You''re ready!\n\nExplore the rest of the docs to learn about Sprints, Time Tracking, Budget Management, and AI features.',
 'Get up and running with Kiroxys in 10 minutes',
 'v1.0', 1, true),

('Understanding Projects',
 'understanding-projects',
 E'# Understanding Projects\n\nA **Project** in Kiroxys is the top-level container for all work related to a specific initiative, product, or client engagement.\n\n## Project Types\n\n### Scrum Projects\nDesigned for Agile teams running time-boxed iterations (sprints). Includes:\n- Backlog management\n- Sprint planning board\n- Velocity chart\n- Burndown tracking\n\n### Kanban Projects\nDesigned for continuous flow. Includes:\n- Unlimited columns\n- WIP (Work in Progress) limits\n- Cumulative flow diagram\n- Cycle time tracking\n\n### Waterfall Projects\nDesigned for sequential, phase-based work. Includes:\n- Phase gates and milestones\n- Gantt chart\n- Critical path analysis\n- Resource leveling\n\n## Project Settings\n\nEach project has its own settings accessible via **Project → Settings**:\n\n- **General**: Name, description, status, color tag\n- **Team**: Members and their roles\n- **Views**: Enable/disable Sprint, Gantt, Timeline, Budget views\n- **Notifications**: Configure who gets notified for what\n- **Integrations**: Connect project-specific GitHub repos, Slack channels\n\n## Project Health\n\nKiroxys automatically computes a **Health Score** for each project based on:\n- Schedule variance\n- Task completion rate\n- Blocker resolution time\n- Budget burn rate\n\nHealthy: 🟢 | At Risk: 🟡 | Critical: 🔴',
 'Learn how projects, project types and settings work in Kiroxys',
 'v1.0', 2, true),

('Managing Tasks',
 'managing-tasks',
 E'# Managing Tasks\n\nTasks are the atomic units of work in Kiroxys. Every piece of work — from a feature to a bug fix to a meeting — can be captured as a task.\n\n## Creating a Task\n\nYou can create a task from anywhere:\n- **Board view**: Click the **+** button in any column\n- **List view**: Click **+ Add Task** at the bottom of any section\n- **Timeline**: Click on any date and drag\n- **Global search**: Press ⌘K and type "Create task"\n\n## Task Fields\n\n| Field | Description |\n|---|---|\n| Title | Clear, action-oriented description |\n| Description | Detailed context, acceptance criteria |\n| Assignee | The person responsible |\n| Due Date | When it must be completed |\n| Priority | Critical / High / Medium / Low |\n| Status | Configurable per project |\n| Tags | Free-form labels |\n| Time Estimate | Story points or hours |\n| Time Logged | Actual time spent |\n| Attachments | Files, links, images |\n\n## Task Dependencies\n\nSet dependencies to enforce sequencing:\n- **Blocks**: This task must complete before another can start\n- **Blocked By**: This task cannot start until another is complete\n- **Related**: Informational link between tasks\n\nDependencies are visualized in the Gantt chart and the Timeline view.\n\n## Recurring Tasks\n\nMark any task as recurring with a daily, weekly, monthly, or custom schedule. Kiroxys automatically creates the next instance when the current one is completed.',
 'Complete guide to creating and managing tasks in Kiroxys',
 'v1.0', 3, true),

('AI Features Overview',
 'ai-features',
 E'# AI Features Overview\n\nKiroxys''s AI engine is designed to reduce manual work and surface insights automatically.\n\n## Morning Briefing\n\nYour personalized daily digest. Every morning, the AI compiles:\n- Overdue tasks and items due within 24 hours\n- Unresolved blockers\n- Projects drifting off schedule\n- Team capacity gaps\n- SLA warnings for client deliverables\n\nCustomize your briefing from **Settings → Preferences → Morning Briefing**.\n\n## AI Task Suggestions\n\nWhen you describe a project goal, the AI suggests a complete task breakdown. Review and import the suggestions directly into your project.\n\n## Risk Detection\n\nThe AI monitors your projects continuously and flags risks:\n- **Schedule risk**: Tasks trending late based on velocity\n- **Capacity risk**: Team members overloaded beyond 100%\n- **Dependency risk**: Blocked tasks on the critical path\n- **Inactivity risk**: Tasks with no updates in 5+ days\n\n## AI Estimation\n\n*(Business and Enterprise plans)*\n\nThe AI suggests story point estimates for new tasks based on:\n- Historical completion time for similar tasks\n- Current assignee''s velocity\n- Task complexity signals from the description\n\n## AI Credits\n\nMost AI features consume credits:\n- Morning Briefing: 1 credit/day\n- Risk scan: 2 credits/scan\n- AI task suggestions: 5 credits/suggestion batch\n- AI reports: 10 credits/report\n\nView your usage at **Settings → AI Credits**.',
 'Complete overview of all AI-powered features in Kiroxys',
 'v1.0', 4, true),

('API Reference — Authentication',
 'api-authentication',
 E'# API Reference: Authentication\n\nAll API requests require authentication using a **Personal Access Token (PAT)**.\n\n## Generating a Token\n\n1. Go to **Settings → API Keys**\n2. Click **Generate New Key**\n3. Give the key a name and select its scope (read-only or read-write)\n4. Copy the token — it will only be shown once\n\n## Using the Token\n\nInclude your token in the `Authorization` header:\n\n```http\nAuthorization: Bearer YOUR_TOKEN_HERE\n```\n\n## Base URL\n\n```\nhttps://api.kiroxys.com/v1\n```\n\n## Rate Limits\n\n| Plan | Requests/hour |\n|---|---|\n| Free | 100 |\n| Pro | 1,000 |\n| Business | 10,000 |\n| Enterprise | Unlimited |\n\nRate limit headers are included in every response:\n- `X-RateLimit-Limit`: Your limit\n- `X-RateLimit-Remaining`: Remaining requests this hour\n- `X-RateLimit-Reset`: Unix timestamp when the limit resets\n\n## Error Responses\n\n```json\n{\n  "error": "unauthorized",\n  "message": "Invalid or expired token",\n  "status": 401\n}\n```',
 'How to authenticate with the Kiroxys REST API',
 'v1.0', 5, true)

ON CONFLICT (slug, version) DO NOTHING;
