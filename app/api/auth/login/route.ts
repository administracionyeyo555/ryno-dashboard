import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Usuario y contrasena son requeridos' },
        { status: 400 }
      )
    }

    // Buscar usuario en la tabla admin_users
    const { data: user, error } = await supabase
      .from('admin_users')
      .select('id, username, password_hash, display_name, role')
      .eq('username', username)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: 'Credenciales invalidas' },
        { status: 401 }
      )
    }

    // Verificar contrasena (comparacion simple - el password_hash es texto plano en este caso)
    if (user.password_hash !== password) {
      return NextResponse.json(
        { success: false, error: 'Credenciales invalidas' },
        { status: 401 }
      )
    }

    // Login exitoso
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name || user.username,
        role: user.role || 'admin',
      },
    })
  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
