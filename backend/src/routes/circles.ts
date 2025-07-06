import express from 'express';
import { PrismaClient } from '@prisma/client';
import { generateCircleSlug, generateUniqueSlug } from '../utils/slug';

const router = express.Router();
const prisma = new PrismaClient();

// CORS middleware for circles routes
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});


// Get all circles (public ones for non-members, all for members)
router.get('/', async (req, res) => {
  try {
    const userId = (req.user as any)?.id;
    
    if (!userId) {
      // Not logged in - only show public circles
      const circles = await prisma.circle.findMany({
        where: { isPublic: true },
        include: {
          creator: { select: { id: true, username: true } },
          _count: { select: { members: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      return res.json(circles);
    }

    // Logged in - show public circles + circles user is member of
    const circles = await prisma.circle.findMany({
      where: {
        OR: [
          { isPublic: true },
          { members: { some: { userId } } }
        ]
      },
      include: {
        creator: { select: { id: true, username: true } },
        _count: { select: { members: true } },
        members: {
          where: { userId },
          select: { joinedAt: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(circles);
  } catch (error) {
    console.error('Error fetching circles:', error);
    res.status(500).json({ error: 'Failed to fetch circles' });
  }
});

// Get circle by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req.user as any)?.id;

    const circle = await prisma.circle.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, username: true } },
        members: {
          include: {
            user: { select: { id: true, username: true } }
          },
          orderBy: { joinedAt: 'asc' }
        },
        tournaments: {
          include: {
            tournament: {
              include: {
                uploader: { select: { id: true, username: true } }
              }
            }
          },
          orderBy: { sharedAt: 'desc' }
        }
      }
    });

    if (!circle) {
      return res.status(404).json({ error: 'Circle not found' });
    }

    // Check access permissions
    const isMember = circle.members.some(member => member.userId === userId);
    const isCreator = circle.createdBy === userId;

    if (!circle.isPublic && !isMember && !isCreator) {
      return res.status(403).json({ error: 'Access denied to private circle' });
    }

    res.json(circle);
  } catch (error) {
    console.error('Error fetching circle:', error);
    res.status(500).json({ error: 'Failed to fetch circle' });
  }
});

// Create new circle
router.post('/', async (req, res) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { name, description, isPublic } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Circle name is required' });
    }

    // Generate unique slug
    const baseSlug = generateCircleSlug(name.trim());
    const existingCircles = await prisma.circle.findMany({
      select: { id: true }
    });
    const existingSlugs = existingCircles.map(c => c.id);
    const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs);

    const circle = await prisma.circle.create({
      data: {
        id: uniqueSlug,
        name: name.trim(),
        description: description?.trim() || null,
        isPublic: Boolean(isPublic),
        createdBy: userId,
        members: {
          create: {
            userId,
            role: 'ADMIN', // Creator is automatically admin
            joinedAt: new Date()
          }
        }
      },
      include: {
        creator: { select: { id: true, username: true } },
        _count: { select: { members: true } }
      }
    });

    res.status(201).json(circle);
  } catch (error) {
    console.error('Error creating circle:', error);
    res.status(500).json({ error: 'Failed to create circle' });
  }
});

// Update circle
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req.user as any)?.id;
    const { name, description, isPublic } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user is creator
    const existingCircle = await prisma.circle.findUnique({
      where: { id },
      select: { createdBy: true }
    });

    if (!existingCircle) {
      return res.status(404).json({ error: 'Circle not found' });
    }

    if (existingCircle.createdBy !== userId) {
      return res.status(403).json({ error: 'Only circle creator can update circle' });
    }

    const circle = await prisma.circle.update({
      where: { id },
      data: {
        name: name?.trim(),
        description: description?.trim() || null,
        isPublic: Boolean(isPublic)
      },
      include: {
        creator: { select: { id: true, username: true } },
        _count: { select: { members: true } }
      }
    });

    res.json(circle);
  } catch (error) {
    console.error('Error updating circle:', error);
    res.status(500).json({ error: 'Failed to update circle' });
  }
});

// Delete circle
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user is creator
    const existingCircle = await prisma.circle.findUnique({
      where: { id },
      select: { createdBy: true }
    });

    if (!existingCircle) {
      return res.status(404).json({ error: 'Circle not found' });
    }

    if (existingCircle.createdBy !== userId) {
      return res.status(403).json({ error: 'Only circle creator can delete circle' });
    }

    await prisma.circle.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting circle:', error);
    res.status(500).json({ error: 'Failed to delete circle' });
  }
});

