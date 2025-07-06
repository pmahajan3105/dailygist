// src/utils/cn.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// src/components/ui/button.tsx
import * as React from 'react'
import { cn } from '@/utils/cn'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-gray-900 text-white hover:bg-gray-800': variant === 'default',
            'border border-gray-300 bg-white hover:bg-gray-50': variant === 'outline',
            'hover:bg-gray-100': variant === 'ghost',
          },
          {
            'h-10 px-4 py-2 text-sm': size === 'default',
            'h-9 px-3 text-sm': size === 'sm',
            'h-11 px-8 text-base': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }

// src/components/ui/loading.tsx
import { Loader2 } from 'lucide-react'

export function Loading() {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  )
}

// src/components/ui/error.tsx
interface ErrorProps {
  message: string
  retry?: () => void
}

export function Error({ message, retry }: ErrorProps) {
  return (
    <div className="rounded-lg bg-red-50 p-4">
      <p className="text-sm text-red-800">{message}</p>
      {retry && (
        <button
          onClick={retry}
          className="mt-2 text-sm font-medium text-red-800 underline"
        >
          Try again
        </button>
      )}
    </div>
  )
}

// src/lib/email/ingest.ts
import { createClient } from '@supabase/supabase-js'
import { extractArticleContent } from '../processors/extractor'

export async function processIncomingEmail(email: {
  from: string
  to: string
  subject: string
  html?: string
  text?: string
  date: string
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  // Extract user from email address
  const userAlias = email.to.split('@')[0]
  const userId = await getUserIdFromAlias(userAlias, supabase)
  
  if (!userId) {
    console.error('No user found for email:', email.to)
    return
  }

  // Get newsletter source
  const { data: source } = await supabase
    .from('sources')
    .select('*')
    .eq('user_id', userId)
    .eq('source_type', 'newsletter')
    .single()

  if (!source) {
    // Create newsletter source
    const { data: newSource } = await supabase
      .from('sources')
      .insert({
        user_id: userId,
        source_type: 'newsletter',
        name: 'Email Newsletters',
        config: {},
        is_active: true,
      })
      .select()
      .single()
    
    if (!newSource) return
  }

  // Extract links from email
  const links = extractLinksFromEmail(email.html || email.text || '')
  
  // Process each link
  for (const link of links) {
    try {
      const content = await extractArticleContent(link)
      
      // Save content item
      await supabase
        .from('content_items')
        .insert({
          source_id: source.id,
          user_id: userId,
          title: content.title || email.subject,
          author: email.from,
          content_url: link,
          published_at: email.date,
          raw_content: email.html || email.text,
          extracted_text: content.textContent,
          metadata: {
            email_subject: email.subject,
            email_from: email.from,
          }
        })
    } catch (error) {
      console.error('Failed to process link:', link, error)
    }
  }
}

async function getUserIdFromAlias(alias: string, supabase: any) {
  const { data } = await supabase
    .from('email_addresses')
    .select('user_id')
    .eq('address', `${alias}@digest.app`)
    .single()
  
  return data?.user_id
}

function extractLinksFromEmail(content: string): string[] {
  const linkRegex = /https?:\/\/[^\s<>"]+/g
  const links = content.match(linkRegex) || []
  
  // Filter out common tracking/unsubscribe links
  return links.filter(link => {
    const lower = link.toLowerCase()
    return !lower.includes('unsubscribe') &&
           !lower.includes('click.') &&
           !lower.includes('track.') &&
           !lower.includes('email.') &&
           !lower.includes('list-manage')
  })
}

// src/app/api/email/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { processIncomingEmail } from '@/lib/email/ingest'

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const secret = request.headers.get('x-webhook-secret')
    if (secret !== process.env.EMAIL_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const emailData = await request.json()
    
    // Process email asynchronously
    processIncomingEmail(emailData).catch(console.error)
    
    // Return immediately
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Email webhook error:', error)
    return NextResponse.json(
      { error: 'Failed to process email' }, 
      { status: 500 }
    )
  }
}

// src/lib/digest/email-template.ts
export function generateEmailTemplate(digest: {
  full_text: string
  digest_date: string
  stats?: any
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Daily Digest</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: white;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #111;
      border-bottom: 2px solid #eee;
      padding-bottom: 10px;
    }
    h2 {
      color: #333;
      margin-top: 30px;
    }
    h3 {
      color: #555;
    }
    a {
      color: #0066cc;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .stats {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 5px;
      margin-top: 30px;
      font-size: 14px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    ${digest.full_text.replace(/\n/g, '<br>')}
    
    ${digest.stats ? `
    <div class="stats">
      <strong>📊 Digest Stats</strong><br>
      Sources checked: ${digest.stats.sources_checked}<br>
      Items processed: ${digest.stats.items_processed}<br>
      Estimated read time: ${digest.stats.estimated_read_time} minutes
    </div>
    ` : ''}
    
    <div class="footer">
      <p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">View in Browser</a> |
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings">Update Settings</a>
      </p>
      <p>Daily Digest - Your Personal Intelligence Brief</p>
    </div>
  </div>
</body>
</html>
  `
}

// src/lib/email/send.ts
export async function sendDigestEmail(
  to: string,
  digest: any
): Promise<boolean> {
  // In production, use a service like SendGrid, Resend, or AWS SES
  // For now, this is a placeholder
  
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Daily Digest <digest@yourdomain.com>',
        to: [to],
        subject: `Your Daily Digest - ${new Date(digest.digest_date).toLocaleDateString()}`,
        html: generateEmailTemplate(digest),
      }),
    })

    return response.ok
  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
}

// src/app/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createServerSupabaseClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL('/dashboard', request.url))
}

// src/app/auth/verify/page.tsx
export default function VerifyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Check your email</h2>
        <p className="text-gray-600">
          We've sent you a confirmation link. Please check your email to complete signup.
        </p>
      </div>
    </div>
  )
}

// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
      },
    },
  },
  plugins: [],
}
export default config