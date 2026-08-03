import { prisma } from '../config/prisma.js';

export const SERVICE_PRICING_SETTING_KEY = 'services.pricing';

export async function getServicePricingVisibility(client = prisma) {
  const setting = await client.siteSetting.findUnique({
    where: { key: SERVICE_PRICING_SETTING_KEY },
    select: { value: true, updatedAt: true }
  });
  const value = setting?.value;
  const visible =
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    value.visible !== false;

  return {
    visible,
    updatedAt: setting?.updatedAt || null
  };
}

export async function updateServicePricingVisibility(visible) {
  const setting = await prisma.siteSetting.upsert({
    where: { key: SERVICE_PRICING_SETTING_KEY },
    update: {
      value: { visible },
      group: 'services',
      label: 'Public xidmət qiymətlərinin görünürlüğü',
      isPublic: true
    },
    create: {
      key: SERVICE_PRICING_SETTING_KEY,
      value: { visible },
      group: 'services',
      label: 'Public xidmət qiymətlərinin görünürlüğü',
      isPublic: true
    },
    select: { value: true, updatedAt: true }
  });

  return {
    visible: setting.value?.visible !== false,
    updatedAt: setting.updatedAt
  };
}

export function applyPublicPricingVisibility(service, visible) {
  if (visible) return { ...service, pricingVisible: true };
  return {
    ...service,
    priceFrom: null,
    currency: undefined,
    priceItems: [],
    pricingVisible: false
  };
}
