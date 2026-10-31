# Systemized Health — Client Onboarding & CRM Status

*Last Updated: 2026-10-31*

This document maintains the live operational status and verification checklist for Systemized Health's **Free 20-Minute Systemized Discovery Call** funnel.

Names, emails, and phone numbers are not stored in this file. They stay in the local database.

---

## 1. Funnel Architecture & Integration Links

- **Short URL Redirect**: [`call.systemizedhealth.com`](http://call.systemizedhealth.com/) $\rightarrow$ TidyCal
- **Booking Endpoint**: [TidyCal Discovery Call](https://tidycal.com/craigandersondc/systemized-discovery-call)
- **Discovery Call Agreement**: `discovery_call_agreement_url` in `scripts/config.json` (template: `scripts/config.example.json`)
- **Form Responses Sheet**: `agreement_sheet_url` in `scripts/config.json`
- **Database Engine**: `database/clients.db` (local only; not committed)

---

## 2. Onboarding Verification Checklist

| Step | Component | Description | Status |
| :--- | :--- | :--- | :--- |
| **01** | **Traffic Redirect** | `call.systemizedhealth.com` 301 redirects to TidyCal. | ✅ **Verified** |
| **02** | **TidyCal Intake** | 20-Minute Discovery Call availability & intake form. | ✅ **Verified** |
| **03** | **Agreement Redirect**| TidyCal confirmation page redirects to Google Form. | ✅ **Verified** |
| **04** | **Booking API Sync** | `tidycal_sync.py` pulls bookings into `clients.db`. | ✅ **Verified** |
| **05** | **Agreement Form Sync**| `sync_agreements.py` matches responses & marks `'Agreement Signed'`. | ✅ **Verified** |

---

## 3. Client Registry

Local database counts only. The row listing, including names and emails, is written to gitignored `docs/client_registry.local.md`.

| | Count |
| :--- | :--- |
| Active bookings | 0 |
| Cancelled / test records | 10 |

---

## 4. Maintenance Commands

To refresh client bookings, agreements, and update this status document:
```bash
python3 scripts/tidycal_sync.py
python3 scripts/sync_agreements.py
python3 scripts/client_db_manager.py --doc
```
