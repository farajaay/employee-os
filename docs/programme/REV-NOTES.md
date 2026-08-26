# Programme revision notes

## FWO-MOB-001 Rev.0 — issued for execution, 26 August 2026

Held here unmodified as the document of record:

- `FWO-MOB-001_Mobile_App_Programme_Rev0.docx`
- `Figure-1-Target-Architecture.png`
- `Figure-2-Execution-Workflow.png`

## Rename: Fatimah Work OS → Employee OS

Applied at repository creation. Rev.0 was issued under the name **Fatimah Work OS**
and has *not* been reissued — an issued revision is not edited in place. The working
documents (`CLAUDE.md`, `MOBILE_BUILD_PLAN.md`) and all code carry the new name and
take precedence where they differ from the Word document.

| Item | Rev.0 | Now |
|---|---|---|
| Product name | Fatimah Work OS | Employee OS |
| App ID | `com.farajaay.fatimahworkos` | `com.farajaay.employeeos` |
| Repository | `farajaay/fatimah-work-os` | `farajaay/employee-os` |
| Capacitor `appName` | `"Fatimah Work OS"` | `"Employee OS"` |

**Unchanged by the rename:** the Supabase project and its contract, the six applied
migrations, the eleven relations, RLS as the security boundary, the Arabic RTL
interface, and the brand tokens `#fbf7f2` / `#a46b75` / `#2c2627`. The programme's
phases, forty tickets, effort estimate and store strategy are unchanged.

**Open:** the production domain is still `fatimah-work-os.vercel.app`. Whether it
moves is a Phase 0 decision — see ticket **M-00** in `MOBILE_BUILD_PLAN.md`.

Reissue as `EOS-MOB-001 Rev.1` if a renamed document of record is wanted; until then
Rev.0 plus this note is the programme.
