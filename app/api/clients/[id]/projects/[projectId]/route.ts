import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; projectId: string }> }
) {
  try {
    const { id: clientId, projectId } = await params;

    const project = await prisma.project.findFirst({
      where: { id: projectId, clientId },
      include: {
        client: {
          select: { id: true, name: true, company: true, mobile: true, email: true, leadId: true },
        },
        requirementHistories: { orderBy: { createdAt: 'desc' } },
        files: { orderBy: { createdAt: 'desc' } },
        projectNotes: { orderBy: { createdAt: 'desc' } },
        activities: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error: any) {
    console.error('Error fetching project detail:', error);
    return NextResponse.json({ error: 'Failed to fetch project detail' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; projectId: string }> }
) {
  try {
    const { id: clientId, projectId } = await params;
    const body = await req.json();
    const {
      name,
      type,
      description,
      requirements,
      changeDescription,
      status,
      startDate,
      expectedCompletionDate,
      notes,
    } = body;

    const existingProject = await prisma.project.findFirst({
      where: { id: projectId, clientId },
      include: { client: true },
    });

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (type) updateData.type = type.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (status) updateData.status = status;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (expectedCompletionDate !== undefined) updateData.expectedCompletionDate = expectedCompletionDate;
    if (notes !== undefined) updateData.notes = notes ? notes.trim() : null;

    let requirementsChanged = false;
    if (requirements !== undefined && requirements.trim() !== (existingProject.requirements || '')) {
      requirementsChanged = true;
      updateData.requirements = requirements.trim();
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
    });

    // Handle Requirements History if updated
    if (requirementsChanged) {
      const historyEntry = await prisma.requirementHistory.create({
        data: {
          projectId,
          requirements: requirements.trim(),
          changeDescription: changeDescription ? changeDescription.trim() : 'Updated project requirements',
        },
      });

      await prisma.activity.create({
        data: {
          clientId,
          projectId,
          leadId: existingProject.client.leadId,
          activityType: 'REQUIREMENT_UPDATED',
          description: `Requirements updated for project "${existingProject.name}"${changeDescription ? `: ${changeDescription}` : ''}`,
        },
      });
    }

    if (status && status !== existingProject.status) {
      await prisma.activity.create({
        data: {
          clientId,
          projectId,
          leadId: existingProject.client.leadId,
          activityType: 'PROJECT_STATUS_CHANGED',
          description: `Project "${existingProject.name}" status changed from ${existingProject.status} to ${status}`,
        },
      });
    }

    return NextResponse.json(updatedProject);
  } catch (error: any) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; projectId: string }> }
) {
  try {
    const { id: clientId, projectId } = await params;

    const project = await prisma.project.findFirst({
      where: { id: projectId, clientId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    await prisma.project.delete({ where: { id: projectId } });

    return NextResponse.json({ success: true, message: 'Project deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
