import { prisma } from '../config/prisma.js';
import {
  applyPublicPricingVisibility,
  getServicePricingVisibility
} from './service-pricing.service.js';
import { ApiError } from '../utils/api-error.js';
import { getPagination, paginationMeta } from '../utils/pagination.js';

const mediaSelect = {
  id: true,
  url: true,
  thumbnailUrl: true,
  altText: true,
  width: true,
  height: true
};

const seoInclude = {
  include: {
    ogImage: { select: mediaSelect }
  }
};

function softDeleteWhere(extra = {}) {
  return { deletedAt: null, ...extra };
}

function publishedArticleWhere(extra = {}) {
  return {
    deletedAt: null,
    status: 'PUBLISHED',
    publishedAt: { lte: new Date() },
    ...extra
  };
}

export async function getPublicConfiguration() {
  const [settings, navigation, socialLinks, homeSections] = await Promise.all([
    prisma.siteSetting.findMany({
      where: { isPublic: true },
      orderBy: [{ group: 'asc' }, { key: 'asc' }]
    }),
    prisma.navigationItem.findMany({
      where: { active: true, deletedAt: null, parentId: null },
      include: {
        children: {
          where: { active: true, deletedAt: null },
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: [{ location: 'asc' }, { sortOrder: 'asc' }]
    }),
    prisma.socialLink.findMany({
      where: { active: true, deletedAt: null },
      orderBy: { sortOrder: 'asc' }
    }),
    prisma.homeSection.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: 'asc' }
    })
  ]);

  return {
    settings: Object.fromEntries(settings.map((setting) => [setting.key, setting.value])),
    navigation,
    socialLinks,
    homeSections: homeSections.filter((section) => section.active),
    inactiveHomeSectionKeys: homeSections
      .filter((section) => !section.active)
      .map((section) => section.key)
  };
}

export async function listDoctors(query) {
  const { page, limit, skip, take } = getPagination(query);
  const where = softDeleteWhere({
    active: true,
    department: {
      active: true,
      deletedAt: null,
      ...(query.department ? { slug: query.department } : {})
    },
    ...(query.branch ? { branch: { slug: query.branch } } : {}),
    ...(query.specialty
      ? { specialty: { contains: query.specialty } }
      : {}),
    ...(query.minExperience
      ? { experienceYears: { gte: query.minExperience } }
      : {}),
    ...(query.featured !== undefined ? { featured: query.featured } : {}),
    ...(query.search
      ? {
          OR: [
            { firstName: { contains: query.search } },
            { lastName: { contains: query.search } },
            { specialty: { contains: query.search } }
          ]
        }
      : {})
  });

  const [items, total] = await prisma.$transaction([
    prisma.doctor.findMany({
      where,
      skip,
      take,
      orderBy: [{ sortOrder: 'asc' }, { lastName: 'asc' }],
      select: {
        id: true,
        slug: true,
        firstName: true,
        lastName: true,
        title: true,
        specialty: true,
        shortBio: true,
        experienceYears: true,
        languages: true,
        featured: true,
        updatedAt: true,
        profileImage: { select: mediaSelect },
        department: { select: { id: true, name: true, slug: true } },
        branch: { select: { id: true, name: true, slug: true } }
      }
    }),
    prisma.doctor.count({ where })
  ]);

  return { items, meta: paginationMeta(total, page, limit) };
}

export async function getDoctor(slug) {
  const doctor = await prisma.doctor.findFirst({
    where: softDeleteWhere({
      slug,
      active: true,
      department: { active: true, deletedAt: null }
    }),
    include: {
      department: {
        select: { id: true, slug: true, name: true, summary: true }
      },
      branch: {
        select: { id: true, slug: true, name: true }
      },
      profileImage: { select: mediaSelect },
      seo: seoInclude,
      educations: { orderBy: { sortOrder: 'asc' } },
      experiences: { orderBy: { sortOrder: 'asc' } },
      certificates: { orderBy: { sortOrder: 'asc' } },
      schedules: {
        where: { active: true },
        include: { branch: { select: { id: true, name: true, slug: true } } }
      },
      services: {
        where: { active: true, deletedAt: null },
        select: { id: true, slug: true, name: true, summary: true }
      }
    }
  });
  if (!doctor) throw new ApiError(404, 'DOCTOR_NOT_FOUND', 'Doctor was not found.');

  const relatedDoctors = await prisma.doctor.findMany({
    where: {
      id: { not: doctor.id },
      departmentId: doctor.departmentId,
      active: true,
      deletedAt: null
    },
    take: 3,
    orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }],
    select: {
      id: true,
      slug: true,
      firstName: true,
      lastName: true,
      specialty: true,
      experienceYears: true,
      profileImage: { select: mediaSelect }
    }
  });
  return {
    ...doctor,
    phone: undefined,
    email: undefined,
    socialLinks: undefined,
    relatedDoctors
  };
}

