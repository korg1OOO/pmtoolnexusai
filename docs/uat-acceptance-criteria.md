# User Acceptance Testing (UAT) — Acceptance Criteria

## Test Environment
- **URL**: Production or staging deployment
- **Roles**: Admin, Owner, Member, Viewer
- **Browsers**: Chrome, Firefox, Edge (latest)

---

## 1. Authentication & Onboarding

| # | Scenario | Steps | Expected Result | Status |
|---|----------|-------|-----------------|--------|
| 1.1 | Login | Enter valid email/password → Submit | Dashboard loads within 5s | ☐ |
| 1.2 | Invalid Login | Enter wrong password → Submit | Error toast appears, no redirect | ☐ |
| 1.3 | Sign Out | Click avatar → Sign Out | Returns to login page, session cleared | ☐ |
| 1.4 | Protected Route | Navigate to /dashboard without session | Redirected to /auth | ☐ |

---

## 2. Tenant & Workspace Management

| # | Scenario | Steps | Expected Result | Status |
|---|----------|-------|-----------------|--------|
| 2.1 | View Tenants | Login as admin → Navigate to tenant list | All tenant cards render with names | ☐ |
| 2.2 | Create Workspace | Click "New Workspace" → Fill form → Save | Workspace appears in list | ☐ |
| 2.3 | Switch Workspace | Use workspace switcher → Select different workspace | Sidebar updates, project list changes | ☐ |
| 2.4 | Tenant Settings | Navigate to tenant settings → Update name | Name persists after page reload | ☐ |

---

## 3. Project Management

| # | Scenario | Steps | Expected Result | Status |
|---|----------|-------|-----------------|--------|
| 3.1 | Create Project | Click "New Project" → Fill form → Create | Project appears in sidebar and list | ☐ |
| 3.2 | Task Board | Open project → Navigate to Board view | Columns render (To Do, In Progress, Done) | ☐ |
| 3.3 | Create Task | Click "Add Task" → Fill title/description → Save | Task card appears in correct column | ☐ |
| 3.4 | Drag-Drop Task | Drag task card to different column | Status updates, card moves | ☐ |
| 3.5 | Task Detail | Click task card → View detail panel | All fields display (assignee, dates, priority) | ☐ |
| 3.6 | Delete Project | Open project settings → Delete → Confirm | Project removed from all lists | ☐ |

---

## 4. Portfolio & Program Hierarchy

| # | Scenario | Steps | Expected Result | Status |
|---|----------|-------|-----------------|--------|
| 4.1 | Create Portfolio | Navigate to portfolios → Create new | Portfolio with budget/ML metrics visible | ☐ |
| 4.2 | Create Program | Inside portfolio → Create program | Program with settings and milestones | ☐ |
| 4.3 | Assign Projects | In program → Assign existing project | Project appears in program hierarchy | ☐ |
| 4.4 | View Hierarchy | Navigate to overview | Portfolio → Program → Project tree renders | ☐ |

---

## 5. Subscription & Billing

| # | Scenario | Steps | Expected Result | Status |
|---|----------|-------|-----------------|--------|
| 5.1 | View Pricing | Navigate to /pricing | All tier cards display with prices | ☐ |
| 5.2 | Upgrade Flow | Click upgrade on pricing → Complete Stripe checkout | Tier updates, features unlock | ☐ |
| 5.3 | Manage Billing | Click "Manage Billing" → Opens Stripe portal | Portal loads with subscription details | ☐ |
| 5.4 | Tier Enforcement | On free tier → Try to use pro feature | Upgrade prompt appears | ☐ |

---

## 6. AI Features & Credits

| # | Scenario | Steps | Expected Result | Status |
|---|----------|-------|-----------------|--------|
| 6.1 | AI Agent View | Navigate to AI Agent page | Chat interface renders | ☐ |
| 6.2 | Credit Balance | View dashboard → Check credits | Balance number visible and accurate | ☐ |
| 6.3 | Purchase Credits | Navigate to credits → Purchase | Stripe payment → Balance increases | ☐ |
| 6.4 | Usage Tracking | Use AI feature → Check usage logs | Usage entry appears with tokens/cost | ☐ |

---

## 7. Governance & Approvals

| # | Scenario | Steps | Expected Result | Status |
|---|----------|-------|-----------------|--------|
| 7.1 | View Policies | Navigate to governance → Policies tab | Policy list renders | ☐ |
| 7.2 | Submit Approval | Submit item for approval | Approval request created in pending state | ☐ |
| 7.3 | Approve/Reject | Admin opens approval → Approve | Status updates to approved | ☐ |
| 7.4 | Delegation | Admin delegates approval authority | Delegate can now approve | ☐ |

---

## 8. ML & Predictions

| # | Scenario | Steps | Expected Result | Status |
|---|----------|-------|-----------------|--------|
| 8.1 | View ML Dashboard | Navigate to ML insights | Charts and pattern list render | ☐ |
| 8.2 | Pattern Export | Click export → Download | JSON/CSV file downloads correctly | ☐ |
| 8.3 | A/B Tests | Navigate to A/B testing | Test list with status badges renders | ☐ |

---

## 9. Notifications & Email

| # | Scenario | Steps | Expected Result | Status |
|---|----------|-------|-----------------|--------|
| 9.1 | View Notifications | Click notification bell | Notification dropdown opens with items | ☐ |
| 9.2 | Mark as Read | Click notification → Mark read | Read status updates | ☐ |
| 9.3 | Email Templates | Admin → Email templates | Template list with edit buttons renders | ☐ |

---

## 10. Security & Permissions

| # | Scenario | Steps | Expected Result | Status |
|---|----------|-------|-----------------|--------|
| 10.1 | RBAC — Viewer | Login as viewer → Try to edit project | Edit buttons hidden or disabled | ☐ |
| 10.2 | RBAC — Admin | Login as admin → Access admin panel | Full admin panel access | ☐ |
| 10.3 | Tenant Isolation | Login as user in Tenant A → Try to access Tenant B data | Access denied or data not visible | ☐ |
| 10.4 | Audit Log | Perform action → Check security logs | Action logged with timestamp and user | ☐ |

---

## Sign-Off

| Role | Name | Date | Status |
|------|------|------|--------|
| Product Owner | | | ☐ Approved |
| QA Lead | | | ☐ Approved |
| Tech Lead | | | ☐ Approved |
