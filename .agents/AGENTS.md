# Systemized Health — Workspace Rules & Directives

## 1. Call-To-Action (CTA) Standard for Discovery Calls
Whenever writing, scripting, outlining, or generating metadata/descriptions for videos containing a Call-To-Action (CTA) for the free discovery call:
- **Mandatory Link**: Always include the official short URL: `http://call.systemizedhealth.com/` (or `call.systemizedhealth.com`).
- **Standard CTA Copy Format**:
  - *"Book your free 20-minute Systemized Discovery Call: call.systemizedhealth.com"*
- **Target Endpoint**: Resolves to `https://tidycal.com/craigandersondc/systemized-discovery-call`.

---

## 2. Client Onboarding & CRM Maintenance
- TidyCal bookings are automatically synced into `database/clients.db` via `python3 scripts/tidycal_sync.py`.
- Form signed agreements are synced via `python3 scripts/sync_agreements.py`.
- Living report [`docs/Client_Onboarding_Status.md`](file:///Users/craiganderson/Developer/SystemizedHealth/docs/Client_Onboarding_Status.md) is updated via `python3 scripts/client_db_manager.py --doc`.