// Join circle
router.post('/:id/join', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const circle = await prisma.circle.findUnique({
      where: { id },
      include: {
        members: { where: { userId } }
      }
    });

    if (!circle) {
      return res.status(404).json({ error: 'Circle not found' });
    }

    if (!circle.isPublic) {
      return res.status(403).json({ error: 'Cannot join private circle' });
    }

    if (circle.members.length > 0) {
      return res.status(400).json({ error: 'Already a member of this circle' });
    }

    await prisma.circleMember.create({
      data: {
        circleId: id,
        userId,
        role: 'MEMBER', // New members start as regular members
        joinedAt: new Date()
      }
    });

    res.status(201).json({ message: 'Successfully joined circle' });
  } catch (error) {
    console.error('Error joining circle:', error);
    res.status(500).json({ error: 'Failed to join circle' });
  }
});

// Leave circle
router.post('/:id/leave', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const circle = await prisma.circle.findUnique({
      where: { id },
      select: { createdBy: true }
    });

    if (!circle) {
      return res.status(404).json({ error: 'Circle not found' });
    }

    if (circle.createdBy === userId) {
      return res.status(400).json({ error: 'Circle creator cannot leave circle' });
    }

    const deletedMember = await prisma.circleMember.deleteMany({
      where: {
        circleId: id,
        userId
      }
    });

    if (deletedMember.count === 0) {
      return res.status(400).json({ error: 'Not a member of this circle' });
    }

    res.json({ message: 'Successfully left circle' });
  } catch (error) {
    console.error('Error leaving circle:', error);
    res.status(500).json({ error: 'Failed to leave circle' });
  }
});

