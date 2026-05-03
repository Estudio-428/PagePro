import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/session';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const TemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  blocks: z.array(z.record(z.unknown())),
  isDefault: z.boolean().optional(),
});

// GET /api/templates
export async function GET(request: NextRequest) {
  try {
    const storeId = await requireAuth();
    const templateId = request.nextUrl.searchParams.get('id');

    if (templateId) {
      const template = await prisma.template.findFirst({
        where: { id: Number(templateId), storeId },
        include: {
          products: { select: { nuvemshopProductId: true, productName: true, appliedAt: true } },
          rules: { where: { isActive: true } },
        },
      });
      if (!template) return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 });
      return NextResponse.json({ template });
    }

    const templates = await prisma.template.findMany({
      where: { storeId, isActive: true },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
      include: { _count: { select: { products: true } } },
    });

    return NextResponse.json({ templates });
  } catch (error: unknown) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST /api/templates — criar
export async function POST(request: NextRequest) {
  try {
    const storeId = await requireAuth();
    const body = await request.json();
    const data = TemplateSchema.parse(body);

    const template = await prisma.template.create({
      data: { ...data, storeId, blocks: data.blocks as Prisma.InputJsonValue },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error: unknown) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro ao criar template' }, { status: 500 });
  }
}

// PUT /api/templates?id=123 — atualizar
export async function PUT(request: NextRequest) {
  try {
    const storeId = await requireAuth();
    const templateId = Number(request.nextUrl.searchParams.get('id'));
    if (!templateId) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 });

    const body = await request.json();
    const data = TemplateSchema.partial().parse(body);

    const existing = await prisma.template.findFirst({ where: { id: templateId, storeId } });
    if (!existing) return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 });

    const template = await prisma.template.update({
      where: { id: templateId },
      data: { ...data, blocks: data.blocks ? (data.blocks as Prisma.InputJsonValue) : undefined, updatedAt: new Date() },
    });

    return NextResponse.json({ template });
  } catch (error: unknown) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Erro ao atualizar template' }, { status: 500 });
  }
}

// DELETE /api/templates?id=123 — desativar (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const storeId = await requireAuth();
    const templateId = Number(request.nextUrl.searchParams.get('id'));
    if (!templateId) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 });

    const existing = await prisma.template.findFirst({ where: { id: templateId, storeId } });
    if (!existing) return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 });

    await prisma.template.update({
      where: { id: templateId },
      data: { isActive: false, updatedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Erro ao remover template' }, { status: 500 });
  }
}
