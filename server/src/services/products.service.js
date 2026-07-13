import { productsRepository } from '../repositories/products.repository.js';
import { cloudinary } from '../config/cloudinary.js';

function parseVariants(raw) {
  if (!raw) return [];
  return (typeof raw === 'string' ? JSON.parse(raw) : raw)
    .map(v => ({ size: v.size, price: Number(v.price) || 0, sku: v.sku || null }));
}

function cloudinaryPublicId(url) {
  // Extract "folder/filename" without extension from a Cloudinary URL.
  try {
    const parts = url.split('/');
    const upload = parts.indexOf('upload');
    return parts.slice(upload + 2).join('/').replace(/\.[^.]+$/, '');
  } catch { return null; }
}

export const productsService = {
  async list({ category, search } = {}) {
    const where = {};
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { nameEn: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
      ];
    }
    return productsRepository.findAll(where);
  },

  async getById(id) {
    const p = await productsRepository.findById(id);
    if (!p) throw Object.assign(new Error('Product not found'), { status: 404 });
    return p;
  },

  async create({ nameEn, nameAr, descEn, descAr, category, variants, imageUrl }) {
    if (!nameEn || !nameAr) throw Object.assign(new Error('nameEn and nameAr are required'), { status: 400 });
    return productsRepository.create({
      nameEn, nameAr,
      descEn: descEn || null, descAr: descAr || null,
      category: category || null, imageUrl: imageUrl || null,
      variants: { create: parseVariants(variants) },
    });
  },

  async update(id, { nameEn, nameAr, descEn, descAr, category, variants, imageUrl }) {
    const existing = await productsService.getById(id);

    // Delete old Cloudinary image if replaced
    if (imageUrl && existing.imageUrl && existing.imageUrl !== imageUrl) {
      const pid = cloudinaryPublicId(existing.imageUrl);
      if (pid) cloudinary.uploader.destroy(pid).catch(() => {});
    }

    const data = {};
    if (nameEn    !== undefined) data.nameEn   = nameEn;
    if (nameAr    !== undefined) data.nameAr   = nameAr;
    if (descEn    !== undefined) data.descEn   = descEn || null;
    if (descAr    !== undefined) data.descAr   = descAr || null;
    if (category  !== undefined) data.category = category || null;
    if (imageUrl  !== undefined) data.imageUrl = imageUrl || null;

    if (variants !== undefined) {
      await productsRepository.deleteVariants(id);
      data.variants = { create: parseVariants(variants) };
    }

    return productsRepository.update(id, data);
  },

  async delete(id) {
    const p = await productsService.getById(id);
    if (p.imageUrl) {
      const pid = cloudinaryPublicId(p.imageUrl);
      if (pid) cloudinary.uploader.destroy(pid).catch(() => {});
    }
    return productsRepository.delete(id);
  },
};
