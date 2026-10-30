import { api, errorMessage, jsonBody } from './client-api';
/** Preserve the inquiry parameter after a partial save so another Save can retry it. */
export async function finishInquiryConversion(orderId: string, inquiryId: string | null) {
  const editorUrl = `/admin/customize?order=${encodeURIComponent(orderId)}`;
  if (inquiryId) {
    try {
      await api('/api/admin/inquiries', { ...jsonBody({ id: inquiryId, status: 'Converted' }), method: 'PATCH' });
    } catch (error) {
      return { editorUrl: `${editorUrl}&inquiry=${encodeURIComponent(inquiryId)}`,
        message: `Invitation saved, but the inquiry could not be marked Converted: ${errorMessage(error)} Save again to retry.` };
    }
  }
  return { editorUrl, message: 'Invitation saved. Send it to the client from Orders.' };
}
