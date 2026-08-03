import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const permissionGroups = {
  dashboard: ['dashboard.read'],
  doctors: ['doctors.read', 'doctors.write', 'doctors.delete'],
  leadership: ['leadership.read', 'leadership.write', 'leadership.delete'],
  departments: ['departments.read', 'departments.write', 'departments.delete'],
  services: ['services.read', 'services.write', 'services.delete'],
  articles: ['articles.read', 'articles.write', 'articles.publish', 'articles.delete'],
  faqs: ['faqs.read', 'faqs.write', 'faqs.delete'],
  testimonials: ['testimonials.read', 'testimonials.write', 'testimonials.delete'],
  branches: ['branches.read', 'branches.write', 'branches.delete'],
  gallery: ['gallery.read', 'gallery.write', 'gallery.delete'],
  certificates: ['certificates.read', 'certificates.write', 'certificates.delete'],
  navigation: ['navigation.read', 'navigation.write', 'navigation.delete'],
  settings: ['settings.read', 'settings.write'],
  contacts: ['contacts.read', 'contacts.write', 'contacts.delete'],
  media: ['media.read', 'media.write', 'media.delete'],
  users: ['users.read', 'users.write', 'users.delete'],
  roles: ['roles.read', 'roles.write'],
  audit: ['audit.read'],
  pages: ['pages.read', 'pages.write', 'pages.delete'],
  homeSections: ['home_sections.read', 'home_sections.write', 'home_sections.delete'],
  socialLinks: ['social_links.read', 'social_links.write', 'social_links.delete']
};

const allPermissions = Object.values(permissionGroups).flat();

const roleDefinitions = [
  {
    name: 'Super Admin',
    slug: 'super-admin',
    description: 'Platformanın bütün modullarına tam giriş',
    permissions: allPermissions
  },
  {
    name: 'Content Manager',
    slug: 'content-manager',
    description: 'Sayt kontenti, məqalələr və media idarəetməsi',
    permissions: [
      ...permissionGroups.dashboard,
      ...permissionGroups.departments,
      ...permissionGroups.services,
      ...permissionGroups.articles,
      ...permissionGroups.leadership,
      ...permissionGroups.faqs,
      ...permissionGroups.testimonials,
      ...permissionGroups.gallery,
      ...permissionGroups.certificates,
      ...permissionGroups.navigation,
      ...permissionGroups.media,
      ...permissionGroups.pages,
      ...permissionGroups.homeSections,
      ...permissionGroups.socialLinks,
      ...permissionGroups.settings,
      'doctors.read',
      'branches.read'
    ]
  },
  {
    name: 'Doctor Manager',
    slug: 'doctor-manager',
    description: 'Həkim, şöbə, xidmət və iş qrafiki idarəetməsi',
    permissions: [
      ...permissionGroups.dashboard,
      ...permissionGroups.doctors,
      ...permissionGroups.departments,
      ...permissionGroups.services,
      ...permissionGroups.branches,
      ...permissionGroups.media
    ]
  },
  {
    name: 'Support Operator',
    slug: 'support-operator',
    description: 'Əlaqə mesajlarının idarəetməsi',
    permissions: [
      ...permissionGroups.dashboard,
      ...permissionGroups.contacts,
      'doctors.read',
      'departments.read',
      'branches.read'
    ]
  }
];

async function seedRbac() {
  const permissionIds = new Map();

  for (const code of allPermissions) {
    const permission = await prisma.permission.upsert({
      where: { code },
      update: { name: code },
      create: {
        code,
        name: code,
        description: `${code} əməliyyatı üçün icazə`
      }
    });
    permissionIds.set(code, permission.id);
  }

  for (const definition of roleDefinitions) {
    const role = await prisma.role.upsert({
      where: { slug: definition.slug },
      update: {
        name: definition.name,
        description: definition.description,
        isSystem: true
      },
      create: {
        name: definition.name,
        slug: definition.slug,
        description: definition.description,
        isSystem: true
      }
    });

    await prisma.rolePermission.createMany({
      data: definition.permissions.map((code) => ({
        roleId: role.id,
        permissionId: permissionIds.get(code)
      })),
      skipDuplicates: true
    });
  }
}

async function seedOptionalAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email && !password) return;
  if (!email || !password) {
    throw new Error('SEED_ADMIN_EMAIL və SEED_ADMIN_PASSWORD birlikdə verilməlidir.');
  }
  if (password.length < 12) {
    throw new Error('SEED_ADMIN_PASSWORD ən azı 12 simvol olmalıdır.');
  }

  const role = await prisma.role.findUniqueOrThrow({
    where: { slug: 'super-admin' }
  });
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: {
      firstName: process.env.SEED_ADMIN_FIRST_NAME || 'Medicare',
      lastName: process.env.SEED_ADMIN_LAST_NAME || 'Administrator',
      passwordHash,
      roleId: role.id,
      status: 'ACTIVE',
      deletedAt: null
    },
    create: {
      email,
      firstName: process.env.SEED_ADMIN_FIRST_NAME || 'Medicare',
      lastName: process.env.SEED_ADMIN_LAST_NAME || 'Administrator',
      passwordHash,
      roleId: role.id
    }
  });
}

