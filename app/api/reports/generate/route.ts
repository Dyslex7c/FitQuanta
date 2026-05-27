import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Chat from '@/models/Chat';
import ProgressLog from '@/models/ProgressLog';
import User from '@/models/User';
import Trainer from '@/models/Trainer';
import Report from '@/models/Report';
import { verifyAuth, handleApiError } from '@/lib/auth';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId, role } = verifyAuth(req, ['client', 'trainer', 'admin']);
    const body = await req.json();
    const { conversationId } = body;

    if (!conversationId) {
      return NextResponse.json({ success: false, message: 'conversationId required' }, { status: 400 });
    }

    await connectDB();

    // 1. Fetch conversation to verify client & trainer identities
    const chat = await Chat.findById(conversationId);
    if (!chat || chat.isActive === false) {
      return NextResponse.json({ success: false, message: 'Active conversation session not found' }, { status: 404 });
    }

    // Authorization check: Make sure user is part of the conversation
    const clientUser = await User.findById(chat.clientId);
    if (!clientUser) {
      return NextResponse.json({ success: false, message: 'Client profile not found' }, { status: 404 });
    }

    let trainerName = 'Trainer';
    const trainer = await Trainer.findById(chat.trainerId);
    if (trainer) {
      trainerName = trainer.name;
    }

    // Verify requesting user is either the client or the trainer of this conversation
    if (role === 'client' && userId !== clientUser._id.toString()) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }
    if (role === 'trainer') {
      const authTrainer = await Trainer.findOne({ userId });
      if (!authTrainer || authTrainer._id.toString() !== chat.trainerId.toString()) {
        return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
      }
    }

    // 2. Fetch Progress Logs from the client (last 30 days)
    const logs = await ProgressLog.find({ userId: clientUser._id })
      .sort({ date: -1 })
      .limit(30)
      .lean();

    // 3. Aggregate Analytics Metrics
    let totalCalories = 0, calCount = 0;
    let totalProtein = 0, totalCarbs = 0, totalFats = 0, macroCount = 0;
    let totalSleep = 0, sleepCount = 0;
    let totalSteps = 0, stepsCount = 0;
    let weights: number[] = [];
    let workoutCount = 0;
    const exercisesLogged = new Set<string>();

    logs.forEach(log => {
      if (log.type === 'nutrition') {
        if (log.calories) {
          totalCalories += log.calories;
          calCount++;
        }
        if (log.protein || log.carbs || log.fats) {
          totalProtein += log.protein || 0;
          totalCarbs += log.carbs || 0;
          totalFats += log.fats || 0;
          macroCount++;
        }
      } else if (log.type === 'health') {
        if (log.sleepHours) {
          totalSleep += log.sleepHours;
          sleepCount++;
        }
        if (log.steps) {
          totalSteps += log.steps;
          stepsCount++;
        }
        if (log.bodyWeight) {
          weights.push(log.bodyWeight);
        }
      } else if (log.type === 'workout') {
        workoutCount++;
        if (log.exercises && Array.isArray(log.exercises)) {
          log.exercises.forEach(ex => exercisesLogged.add(ex.name));
        }
      }
    });

    const avgCal = calCount > 0 ? Math.round(totalCalories / calCount) : null;
    const avgProtein = macroCount > 0 ? Math.round(totalProtein / macroCount) : null;
    const avgCarbs = macroCount > 0 ? Math.round(totalCarbs / macroCount) : null;
    const avgFats = macroCount > 0 ? Math.round(totalFats / macroCount) : null;
    const avgSleep = sleepCount > 0 ? Number((totalSleep / sleepCount).toFixed(1)) : null;
    const avgSteps = stepsCount > 0 ? Math.round(totalSteps / stepsCount) : null;
    
    // Weight calculations
    const startWeight = weights.length > 0 ? weights[weights.length - 1] : clientUser.weight;
    const currentWeight = weights.length > 0 ? weights[0] : clientUser.weight;
    const weightDiff = startWeight && currentWeight ? Number((currentWeight - startWeight).toFixed(1)) : 0;

    // 4. Generate beautiful HTML Report
    const htmlReport = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FitQuanta Client Analytics Report</title>
  <style>
    :root {
      --bg-dark: #06060a;
      --bg-card: #0d0d14;
      --primary: #f07028;
      --gold: #e8a820;
      --white: #ffffff;
      --text-muted: #9090a0;
      --border: #22223a;
      --emerald: #1ed696;
    }
    body {
      background-color: var(--bg-dark);
      color: var(--white);
      font-family: 'Inter', system-ui, sans-serif;
      margin: 0;
      padding: 40px 20px;
    }
    .report-container {
      max-width: 800px;
      margin: 0 auto;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
    header {
      border-bottom: 1px solid var(--border);
      padding-bottom: 24px;
      margin-bottom: 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }
    h1 {
      font-family: 'Orbitron', sans-serif;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin: 0;
      background: linear-gradient(to right, #ffffff, var(--primary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .badge {
      background: rgba(240, 112, 40, 0.1);
      border: 1px solid var(--primary);
      color: var(--primary);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .profile-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 28px;
    }
    .profile-item span {
      display: block;
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 4px;
    }
    .profile-item strong {
      font-size: 14px;
      color: var(--white);
    }
    h2 {
      font-family: 'Orbitron', sans-serif;
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--gold);
      border-bottom: 1px solid var(--border);
      padding-bottom: 8px;
      margin-top: 32px;
      margin-bottom: 16px;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
    }
    .metric-card {
      border: 1px solid var(--border);
      background: rgba(255, 255, 255, 0.01);
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .metric-title {
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 8px;
    }
    .metric-value {
      font-size: 24px;
      font-weight: 800;
      color: var(--primary);
    }
    .metric-sub {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 6px;
    }
    .macro-bar {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-top: 10px;
      font-size: 11px;
    }
    .macro-item {
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
    }
    .p-p { background: rgba(232, 168, 32, 0.1); color: var(--gold); }
    .p-c { background: rgba(240, 112, 40, 0.1); color: var(--primary); }
    .p-f { background: rgba(30, 214, 150, 0.1); color: var(--emerald); }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      text-align: left;
      margin-top: 10px;
    }
    th {
      border-bottom: 1px solid var(--border);
      color: var(--text-muted);
      padding: 8px;
      font-weight: 600;
    }
    td {
      padding: 10px 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.02);
    }
    .footer-note {
      text-align: center;
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 40px;
      border-top: 1px solid var(--border);
      padding-top: 16px;
    }
  </style>
