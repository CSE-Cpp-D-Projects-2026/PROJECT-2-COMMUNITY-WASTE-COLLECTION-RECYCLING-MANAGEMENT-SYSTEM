# OpportunityShield

Local, rule-based opportunity checks and a Discover feed. Uploads stay in memory. No account or database.

## Run

1. `npm install`
2. `npm test` (or `npm run smoke` for current feed and lookup status)
3. `npm start`, then open http://localhost:3000

## Add a reference organisation

Edit `data/references.json` with a name, aliases, confidently known official domains, source URL, ISO `lastChecked` date, and `_note`. Manually verify references before a demo.

## Add a curated opportunity

Edit `data/curated-opportunities.json` with title, organiser, type, deadline, official listing URL, source, `lastChecked` date, and `verifiedBy`. Confirm the live official page in the same session. If it is not confirmed, keep the three `SAMPLE - replace` placeholders clearly marked; they are not real listings.

## Optional web search

Copy `.env.example` to `.env` and set `SEARCH_API_KEY` to a Brave Search API key. Without it, web search is hidden. Never commit `.env` or paste the key into chat.

## Community listings and owner review

Copy `.env.example` to `.env`, then set `ADMIN_TOKEN` and `REPORT_SALT` to two different long random values. Restart the app. `/admin` accepts the admin token for listing and report moderation; without it, admin API requests return 403. Reports stay unavailable until `REPORT_SALT` is set. User listings are saved as pending metadata in `data/submissions.json` and appear in Discover only after approval. Reports are saved in `data/reports.json`; raw IP addresses are never written to disk. Both files are ignored by git.

Bulk add accepts a JSON array with this schema (the same fields as the public listing form):

```json
[{"title":"Campus Build Weekend","organiser":"North Star Labs","mode":"online","city":"","startDate":"2027-02-12","deadline":"2027-02-01","url":"https://events.example.org/hack","description":"A weekend student hackathon.","email":""}]
```

Bulk entries are validated and link-checked, then remain pending for owner approval. High-severity findings require an override reason to approve. Listing and report limits are 5 and 10 per hour per IP, respectively.

Recent checks, saved opportunities, and the risk breakdown are stored in this browser only. They can be cleared from the Dashboard. Pasted verification text and uploaded files are not saved.

## Sources and limits

Discover reads the keyless Remotive and Arbeitnow job APIs, filters to intern, trainee, and graduate roles, and caches results for 30 minutes. Remotive requires source attribution and its original listing URL; Arbeitnow asks for a link back to its site. Hackalist and Open Hackathons were excluded after live freshness/terms checks; the smoke command reports why. Other hackathon and scholarship results must be manually verified before being added as curated records. Unverified `SAMPLE - replace` placeholders stay in the JSON file and are not displayed as opportunities. RDAP and certificate lookups can be unavailable; search results are leads, not proof. The prototype cannot guarantee an opportunity. **no screenshot support yet**; only text-based PDFs are supported.
