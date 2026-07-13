import prisma from '../prisma/client.js';

const include = { variants: { orderBy: { size: 'asc' } } };

export const productsRepository = {
  findAll:        (where)     => prisma.product.findMany({ where, include, orderBy: { createdAt: 'desc' } }),
  findById:       (id)        => prisma.product.findUnique({ where: { id }, include }),
  create:         (data)      => prisma.product.create({ data, include }),
  update:         (id, data)  => prisma.product.update({ where: { id }, data, include }),
  delete:         (id)        => prisma.product.delete({ where: { id } }),
  deleteVariants: (productId) => prisma.productVariant.deleteMany({ where: { productId } }),
};
