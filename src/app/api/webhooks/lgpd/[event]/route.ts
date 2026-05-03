import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createHmac, timingSafeEqual } from 'crypto';

function verifyHmac(body: Buffer, signature: string): boolean {
  const expected = createHmac('sha256', process.env.NUVEMSHOP_CLIENT_SECRET!)
    .update(body)
    .digest('base64');
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { event: string } }
) {
  const rawBody = Buffer.from(await request.arrayBuffer());
  const signature = request.headers.get('x-linkedstore-hmac-sha256') ?? '';

  if (!verifyHmac(rawBody, signature)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const payload = JSON.parse(rawBody.toString());
  const storeId = Number(payload.store_id);

  try {
    switch (params.event) {
      case 'store-redact': {
        await prisma.$transaction([
          prisma.block.deleteMany({
            where: { productConfig: { storeId } },
          }),
          prisma.productConfig.deleteMany({ where: { storeId } }),
          prisma.template.deleteMany({ where: { storeId } }),
          prisma.importJob.deleteMany({ where: { storeId } }),
          prisma.webhookEvent.deleteMany({ where: { storeId } }),
          prisma.store.update({
            where: { storeId },
            data: { accessToken: null, redactedAt: new Date() },
          }),
        ]);
        break;
      }

      case 'customer-redact': {
        // Este app não armazena dados de clientes diretamente
        // Registrar para auditoria
        await prisma.dataExportRequest.create({
          data: {
            storeId,
            customerId: payload.customer?.id ?? 0,
            status: 'completed',
            dataJson: JSON.stringify({ note: 'No customer data stored' }),
            processedAt: new Date(),
          },
        });
        break;
      }

      case 'data-request': {
        const customerId = payload.customer?.id ?? 0;
        // Este app não armazena dados pessoais de clientes
        await prisma.dataExportRequest.create({
          data: {
            storeId,
            customerId,
            status: 'completed',
            dataJson: JSON.stringify({ data: [], note: 'No personal data stored for this customer' }),
            processedAt: new Date(),
          },
        });
        break;
      }

      default:
        return new NextResponse('Unknown event', { status: 400 });
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error(`LGPD ${params.event} error:`, error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
