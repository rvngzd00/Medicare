import {
  getExecutiveDirectorForAdmin,
  getPublicExecutiveDirector,
  updateExecutiveDirector
} from '../services/executive-director.service.js';
import { success } from '../utils/api-response.js';

export async function getExecutiveDirectorController(_request, response) {
  return success(response, await getExecutiveDirectorForAdmin());
}

export async function updateExecutiveDirectorController(request, response) {
  return success(response, await updateExecutiveDirector(request.body), {
    message: 'Executive director profile updated successfully.'
  });
}

export async function publicExecutiveDirectorController(_request, response) {
  return success(response, await getPublicExecutiveDirector());
}
