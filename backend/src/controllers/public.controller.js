import { prisma } from '../config/prisma.js';
import {
  getArticle,
  getContentPage,
  getDepartment,
  getDoctor,
  getPublicConfiguration,
  getService,
  listPublicPages,
  listArticles,
  listDepartments,
  listDoctors,
  listServices,
  listSimpleContent,
  searchPublicContent
} from '../services/public-content.service.js';
import { ApiError } from '../utils/api-error.js';
import { success } from '../utils/api-response.js';

export async function configurationController(_request, response) {
  return success(response, await getPublicConfiguration());
}

export async function doctorsController(request, response) {
  const result = await listDoctors(request.query);
  return success(response, result.items, { meta: result.meta });
}

export async function doctorController(request, response) {
  return success(response, await getDoctor(request.params.slug));
}

export async function departmentsController(request, response) {
  const result = await listDepartments(request.query);
  return success(response, result.items, { meta: result.meta });
}

export async function departmentController(request, response) {
  return success(response, await getDepartment(request.params.slug));
}

export async function servicesController(request, response) {
  const result = await listServices(request.query);
  return success(response, result.items, { meta: result.meta });
}

export async function serviceController(request, response) {
  return success(response, await getService(request.params.slug));
}

export async function articlesController(request, response) {
  const result = await listArticles(request.query);
  return success(response, result.items, { meta: result.meta });
}

export async function articleController(request, response) {
  return success(response, await getArticle(request.params.slug));
}

export async function simpleContentController(request, response) {
  return success(
    response,
    await listSimpleContent(request.params.type, request.query)
  );
}

export async function contentPageController(request, response) {
  return success(response, await getContentPage(request.params.slug));
}

export async function contentPagesController(_request, response) {
  return success(response, await listPublicPages());
}

export async function searchController(request, response) {
  return success(response, await searchPublicContent(request.query.q || ''));
}

export async function createAppointmentController(request, response) {
  const { website: _honeypot, ...data } = request.body;
  const [department, doctor, branch] = await Promise.all([
    data.departmentId
      ? prisma.department.findFirst({
          where: { id: data.departmentId, active: true, deletedAt: null },
          select: { id: true }
        })
      : null,
    data.doctorId
      ? prisma.doctor.findFirst({
          where: {
            id: data.doctorId,
            active: true,
            deletedAt: null,
            department: { active: true, deletedAt: null }
          },
          select: { id: true, departmentId: true, branchId: true }
        })
      : null,
    data.branchId
      ? prisma.branch.findFirst({
          where: { id: data.branchId, active: true, deletedAt: null },
          select: { id: true }
        })
      : null
  ]);

  if (data.departmentId && !department) {
    throw new ApiError(
      422,
      'INVALID_DEPARTMENT',
      'The selected department is not available.'
    );
  }
  if (data.doctorId && !doctor) {
    throw new ApiError(422, 'INVALID_DOCTOR', 'The selected doctor is not available.');
  }
  if (data.branchId && !branch) {
    throw new ApiError(422, 'INVALID_BRANCH', 'The selected branch is not available.');
  }
  if (
    doctor &&
    data.departmentId &&
    doctor.departmentId !== data.departmentId
  ) {
    throw new ApiError(
      422,
      'DOCTOR_DEPARTMENT_MISMATCH',
      'The selected doctor does not belong to this department.'
    );
  }

  const appointment = await prisma.appointmentRequest.create({
    data: {
      ...data,
      email: data.email || null,
      message: data.message || null,
      departmentId: data.departmentId || null,
      doctorId: data.doctorId || null,
      branchId: data.branchId || null
    },
    select: { id: true, status: true, createdAt: true }
  });
  return success(response, appointment, {
    statusCode: 201,
    message: 'Appointment request received successfully.'
  });
}

export async function createContactController(request, response) {
  const { website: _honeypot, ...data } = request.body;
  const message = await prisma.contactMessage.create({
    data: {
      ...data,
      lastName: data.lastName || null,
      phone: data.phone || null
    },
    select: { id: true, status: true, createdAt: true }
  });
  return success(response, message, {
    statusCode: 201,
    message: 'Contact message received successfully.'
  });
}
