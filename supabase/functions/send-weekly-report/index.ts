import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReportRequest {
  user_id: string;
  recipient_email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, recipient_email }: ReportRequest = await req.json();

    if (!user_id || !recipient_email) {
      return new Response(
        JSON.stringify({ error: "Missing user_id or recipient_email" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("username")
      .eq("user_id", user_id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch user profile" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const studentName = profile?.username || "Student";

    // Calculate date ranges
    const today = new Date();
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - 6);
    thisWeekStart.setHours(0, 0, 0, 0);
    
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setMilliseconds(-1);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    const formatDisplayDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Fetch this week's daily activity
    const { data: thisWeekActivity } = await supabase
      .from("daily_activity")
      .select("activity_date, questions_attempted, questions_correct")
      .eq("user_id", user_id)
      .gte("activity_date", formatDate(thisWeekStart))
      .lte("activity_date", formatDate(today));

    // Fetch last week's daily activity
    const { data: lastWeekActivity } = await supabase
      .from("daily_activity")
      .select("activity_date, questions_attempted, questions_correct")
      .eq("user_id", user_id)
      .gte("activity_date", formatDate(lastWeekStart))
      .lt("activity_date", formatDate(thisWeekStart));

    // Fetch this week's question attempts for response time
    const { data: thisWeekAttempts } = await supabase
      .from("question_attempts")
      .select("is_correct, response_time_ms, created_at")
      .eq("user_id", user_id)
      .gte("created_at", thisWeekStart.toISOString())
      .lte("created_at", today.toISOString());

    // Fetch last week's question attempts for response time comparison
    const { data: lastWeekAttempts } = await supabase
      .from("question_attempts")
      .select("is_correct, response_time_ms, created_at")
      .eq("user_id", user_id)
      .gte("created_at", lastWeekStart.toISOString())
      .lt("created_at", thisWeekStart.toISOString());

    // Fetch this week's test sessions
    const { data: thisWeekTests } = await supabase
      .from("test_sessions")
      .select("id, completed_at")
      .eq("user_id", user_id)
      .gte("completed_at", thisWeekStart.toISOString())
      .lte("completed_at", today.toISOString());

    // Fetch last week's test sessions
    const { data: lastWeekTests } = await supabase
      .from("test_sessions")
      .select("id, completed_at")
      .eq("user_id", user_id)
      .gte("completed_at", lastWeekStart.toISOString())
      .lt("completed_at", thisWeekStart.toISOString());

    // Calculate this week stats
    const thisWeekAttempted = (thisWeekActivity || []).reduce((sum, a) => sum + a.questions_attempted, 0);
    const thisWeekCorrect = (thisWeekActivity || []).reduce((sum, a) => sum + a.questions_correct, 0);
    const thisWeekAccuracy = thisWeekAttempted > 0 ? Math.round((thisWeekCorrect / thisWeekAttempted) * 100) : 0;
    const thisWeekTestsCount = thisWeekTests?.length || 0;
    const thisWeekActiveDays = (thisWeekActivity || []).filter(a => a.questions_attempted > 0).length;

    // Calculate last week stats for comparison
    const lastWeekAttempted = (lastWeekActivity || []).reduce((sum, a) => sum + a.questions_attempted, 0);
    const lastWeekCorrect = (lastWeekActivity || []).reduce((sum, a) => sum + a.questions_correct, 0);
    const lastWeekAccuracy = lastWeekAttempted > 0 ? Math.round((lastWeekCorrect / lastWeekAttempted) * 100) : 0;
    const lastWeekTestsCount = lastWeekTests?.length || 0;

    // Calculate response times
    const thisWeekWithTime = (thisWeekAttempts || []).filter(a => a.response_time_ms !== null);
    const thisWeekAvgResponseMs = thisWeekWithTime.length > 0
      ? thisWeekWithTime.reduce((sum, a) => sum + (a.response_time_ms || 0), 0) / thisWeekWithTime.length
      : null;

    const lastWeekWithTime = (lastWeekAttempts || []).filter(a => a.response_time_ms !== null);
    const lastWeekAvgResponseMs = lastWeekWithTime.length > 0
      ? lastWeekWithTime.reduce((sum, a) => sum + (a.response_time_ms || 0), 0) / lastWeekWithTime.length
      : null;

    // Format response time
    const formatResponseTime = (ms: number | null) => {
      if (ms === null) return "N/A";
      if (ms >= 60000) return `${(ms / 60000).toFixed(1)} min`;
      return `${(ms / 1000).toFixed(1)} sec`;
    };

    // Calculate streak (days with 10+ questions in the last 28 days)
    const { data: recentActivity } = await supabase
      .from("daily_activity")
      .select("activity_date, questions_attempted")
      .eq("user_id", user_id)
      .gte("activity_date", formatDate(new Date(today.getTime() - 28 * 24 * 60 * 60 * 1000)))
      .order("activity_date", { ascending: false });

    let dailyStreak = 0;
    if (recentActivity && recentActivity.length > 0) {
      const activeActivities = recentActivity.filter(a => a.questions_attempted >= 10);
      const activityDates = new Set(activeActivities.map(a => a.activity_date));
      const todayStr = formatDate(today);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = formatDate(yesterday);

      if (activityDates.has(todayStr) || activityDates.has(yesterdayStr)) {
        let checkDate = new Date(today);
        if (!activityDates.has(todayStr)) {
          checkDate.setDate(checkDate.getDate() - 1);
        }

        while (true) {
          const checkStr = formatDate(checkDate);
          if (activityDates.has(checkStr)) {
            dailyStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
      }
    }

    // Generate comparison indicators
    const getChangeIndicator = (current: number, previous: number) => {
      if (previous === 0 && current === 0) return "—";
      if (previous === 0) return `+${current} ↑`;
      const diff = current - previous;
      const pct = Math.round((diff / previous) * 100);
      if (diff > 0) return `+${diff} (${pct > 0 ? '+' : ''}${pct}%) ↑`;
      if (diff < 0) return `${diff} (${pct}%) ↓`;
      return "No change";
    };

    // Generate activity grid for the week
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const activityMap = new Map((thisWeekActivity || []).map(a => [a.activity_date, a.questions_attempted]));
    
    let activityGridHtml = '<table style="border-collapse: collapse; margin: 10px 0;"><tr>';
    for (let i = 0; i < 7; i++) {
      const date = new Date(thisWeekStart);
      date.setDate(thisWeekStart.getDate() + i);
      const dateStr = formatDate(date);
      const attempted = activityMap.get(dateStr) || 0;
      const dayIndex = (date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
      const bgColor = attempted >= 10 ? '#22c55e' : attempted > 0 ? '#86efac' : '#e5e7eb';
      const textColor = attempted >= 10 ? '#ffffff' : '#374151';
      activityGridHtml += `<td style="padding: 8px 12px; text-align: center; background-color: ${bgColor}; color: ${textColor}; border-radius: 4px; margin: 2px;">${daysOfWeek[dayIndex]}<br/><small>${attempted}</small></td>`;
    }
    activityGridHtml += '</tr></table>';

    // Build email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px; }
          h1 { color: #1f2937; margin-bottom: 5px; }
          h2 { color: #4b5563; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-top: 30px; }
          .stat-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
          .stat-label { color: #6b7280; }
          .stat-value { font-weight: 600; color: #1f2937; }
          .comparison { font-size: 0.9em; color: #6b7280; margin-top: 2px; }
          .positive { color: #16a34a; }
          .negative { color: #dc2626; }
          .streak-badge { display: inline-block; background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 4px 12px; border-radius: 20px; font-weight: 600; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 0.85em; color: #9ca3af; }
        </style>
      </head>
      <body>
        <h1>📚 ${studentName}'s Weekly Study Report</h1>
        <p style="color: #6b7280; margin-top: 0;">${formatDisplayDate(thisWeekStart)} - ${formatDisplayDate(today)}</p>
        
        <h2>📊 Weekly Summary</h2>
        <div class="stat-row">
          <span class="stat-label">Questions Attempted</span>
          <span class="stat-value">${thisWeekAttempted}</span>
        </div>
        <div class="comparison ${thisWeekAttempted >= lastWeekAttempted ? 'positive' : 'negative'}">
          vs last week: ${getChangeIndicator(thisWeekAttempted, lastWeekAttempted)}
        </div>
        
        <div class="stat-row">
          <span class="stat-label">Questions Correct</span>
          <span class="stat-value">${thisWeekCorrect}</span>
        </div>
        <div class="comparison ${thisWeekCorrect >= lastWeekCorrect ? 'positive' : 'negative'}">
          vs last week: ${getChangeIndicator(thisWeekCorrect, lastWeekCorrect)}
        </div>
        
        <div class="stat-row">
          <span class="stat-label">Accuracy</span>
          <span class="stat-value">${thisWeekAccuracy}%</span>
        </div>
        <div class="comparison ${thisWeekAccuracy >= lastWeekAccuracy ? 'positive' : 'negative'}">
          vs last week: ${lastWeekAccuracy}% (${thisWeekAccuracy >= lastWeekAccuracy ? '+' : ''}${thisWeekAccuracy - lastWeekAccuracy}%)
        </div>
        
        <div class="stat-row">
          <span class="stat-label">Tests Completed</span>
          <span class="stat-value">${thisWeekTestsCount}</span>
        </div>
        <div class="comparison ${thisWeekTestsCount >= lastWeekTestsCount ? 'positive' : 'negative'}">
          vs last week: ${getChangeIndicator(thisWeekTestsCount, lastWeekTestsCount)}
        </div>
        
        <div class="stat-row">
          <span class="stat-label">Average Response Time</span>
          <span class="stat-value">${formatResponseTime(thisWeekAvgResponseMs)}</span>
        </div>
        ${lastWeekAvgResponseMs !== null ? `
        <div class="comparison ${(thisWeekAvgResponseMs || 0) <= (lastWeekAvgResponseMs || 0) ? 'positive' : 'negative'}">
          vs last week: ${formatResponseTime(lastWeekAvgResponseMs)} ${(thisWeekAvgResponseMs || 0) < (lastWeekAvgResponseMs || 0) ? '(faster!)' : (thisWeekAvgResponseMs || 0) > (lastWeekAvgResponseMs || 0) ? '(slower)' : ''}
        </div>
        ` : ''}
        
        <div class="stat-row">
          <span class="stat-label">Active Study Days</span>
          <span class="stat-value">${thisWeekActiveDays}/7</span>
        </div>
        
        <div class="stat-row">
          <span class="stat-label">Current Streak</span>
          <span class="stat-value"><span class="streak-badge">🔥 ${dailyStreak} ${dailyStreak === 1 ? 'day' : 'days'}</span></span>
        </div>
        
        <h2>📅 This Week's Activity</h2>
        <p style="font-size: 0.9em; color: #6b7280;">Questions attempted each day (10+ = full credit for streak)</p>
        ${activityGridHtml}
        
        <div class="footer">
          <p>Keep up the great work! 💪</p>
          <p>—<br>Sent from SCC CLS Study App</p>
        </div>
      </body>
      </html>
    `;

    // Send email using Resend API directly
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "SCC CLS Study Report <onboarding@resend.dev>",
        to: [recipient_email],
        subject: `${studentName}'s Weekly Study Report - ${formatDisplayDate(thisWeekStart)} to ${formatDisplayDate(today)}`,
        html: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", emailData);
      throw new Error(emailData.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-weekly-report function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
