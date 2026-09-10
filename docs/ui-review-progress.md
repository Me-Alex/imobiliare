# UI improvement progress

The project-wide improvement goal remains open. Review scores describe inspected evidence; they are not a claim that every screen is flawless. Sixteen independent review rounds have been completed: four general UI rounds, five document-drafting rounds (see document-drafting-review.md), three administration/saved-search rounds, and four admin-header/footer rounds. The requested minimum of 100 rounds has not been completed.

## Current batch

Account navigation: visible menu label, grouped destinations, accent-insensitive search, current-section context, fixed Help action, accessible close control, predictable opening scroll position, keyboard focus and reduced-motion support. Role destinations are preserved.

Public browsing: labeled search, transaction and property-type controls; labeled grid/list/map switch; secondary sorting and saving controls; advanced-filter count excludes visible criteria.

## Independent review ledger

| Round | Navigation | Mobile | Accessibility | Hierarchy | Roles | Preservation |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 8 | 8 | 8 | 8 | 9 | 8 |
| 2 | 9 | 8.5 | 9 | 8.5 | 9 | 8.5 |

Round 1 identified opening-scroll displacement, missing reduced-motion overlay handling, and missing explicit quick-link focus indicators. These were corrected. Round 2 inspected those fixes in source and a refreshed desktop screenshot; its ratings preceded completed browser evidence and must not be represented as a full execution review.

## Outstanding work

- Owner performance: continue task-based review after simplified hierarchy, corrected metric periods, conservative comparable-property analysis, nullable feedback, and explicit dossier navigation.
- Documents: staff dossier identity is visible and drafting improvements passed five focused reviews; continue broader workflow coverage beyond the tested scope.
- Public price filter: explicit finite limits now remain visible/effective across grid, map and versioned saved searches; unlimited uses null, legacy saved searches retain their previous unlimited semantics.
- Administration: the section selector, task hierarchy, compact header and exact search-result navigation are improved; continue reviewing the remaining workflows and discoverability of the trailing desktop tabs.
- Continue reviewing remaining pages; the mobile footer and newsletter flow now have focused browser coverage.
- Continue meaningful independent reviews of concrete changes; do not manufacture perfect scores or count repeated messages as reviews.

## Owner performance and budget batch

Round 3 found aggregate document/activity actions still targeting the latest appointment (dossier navigation 6/10); other source scores were hierarchy 8.5, data clarity 9, chart accessibility 9 and comparison correctness 9. Responsive evidence was missing at that inspection. Aggregate actions now open explicit dossier/transaction choosers.

Round 4 inspected fresh owner desktop/mobile screenshots and source: dossier navigation 9, responsive clarity 9, data explanation 9, language 8 and visual economy 8.5. It identified raw status codes, empty chart height and stretched empty panels. These were subsequently corrected; no independent revised score is claimed.

Implemented: neutral 30-day results; one recommended action; compact property summary; retained detailed guidance; daily chart table and honest zero state; same-city/zone/type/transaction/currency comparisons requiring at least three candidates; absent-rating/null-decision handling; recent-activity scope explained; known generated activity summaries translated without altering free text.

Budget verification covers explicit zero, 999999, 1000000, 1200000, unlimited, legacy saved searches, JSON serialization and actual API parameter construction. Browser checks exercise grid/map queries and local saved-search reload without external mutations. Owner/admin browser checks cover 1280/390/320 layouts, daily table, guidance, property switching, refresh and aggregate chooser destinations without arbitrary appointment/deal context.

## Administration and saved-search batch — September 10, 2026

Saved searches now use a shared complete criteria description, including explicit minimum/maximum budgets, keyword, area, featured status, virtual tours and ordering. The interface explains that persistence is limited to this browser/device. Every opening starts with a fresh name; failed storage leaves the form open with its input intact. Invalid ranges cannot be saved or applied. Damaged storage is not overwritten. Deletion offers accessible cumulative undo inside the panel; recovery merges with the current stored list, preserving later additions and edits. Search rows use a visible result action and individually named 44px deletion controls.

Administration exposes all ten destinations through a mobile section selector and desktop tabs. The next task precedes optional statistics and operational guidance. Search results identify the exact lead/deal, including closed requests or records beyond the overview's preview limit; a focused transaction opens its own deal context. Role/property filters have accessible names. The account shortcuts retain full labels at 320px.

