const express = require('express');
const {PrismaClient} = require('@prisma/client');

const router = express.Router();

const prisma = new PrismaClient();

router.get('/', async (req, res,next) => {
    try {

    const {
        page = 1,
        limit = 20,
        q,
        cui,
        judet,
        stare,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};
    if(cui)
    {
        where.cui = { contains: cui, mode: 'insensitive' };
    }
    if(q)
    {
        where.denumire = {contains: q, mode: 'insensitive'};
    }
    if(judet)
    {
        where.judet = {equals: judet, mode: 'insensitive'};
    }
    if(stare)
    {
        where.stare = {equals: stare, mode: 'insensitive'};
    }
    const [total, companies] = await Promise.all([
        prisma.company.count({ where }),
        prisma.company.findMany({
            where,
            skip,
            take,
            orderBy: { denumire: 'asc' },
        select: {
            id: true,
            cui: true,
            denumire: true,
            cod_inmatriculare: true,
            stare: true,
            judet: true,
            localitate: true,
            adresa: true,
            cod_caen: true,
            caen_denumire: true,
        },
    }),
]);
    res.json({
        data: companies,
        meta: {
            total,
            page: parseInt(page),
            limit: take,
            pages: Math.ceil(total / take),
        },
    });
}
catch (err) {
    next(err);
}
});

router.get('/:cui', async (req, res, next) => {
    try
    {
        const company = await prisma.company.findUnique({
            where: { cui: req.params.cui },
        });
        if (!company) {
            return res.status(404).json({ error: 'Company not found' })
        };
         res.json(company);
    }
    catch (err) {
        next(err);
    }
});
module.exports = router;

    