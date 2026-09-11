import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;
    const body = await req.json();
    const {
      name,
      type,
      description,
      requirements,
      startDate,
      expectedCompletionDate,
      status,
      notes,
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Project Name is required.' }, { status: 400 });
    }

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const project = await prisma.project.create({
      data: {
        clientId,
        name: name.trim(),
        type: type ? type.trim() : 'Website',
        description: description ? description.trim() : null,
        requirements: requirements ? requirements.trim() : null,
        startDate: startDate || new Date().toISOString().split('T')[0],
        expectedCompletionDate: expectedCompletionDate || null,
        status: status || 'IN_PROGRESS',
        notes: notes ? notes.trim() : null,
        requirementHistories: requirements ? {
          create: {
            requirements: requirements.trim(),
            changeDescription: 'Initial project requirements set on creation',
          },
        } : undefined,
      },
      include: {
        requirementHistories: true,
      },
    });

    await prisma.activity.create({
      data: {
        clientId,
        projectId: project.id,
        leadId: client.leadId,
        activityType: 'PROJECT_CREATED',
        description: `Project "${project.name}" created for ${client.name}`,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
