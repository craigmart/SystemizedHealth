# Systemized Health — Client Onboarding & CRM Status

*Last Updated: 2026-07-29*

This document maintains the live operational status, verification checklist, and active client intake registry for Systemized Health's **Free 20-Minute Systemized Discovery Call** funnel.

---

## 1. Funnel Architecture & Integration Links

- **Short URL Redirect**: [`call.systemizedhealth.com`](http://call.systemizedhealth.com/) $\rightarrow$ TidyCal
- **Booking Endpoint**: [TidyCal Discovery Call](https://tidycal.com/craigandersondc/systemized-discovery-call)
- **Discovery Call Agreement**: [Google Form Agreement](https://docs.google.com/forms/d/e/1FAIpQLScOmaeooaLLHFBppRqDI4Mtb9uM8qnU9eUH0gjo0HFU_NqGzQ/viewform?usp=header)
- **Form Responses Sheet**: [Google Sheet Responses](https://docs.google.com/spreadsheets/d/1wbJfIx92aliZilY4Yyr_oFRaz1TN06erOti6HKZk-ZA/edit?usp=sharing)
- **Database Engine**: [`database/clients.db`](file:///Users/craiganderson/Developer/SystemizedHealth/database/clients.db)

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

## 3. Active Client Registry Table

*(Auto-generated from `database/clients.db`)*

| Client ID | Name | Email | Status | Scheduled Time |
| :--- | :--- | :--- | :--- | :--- |
| 9 | dummy6 | craigandersondc-dummy6@gmail.com | Booked | 2026-08-11T22:30:00.000000Z |
| 10 | dummy3 | craigandersondc-dummy3@gmail.com | Booked | 2026-08-08T13:00:00.000000Z |
| 6 | lastone | craigandersondc-lastone@gmail.com | Agreement Signed | 2026-08-07T17:00:00.000000Z |
| 8 | test5 | craigandersondc-test5@gmail.com | Booked | 2026-08-07T14:30:00.000000Z |
| 11 | Dummy 2 | craigandersondc-dummy2@gmail.com | Booked | 2026-08-07T13:30:00.000000Z |
| 7 | test77 | craigandersondc-test77@gmail.com | Booked | 2026-08-07T12:30:00.000000Z |
| 4 | Test | craiganderson.dc-test@gmail.com | Booked | 2026-08-04T22:30:00.000000Z |
| 1 | Test | craig@craigandersondc.com | Booked | 2026-05-29T18:30:00.000000Z |

---

## 4. Maintenance Commands

To refresh client bookings, agreements, and update this status document:
```bash
python3 scripts/tidycal_sync.py
python3 scripts/sync_agreements.py
python3 scripts/client_db_manager.py --doc
```
