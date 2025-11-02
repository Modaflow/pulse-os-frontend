<!-- bb09f903-d548-465e-8a13-95a5b4d98c89 42c9d809-7373-440b-8f60-2ef9b2c31679 -->
# Complete PulseOS Workflow System

## Phase 1: Fix Critical Timeline Bug

**Problem:** Timeline events aren't displaying despite backend broadcasting them.

**Root Cause:** War room datetime serialization error crashes WebSocket connection.

**Tasks:**

1. Verify `services/war_room.py` datetime serialization fix is working
2. Restart backend and test incident trigger
3. Check browser console for `📝 Timeline event received:` logs
4. Remove debug logging from `agents/base.py` and `events/streamer.py` once confirmed

**Files:** `pulse-os-backend/services/war_room.py`, `agents/base.py`, `events/streamer.py`

---

## Phase 2: OpenRouter/Claude Integration

### 2.1 Create OpenRouter Client Service

**New file:** `pulse-os-backend/services/llm_client.py`

Implement:

- `OpenRouterClient` class
- `chat_completion()` method using Claude 3.5 Sonnet
- Async HTTP client with httpx
- Error handling and retries

**Dependencies:** Add `httpx>=0.28.1` to `requirements.txt`

### 2.2 Environment Configuration

**Create:** `pulse-os-backend/.env` with:

```bash
OPENROUTER_API_KEY=sk-or-v1-...
GITHUB_WEBHOOK_SECRET=<generate_random>
```

Use existing Composio/GitHub vars from user.

---

## Phase 3: Carl - AI Codebase Investigation

**File:** `pulse-os-backend/agents/carl.py`

**Add Methods:**

1. `_fetch_frontend_codebase()` - Use Composio to read files from saai151/code-sync (frontend only)

   - Call `GITHUB_GET_REPOSITORY_CONTENT` via Composio
   - Fetch `src/` directory recursively
   - Read key files: components, pages, hooks
   - Return concatenated file contents with file paths

2. `_investigate_with_llm()` - Analyze issue against codebase

   - Accept GitHub issue body and title
   - Fetch codebase context
   - Send to Claude via OpenRouter
   - Parse response for root cause, affected files, recommendations
   - Return structured findings

3. Update `act()` method:

   - Accept optional `github_issue` parameter
   - Call `_investigate_with_llm()` instead of hardcoded experiment
   - Store investigation findings in memory graph
   - Log detailed findings with severity
   - Keep war room active (don't resolve yet)

**Key Changes:**

- Remove experiment simulation
- Add real LLM analysis
- Use Composio's `execute_github_action()` from `services/composio_mcp.py`
- Read from `GITHUB_REPO_OWNER` and `GITHUB_REPO_NAME` env vars

---

## Phase 4: Gary - AI Report & GitHub Communication

**File:** `pulse-os-backend/agents/gary.py`

**Add Methods:**

1. `_generate_report_with_llm()` - Generate incident report

   - Accept incident and investigation data
   - Prompt Claude for professional report
   - Format: What happened, Root cause, Actions taken, ETA
   - Return markdown formatted report

2. `_post_github_comment()` - Reply to GitHub issue

   - Use Composio `GITHUB_CREATE_COMMENT` action
   - Post investigation report to issue
   - Include findings and next steps

3. Update `act()` method:

   - Retrieve investigation from memory
   - Generate report with LLM
   - Post to Slack (existing code)
   - Post to GitHub issue via Composio
   - Skip Twitter integration
   - Close war room after communication
   - Mark incident as resolved

---

## Phase 5: Workflow Execution Engine

### 5.1 Create Workflow Executor

**New file:** `pulse-os-backend/services/workflow_executor.py`

```python
class WorkflowExecutor:
    async def execute(self, workflow: Workflow, trigger_data: Dict):
        # Initialize memory graph
        # Create agents based on workflow.agents config
        # Set LLM model from agent config
        # Pass custom prompts to agents
        
        # Execute in sequence:
        # 1. Phill with github_issue data
        # 2. Carl with LLM enabled
        # 3. Gary with outputs from workflow.outputs
        
        # Return execution results
```

### 5.2 Update Workflow Manager

**File:** `pulse-os-backend/services/workflow_manager.py`

In `execute_workflow()`:

- Replace TODO stub with actual executor call
- Pass workflow config to executor
- Handle execution errors
- Store detailed results

---

## Phase 6: GitHub Webhook Integration

**File:** `pulse-os-backend/server.py`

**Add endpoint:**

```python
@app.post("/webhooks/github")
async def github_webhook(request: Request):
    # Verify HMAC signature with GITHUB_WEBHOOK_SECRET
    # Parse payload
    # If action == "opened" and issue:
    #   - Find active workflows with github_issue trigger
    #   - Execute each matching workflow
    #   - Return 200 OK
```

**Setup instructions:**

- GitHub repo → Settings → Webhooks → Add webhook
- URL: `https://your-backend.com/webhooks/github`
- Content type: `application/json`
- Events: Issues
- Secret: Match `GITHUB_WEBHOOK_SECRET`

---

## Phase 7: Frontend Workflow Testing

**File:** `pulse-os-frontend/src/app/workflows/[id]/page.tsx`

**Add:**

1. "Test Workflow" button in header
2. `handleTestWorkflow()` - POST to `/workflows/{id}/execute` with mock data
3. Show success/error notification
4. Redirect to dashboard to see execution

---

## Phase 8: Timeline Event Enhancements

**File:** `pulse-os-frontend/src/app/page.tsx`

**Add severity detection:**

- Parse investigation findings for severity keywords
- Map to high/medium/low
- Send in timeline_event data

**File:** `pulse-os-backend/agents/base.py`

Update `log()` to accept optional `severity` parameter and include in payload.

---

## Phase 9: Cleanup & Polish

1. Remove all `[DEBUG]` print statements from backend
2. Add proper error boundaries to frontend
3. Add loading states to workflow toggle/delete operations
4. Test end-to-end flow
5. Update README with setup instructions

---

## Environment Variables Required

**Backend `.env`:**

```bash
# Existing (user has)
COMPOSIO_API_KEY=ak_6fEWAuN_L22wf2SlUiDp
GITHUB_AUTH_CONFIG_ID=ac_z2CC4twgGOPZimage.png
GITHUB_REPO_OWNER=saai151
GITHUB_REPO_NAME=code-sync
GITHUB_MCP_SERVER_ID=dfb8d235-0389-4b2d-8aee-3072238a9b8e
COMPOSIO_USER_ID=pg-test-af29af9e-d9a6-49a8-888d-a8c8b0aa2428

# Need to add
OPENROUTER_API_KEY=<user_will_provide>
GITHUB_WEBHOOK_SECRET=<generate_random>
```

---

## Testing Checklist

After implementation:

1. Timeline events display correctly
2. Create workflow via UI
3. Activate workflow
4. Open GitHub issue in code-sync repo
5. Verify webhook triggers workflow
6. Watch real-time updates: Phill → Carl → Gary
7. See investigation findings in timeline
8. Verify GitHub comment posted
9. Check Slack message sent
10. War room closes automatically

### To-dos

- [ ] Fix timeline events display - test datetime serialization
- [ ] Create OpenRouter LLM client service
- [ ] Update Carl with LLM investigation and GitHub codebase reading
- [ ] Update Gary with LLM report generation and GitHub commenting
- [ ] Build workflow execution engine
- [ ] Add GitHub webhook endpoint with signature verification
- [ ] Add test workflow button to frontend
- [ ] Create .env file with OpenRouter key
- [ ] Remove debug logs and polish UI