async function seedContent() {
  const mediaDefinitions = [
    ['doctor-aydan', 'leyla-memmedova.png', 1744153, 864, 1821, 'Dr. Aydan Məmmədova'],
    ['doctor-elvin', 'orxan-aliyev.png', 2209323, 1024, 1536, 'Dr. Elvin Əliyev'],
    ['doctor-nigar', 'nigar-aliyeva.png', 1723074, 1023, 1537, 'Dr. Nigar Hüseynli'],
    ['leader-kamran', 'orxan-huseynli.png', 1985890, 1024, 1536, 'Dr. Kamran Rzayev'],
    ['leader-nermin', 'leyla-quliyeva.png', 1973834, 1024, 1536, 'Dr. Nərmin Məmmədova'],
    ['leader-elcin', 'elcin-memmedov.png', 2051005, 1024, 1536, 'Elçin Məmmədov']
  ];
  const media = new Map();
  for (const [key, filename, size, width, height, altText] of mediaDefinitions) {
    const item = await prisma.mediaFile.upsert({
      where: { storageKey: `static/doctors/${filename}` },
      update: {},
      create: {
        provider: 'S3',
        storageKey: `static/doctors/${filename}`,
        filename,
        originalName: filename,
        mimeType: 'image/png',
        size,
        width,
        height,
        url: `/images/doctors/${filename}`,
        altText
      }
    });
    media.set(key, item);
  }

  const leadershipDefinitions = [
    {
      slug: 'dr-kamran-rzayev',
      firstName: 'Dr. Kamran',
      lastName: 'Rzayev',
      position: 'Baş direktor',
      bio: 'Medicare Hospital-da klinik keyfiyyət, pasiyent təhlükəsizliyi və komanda əməkdaşlığı üzrə inkişaf proqramlarına rəhbərlik edir.',
      education: ['Azərbaycan Tibb Universiteti — Müalicə işi'],
      experience: ['Səhiyyə idarəçiliyi və klinik keyfiyyət üzrə uzunmüddətli rəhbərlik təcrübəsi'],
      imageId: media.get('leader-kamran').id,
      sortOrder: 1
    },
    {
      slug: 'dr-nermin-memmedova',
      firstName: 'Dr. Nərmin',
      lastName: 'Məmmədova',
      position: 'Tibbi direktor',
      bio: 'Klinik protokolların, multidissiplinar komanda işinin və pasiyent təhlükəsizliyi standartlarının davamlı inkişafına rəhbərlik edir.',
      education: ['Azərbaycan Tibb Universiteti — Müalicə işi', 'Klinik idarəetmə üzrə ixtisasartırma proqramı'],
      experience: ['Klinik xidmətlərin təşkili və keyfiyyət idarəetməsi üzrə 15 ildən artıq təcrübə'],
      imageId: media.get('leader-nermin').id,
      sortOrder: 2
    },
    {
      slug: 'elcin-memmedov',
      firstName: 'Elçin',
      lastName: 'Məmmədov',
      position: 'İnzibati işlər üzrə direktor',
      bio: 'Hospitalın əməliyyat proseslərini, xidmət koordinasiyasını və pasiyent təcrübəsinin təşkilati inkişafını idarə edir.',
      education: ['Azərbaycan Dövlət İqtisad Universiteti — Menecment'],
      experience: ['Səhiyyə müəssisələrinin əməliyyat idarəçiliyi üzrə 12 ildən artıq təcrübə'],
      imageId: media.get('leader-elcin').id,
      sortOrder: 3
    }
  ];
  for (const leader of leadershipDefinitions) {
    await prisma.leadershipMember.upsert({
      where: { slug: leader.slug },
      update: {},
      create: leader
    });
  }

  const branch = await prisma.branch.upsert({
    where: { slug: 'medicare-merkez' },
    update: {
      name: 'Medicare Hospital — Sabunçu',
      address: 'Sabunçu qəsəbəsi, Əslidar Məmmədəliyev küçəsi 5, Bakı',
      city: 'Bakı',
      postalCode: 'AZ1034',
      phone: '+994 12 450 32 91',
      email: 'official@medicarehospital.az',
      emergencyPhone: '103',
      latitude: null,
      longitude: null,
      workingHours: {
        'Hər gün': '24 saat'
      },
      active: true,
      deletedAt: null
    },
    create: {
      slug: 'medicare-merkez',
      name: 'Medicare Hospital — Sabunçu',
      address: 'Sabunçu qəsəbəsi, Əslidar Məmmədəliyev küçəsi 5, Bakı',
      city: 'Bakı',
      postalCode: 'AZ1034',
      phone: '+994 12 450 32 91',
      email: 'official@medicarehospital.az',
      emergencyPhone: '103',
      workingHours: {
        'Hər gün': '24 saat'
      }
    }
  });

  const departmentData = [
    {
      slug: 'kardiologiya',
      name: 'Kardiologiya',
      summary: 'Ürək-damar sağlamlığı üçün dəqiq diaqnostika və fərdi müalicə.',
      description: 'Medicare Kardiologiya şöbəsi profilaktik müayinədən kompleks müalicəyə qədər sübuta əsaslanan tibbi xidmət göstərir.',
      conditions: ['Arterial hipertenziya', 'Ürək ritm pozuntuları', 'Koronar ürək xəstəliyi'],
      technologies: [],
      featured: true,
      sortOrder: 1
    },
    {
      slug: 'nevrologiya',
      name: 'Nevrologiya',
      summary: 'Sinir sistemi xəstəliklərinin müasir diaqnostikası və müalicəsi.',
      description: 'Nevroloqlarımız baş ağrısı, başgicəllənmə və periferik sinir sistemi problemləri üçün multidissiplinar yanaşma tətbiq edir.',
      conditions: ['Miqren', 'Nevropatiya', 'Yuxu pozuntuları'],
      technologies: [],
      featured: true,
      sortOrder: 2
    },
    {
      slug: 'pediatriya',
      name: 'Pediatriya',
      summary: 'Uşaqların sağlam böyüməsi üçün ailə yönümlü tibbi xidmət.',
      description: 'Doğuşdan yeniyetməlik dövrünədək profilaktika, peyvənd izlənməsi və xəstəliklərin müalicəsi vahid qayğı planında birləşdirilir.',
      conditions: ['Mövsümi infeksiyalar', 'Allergik vəziyyətlər', 'İnkişaf izlənməsi'],
      technologies: [],
      featured: true,
      sortOrder: 3
    },
    {
      slug: 'psixiatriya',
      name: 'Psixiatriya',
      summary: 'Psixi sağlamlıq üzrə konsultasiya və müayinə xidmətləri.',
      description: 'Psixi sağlamlığın qiymətləndirilməsi və fərdi konsultasiya xidmətləri.',
      conditions: [],
      technologies: [],
      featured: false,
      sortOrder: 10
    },
    {
      slug: 'diaqnostika',
      name: 'Diaqnostika',
      summary: 'Instrumental müayinələr və həkim qəbulu xidmətləri.',
      description: 'Rentgen, ultrasəs və digər diaqnostik xidmətlərin vahid koordinasiyası.',
      conditions: [],
      technologies: [],
      featured: false,
      sortOrder: 11
    },
    {
      slug: 'laboratoriya',
      name: 'Laboratoriya',
      summary: 'Klinik və instrumental laborator müayinələrin geniş spektri.',
      description: 'Müasir laborator diaqnostika, skrininq və monitorinq xidmətləri.',
      conditions: [],
      technologies: [],
      featured: false,
      sortOrder: 12
    },
    {
      slug: 'poliklinika-ve-reabilitasiya',
      name: 'Poliklinika və reabilitasiya',
      summary: 'Fizioterapiya və ambulator manipulyasiya xidmətləri.',
      description: 'Bərpa, fizioterapiya və gündəlik ambulator prosedurlar üçün koordinasiyalı xidmət.',
      conditions: [],
      technologies: [],
      featured: false,
      sortOrder: 13
    }
  ];

  const departments = new Map();
  for (const data of departmentData) {
    const department = await prisma.department.upsert({
      where: { slug: data.slug },
      update: {
        ...data,
        active: true,
        deletedAt: null,
        branches: { connect: { id: branch.id } }
      },
      create: { ...data, branches: { connect: { id: branch.id } } }
    });
    departments.set(data.slug, department);
  }

  const serviceData = [
    {
      slug: 'kardioloji-check-up',
      name: 'Kardioloji Check-up',
      summary: 'Ürək-damar risklərinin bir görüşdə kompleks qiymətləndirilməsi.',
      description: 'Kardioloq konsultasiyası, EKQ, exokardioqrafiya və fərdi risk hesabatını əhatə edən müayinə proqramı.',
      departmentSlug: 'kardiologiya',
      priceFrom: 120,
      featured: true,
      sortOrder: 1
    },
    {
      slug: 'nevroloji-konsultasiya',
      name: 'Nevroloji konsultasiya',
      summary: 'Şikayətlərin sistemli qiymətləndirilməsi və fərdi müalicə planı.',
      description: 'Ətraflı anamnez, nevroloji müayinə və ehtiyac olduqda instrumental diaqnostika planı.',
      departmentSlug: 'nevrologiya',
      priceFrom: 70,
      featured: true,
      sortOrder: 2
    },
    {
      slug: 'usaq-saglamliq-izlenmesi',
      name: 'Uşaq sağlamlıq izlənməsi',
      summary: 'Boy, çəki, inkişaf və peyvənd planının davamlı izlənməsi.',
      description: 'Yaşa uyğun inkişaf göstəriciləri və profilaktik tövsiyələr pediatr tərəfindən vahid elektron qeyddə izlənir.',
      departmentSlug: 'pediatriya',
      priceFrom: 55,
      featured: true,
      sortOrder: 3
    }
  ];

  const services = new Map();
  for (const { departmentSlug, ...data } of serviceData) {
    const service = await prisma.service.upsert({
      where: { slug: data.slug },
      update: {
        ...data,
        departmentId: departments.get(departmentSlug).id,
        active: true,
        deletedAt: null
      },
      create: {
        ...data,
        departmentId: departments.get(departmentSlug).id
      }
    });
    services.set(data.slug, service);
  }

  const doctorData = [
    {
      slug: 'dr-aydan-memmedova',
      firstName: 'Aydan',
      lastName: 'Məmmədova',
      title: 'Dr.',
      specialty: 'Kardioloq',
      shortBio: 'Ürək-damar risklərinin erkən aşkarlanması üzrə ixtisaslaşmış kardioloq.',
      bio: 'Dr. Aydan Məmmədova pasiyentlərin həyat tərzinə uyğun, ölçülə bilən və davamlı kardioloji qayğı planları hazırlayır.',
      experienceYears: 14,
      languages: ['Azərbaycan', 'İngilis', 'Rus'],
      conditions: ['Arterial hipertenziya', 'Aritmiya', 'Ürək çatışmazlığı'],
      procedures: ['EKQ şərhi', 'Exokardioqrafiya', 'Holter nəticələrinin analizi'],
      departmentSlug: 'kardiologiya',
      serviceSlugs: ['kardioloji-check-up'],
      profileImageId: media.get('doctor-aydan').id,
      featured: true,
      sortOrder: 1
    },
    {
      slug: 'dr-elvin-eliyev',
      firstName: 'Elvin',
      lastName: 'Əliyev',
      title: 'Dr.',
      specialty: 'Nevroloq',
      shortBio: 'Baş ağrıları və periferik sinir sistemi xəstəlikləri üzrə mütəxəssis.',
      bio: 'Dr. Elvin Əliyev diaqnostik nəticələri gündəlik həyat məqsədləri ilə birləşdirən pasiyent yönümlü yanaşma tətbiq edir.',
      experienceYears: 11,
      languages: ['Azərbaycan', 'Türk', 'İngilis'],
      conditions: ['Miqren', 'Nevropatiya', 'Başgicəllənmə'],
      procedures: ['Nevroloji müayinə', 'EEQ nəticələrinin şərhi'],
      departmentSlug: 'nevrologiya',
      serviceSlugs: ['nevroloji-konsultasiya'],
      profileImageId: media.get('doctor-elvin').id,
      featured: true,
      sortOrder: 2
    },
    {
      slug: 'dr-nigar-huseynli',
      firstName: 'Nigar',
      lastName: 'Hüseynli',
      title: 'Dr.',
      specialty: 'Pediatr',
      shortBio: 'Uşaq inkişafı və profilaktik pediatriya üzrə təcrübəli mütəxəssis.',
      bio: 'Dr. Nigar Hüseynli valideynlərlə açıq ünsiyyətə əsaslanan, uşağın fiziki və emosional inkişafını birlikdə nəzərə alan xidmət göstərir.',
      experienceYears: 9,
      languages: ['Azərbaycan', 'Rus'],
      conditions: ['Uşaq infeksiyaları', 'Allergik vəziyyətlər', 'İnkişaf izlənməsi'],
      procedures: ['Profilaktik baxış', 'Peyvənd planlaması', 'İnkişaf skrininqi'],
      departmentSlug: 'pediatriya',
      serviceSlugs: ['usaq-saglamliq-izlenmesi'],
      profileImageId: media.get('doctor-nigar').id,
      featured: true,
      sortOrder: 3
    }
  ];

  const doctors = new Map();
  for (const { departmentSlug, serviceSlugs, profileImageId, ...data } of doctorData) {
    const doctor = await prisma.doctor.upsert({
      where: { slug: data.slug },
      update: {
        ...data,
        departmentId: departments.get(departmentSlug).id,
        branchId: branch.id,
        services: {
          set: serviceSlugs.map((slug) => ({ id: services.get(slug).id }))
        },
        active: true,
        deletedAt: null
      },
      create: {
        ...data,
        profileImageId,
        departmentId: departments.get(departmentSlug).id,
        branchId: branch.id,
        services: {
          connect: serviceSlugs.map((slug) => ({ id: services.get(slug).id }))
        }
      }
    });
    doctors.set(data.slug, doctor);
  }

  const cardiologist = doctors.get('dr-aydan-memmedova');
  await prisma.doctorEducation.upsert({
    where: { id: `${cardiologist.id}-education` },
    update: {},
    create: {
      id: `${cardiologist.id}-education`,
      doctorId: cardiologist.id,
      institution: 'Azərbaycan Tibb Universiteti',
      degree: 'Müalicə işi',
      endYear: 2010
    }
  });
  await prisma.doctorSchedule.upsert({
    where: {
      doctorId_branchId_dayOfWeek_startTime: {
        doctorId: cardiologist.id,
        branchId: branch.id,
        dayOfWeek: 'MONDAY',
        startTime: '09:00'
      }
    },
    update: { endTime: '15:00', active: true },
    create: {
      doctorId: cardiologist.id,
      branchId: branch.id,
      dayOfWeek: 'MONDAY',
      startTime: '09:00',
      endTime: '15:00'
    }
  });

  const faqs = [
    {
      question: 'Hospital ilə necə əlaqə saxlaya bilərəm?',
      answer: '+994 12 450 32 91 nömrəsinə zəng edərək hospitalın əlaqə mərkəzi ilə danışa bilərsiniz.',
      category: 'Əlaqə',
      sortOrder: 1
    },
    {
      question: 'Müayinəyə gələrkən hansı sənədləri gətirməliyəm?',
      answer: 'Şəxsiyyət vəsiqənizi və varsa əvvəlki müayinə nəticələrinizi özünüzlə gətirin.',
      category: 'Müayinə',
      sortOrder: 2
    }
  ];
  for (const faq of faqs) {
    const existing = await prisma.fAQ.findFirst({
      where: { question: faq.question, departmentId: null, serviceId: null }
    });
    if (existing) {
      await prisma.fAQ.update({
        where: { id: existing.id },
        data: { ...faq, active: true, deletedAt: null }
      });
    } else {
      await prisma.fAQ.create({ data: faq });
    }
  }

  const testimonialQuote = 'Həkim müayinənin hər mərhələsini aydın izah etdi və nəticələrimi diqqətlə izləyən fərdi plan hazırladı.';
  const existingTestimonial = await prisma.testimonial.findFirst({
    where: { patientName: 'Leyla R.', quote: testimonialQuote }
  });
  if (!existingTestimonial) {
    await prisma.testimonial.create({
      data: {
        patientName: 'Leyla R.',
        patientTitle: 'Kardiologiya pasiyenti',
        quote: testimonialQuote,
        rating: 5,
        doctorId: cardiologist.id,
        departmentId: departments.get('kardiologiya').id,
        active: true,
        featured: true
      }
    });
  }

  const category = await prisma.articleCategory.upsert({
    where: { slug: 'profilaktika' },
    update: { name: 'Profilaktika', active: true, deletedAt: null },
    create: {
      slug: 'profilaktika',
      name: 'Profilaktika',
      description: 'Sağlamlığın qorunması və erkən diaqnostika üzrə tövsiyələr'
    }
  });

  await prisma.article.upsert({
    where: { slug: 'urek-saglamligini-qorumaq-ucun-5-addim' },
    update: {
      status: 'PUBLISHED',
      featured: true,
      deletedAt: null,
      categories: { set: [{ id: category.id }] }
    },
    create: {
      slug: 'urek-saglamligini-qorumaq-ucun-5-addim',
      title: 'Ürək sağlamlığını qorumaq üçün 5 gündəlik addım',
      excerpt: 'Kiçik, davamlı vərdişlərlə ürək-damar risklərini azaltmağın praktik yolları.',
      body: {
        version: 1,
        blocks: [
          {
            type: 'paragraph',
            text: 'Müntəzəm hərəkət, balanslı qidalanma və təzyiqin izlənməsi ürək sağlamlığının əsas dayaqlarıdır.'
          },
          {
            type: 'heading',
            level: 2,
            text: 'Davamlı dəyişiklik kiçik addımlardan başlayır'
          }
        ]
      },
      status: 'PUBLISHED',
      featured: true,
      readingMinutes: 4,
      publishedAt: new Date('2026-01-12T08:00:00.000Z'),
      categories: { connect: { id: category.id } }
    }
  });

  const pageDefinitions = [
    {
      slug: 'home',
      title: 'Ana səhifə',
      excerpt: 'Medicare Hospital-un əsas təqdimat səhifəsi.',
      template: 'HOME',
      sections: [
        ['hero', 'HERO', 'Hero təqdimatı', 'Sağlamlığınız üçün dəqiq qərarlar, qayğıkeş yanaşma', 'Sağlamlığınız bizim dəyərimizdir', 'Müasir diaqnostika və güvəndiyiniz həkim komandası bir məkanda.', { primaryLabel: 'Bizimlə əlaqə saxla', primaryHref: 'tel:+994124503291', secondaryLabel: 'Həkimləri tanı', secondaryHref: '/doctors' }],
        ['stats', 'STATISTICS', 'Etibar göstəriciləri', 'Rəqəmlərdə Medicare', 'Etibar', 'Həkim, pasiyent, şöbə və təcrübə göstəriciləri.', {}],
        ['assurance', 'FEATURE_GRID', 'Qayğı yolu', 'Müraciətdən aydın tibbi plana qədər', 'Qayğı yolu', 'Sualınızı dinləyir, sizi doğru mütəxəssisə yönləndirir və növbəti addımları sadə dildə planlaşdırırıq.', {}],
        ['services', 'COLLECTION', 'Əsas xidmətlər', 'Ehtiyacınıza uyğun tibbi həllər', 'Əsas xidmətlər', 'Profilaktik müayinədən mürəkkəb diaqnostikaya qədər hər xidmət vahid klinik standartla planlanır.', { collection: 'services', limit: 4, linkLabel: 'Bütün xidmətlər', linkHref: '/services' }],
        ['departments', 'COLLECTION', 'Tibbi şöbələr', 'Bir-birini tamamlayan ixtisaslar', 'Tibbi şöbələr', 'Komandalarımız mürəkkəb halları birlikdə dəyərləndirir, siz isə bütün prosesi bir mərkəzdə tamamlayırsınız.', { collection: 'departments', limit: 6, linkLabel: 'Bütün şöbələr', linkHref: '/departments' }],
        ['doctors', 'COLLECTION', 'Həkim komandamız', 'Bilik qədər ünsiyyətə də önəm verən mütəxəssislər', 'Həkim komandamız', 'Sizin sualınızı dinləyən, seçimlərinizi aydın izah edən və müalicə yolunu birlikdə quran həkimlər.', { collection: 'doctors', limit: 4, linkLabel: 'Bütün həkimlər', linkHref: '/doctors' }],
        ['leadership', 'COLLECTION', 'Rəhbərlik', 'Medicare-i gələcəyə aparan komanda', 'Rəhbərlik', 'Klinik keyfiyyət, pasiyent təhlükəsizliyi və davamlı inkişaf üçün çalışan rəhbərlik komandamızla tanış olun.', { collection: 'leadership', limit: 6 }],
        ['why-medicare', 'FEATURE_GRID', 'Niyə Medicare?', 'Tibbi dəqiqlik, insani diqqətlə birlikdə', 'Niyə Medicare?', 'Sistemimizi pasiyentin özünü məlumatlı, təhlükəsiz və rahat hiss etməsi üçün qurmuşuq.', {}],
        ['contact-cta', 'CTA', 'Telefon əlaqə çağırışı', 'Sağlamlığınızı təxirə salmayın', 'Əlaqə', 'Sizə uyğun şöbə və həkim haqqında məlumat üçün komandamıza zəng edin.', { primaryLabel: 'Bizimlə əlaqə saxla', primaryHref: 'tel:+994124503291' }],
        ['testimonials', 'COLLECTION', 'Pasiyent rəyləri', 'Etibar, hər görüşdə yenidən qazanılır', 'Pasiyent təcrübəsi', 'Pasiyentlərin paylaşdığı təcrübələr xidmətimizi daha yaxşı qurmağımıza kömək edir.', { collection: 'testimonials' }],
        ['articles', 'COLLECTION', 'Sağlamlıq jurnalı', 'Bilik, sağlam qərarın başlanğıcıdır', 'Sağlamlıq jurnalı', 'Həkimlərimizin gündəlik sağlamlıq və müasir tibbi yanaşmalar haqqında aydın izahları.', { collection: 'articles', limit: 3, linkLabel: 'Bütün məqalələr', linkHref: '/news' }],
        ['faq', 'FAQ', 'Tez-tez soruşulanlar', 'Qəbuldan əvvəl bilməli olduqlarınız', 'Tez-tez soruşulanlar', 'Ən çox verilən sualları topladıq. Axtardığınız cavab yoxdursa, komandamızla əlaqə saxlayın.', { limit: 5, linkLabel: 'Bütün suallara bax', linkHref: '/faq' }],
        ['contact', 'CONTACT', 'Ünvanımız', 'Medicare Hospital — Sabunçu', 'Ünvanımız', 'Əslidar Məmmədəliyev küçəsi 5 ünvanında həftənin hər günü, 24 saat xidmətinizdəyik.', {}]
      ]
    },
    {
      slug: 'about',
      title: 'Dəqiq tibbin mərkəzində insan dayanır',
      excerpt: '2017-ci ildən etibarən Sabunçuda klinik təcrübəni və insana yaxın tibbi xidməti bir araya gətiririk.',
      template: 'STANDARD',
      sections: [
        ['hero', 'HERO', 'Səhifə təqdimatı', 'Dəqiq tibbin mərkəzində insan dayanır', 'Medicare haqqında', '2017-ci ildən etibarən Sabunçuda klinik təcrübəni və insana yaxın tibbi xidməti bir araya gətiririk.', {}],
        ['story', 'RICH_TEXT', 'Bizim hekayəmiz', 'Ambulator klinikadan Medicare Hospital-a', 'Bizim hekayəmiz', 'Medicare bir sualla başladı: tibbi proses pasiyent üçün necə daha aydın, rahat və etibarlı ola bilər?', { text: 'Medicare Hospital Sabunçu qəsəbəsində çoxprofilli tibbi xidmət göstərir.\\n\\nBizim üçün inkişaf daha çox cihaz deyil; daha düzgün sual, daha dəqiq protokol və daha yaxşı pasiyent təcrübəsidir.' }],
        ['mission', 'FEATURE_GRID', 'Missiya və vizyon', 'Missiyamız və vizyonumuz', 'Məqsədimiz', 'Elmi əsaslı tibbi xidməti insana yaxın, aydın və əlçatan formada təqdim edirik.', {}],
        ['timeline', 'FEATURE_GRID', 'İnkişaf yolu', 'Hər mərhələdə daha güclü klinik sistem', 'İnkişaf yolu', 'İnfrastruktur böyüdükcə əsas prinsipimiz dəyişməyib: təhlükəsiz və izah edilən tibbi qayğı.', {}],
        ['values', 'FEATURE_GRID', 'Dəyərlərimiz', 'Hər qərara istiqamət verən prinsiplər', 'Dəyərlərimiz', 'Tibbi nəticə ilə pasiyent təcrübəsini bir-birindən ayırmırıq.', {}],
        ['infrastructure', 'MEDIA', 'İnfrastruktur', 'Dəqiqlik üçün düşünülmüş məkanlar', 'İnfrastruktur', 'Hər zona təhlükəsizlik, rahatlıq və klinik komandanın sürətli əməkdaşlığı üçün planlanıb.', { collection: 'gallery' }],
        ['certificates', 'COLLECTION', 'Keyfiyyət və etibar', 'Standartlarımız sənədləşir, hər gün tətbiq olunur', 'Keyfiyyət və etibar', 'Daxili audit, infeksiya nəzarəti və klinik təhlükəsizlik göstəriciləri davamlı izlənir.', { collection: 'certificates' }],
        ['contact-cta', 'CTA', 'Telefon əlaqə çağırışı', 'Medicare təcrübəsini yaxından tanıyın', 'Əlaqə', 'Hospitalımız, həkimlərimiz və sizə uyğun xidmət planı haqqında komandamızdan məlumat alın.', { primaryLabel: 'Bizimlə əlaqə saxla', primaryHref: 'tel:+994124503291' }]
      ]
    },
    {
      slug: 'doctors',
      title: 'Həkimlərimiz',
      excerpt: 'İxtisaslaşmış həkim komandasını kəşf edin.',
      template: 'STANDARD',
      sections: [['hero', 'HERO', 'Səhifə təqdimatı', 'Sizə uyğun mütəxəssisi tapın', 'Həkimlər', 'İxtisas, şöbə və təcrübəyə görə həkim komandamızla tanış olun.', {}], ['collection', 'COLLECTION', 'Həkim siyahısı', 'Həkim komandamız', 'Mütəxəssislər', 'Doğru tibbi qərar aydın ünsiyyətdən başlayır.', { collection: 'doctors' }], ['contact-cta', 'CTA', 'Telefon əlaqə çağırışı', 'Uyğun mütəxəssisi birlikdə seçək', 'Əlaqə', 'Komandamız ehtiyacınıza uyğun həkim haqqında telefonla məlumat verməyə hazırdır.', { primaryLabel: 'Bizimlə əlaqə saxla', primaryHref: 'tel:+994124503291' }]]
    },
    {
      slug: 'departments',
      title: 'Tibbi şöbələr',
      excerpt: 'Bir-birini tamamlayan klinik ixtisaslar.',
      template: 'STANDARD',
      sections: [['hero', 'HERO', 'Səhifə təqdimatı', 'Kompleks qayğı üçün ixtisaslaşmış şöbələr', 'Şöbələr', 'Ehtiyacınıza uyğun klinik istiqaməti seçin.', {}], ['collection', 'COLLECTION', 'Şöbə siyahısı', 'Tibbi istiqamətlər', 'Şöbələr', 'Komandalarımız diaqnostika və müalicəni vahid plan üzrə əlaqələndirir.', { collection: 'departments' }], ['contact-cta', 'CTA', 'Telefon əlaqə çağırışı', 'Doğru şöbədən başlamağa kömək edək', 'Əlaqə', 'Əlaqə komandamız sizi uyğun klinik istiqamətə yönləndirsin.', { primaryLabel: 'Bizimlə əlaqə saxla', primaryHref: 'tel:+994124503291' }]]
    },
    {
      slug: 'services',
      title: 'Tibbi xidmətlər',
      excerpt: 'Profilaktikadan diaqnostika və müalicəyə qədər.',
      template: 'STANDARD',
      sections: [['hero', 'HERO', 'Səhifə təqdimatı', 'Ehtiyacınıza uyğun tibbi xidmətlər', 'Xidmətlər', 'Müayinə və müalicə seçimlərini aydın təsvirlərlə kəşf edin.', {}], ['collection', 'COLLECTION', 'Xidmət siyahısı', 'Bütün xidmətlər', 'Xidmətlər', 'Hər xidmət klinik protokol və pasiyent ehtiyacına uyğun planlanır.', { collection: 'services' }], ['contact-cta', 'CTA', 'Telefon əlaqə çağırışı', 'Sizə uyğun xidməti birlikdə seçək', 'Əlaqə', 'Hazırlıq qaydaları və xidmət detalları haqqında komandamızdan telefonla məlumat alın.', { primaryLabel: 'Bizimlə əlaqə saxla', primaryHref: 'tel:+994124503291' }]]
    },
    {
      slug: 'news',
      title: 'Sağlamlıq jurnalı',
      excerpt: 'Həkimlərdən aydın və praktik tibbi məlumat.',
      template: 'STANDARD',
      sections: [['hero', 'HERO', 'Səhifə təqdimatı', 'Bilik sağlam qərarın başlanğıcıdır', 'Xəbərlər', 'Sağlamlıq, profilaktika və müasir tibbi yanaşmalar haqqında materiallar.', {}], ['collection', 'COLLECTION', 'Məqalə siyahısı', 'Son məqalələr', 'Sağlamlıq jurnalı', 'Həkimlərimizin hazırladığı faydalı materiallar.', { collection: 'articles' }]]
    },
    {
      slug: 'faq',
      title: 'Tez-tez verilən suallar',
      excerpt: 'Qəbul və xidmət prosesi üzrə aydın cavablar.',
      template: 'STANDARD',
      sections: [['hero', 'HERO', 'Səhifə təqdimatı', 'Sualınıza aydın cavab tapın', 'FAQ', 'Ən çox verilən sualları mövzular üzrə topladıq.', {}], ['questions', 'FAQ', 'Sual-cavab siyahısı', 'Tez-tez soruşulanlar', 'Suallar', 'Axtardığınız cavab burada yoxdursa, bizimlə əlaqə saxlayın.', {}], ['contact-cta', 'CTA', 'Telefon əlaqə çağırışı', 'Cavab tapmadınız?', 'Əlaqə', 'Əlaqə komandamız sizə kömək etməyə hazırdır.', { primaryLabel: 'Bizimlə əlaqə saxla', primaryHref: 'tel:+994124503291' }]]
    },
    {
      slug: 'contact',
      title: 'Bizimlə əlaqə',
      excerpt: 'Medicare komandası müraciətinizi cavablandırmağa hazırdır.',
      template: 'CONTACT',
      sections: [['hero', 'HERO', 'Səhifə təqdimatı', 'Sizin üçün buradayıq', 'Əlaqə', 'Qəbul, xidmət və filial məlumatları üçün komandamızla əlaqə saxlayın.', {}], ['details', 'CONTACT', 'Əlaqə məlumatları', 'Medicare Hospital — Sabunçu', 'Ünvan və telefon', 'Hər gün 24 saat xidmətinizdəyik.', {}], ['form', 'CUSTOM', 'Əlaqə forması', 'Bizə yazın', 'Mesaj', 'Sorğunuzu göndərin, komandamız sizinlə əlaqə saxlasın.', {}], ['map', 'CONTACT', 'Xəritə', 'Medicare Hospital-a necə gəlmək olar?', 'Ünvanımız', 'Hospital Sabunçu qəsəbəsində, 3 saylı Şəhər Klinik Xəstəxanasının qarşısında yerləşir.', {}], ['social', 'CUSTOM', 'Sosial media', 'Sağlamlıq yeniliklərini izləyin', 'Sosial mediada', 'Rəsmi Medicare hesablarımızı izləyin.', {}]]
    },
    {
      slug: 'privacy-policy',
      title: 'Məxfilik siyasəti',
      excerpt: 'Şəxsi məlumatların qorunması prinsipləri.',
      template: 'LEGAL',
      sections: [['intro', 'HERO', 'Məxfilik siyasəti', 'Məxfilik siyasəti', 'Hüquqi məlumat', 'Şəxsi və tibbi məlumatlarınıza ehtiyatla yanaşır, onları şəffaf prinsiplərlə işləyirik.', {}], ['collected-data', 'RICH_TEXT', 'Topladığımız məlumatlar', 'Topladığımız məlumatlar', '01', 'Əlaqə forması ilə təqdim etdiyiniz məlumatları yalnız sorğunuzu cavablandırmaq və sizinlə əlaqə saxlamaq üçün toplayırıq.', { text: 'Ad, soyad və əlaqə məlumatları.\\n\\nSorğunun mövzusu və mesajı.\\n\\nSorğuda könüllü paylaşdığınız digər məlumatlar.' }], ['data-use', 'RICH_TEXT', 'Məlumatlardan istifadə', 'Məlumatlardan istifadə', '02', 'Şəxsi məlumatlar sorğuların cavablandırılması, xidmət keyfiyyətinin yaxşılaşdırılması və qanuni öhdəliklərin icrası üçün işlənir.', { text: 'Marketinq məlumatı yalnız ayrıca razılıq verdiyiniz halda göndərilir.' }], ['protection', 'RICH_TEXT', 'Qorunma və saxlanma', 'Qorunma və saxlanma', '03', 'Məlumatlara giriş vəzifə və ehtiyac prinsipi ilə məhdudlaşdırılır.', { text: 'Məlumatlar məqsəd üçün tələb olunan və qanunla müəyyən edilən müddətdən artıq saxlanmır.' }], ['rights', 'RICH_TEXT', 'Hüquqlarınız', 'Hüquqlarınız', '04', 'Məlumatlarınıza çıxış, düzəliş və silinmə tələb edə bilərsiniz.', { text: 'Məlumatların surətini almaq.\\n\\nYanlış məlumatı düzəltdirmək.\\n\\nRazılığı geri götürmək.' }]]
    },
    {
      slug: 'terms',
      title: 'İstifadə şərtləri',
      excerpt: 'Saytdan istifadə və tibbi məlumatların xarakteri.',
      template: 'LEGAL',
      sections: [['intro', 'HERO', 'İstifadə şərtləri', 'İstifadə şərtləri', 'Hüquqi məlumat', 'Saytdan istifadə etməzdən və onlayn sorğu göndərməzdən əvvəl əsas şərtlərlə tanış olun.', {}], ['purpose', 'RICH_TEXT', 'Saytın məqsədi', 'Saytın məqsədi', '01', 'Bu sayt Medicare Hospital, onun həkimləri, şöbələri və xidmətləri haqqında məlumat vermək məqsədi daşıyır.', { text: 'Onlayn əlaqə forması hospital ilə ünsiyyəti asanlaşdırır.' }], ['medical-info', 'RICH_TEXT', 'Tibbi məlumatlar', 'Tibbi məlumatlar', '02', 'Saytdakı materiallar ümumi məlumat xarakterlidir.', { text: 'Onlar fərdi diaqnoz, müalicə təyinatı və ya təcili tibbi yardımın əvəzi deyil.\\n\\nHəyati təhlükəli vəziyyətdə 103 xidmətinə zəng edin.' }], ['contact-form', 'RICH_TEXT', 'Əlaqə forması', 'Əlaqə forması', '03', 'Onlayn formanın göndərilməsi tibbi məsləhət və ya xidmət təsdiqi sayılmır.', { text: 'Təcili olmayan suallar üçün əlaqə formundan və ya hospitalın telefon nömrəsindən istifadə edə bilərsiniz.' }], ['responsibility', 'RICH_TEXT', 'Məsuliyyət və dəyişikliklər', 'Məsuliyyət və dəyişikliklər', '04', 'Həkim qrafiki və xidmət imkanları dəyişə bilər.', { text: 'Son məlumatı əlaqə mərkəzi təsdiqləyir. Şərtlər qanunvericiliyə uyğun yenilənə bilər.' }]]
    },
    {
      slug: 'cookie-policy',
      title: 'Kuki siyasəti',
      excerpt: 'Saytda istifadə olunan kukilər haqqında məlumat.',
      template: 'LEGAL',
      sections: [['intro', 'HERO', 'Kuki siyasəti', 'Kuki siyasəti', 'Hüquqi məlumat', 'Saytın işləməsi və rahat istifadəsi üçün kukilərdən necə istifadə etdiyimizi izah edirik.', {}], ['what-is-cookie', 'RICH_TEXT', 'Kuki nədir?', 'Kuki nədir?', '01', 'Kuki saytın işləməsi və seçiminizin yadda saxlanması üçün brauzerinizdə saxlanan kiçik məlumat faylıdır.', { text: 'Kuki cihazınızdakı digər fayllara çıxış vermir.' }], ['required-cookies', 'RICH_TEXT', 'Zəruri kukilər', 'Zəruri kukilər', '02', 'Bu kukilər təhlükəsizlik, forma funksiyaları və seçimlərin yadda saxlanması üçün tələb olunur.', { text: 'Onları söndürmək saytın bəzi hissələrinin işləməsinə təsir edə bilər.' }], ['analytics', 'RICH_TEXT', 'Analitika kukiləri', 'Analitika kukiləri', '03', 'Analitika kukiləri saytdan istifadənin ümumi göstəricilərini anlamağa kömək edir.', { text: 'Onlar yalnız razılığınız olduqda aktivləşdirilir.' }], ['choices', 'RICH_TEXT', 'Seçimlərin idarə olunması', 'Seçimlərin idarə olunması', '04', 'İlk ziyarətdə yalnız zəruri və ya bütün icazə verilən kukiləri seçə bilərsiniz.', { text: 'Brauzer parametrlərindən saxlanmış kukiləri silmək mümkündür.' }]]
    }
  ];
  for (const { sections, ...page } of pageDefinitions) {
    const savedPage = await prisma.contentPage.upsert({
      where: { slug: page.slug },
      update: { ...page, status: 'PUBLISHED', deletedAt: null },
      create: {
        ...page,
        body: { version: 2, blocks: [] },
        status: 'PUBLISHED'
      }
    });
    for (const [key, type, label, title, eyebrow, description, content] of sections) {
      await prisma.pageSection.upsert({
        where: { pageId_key: { pageId: savedPage.id, key } },
        update: {
          type,
          label,
          locked: true,
          deletedAt: null
        },
        create: {
          pageId: savedPage.id,
          key,
          type,
          label,
          title,
          eyebrow,
          description,
          content,
          locked: true,
          sortOrder: sections.findIndex((section) => section[0] === key)
        }
      });
    }
  }

  const settings = [
    {
      key: 'contact',
      group: 'contact',
      label: 'Əlaqə məlumatları',
      value: {
        phone: '+994 12 450 32 91',
        phoneSecondary: '+994 12 450 07 17',
        phoneTertiary: '+994 12 450 53 58',
        whatsapp: '+994 55 215 97 44',
        mobileSecondary: '+994 55 511 69 89',
        email: 'official@medicarehospital.az',
        emergencyPhone: '103',
        address: 'Sabunçu qəsəbəsi, Əslidar Məmmədəliyev küçəsi 5, Bakı',
        workHours: 'Hər gün, 24 saat'
      }
    },
    {
      key: 'hospital.stats',
      group: 'general',
      label: 'Etibar göstəriciləri',
      value: {
        doctors: 48,
        departments: 12,
        annualPatients: 24000,
        experienceYears: 15
      }
    },
    {
      key: 'services.pricing',
      group: 'services',
      label: 'Public xidmət qiymətlərinin görünürlüğü',
      isPublic: true,
      value: { visible: true }
    }
  ];
  for (const setting of settings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: setting,
      create: setting
    });
  }

  const navigation = [
    ['Ana səhifə', '/', 1, 'HEADER'],
    ['Haqqımızda', '/about', 2, 'HEADER'],
    ['Şöbələr', '/departments', 3, 'HEADER'],
    ['Həkimlər', '/doctors', 4, 'HEADER'],
    ['Xidmətlər', '/services', 5, 'HEADER'],
    ['Xəbərlər', '/news', 6, 'HEADER'],
    ['Əlaqə', '/contact', 7, 'HEADER'],
    ['Haqqımızda', '/about', 1, 'FOOTER'],
    ['Həkimlər', '/doctors', 2, 'FOOTER'],
    ['Xidmətlər', '/services', 3, 'FOOTER'],
    ['Xəbərlər', '/news', 4, 'FOOTER'],
    ['FAQ', '/faq', 5, 'FOOTER'],
    ['Əlaqə', '/contact', 6, 'FOOTER']
  ];
  for (const [label, url, sortOrder, location] of navigation) {
    const existing = await prisma.navigationItem.findFirst({
      where: { label, location, parentId: null }
    });
    const data = {
      label,
      url,
      sortOrder,
      location,
      active: true,
      deletedAt: null
    };
    if (existing) {
      await prisma.navigationItem.update({ where: { id: existing.id }, data });
    } else {
      await prisma.navigationItem.create({ data });
    }
  }

  await prisma.homeSection.upsert({
    where: { key: 'hero' },
    update: { active: true, deletedAt: null },
    create: {
      key: 'hero',
      title: 'Sağlamlığınız üçün dəqiq qərarlar, qayğıkeş yanaşma',
      subtitle: 'Müasir diaqnostika və güvəndiyiniz həkim komandası bir məkanda.',
      content: {
        primaryAction: { label: 'Bizimlə əlaqə saxla', href: 'tel:+994124503291' },
        secondaryAction: { label: 'Həkimləri tanı', href: '/doctors' }
      },
      sortOrder: 1
    }
  });

  const existingSocial = await prisma.socialLink.findFirst({
    where: { platform: 'instagram' }
  });
  const socialData = {
    platform: 'instagram',
    label: 'Instagram',
    url: 'https://www.instagram.com/medicarehospital_/',
    sortOrder: 1,
    active: true
  };
  if (existingSocial) {
    await prisma.socialLink.update({
      where: { id: existingSocial.id },
      data: socialData
    });
  } else {
    await prisma.socialLink.create({
      data: socialData
    });
  }
}

async function main() {
  await seedRbac();
  await seedOptionalAdmin();
  await seedContent();
  process.stdout.write('Medicare database seed completed.\n');
}

main()
  .catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