export async function listDepartments(query) {
  const { page, limit, skip, take } = getPagination(query);
  const where = softDeleteWhere({
    active: true,
    ...(query.featured !== undefined ? { featured: query.featured } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search } },
            { summary: { contains: query.search } }
          ]
        }
      : {})
  });
  const [items, total] = await prisma.$transaction([
    prisma.department.findMany({
      where,
      skip,
      take,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        image: { select: mediaSelect },
        _count: {
          select: {
            doctors: { where: { active: true, deletedAt: null } },
            services: { where: { active: true, deletedAt: null } }
          }
        }
      }
    }),
    prisma.department.count({ where })
  ]);
  return {
    items: items.map((item) => ({ ...item, technologies: undefined })),
    meta: paginationMeta(total, page, limit)
  };
}

export async function getDepartment(slug) {
  const { visible: pricingVisible } = await getServicePricingVisibility();
  const department = await prisma.department.findFirst({
    where: softDeleteWhere({ slug, active: true }),
    include: {
      image: { select: mediaSelect },
      seo: seoInclude,
      services: {
        where: { active: true, deletedAt: null },
        orderBy: { sortOrder: 'asc' },
        include: { image: { select: mediaSelect } }
      },
      doctors: {
        where: { active: true, deletedAt: null },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          slug: true,
          firstName: true,
          lastName: true,
          specialty: true,
          experienceYears: true,
          profileImage: { select: mediaSelect }
        }
      },
      branches: {
        where: { active: true, deletedAt: null },
        orderBy: { sortOrder: 'asc' }
      },
      faqs: {
        where: { active: true, deletedAt: null },
        orderBy: { sortOrder: 'asc' }
      }
    }
  });
  if (!department) {
    throw new ApiError(404, 'DEPARTMENT_NOT_FOUND', 'Department was not found.');
  }
  return {
    ...department,
    technologies: undefined,
    services: department.services.map((service) =>
      applyPublicPricingVisibility(service, pricingVisible)
    )
  };
}

export async function listServices(query) {
  const { visible: pricingVisible } = await getServicePricingVisibility();
  const { page, limit, skip, take } = getPagination(query);
  const where = softDeleteWhere({
    active: true,
    department: {
      active: true,
      deletedAt: null,
      ...(query.department ? { slug: query.department } : {})
    },
    ...(query.featured !== undefined ? { featured: query.featured } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search } },
            { summary: { contains: query.search } }
          ]
        }
      : {})
  });
  const [items, total] = await prisma.$transaction([
    prisma.service.findMany({
      where,
      skip,
      take,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        image: { select: mediaSelect },
        department: { select: { id: true, name: true, slug: true } },
        ...(pricingVisible
          ? {
              priceItems: {
                where: { active: true },
                orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
              }
            }
          : {})
      }
    }),
    prisma.service.count({ where })
  ]);
  return {
    items: items.map((service) =>
      applyPublicPricingVisibility(service, pricingVisible)
    ),
    meta: paginationMeta(total, page, limit)
  };
}

export async function getService(slug) {
  const { visible: pricingVisible } = await getServicePricingVisibility();
  const service = await prisma.service.findFirst({
    where: softDeleteWhere({
      slug,
      active: true,
      department: { active: true, deletedAt: null }
    }),
    include: {
      image: { select: mediaSelect },
      seo: seoInclude,
      department: {
        select: { id: true, slug: true, name: true, summary: true }
      },
      doctors: {
        where: { active: true, deletedAt: null },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          slug: true,
          firstName: true,
          lastName: true,
          specialty: true,
          profileImage: { select: mediaSelect }
        }
      },
      faqs: {
        where: { active: true, deletedAt: null },
        orderBy: { sortOrder: 'asc' }
      },
      ...(pricingVisible
        ? {
            priceItems: {
              where: { active: true },
              orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
            }
          }
        : {})
    }
  });
  if (!service) throw new ApiError(404, 'SERVICE_NOT_FOUND', 'Service was not found.');
  return applyPublicPricingVisibility(service, pricingVisible);
}

