import {
  deleteMedia,
  listMedia,
  replaceMedia,
  uploadMedia
} from '../services/media.service.js';
import { success } from '../utils/api-response.js';

export async function listMediaController(request, response) {
  const result = await listMedia(request.query);
  return success(response, result.items, { meta: result.meta });
}

export async function uploadMediaController(request, response) {
  return success(
    response,
    await uploadMedia(request.file, request.body.altText, request.user.id),
    { statusCode: 201, message: 'Image uploaded and optimized successfully.' }
  );
}

export async function replaceMediaController(request, response) {
  return success(
    response,
    await replaceMedia(request.params.id, request.file, request.body.altText),
    { message: 'Image replaced successfully.' }
  );
}

export async function deleteMediaController(request, response) {
  await deleteMedia(request.params.id);
  return success(response, null, { message: 'Image deleted successfully.' });
}