| Round | Saved clarity | Saved reliability | Admin search | Hierarchy | Compact navigation | Accessibility |
| --- | --- | --- | --- | --- | --- | --- |
| 10 | 6 | 6 | 5 | 6.5 | Not rated | 6.5 |
| 11 | 9 | 9 | 8.5 | 8 | 7 | 8 |
| 12 | 9 | 9 | 9 | 8.5 | 9 | 9 |

Round 10 was a source audit: incomplete/ambiguous summaries, silent storage failure, irreversible immediate deletion, duplicated admin orientation and misleading search destinations. Round 11 inspected changed source and the supplied narrow admin screenshot, finding the focused deal's generic open action, truncated shortcuts and an unlabeled role filter. These were corrected. Round 12 inspected source plus fresh 320px/1280px saved-search and 320px admin screenshots; no further material defect was found in that bounded pass. The reviewer identified mobile admin header density as a remaining refinement opportunity, not a functional blocker. No 10/10 or project-wide completion is claimed.

Validation before commit: ESLint and TypeScript passed; 112 unit tests passed, including six new criteria/storage/recovery tests. Two focused Playwright tests passed: saved searches exercise failure/retry, fresh forms, explicit million-euro restoration, complete summaries at 1280/390/320, failed deletion and undo retaining later saves; administration exercises all ten sections at those widths, readable shortcuts, out-of-preview/closed results and exact deal navigation. Admin search edge cases use synthetic rows substituted into a read-only response. No account roles, live documents, rewards or other production records were changed by these tests.

The production Next.js build also passed, including static generation. Checks were completed before committing, per the user's requested workflow.

## Compact administration header and footer — September 10, 2026

The administration header now shows the task title, a 44px refresh action and the timestamp of the displayed data. Identity, logout and public browsing remain in the existing user menu. When a refresh fails, previously loaded data stays visible with a persistent explanation and retry action. The header stays below 150px at 1280/390/320 widths in the browser regression.

The public footer groups its existing destinations into three disclosures and retains contact information and newsletter access. Category and popular-search shortcuts reset every old criterion before applying their own selection. Room labels now state the actual minimum (1+/2+/3+). Dead social buttons were removed; no destinations or contact information were invented.

Newsletter submission now has labeled 44px controls, duplicate-submission protection, inline errors, retained input on failure and explicit confirmation. The API returns 503 when no database is available, instead of reporting an unsaved subscription as successful. Existing persistence and duplicate-email handling remain intact. Footer scrolling respects reduced-motion preference; mobile legal links reserve horizontal space for the chat launcher.

| Round | Admin header | Footer navigation | Newsletter reliability | Footer accessibility |
| --- | --- | --- | --- | --- |
| 13 | 7 | 5 | 4 | 5 |
| 14 | 9 | 9 | 9 | 8.5 |
| 15 | 9 | 8.5 | Not rerated | 9 |
| 16 | Not rerated | 9 | Not rerated | 9 |

Round 13 audited source and found stale shortcut filters, misleading room labels, false newsletter success without storage, missing newsletter labels and nonpersistent admin refresh errors. Round 14 inspected source and fresh desktop/mobile screenshots; it found the newsletter input rendering around 32px on mobile despite its height utility. The input now has a minimum height and correct flex sizing. Round 15 confirmed that correction and identified chat overlap with the privacy link at intermediate mobile scroll positions. A right gutter now prevents overlap by geometry. Round 16 inspected the final mobile screenshot and source and found no further material defect in this bounded scope. Scores are evidence-specific and do not establish project-wide perfection.

Validation: ESLint/TypeScript and all 115 unit tests passed, including three newsletter route tests. Two Playwright regressions passed for the changed administration and footer flows. They cover failed refresh/retry with retained data, user-menu access, all ten admin sections and exact result navigation; newsletter validation, pending state, mocked failure and success; complete shortcut reset; responsive sizing, cookie preferences, reduced-motion scrolling and legal-link/chat geometry. The final footer regression passed again after the last spacing correction. No real subscription, message, role change or administrative mutation was submitted by QA.

The final production build passed after the spacing correction, including TypeScript and static-page generation. All validation preceded the commit.