// Remove member (creator only)
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const { id, userId: targetUserId } = req.params;
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const circle = await prisma.circle.findUnique({
      where: { id },
      select: { createdBy: true }
    });

    if (!circle) {
      return res.status(404).json({ error: 'Circle not found' });
    }

    if (circle.createdBy !== userId) {
      return res.status(403).json({ error: 'Only circle creator can remove members' });
    }

    if (targetUserId === userId) {
      return res.status(400).json({ error: 'Cannot remove yourself from circle' });
    }

    const deletedMember = await prisma.circleMember.deleteMany({
      where: {
        circleId: id,
        userId: targetUserId
      }
    });

    if (deletedMember.count === 0) {
      return res.status(400).json({ error: 'User is not a member of this circle' });
    }

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// Get tournament within circle context
router.get('/:id/tournaments/:tournamentId', async (req, res) => {
  try {
    const { id: circleId, tournamentId } = req.params;
    const userId = (req.user as any)?.id;

    // Check if circle exists and user has access
    const circle = await prisma.circle.findUnique({
      where: { id: circleId },
      include: {
        members: { where: { userId } }
      }
    });

    if (!circle) {
      return res.status(404).json({ error: 'Circle not found' });
    }

    // Check access permissions
    const isMember = circle.members.length > 0;
    const isCreator = circle.createdBy === userId;

    if (!circle.isPublic && !isMember && !isCreator) {
      return res.status(403).json({ error: 'Access denied to private circle' });
    }

    // Check if tournament is shared with this circle
    const tournamentCircle = await prisma.tournamentCircle.findUnique({
      where: {
        tournamentId_circleId: {
          tournamentId,
          circleId
        }
      }
    });

    if (!tournamentCircle) {
      return res.status(404).json({ error: 'Tournament not found in this circle' });
    }

    // Get tournament with comments filtered by circle
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        uploader: { select: { id: true, username: true } },
        circles: {
          include: {
            circle: { select: { id: true, name: true } }
          }
        },
        comments: {
          where: { circleId },
          include: {
            user: { select: { id: true, username: true } },
            circle: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    res.json(tournament);
  } catch (error) {
    console.error('Error fetching tournament:', error);
    res.status(500).json({ error: 'Failed to fetch tournament' });
  }
});

// Create comment for tournament within circle context
router.post('/:id/tournaments/:tournamentId/comments', async (req, res) => {
  try {
    const { id: circleId, tournamentId } = req.params;
    const { content, boardNumber, parentCommentId } = req.body;
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    if (!boardNumber || boardNumber < 1) {
      return res.status(400).json({ error: 'Valid board number is required' });
    }

    // Check if circle exists and user has access
    const circle = await prisma.circle.findUnique({
      where: { id: circleId },
      include: {
        members: { where: { userId } }
      }
    });

    if (!circle) {
      return res.status(404).json({ error: 'Circle not found' });
    }

    // Check access permissions
    const isMember = circle.members.length > 0;
    const isCreator = circle.createdBy === userId;

    if (!circle.isPublic && !isMember && !isCreator) {
      return res.status(403).json({ error: 'Access denied to private circle' });
    }

    // Check if tournament is shared with this circle
    const tournamentCircle = await prisma.tournamentCircle.findUnique({
      where: {
        tournamentId_circleId: {
          tournamentId,
          circleId
        }
      }
    });

    if (!tournamentCircle) {
      return res.status(404).json({ error: 'Tournament not found in this circle' });
    }

    // Validate parent comment if specified
    if (parentCommentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentCommentId },
        select: { tournamentId: true, circleId: true, boardNumber: true }
      });

      if (!parentComment || 
          parentComment.tournamentId !== tournamentId || 
          parentComment.circleId !== circleId ||
          parentComment.boardNumber !== boardNumber) {
        return res.status(400).json({ error: 'Invalid parent comment' });
      }
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        tournamentId,
        boardNumber: parseInt(boardNumber),
        userId,
        circleId,
        parentCommentId: parentCommentId || null
      },
      include: {
        user: { select: { id: true, username: true } },
        circle: { select: { id: true, name: true } }
      }
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// Update comment
router.put('/:id/tournaments/:tournamentId/comments/:commentId', async (req, res) => {
  try {
    const { id: circleId, tournamentId, commentId } = req.params;
    const { content } = req.body;
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    // Check if comment exists and belongs to user
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { userId: true, tournamentId: true, circleId: true }
    });

    if (!existingComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (existingComment.userId !== userId) {
      return res.status(403).json({ error: 'Can only edit your own comments' });
    }

    if (existingComment.tournamentId !== tournamentId || existingComment.circleId !== circleId) {
      return res.status(400).json({ error: 'Comment does not belong to this tournament/circle' });
    }

    // Update comment
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { content: content.trim() },
      include: {
        user: { select: { id: true, username: true } },
        circle: { select: { id: true, name: true } }
      }
    });

    res.json(updatedComment);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

// Delete comment
router.delete('/:id/tournaments/:tournamentId/comments/:commentId', async (req, res) => {
  try {
    const { id: circleId, tournamentId, commentId } = req.params;
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if comment exists and belongs to user or circle creator
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { userId: true, tournamentId: true, circleId: true }
    });

    if (!existingComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (existingComment.tournamentId !== tournamentId || existingComment.circleId !== circleId) {
      return res.status(400).json({ error: 'Comment does not belong to this tournament/circle' });
    }

    // Check if user can delete (comment author or circle creator)
    const circle = await prisma.circle.findUnique({
      where: { id: circleId },
      select: { createdBy: true }
    });

    const canDelete = existingComment.userId === userId || circle?.createdBy === userId;

    if (!canDelete) {
      return res.status(403).json({ error: 'Can only delete your own comments or as circle creator' });
    }

    // Delete comment (this will also delete any child comments due to cascade)
    await prisma.comment.delete({
      where: { id: commentId }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// Update member role (creator only)
router.put('/:id/members/:userId/role', async (req, res) => {
  try {
    const { id, userId: targetUserId } = req.params;
    const { role } = req.body;
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!role || !['MEMBER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be MEMBER or ADMIN' });
    }

    // Check if user is circle creator
    const circle = await prisma.circle.findUnique({
      where: { id },
      select: { createdBy: true }
    });

    if (!circle) {
      return res.status(404).json({ error: 'Circle not found' });
    }

    if (circle.createdBy !== userId) {
      return res.status(403).json({ error: 'Only circle creator can manage member roles' });
    }

    if (targetUserId === userId) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    // Update member role
    const updatedMember = await prisma.circleMember.update({
      where: {
        circleId_userId: {
          circleId: id,
          userId: targetUserId
        }
      },
      data: { role },
      include: {
        user: { select: { id: true, username: true } }
      }
    });

    res.json(updatedMember);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Member not found in this circle' });
    }
    console.error('Error updating member role:', error);
    res.status(500).json({ error: 'Failed to update member role' });
  }
});

// Send invitation to join private circle (creator/admin only)
router.post('/:id/invite', async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    // Check if user is creator or admin
    const circle = await prisma.circle.findUnique({
      where: { id },
      include: {
        members: {
          where: { userId }
        }
      }
    });

    if (!circle) {
      return res.status(404).json({ error: 'Circle not found' });
    }

    const isCreator = circle.createdBy === userId;
    const isAdmin = circle.members.some(m => m.role === 'ADMIN');

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ error: 'Only circle creator or admin can send invitations' });
    }

    // Check if email is already a member
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: {
        circleMembers: {
          where: { circleId: id }
        }
      }
    });

    if (existingUser && existingUser.circleMembers.length > 0) {
      return res.status(400).json({ error: 'User is already a member of this circle' });
    }

    // Check if invitation already exists
    const existingInvitation = await prisma.circleInvitation.findUnique({
      where: {
        circleId_invitedEmail: {
          circleId: id,
          invitedEmail: email
        }
      }
    });

    if (existingInvitation && existingInvitation.status === 'PENDING') {
      return res.status(400).json({ error: 'Invitation already sent to this email' });
    }

    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation
    const invitation = await prisma.circleInvitation.create({
      data: {
        circleId: id,
        invitedEmail: email,
        invitedUserId: existingUser?.id || null,
        invitedBy: userId,
        expiresAt
      },
      include: {
        circle: { select: { id: true, name: true } },
        inviter: { select: { id: true, username: true } }
      }
    });

    res.status(201).json(invitation);
  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
});