</head>
<body>
  <div class="report-container">
    <header>
      <div>
        <h1>Analytics Report</h1>
        <p style="font-size: 12px; color: var(--text-muted); margin: 4px 0 0 0;">Generated by FitQuanta AI &bull; ${new Date().toLocaleDateString()}</p>
      </div>
      <span class="badge">Last 30 Days</span>
    </header>

    <div class="profile-summary">
      <div class="profile-item">
        <span>Client Name</span>
        <strong>${clientUser.name}</strong>
      </div>
      <div class="profile-item">
        <span>Fitness Goal</span>
        <strong style="text-transform: capitalize;">${clientUser.fitnessGoal?.replace('_', ' ') || 'Fat Loss'}</strong>
      </div>
      <div class="profile-item">
        <span>Starting Weight</span>
        <strong>${startWeight ? startWeight + ' kg' : 'Not set'}</strong>
      </div>
      <div class="profile-item">
        <span>Current Weight</span>
        <strong>${currentWeight ? currentWeight + ' kg' : 'Not set'}</strong>
      </div>
    </div>

    <h2>Nutrition & Calories</h2>
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-title">Avg Daily Intake</div>
        <div class="metric-value">${avgCal ? avgCal + ' kcal' : 'N/A'}</div>
        <div class="metric-sub">Across ${calCount} logged days</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">Average Macronutrients</div>
        <div class="metric-value" style="font-size: 18px; color: var(--white); margin: 8px 0;">
          P: ${avgProtein ? avgProtein + 'g' : '—'} &bull; C: ${avgCarbs ? avgCarbs + 'g' : '—'} &bull; F: ${avgFats ? avgFats + 'g' : '—'}
        </div>
        <div class="macro-bar">
          <span class="macro-item p-p">Protein</span>
          <span class="macro-item p-c">Carbs</span>
          <span class="macro-item p-f">Fats</span>
        </div>
      </div>
    </div>

    <h2>Workouts & Activity</h2>
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-title">Total Workouts</div>
        <div class="metric-value" style="color: var(--gold);">${workoutCount}</div>
        <div class="metric-sub">Gym sessions logged</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">Avg Daily Steps</div>
        <div class="metric-value" style="color: var(--emerald);">${avgSteps ? avgSteps.toLocaleString() : 'N/A'}</div>
        <div class="metric-sub">Target: 10,000 steps</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">Avg Daily Sleep</div>
        <div class="metric-value" style="color: #90b0ff;">${avgSleep ? avgSleep + ' hrs' : 'N/A'}</div>
        <div class="metric-sub">Recommended: 7-9 hrs</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">Weight Change</div>
        <div class="metric-value" style="color: ${weightDiff <= 0 ? 'var(--emerald)' : 'var(--primary)'};">
          ${weightDiff > 0 ? '+' : ''}${weightDiff} kg
        </div>
        <div class="metric-sub">Trend over last 30 days</div>
      </div>
    </div>

    <h2>Exercises Performed</h2>
    ${
      exercisesLogged.size === 0
        ? '<p style="font-size: 12.5px; color: var(--text-muted); font-style: italic;">No specific exercises recorded in logs yet.</p>'
        : `<table>
            <thead>
              <tr>
                <th style="width: 40px;">#</th>
                <th>Exercise Name</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${Array.from(exercisesLogged)
                .slice(0, 10)
                .map((exName, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td style="font-weight: 600; color: var(--white);">${exName}</td>
                    <td style="color: var(--emerald);">Active log</td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
          ${exercisesLogged.size > 10 ? `<p style="font-size: 11px; color: var(--text-muted); margin-top: 8px;">+ ${exercisesLogged.size - 10} more exercises performed</p>` : ''}`
    }

    <div class="footer-note">
      This report is generated dynamically based on active client logs in the FitQuanta database. &bull; Coach in session: ${trainerName}
    </div>
  </div>
</body>
</html>
    `;

    // 5. Save HTML report to MongoDB
    const savedReport = await Report.create({
      htmlContent: htmlReport,
    });

    const reportUrl = `/api/reports/view/${savedReport._id}`;

    return NextResponse.json({
      success: true,
      data: {
        url: reportUrl,
        fileName: `FitQuanta_Analytics_Report_${clientUser.name.replace(/\s+/g, '_')}.html`,
      },
    });
  } catch (error: any) {
    console.error('[REPORTS GENERATE ERROR]', error);
    return NextResponse.json({ success: false, message: error.message || 'Something went wrong' }, { status: 500 });
  }
}
