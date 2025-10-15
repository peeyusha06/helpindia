import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { userId, requestedRole } = await req.json()

    console.log('Role assignment request:', { userId, requestedRole })

    // Validate inputs
    if (!userId || !requestedRole) {
      return new Response(
        JSON.stringify({ error: 'Missing userId or requestedRole' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Only allow 'volunteer' and 'donor' roles via signup
    // NGO role requires manual approval/verification
    const allowedRoles = ['volunteer', 'donor']
    const finalRole = allowedRoles.includes(requestedRole) ? requestedRole : 'volunteer'

    console.log('Assigning role:', { userId, finalRole })

    // Insert the role using service role key (bypasses RLS)
    const { error } = await supabaseClient
      .from('user_roles')
      .insert({ user_id: userId, role: finalRole })

    if (error) {
      console.error('Error assigning role:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Role assigned successfully')

    return new Response(
      JSON.stringify({ success: true, role: finalRole }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Function error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
