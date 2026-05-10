import webpush from 'npm:web-push@3'

const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = 'mailto:sahasra.kasturi@gmail.com'

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const now = new Date()
  const currentHour = String(now.getUTCHours()).padStart(2, '0')
  const today = now.toISOString().slice(0, 10)

  const settingsRes = await fetch(
    `${supabaseUrl}/rest/v1/user_settings?notifications_enabled=eq.true&reminder_time=gte.${currentHour}:00&reminder_time=lt.${currentHour}:59&push_subscription=not.is.null`,
    { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
  )
  const users = await settingsRes.json()

  for (const user of users) {
    const logRes = await fetch(
      `${supabaseUrl}/rest/v1/weight_entries?user_id=eq.${user.user_id}&date=eq.${today}`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    )
    const logged = await logRes.json()
    if (logged.length > 0) continue

    try {
      await webpush.sendNotification(
        user.push_subscription,
        JSON.stringify({
          title: 'Sahasra',
          body: "Hey Sahasra — don't forget to log your weight today!",
        })
      )
    } catch (err) {
      console.error('Push failed for user', user.user_id, err)
    }
  }

  return new Response('ok')
})
