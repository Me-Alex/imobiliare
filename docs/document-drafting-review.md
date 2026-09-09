# Document drafting review

Scope: drafting and editing documents (Romanian “redactare”), their review step, generation and document preview. This batch does not add sensitive-information masking or change legal template clauses. Requested review limit: five meaningful independent rounds, or an earlier fully supported 10/10 result. Scores are evidence-based and do not certify legal compliance.

| Round | Comprehension | Design | Context | Data | Accessibility | Preservation |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 6 | 6 | 6 | 5 | 6 | 8 |
| 2 | 8 | 8 provisional | 7 | 7 | 8 provisional | 8 |
| 3 | 9 | 8 provisional | 9 | 9 | 8 provisional | 9 provisional |
| 4 | 9 | 9 | 9 | 9 | 8 | 9 provisional |
| 5 | 9 | 9 | 9 | 9 | 9 | 9 |

Round 1 identified unsafe participant/payment defaults, invalid transaction selections, missing text review, unhelpful validation, misleading PDF controls and PDF character loss. Round 2 identified participant field ownership, stale untouched prefills during refresh and missing amount validation. Round 3 confirmed those corrections and inspected a real three-page PDF; it identified inconsistent unsupported-template-token validation, subsequently corrected.

Implemented direction: edit data → review full text → create in the selected dossier. Agency/system values stay authoritative; participant declarations only fill fields owned by that identified participant. Refresh updates untouched defaults and preserves edits. Generation reloads the authoritative template and context, rejecting stale reviewed content. It preserves the reviewed reference and uses the same validation/rendering helpers. Generation success and list-refresh failure are distinguished to avoid duplicate creation.

PDF generation embeds locally hosted Noto Sans with its license, preserving supported Unicode. Unsupported glyphs stop creation rather than disappearing. Long references wrap, headings use their actual font metrics, and page headers/numbers repeat. Preview controls match the file format and use one accessible close button.

Round 4 inspected the live review screenshots at 1280, 390 and 320px; it identified history-toggle accessibility and short-screen/keyboard coverage gaps. The history now has a 44px target, explicit expanded/controlled state and localized role/status labels. Testing at 320×568 found a focus-return defect in the unsaved-changes prompt; it was corrected. The final review also prompted a compact introduction so document text is visible immediately on a short phone screen.

Round 5 completed with 9/10 across all six perspectives and no remaining functional blocker found in the reviewed scope. It did not claim perfection or legal certification.

Pre-commit verification: ESLint, TypeScript, 106 unit tests across 16 files and production build passed. Five Playwright scenarios passed: the four demo roles retain dossier selection, operations, requests and preview-before-signing behavior; the drafting scenario exercises editable versus untouched refresh, invalid amounts, full-text review, stale-template rejection, single creation, and the reviewed reference/name/amount. The final focused confirmation passed after the compact-copy and test-fixture changes, including 320×568 layout and Escape → continue-editing focus return.

PDF evidence: a three-page Unicode/long-reference sample and the two-page PDF captured from actual browser generation were parsed and rendered locally. Romanian/Cyrillic text, reviewed name/amount and page boundaries passed. Noto font license is included. Browser generation/storage mutations were intercepted, so no test contract was written to a real dossier. Production signing and legal compliance were not assessed.
