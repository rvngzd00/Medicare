const commonContentFields = ['active', 'sortOrder'];
const commonMediaSeoFields = ['imageId', 'seo'];

export const adminEntities = Object.freeze({
  doctors: {
    delegate: 'doctor',
    permission: 'doctors',
    softDelete: true,
    searchFields: ['firstName', 'lastName', 'specialty'],
    orderBy: [{ sortOrder: 'asc' }, { lastName: 'asc' }],
    slugSource: (data) => `${data.firstName || ''}-${data.lastName || ''}`,
    required: [
      'firstName',
      'lastName',
      'specialty',
      'shortBio',
      'bio',
      'departmentId'
    ],
    writable: [
      'slug',
      'firstName',
      'lastName',
      'title',
      'specialty',
      'shortBio',
      'bio',
      'experienceYears',
      'phone',
      'email',
      'languages',
      'conditions',
      'procedures',
      'socialLinks',
      'departmentId',
      'branchId',
      'profileImageId',
      'seo',
      'featured',
      ...commonContentFields,
      'serviceIds',
      'educations',
      'experiences',
      'certificates',
      'schedules'
    ],
    integers: ['experienceYears', 'sortOrder'],
    booleans: ['active', 'featured'],
    stringArrays: ['languages', 'conditions', 'procedures'],
    idArrays: ['serviceIds'],
    jsonFields: ['socialLinks'],
    dateFields: [],
    include: {
      department: { select: { id: true, name: true, slug: true } },
      branch: { select: { id: true, name: true, slug: true } },
      profileImage: true,
      seo: true,
      services: { select: { id: true, name: true, slug: true } },
      educations: { orderBy: { sortOrder: 'asc' } },
      experiences: { orderBy: { sortOrder: 'asc' } },
      certificates: { orderBy: { sortOrder: 'asc' } },
      schedules: true
    }
  },
  departments: {
    delegate: 'department',
    permission: 'departments',
    softDelete: true,
    searchFields: ['name', 'summary'],
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    slugSource: (data) => data.name,
    required: ['name', 'summary', 'description'],
    writable: [
      'slug',
      'name',
      'summary',
      'description',
      'conditions',
      'technologies',
      'phone',
      ...commonMediaSeoFields,
      'featured',
      ...commonContentFields,
      'branchIds'
    ],
    integers: ['sortOrder'],
    booleans: ['active', 'featured'],
    stringArrays: ['conditions', 'technologies'],
    idArrays: ['branchIds'],
    include: { image: true, seo: true, branches: true, _count: true }
  },
  services: {
    delegate: 'service',
    permission: 'services',
    softDelete: true,
    searchFields: ['name', 'summary'],
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    slugSource: (data) => data.name,
    required: ['name', 'summary', 'description', 'departmentId'],
    writable: [
      'slug',
      'name',
      'summary',
      'description',
      'priceFrom',
      'currency',
      'icon',
      'departmentId',
      ...commonMediaSeoFields,
      'featured',
      ...commonContentFields,
      'doctorIds'
    ],
    integers: ['sortOrder'],
    booleans: ['active', 'featured'],
    idArrays: ['doctorIds'],
    include: {
      image: true,
      seo: true,
      department: { select: { id: true, name: true, slug: true } },
      doctors: { select: { id: true, firstName: true, lastName: true } }
    }
  },
  articles: {
    delegate: 'article',
    permission: 'articles',
    softDelete: true,
    searchFields: ['title', 'excerpt'],
    orderBy: [{ createdAt: 'desc' }],
    slugSource: (data) => data.title,
    required: ['title', 'excerpt', 'body'],
    writable: [
      'slug',
      'title',
      'excerpt',
      'body',
      'status',
      'featured',
      'readingMinutes',
      'publishedAt',
      'scheduledAt',
      'authorId',
      'coverImageId',
      'seo',
      'categoryIds'
    ],
    integers: ['readingMinutes'],
    booleans: ['featured'],
    idArrays: ['categoryIds'],
    dateFields: ['publishedAt', 'scheduledAt'],
    jsonFields: ['body'],
    enums: {
      status: ['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED']
    },
    include: {
      author: { select: { id: true, firstName: true, lastName: true } },
      coverImage: true,
      seo: true,
      categories: true
    }
  },
  'article-categories': {
    delegate: 'articleCategory',
    permission: 'articles',
    softDelete: true,
    searchFields: ['name'],
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    slugSource: (data) => data.name,
    required: ['name'],
    writable: [
      'slug',
      'name',
      'description',
      ...commonContentFields
    ],
    integers: ['sortOrder'],
    booleans: ['active']
  },
  faqs: {
    delegate: 'fAQ',
    permission: 'faqs',
    softDelete: true,
    searchFields: ['question', 'answer'],
    orderBy: [{ sortOrder: 'asc' }],
    required: ['question', 'answer'],
    writable: [
      'question',
      'answer',
      'category',
      'departmentId',
      'serviceId',
      ...commonContentFields
    ],
    integers: ['sortOrder'],
    booleans: ['active'],
    include: {
      department: { select: { id: true, name: true } },
      service: { select: { id: true, name: true } }
    }
  },
  testimonials: {
    delegate: 'testimonial',
    permission: 'testimonials',
    softDelete: true,
    searchFields: ['patientName', 'quote'],
    orderBy: [{ sortOrder: 'asc' }],
    required: ['patientName', 'quote'],
    writable: [
      'patientName',
      'patientTitle',
      'quote',
      'rating',
      'doctorId',
      'departmentId',
      'imageId',
      'featured',
      ...commonContentFields
    ],
    integers: ['rating', 'sortOrder'],
    booleans: ['active', 'featured'],
    include: { doctor: true, department: true, image: true }
  },
  branches: {
    delegate: 'branch',
    permission: 'branches',
    softDelete: true,
    searchFields: ['name', 'address', 'city'],
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    slugSource: (data) => data.name,
    required: ['name', 'address', 'city', 'phone'],
    writable: [
      'slug',
      'name',
      'address',
      'city',
      'postalCode',
      'phone',
      'email',
      'emergencyPhone',
      'latitude',
      'longitude',
      'workingHours',
      'mapEmbedUrl',
      ...commonMediaSeoFields,
      ...commonContentFields,
      'departmentIds'
    ],
    integers: ['sortOrder'],
    booleans: ['active'],
    idArrays: ['departmentIds'],
    jsonFields: ['workingHours'],
    webUrls: ['mapEmbedUrl'],
    include: { image: true, seo: true, departments: true }
  },
  gallery: {
    delegate: 'galleryItem',
    permission: 'gallery',
    softDelete: true,
    searchFields: ['title', 'category'],
    orderBy: [{ sortOrder: 'asc' }],
    required: ['title', 'mediaId'],
    writable: ['title', 'description', 'category', 'mediaId', ...commonContentFields],
    integers: ['sortOrder'],
    booleans: ['active'],
    include: { media: true }
  },
  certificates: {
    delegate: 'certificate',
    permission: 'certificates',
    softDelete: true,
    searchFields: ['title', 'issuer'],
    orderBy: [{ sortOrder: 'asc' }],
    required: ['title', 'issuer'],
    writable: [
      'title',
      'issuer',
      'description',
      'credentialNumber',
      'issuedAt',
      'expiresAt',
      'mediaId',
      ...commonContentFields
    ],
    integers: ['sortOrder'],
    booleans: ['active'],
    dateFields: ['issuedAt', 'expiresAt'],
    include: { media: true }
  },
  leadership: {
    delegate: 'leadershipMember',
    permission: 'leadership',
    softDelete: true,
    searchFields: ['firstName', 'lastName', 'position'],
    orderBy: [{ sortOrder: 'asc' }],
    slugSource: (data) => `${data.firstName || ''}-${data.lastName || ''}`,
    required: ['firstName', 'lastName', 'position'],
    writable: [
      'slug',
      'firstName',
      'lastName',
      'position',
      'bio',
      'email',
      'socialLinks',
      'imageId',
      ...commonContentFields
    ],
    integers: ['sortOrder'],
    booleans: ['active'],
    jsonFields: ['socialLinks'],
    include: { image: true }
  },
  navigation: {
    delegate: 'navigationItem',
    permission: 'navigation',
    softDelete: true,
    searchFields: ['label', 'url'],
    orderBy: [{ location: 'asc' }, { sortOrder: 'asc' }],
    required: ['label', 'url', 'location'],
    writable: [
      'label',
      'url',
      'location',
      'parentId',
      'isExternal',
      ...commonContentFields
    ],
    integers: ['sortOrder'],
    booleans: ['active', 'isExternal'],
    linkUrls: ['url'],
    enums: {
      location: ['HEADER', 'FOOTER', 'UTILITY']
    },
    include: { parent: true, children: true }
  },
  settings: {
    delegate: 'siteSetting',
    permission: 'settings',
    softDelete: false,
    allowDelete: false,
    searchFields: ['key', 'group', 'label'],
    orderBy: [{ group: 'asc' }, { key: 'asc' }],
    required: ['key', 'value', 'group'],
    writable: ['key', 'value', 'group', 'label', 'isPublic'],
    booleans: ['isPublic'],
    jsonFields: ['value']
  },
  contacts: {
    delegate: 'contactMessage',
    permission: 'contacts',
    softDelete: true,
    allowCreate: false,
    searchFields: ['firstName', 'lastName', 'email', 'subject'],
    orderBy: [{ createdAt: 'desc' }],
    required: [],
    writable: ['status', 'adminNotes', 'assignedToId'],
    enums: {
      status: ['NEW', 'IN_PROGRESS', 'RESOLVED', 'SPAM']
    },
    include: {
      assignedTo: { select: { id: true, firstName: true, lastName: true } }
    }
  },
  pages: {
    delegate: 'contentPage',
    permission: 'pages',
    softDelete: true,
    searchFields: ['title', 'slug', 'excerpt'],
    orderBy: [{ updatedAt: 'desc' }],
    slugSource: (data) => data.title,
    required: ['title', 'body'],
    writable: ['slug', 'title', 'excerpt', 'body', 'template', 'status', 'seo'],
    jsonFields: ['body'],
    enums: {
      status: ['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED']
    },
    include: {
      seo: true,
      sections: {
        where: { deletedAt: null },
        orderBy: { sortOrder: 'asc' }
      }
    }
  },
  'home-sections': {
    delegate: 'homeSection',
    permission: 'home_sections',
    softDelete: true,
    searchFields: ['key', 'title', 'subtitle'],
    orderBy: [{ sortOrder: 'asc' }],
    required: ['key', 'content'],
    writable: ['key', 'title', 'subtitle', 'content', ...commonContentFields],
    integers: ['sortOrder'],
    booleans: ['active'],
    jsonFields: ['content']
  },
  'social-links': {
    delegate: 'socialLink',
    permission: 'social_links',
    softDelete: true,
    searchFields: ['platform', 'label', 'url'],
    orderBy: [{ sortOrder: 'asc' }],
    required: ['platform', 'url'],
    writable: ['platform', 'label', 'url', ...commonContentFields],
    integers: ['sortOrder'],
    booleans: ['active'],
    webUrls: ['url']
  }
});