export async function listArticles(query) {
  const { page, limit, skip, take } = getPagination(query, { defaultLimit: 9 });
  const where = publishedArticleWhere({
    ...(query.category ? { categories: { some: { slug: query.category } } } : {}),
    ...(query.featured !== undefined ? { featured: query.featured } : {}),
    ...(query.search
      ? {
          OR: [
            { title: { contains: query.search } },
            { excerpt: { contains: query.search } }
          ]
        }
      : {})
  });
  const [items, total] = await prisma.$transaction([
    prisma.article.findMany({
      where,
      skip,
      take,
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        featured: true,
        readingMinutes: true,
        publishedAt: true,
        updatedAt: true,
        coverImage: { select: mediaSelect },
        categories: { select: { id: true, slug: true, name: true } },
        author: { select: { firstName: true, lastName: true } }
      }
    }),
    prisma.article.count({ where })
  ]);
  return { items, meta: paginationMeta(total, page, limit) };
}

export async function getArticle(slug) {
  const article = await prisma.article.findFirst({
    where: publishedArticleWhere({ slug }),
    include: {
      coverImage: { select: mediaSelect },
      seo: seoInclude,
      categories: true,
      author: { select: { id: true, firstName: true, lastName: true } },
      outgoingRelations: {
        orderBy: { sortOrder: 'asc' },
        include: {
          relatedArticle: {
            select: {
              id: true,
              slug: true,
              title: true,
              excerpt: true,
              publishedAt: true,
              coverImage: { select: mediaSelect }
            }
          }
        }
      }
    }
  });
  if (!article) throw new ApiError(404, 'ARTICLE_NOT_FOUND', 'Article was not found.');

  await prisma.article.update({
    where: { id: article.id },
    data: { viewCount: { increment: 1 } }
  });

  let relatedArticles = article.outgoingRelations.map(
    ({ relatedArticle }) => relatedArticle
  );
  if (relatedArticles.length === 0 && article.categories.length > 0) {
    relatedArticles = await prisma.article.findMany({
      where: publishedArticleWhere({
        id: { not: article.id },
        categories: { some: { id: { in: article.categories.map(({ id }) => id) } } }
      }),
      take: 3,
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        publishedAt: true,
        coverImage: { select: mediaSelect }
      }
    });
  }

  const { outgoingRelations, ...result } = article;
  return { ...result, viewCount: article.viewCount + 1, relatedArticles };
}

