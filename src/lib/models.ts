export interface Template { id: number; slug?: string | null; title: string; filename: string; category: string; category_id?: number; badge: string; bg?: string; price?: string; original_price?: string; tier?: string; enabled: boolean; created_at?: string }
export interface EditorState { texts: Record<string, string>; images: Record<string, string>; primaryColor: string; bgColor: string; musicUrl: string; musicName?: string; config?: Record<string, string | number> }
export const emptyEditor = (): EditorState => ({ texts: {}, images: {}, primaryColor: '', bgColor: '', musicUrl: '' });
export interface Category { id: number; name: string; slug: string; badge: string; display_order: number; is_active: boolean }
export interface Inquiry { id: string; client_name: string; email: string; phone?: string; category: string; category_id?: number; template_name: string; message?: string; status: string; created_at: string }
export interface Order { id: string; slug?: string; client_name: string; email: string; template_name: string; template_filename?: string; status: string; price: string; message?: string; created_at: string; editor_state?: EditorState; source_html?: string; published_file?: string; inquiry_id?: string; updated_at?: string; email_sent_at?: string | null; email_sent_to?: string | null; email_sent_count?: number; last_email_error?: string | null }
export function templateUrl(filename: string) {
  if (filename.startsWith('http')) return `/api/serve-template/${encodeURIComponent(new URL(filename).pathname.split('/').pop()!)}`;
  return `/templates/${encodeURIComponent(filename)}`;
}

