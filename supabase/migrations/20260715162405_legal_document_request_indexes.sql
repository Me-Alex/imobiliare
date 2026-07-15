-- Covers the document-side lookup and the ON DELETE SET NULL foreign key.
create index if not exists legal_document_requests_fulfilled_document_idx
  on public.legal_document_requests(fulfilled_document_id)
  where fulfilled_document_id is not null;