export async function listSimpleContent(type, query = {}) {
  const definitions = {
    leadership: {
      delegate: prisma.leadershipMember,
      where: { active: true, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { lastName: 'asc' }],
      select: {
        id: true,
        slug: true,
        firstName: true,
        lastName: true,
        position: true,
        bio: true,
        education: true,
        experience: true,
        sortOrder: true,
        image: { select: mediaSelect }
      }
    },
    branches: {
      delegate: prisma.branch,
      where: { active: true, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { image: { select: mediaSelect } }
    },
    faqs: {
      delegate: prisma.fAQ,
      where: {
        active: true,
        deletedAt: null,
        AND: [
          {
            OR: [
              { departmentId: null },
              { department: { active: true, deletedAt: null } }
            ]
          },
          {
            OR: [
              { serviceId: null },
              {
                service: {
                  active: true,
                  deletedAt: null,
                  department: { active: true, deletedAt: null }
                }
              }
            ]
          }
        ],
        ...(query.department ? { department: { slug: query.department } } : {})
      },
      orderBy: { sortOrder: 'asc' },
      include: undefined
    },
    testimonials: {
      delegate: prisma.testimonial,
      where: {
        active: true,
        deletedAt: null,
        AND: [
          {
            OR: [
              { departmentId: null },
              { department: { active: true, deletedAt: null } }
            ]
          },
          {
            OR: [
              { doctorId: null },
              {
                doctor: {
                  active: true,
                  deletedAt: null,
                  department: { active: true, deletedAt: null }
                }
              }
            ]
          }
        ],
        ...(query.featured !== undefined ? { featured: query.featured } : {})
      },
      orderBy: { sortOrder: 'asc' },
      include: {
        image: { select: mediaSelect },
        doctor: {
          select: { slug: true, firstName: true, lastName: true, specialty: true }
        },
        department: { select: { slug: true, name: true } }
      }
    },
    gallery: {
      delegate: prisma.galleryItem,
      where: { active: true, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      include: { media: { select: mediaSelect } }
    },
    certificates: {
      delegate: prisma.certificate,
      where: { active: true, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      include: { media: { select: mediaSelect } }
    },
    'article-categories': {
      delegate: prisma.articleCategory,
      where: { active: true, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      include: undefined
    }
  };
  const definition = definitions[type];
  if (!definition) throw new ApiError(404, 'CONTENT_TYPE_NOT_FOUND', 'Content type not found.');
  return definition.delegate.findMany({
    where: definition.where,
    orderBy: definition.orderBy,
    ...(definition.include ? { include: definition.include } : {}),
    ...(definition.select ? { select: definition.select } : {})
  });
}

export async function getContentPage(slug) {
  const page = await prisma.contentPage.findFirst({
    where: { slug, status: 'PUBLISHED', deletedAt: null },
    include: {
      seo: seoInclude,
      sections: {
        where: { deletedAt: null },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
      }
    }
  });
  if (!page) throw new ApiError(404, 'PAGE_NOT_FOUND', 'Page was not found.');
  return {
    ...page,
    sectionLayoutConfigured: page.sections.length > 0,
    inactiveSectionKeys: page.sections
      .filter((section) => !section.active)
      .map((section) => section.key),
    sections: page.sections.filter((section) => section.active)
  };
}

export async function listPublicPages() {
  return prisma.contentPage.findMany({
    where: { status: 'PUBLISHED', deletedAt: null },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      slug: true,
      title: true,
      updatedAt: true
    }
  });
}

export async function getPublicHome() {
  const [
    _databaseReady,
    page,
    leadership,
    services,
    departments,
    doctors,
    articles,
    testimonials,
    faqs,
    branches,
    pricingSetting
  ] = await prisma.$transaction([
    // Keep the complete homepage read on one pooled connection. This also
    // fails before Express starts any additional request-level DB fan-out.
    prisma.$queryRaw`SELECT 1`,
    prisma.contentPage.findFirst({
      where: { slug: 'home', status: 'PUBLISHED', deletedAt: null },
      include: {
        seo: seoInclude,
        sections: {
          where: { deletedAt: null },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
        }
      }
    }),
    prisma.leadershipMember.findMany({
      where: { active: true, deletedAt: null },
      take: 100,
      orderBy: [{ sortOrder: 'asc' }, { lastName: 'asc' }],
      select: {
        id: true,
        slug: true,
        firstName: true,
        lastName: true,
        position: true,
        bio: true,
        education: true,
        experience: true,
        sortOrder: true,
        image: { select: mediaSelect }
      }
    }),
    prisma.service.findMany({
      where: {
        active: true,
        deletedAt: null,
        department: { active: true, deletedAt: null }
      },
      take: 100,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        slug: true,
        name: true,
        summary: true,
        priceFrom: true,
        currency: true,
        icon: true,
        featured: true,
        updatedAt: true,
        image: { select: mediaSelect },
        department: { select: { id: true, name: true, slug: true } }
      }
    }),
    prisma.department.findMany({
      where: { active: true, deletedAt: null },
      take: 100,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        slug: true,
        name: true,
        summary: true,
        featured: true,
        updatedAt: true,
        image: { select: mediaSelect },
        _count: {
          select: {
            doctors: { where: { active: true, deletedAt: null } },
            services: { where: { active: true, deletedAt: null } }
          }
        }
      }
    }),
    prisma.doctor.findMany({
      where: {
        active: true,
        deletedAt: null,
        department: { active: true, deletedAt: null }
      },
      take: 100,
      orderBy: [{ sortOrder: 'asc' }, { lastName: 'asc' }],
      select: {
        id: true,
        slug: true,
        firstName: true,
        lastName: true,
        title: true,
        specialty: true,
        shortBio: true,
        experienceYears: true,
        languages: true,
        featured: true,
        updatedAt: true,
        profileImage: { select: mediaSelect },
        department: { select: { id: true, name: true, slug: true } },
        branch: { select: { id: true, name: true, slug: true } }
      }
    }),
    prisma.article.findMany({
      where: publishedArticleWhere(),
      take: 100,
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        featured: true,
        readingMinutes: true,
        publishedAt: true,
        updatedAt: true,
        coverImage: { select: mediaSelect },
        categories: { select: { id: true, slug: true, name: true } },
        author: { select: { firstName: true, lastName: true } }
      }
    }),
    prisma.testimonial.findMany({
      where: {
        active: true,
        deletedAt: null,
        AND: [
          {
            OR: [
              { departmentId: null },
              { department: { active: true, deletedAt: null } }
            ]
          },
          {
            OR: [
              { doctorId: null },
              {
                doctor: {
                  active: true,
                  deletedAt: null,
                  department: { active: true, deletedAt: null }
                }
              }
            ]
          }
        ]
      },
      take: 100,
      orderBy: { sortOrder: 'asc' },
      include: {
        image: { select: mediaSelect },
        doctor: {
          select: { slug: true, firstName: true, lastName: true, specialty: true }
        },
        department: { select: { slug: true, name: true } }
      }
    }),
    prisma.fAQ.findMany({
      where: {
        active: true,
        deletedAt: null,
        AND: [
          {
            OR: [
              { departmentId: null },
              { department: { active: true, deletedAt: null } }
            ]
          },
          {
            OR: [
              { serviceId: null },
              {
                service: {
                  active: true,
                  deletedAt: null,
                  department: { active: true, deletedAt: null }
                }
              }
            ]
          }
        ]
      },
      take: 100,
      orderBy: { sortOrder: 'asc' }
    }),
    prisma.branch.findMany({
      where: { active: true, deletedAt: null },
      take: 100,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { image: { select: mediaSelect } }
    }),
    prisma.siteSetting.findUnique({
      where: { key: 'services.pricing' },
      select: { value: true }
    })
  ]);

  if (!page) throw new ApiError(404, 'PAGE_NOT_FOUND', 'Page was not found.');
  const pricingVisible = pricingSetting?.value?.visible !== false;
  const publicPage = {
    ...page,
    sectionLayoutConfigured: page.sections.length > 0,
    inactiveSectionKeys: page.sections
      .filter((section) => !section.active)
      .map((section) => section.key),
    sections: page.sections.filter((section) => section.active)
  };

  return {
    page: publicPage,
    leadership,
    services: services.map((service) =>
      applyPublicPricingVisibility(service, pricingVisible)
    ),
    departments,
    doctors,
    articles,
    testimonials,
    faqs,
    branches
  };
}