// Get pending invitations for a circle (creator/admin only)
router.get('/:id/invitations', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user is creator or admin
    const circle = await prisma.circle.findUnique({
      where: { id },
      include: {
        members: {
          where: { userId }
        }
      }
    });

    if (!circle) {
      return res.status(404).json({ error: 'Circle not found' });
    }

    const isCreator = circle.createdBy === userId;
    const isAdmin = circle.members.some(m => m.role === 'ADMIN');

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ error: 'Only circle creator or admin can view invitations' });
    }

    // Get pending invitations
    const invitations = await prisma.circleInvitation.findMany({
      where: {
        circleId: id,
        status: 'PENDING',
        expiresAt: { gte: new Date() }
      },
      include: {
        inviter: { select: { id: true, username: true } },
        invitedUser: { select: { id: true, username: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(invitations);
  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({ error: 'Failed to fetch invitations' });
  }
});

// Accept invitation to join circle
router.post('/invitations/:invitationId/accept', async (req, res) => {
  try {
    const { invitationId } = req.params;
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get invitation
    const invitation = await prisma.circleInvitation.findUnique({
      where: { id: invitationId },
      include: {
        circle: { select: { id: true, name: true } }
      }
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    if (invitation.invitedEmail !== user.email) {
      return res.status(403).json({ error: 'This invitation is not for you' });
    }

    if (invitation.status !== 'PENDING') {
      return res.status(400).json({ error: 'Invitation has already been processed' });
    }

    if (invitation.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    // Check if already a member
    const existingMember = await prisma.circleMember.findUnique({
      where: {
        circleId_userId: {
          circleId: invitation.circleId,
          userId
        }
      }
    });

    if (existingMember) {
      return res.status(400).json({ error: 'You are already a member of this circle' });
    }

    // Accept invitation and add to circle
    await prisma.$transaction([
      prisma.circleInvitation.update({
        where: { id: invitationId },
        data: { status: 'ACCEPTED' }
      }),
      prisma.circleMember.create({
        data: {
          circleId: invitation.circleId,
          userId,
          role: 'MEMBER'
        }
      })
    ]);

    res.json({ message: `Successfully joined ${invitation.circle.name}` });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
});

// Get user's pending invitations
router.get('/invitations/pending', async (req, res) => {
  try {
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get pending invitations for this user
    const invitations = await prisma.circleInvitation.findMany({
      where: {
        invitedEmail: user.email,
        status: 'PENDING',
        expiresAt: { gte: new Date() }
      },
      include: {
        circle: { select: { id: true, name: true, description: true } },
        inviter: { select: { id: true, username: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(invitations);
  } catch (error) {
    console.error('Error fetching user invitations:', error);
    res.status(500).json({ error: 'Failed to fetch invitations' });
  }
});

export default router;