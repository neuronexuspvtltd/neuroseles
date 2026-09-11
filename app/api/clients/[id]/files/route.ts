import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, unlink, mkdir } from 'fs/promises';
import path from 'path';

const ALLOWED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.webp',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx',
  '.zip', '.txt', '.csv'
];

const DISALLOWED_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.sh', '.php', '.js', '.vbs', '.msi', '.ps1', '.py', '.cgi', '.dll'
];

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const contentType = req.headers.get('content-type') || '';
    let category = 'Requirements';
    let projectId: string | null = null;
    let originalName = '';
    let buffer: Buffer;
    let fileType = 'text/plain';
    let isTextEntry = false;

    if (contentType.includes('application/json')) {
      const body = await req.json();
      const textContent = body.textContent || '';
      const title = (body.title || 'Requirement Document').trim();
      category = body.category || 'Requirements';
      projectId = body.projectId || null;
      isTextEntry = true;

      if (!textContent.trim()) {
        return NextResponse.json({ error: 'Text content cannot be empty' }, { status: 400 });
      }

      originalName = title.endsWith('.txt') ? title : `${title}.txt`;
      buffer = Buffer.from(textContent, 'utf-8');
      fileType = 'text/plain';
    } else {
      const formData = await req.formData();
      const textContent = formData.get('textContent') as string | null;
      const title = formData.get('title') as string | null;
      const file = formData.get('file') as File | null;
      category = (formData.get('category') as string) || 'Other';
      projectId = (formData.get('projectId') as string) || null;

      if (textContent !== null && textContent !== undefined) {
        isTextEntry = true;
        const textTitle = (title || 'Requirement Document').trim();
        if (!textContent.trim()) {
          return NextResponse.json({ error: 'Text content cannot be empty' }, { status: 400 });
        }

        originalName = textTitle.endsWith('.txt') ? textTitle : `${textTitle}.txt`;
        buffer = Buffer.from(textContent, 'utf-8');
        fileType = 'text/plain';
      } else if (file) {
        originalName = file.name;
        const ext = path.extname(originalName).toLowerCase();

        if (DISALLOWED_EXTENSIONS.includes(ext)) {
          return NextResponse.json({
            error: `Executable file types (${ext}) are strictly blocked for security reasons.`,
          }, { status: 400 });
        }

        if (!ALLOWED_EXTENSIONS.includes(ext)) {
          return NextResponse.json({
            error: `Unsupported file type (${ext}). Allowed types: Images (JPG, PNG, WEBP), Documents (PDF, DOC, DOCX, XLS, XLSX), ZIP, TXT.`,
          }, { status: 400 });
        }

        // 25MB max size
        const MAX_SIZE = 25 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
          return NextResponse.json({ error: 'File size exceeds 25 MB limit' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        buffer = Buffer.from(bytes);
        fileType = file.type || ext.replace('.', '');
      } else {
        return NextResponse.json({ error: 'No file or text content provided' }, { status: 400 });
      }
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'client_files');
    await mkdir(uploadsDir, { recursive: true });

    const safeName = `${Date.now()}_${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(uploadsDir, safeName);
    await writeFile(filePath, buffer);

    const fileReference = `/uploads/client_files/${safeName}`;

    const clientFile = await prisma.clientFile.create({
      data: {
        clientId,
        projectId: projectId || null,
        fileName: originalName,
        fileReference,
        fileType,
        fileSize: buffer.length,
        category,
        uploadedBy: 'Sales Representative',
      },
    });

    await prisma.activity.create({
      data: {
        clientId,
        projectId: projectId || null,
        leadId: client.leadId,
        activityType: isTextEntry ? 'NOTE_ADDED' : 'FILE_UPLOADED',
        description: isTextEntry
          ? `Added text requirement "${originalName}" (${category})`
          : `Uploaded file "${originalName}" (${category})`,
      },
    });

    return NextResponse.json(clientFile, { status: 201 });
  } catch (error: any) {
    console.error('Error processing upload/text requirement:', error);
    return NextResponse.json({ error: 'Unable to save requirement file. Please try again.' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json({ error: 'fileId is required' }, { status: 400 });
    }

    const clientFile = await prisma.clientFile.findFirst({
      where: { id: fileId, clientId },
    });

    if (!clientFile) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Try deleting physical file
    try {
      const physicalPath = path.join(process.cwd(), 'public', clientFile.fileReference);
      await unlink(physicalPath);
    } catch (fsErr) {
      console.warn('Physical file delete warning:', fsErr);
    }

    await prisma.clientFile.delete({ where: { id: fileId } });

    return NextResponse.json({ success: true, message: 'File deleted' });
  } catch (error: any) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
