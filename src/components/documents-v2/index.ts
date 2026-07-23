/**
 * Barrel for the new documents workspace.
 *
 * Prefer importing from `@/components/documents-v2` rather than the
 * individual files — it keeps call sites stable while we iterate on
 * the component split.
 */

export { DocumentWorkspace, type DocumentWorkspaceProps } from './document-workspace'
export { DocumentTimeline, type DocumentTimelineProps, type TimelineItem } from './document-timeline'
export { DocumentCard, type DocumentCardProps } from './document-card'
export { StatePill, type StatePillProps } from './state-pill'
export { IdentityCard, type IdentityCardProps, type IdentityValue } from './identity-card'
export { ClientFlow, type ClientFlowProps, type ClientSubmission, type ClientFieldValue } from './client-flow'
