import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;
    const body = await req.json();
    const { note, projectId } = body;

    if (!note || !note.trim()) {
      return NextResponse.json({ error: 'Note text is required' }, { status: 400 });
    }

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const clientNote = await prisma.clientNote.create({
      data: {
        clientId,
        projectId: projectId || null,
        note: note.trim(),
        createdBy: 'Sales Representative',
      },
    });

    await prisma.activity.create({
      data: {
        clientId,
        projectId: projectId || null,
        leadId: client.leadId,
        activityType: 'NOTE_ADDED',
        description: `Added Note: "${note.trim().length > 60 ? note.trim().slice(0, 60) + '...' : note.trim()}"`,
      },
    });

    return NextResponse.json(clientNote, { status: 201 });
  } catch (error: any) {
    console.error('Error adding note:', error);
    return NextResponse.json({ error: 'Failed to add note' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;
    const { searchParams } = new URL(req.url);
    const noteId = searchParams.get('noteId');

    if (!noteId) {
      return NextResponse.json({ error: 'noteId is required' }, { status: 400 });
    }

    await prisma.clientNote.deleteMany({
      where: { id: noteId, clientId },
    });

    return NextResponse.json({ success: true, message: 'Note deleted' });
  } catch (error: any) {
    console.error('Error deleting note:', error);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
