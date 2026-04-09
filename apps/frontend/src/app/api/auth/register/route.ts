import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

const ALLOWED_ROLES = ['admin', 'director', 'rep'] as const
type AllowedRole = (typeof ALLOWED_ROLES)[number]

function isAllowedRole(role: string): role is AllowedRole {
  return ALLOWED_ROLES.includes(role as AllowedRole)
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role = 'rep' } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    if (!isAllowedRole(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        email,
        password_hash: passwordHash,
        name,
        role,
      },
    })

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
