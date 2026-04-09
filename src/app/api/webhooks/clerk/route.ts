export const dynamic = 'force-dynamic';
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Role } from '@prisma/client';

interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    email_addresses: Array<{
      email_address: string;
      id: string;
    }>;
    first_name: string | null;
    last_name: string | null;
    public_metadata: {
      role?: string;
    };
  };
}

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('CLERK_WEBHOOK_SECRET is not set');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  // Get headers for verification
  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: 'Missing svix headers' },
      { status: 400 }
    );
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Verify webhook signature
  const wh = new Webhook(WEBHOOK_SECRET);
  let event: ClerkWebhookEvent;

  try {
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkWebhookEvent;
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook verification failed' },
      { status: 400 }
    );
  }

  // Handle events
  const { type, data } = event;

  if (type === 'user.created') {
    const email = data.email_addresses[0]?.email_address;
    const name = [data.first_name, data.last_name].filter(Boolean).join(' ') || null;
    const role = (data.public_metadata?.role as Role) || 'CANDIDATE';

    if (!email) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 });
    }

    try {
      await prisma.user.create({
        data: {
          clerkId: data.id,
          email,
          name,
          role,
        },
      });
      console.log(`[Webhook] User created: ${email} with role ${role}`);
    } catch (error) {
      console.error('[Webhook] Failed to create user:', error);
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
  }

  if (type === 'user.updated') {
    const email = data.email_addresses[0]?.email_address;
    const name = [data.first_name, data.last_name].filter(Boolean).join(' ') || null;
    const role = (data.public_metadata?.role as Role) || 'CANDIDATE';

    try {
      await prisma.user.upsert({
        where: { clerkId: data.id },
        update: { email, name, role },
        create: {
          clerkId: data.id,
          email: email || '',
          name,
          role,
        },
      });
      console.log(`[Webhook] User updated: ${email} → role ${role}`);
    } catch (error) {
      console.error('[Webhook] Failed to update user:', error);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
