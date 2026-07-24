import { success } from '../utils/api-response.js';
import {
  createCmsPage,
  getCmsPage,
  listCmsPages,
  listCmsRevisions,
  restoreCmsRevision,
  saveCmsPage
} from '../services/cms.service.js';

export async function listCmsPagesController(_request, response) {
  return success(response, await listCmsPages());
}

export async function getCmsPageController(request, response) {
  return success(response, await getCmsPage(request.params.id));
}

export async function createCmsPageController(request, response) {
  return success(response, await createCmsPage(request.body), {
    statusCode: 201,
    message: 'Content page created successfully.'
  });
}

export async function saveCmsPageController(request, response) {
  return success(
    response,
    await saveCmsPage(request.params.id, request.body, request.user),
    { message: 'Content page and section order saved successfully.' }
  );
}

export async function listCmsRevisionsController(request, response) {
  return success(response, await listCmsRevisions(request.params.id));
}

export async function restoreCmsRevisionController(request, response) {
  return success(
    response,
    await restoreCmsRevision(
      request.params.id,
      request.params.revisionId,
      request.user
    ),
    { message: 'Content revision restored successfully.' }
  );
}