export async function searchPublicContent(searchTerm) {
  const term = searchTerm.trim();
  if (term.length < 2) return { doctors: [], departments: [], services: [], articles: [] };

  const [doctors, departments, services, articles] = await Promise.all([
    prisma.doctor.findMany({
      where: {
        active: true,
        deletedAt: null,
        department: { active: true, deletedAt: null },
        OR: [
          { firstName: { contains: term } },
          { lastName: { contains: term } },
          { specialty: { contains: term } }
        ]
      },
      take: 5,
      select: {
        id: true,
        slug: true,
        firstName: true,
        lastName: true,
        specialty: true,
        shortBio: true
      }
    }),
    prisma.department.findMany({
      where: {
        active: true,
        deletedAt: null,
        OR: [
          { name: { contains: term } },
          { summary: { contains: term } }
        ]
      },
      take: 5,
      select: { id: true, slug: true, name: true, summary: true }
    }),
    prisma.service.findMany({
      where: {
        active: true,
        deletedAt: null,
        department: { active: true, deletedAt: null },
        OR: [
          { name: { contains: term } },
          { summary: { contains: term } }
        ]
      },
      take: 5,
      select: { id: true, slug: true, name: true, summary: true }
    }),
    prisma.article.findMany({
      where: publishedArticleWhere({
        OR: [
          { title: { contains: term } },
          { excerpt: { contains: term } }
        ]
      }),
      take: 5,
      select: { id: true, slug: true, title: true, excerpt: true, publishedAt: true }
    })
  ]);
  return { doctors, departments, services, articles };
}
