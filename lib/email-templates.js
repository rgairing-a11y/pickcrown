// lib/email-templates.js
// Polished email copy - warmer, clearer, calmer

export function reminderEmail({ poolName, eventName, deadline, poolUrl }) {
  return {
    subject: `🎯 ${poolName} – picks close soon!`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">
          👑 Quick Reminder
        </h1>
        
        <p style="font-size: 16px; color: #333; line-height: 1.6;">
          Hey! Just a friendly nudge – your picks for <strong>${poolName}</strong> are due soon.
        </p>
        
        <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 24px 0; border-left: 4px solid #3b82f6;">
          <p style="margin: 0 0 8px; font-size: 15px; color: #333;">
            <strong>${eventName}</strong>
          </p>
          <p style="margin: 0; font-size: 14px; color: #666;">
            ⏰ Picks lock: <strong>${deadline}</strong>
          </p>
        </div>
        
        <p style="font-size: 15px; color: #333; line-height: 1.6; margin-bottom: 24px;">
          <strong>What happens next:</strong> Once picks lock, you'll be able to see everyone's picks and track the standings as results come in. No pressure – just fun!
        </p>
        
        <a href="${poolUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
          Submit Your Picks →
        </a>
        
        <p style="font-size: 14px; color: #666; margin-top: 32px;">
          Good luck! 🍀
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
        
        <p style="font-size: 12px; color: #999;">
          You're receiving this because you joined a PickCrown pool. No action needed if you've already submitted.
        </p>
      </div>
    `,
    text: `
Quick Reminder from PickCrown

Hey! Just a friendly nudge – your picks for ${poolName} are due soon.

Event: ${eventName}
Picks lock: ${deadline}

What happens next: Once picks lock, you'll be able to see everyone's picks and track the standings as results come in. No pressure – just fun!

Submit your picks: ${poolUrl}

Good luck!

---
You're receiving this because you joined a PickCrown pool. No action needed if you've already submitted.
    `.trim()
  }
}

export function resultsEmail({ poolName, eventName, standings, poolUrl, recipientRank, recipientName }) {
  const topThree = standings.slice(0, 3)
  const standingsHtml = topThree.map((entry, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'
    const isRecipient = entry.entry_name === recipientName
    return `<tr style="${isRecipient ? 'background: #fef9c3;' : ''}">
      <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: ${isRecipient ? '600' : '400'};">${medal} ${entry.entry_name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">${entry.total_points} pts</td>
    </tr>`
  }).join('')
  
  const recipientEntry = standings.find(s => s.entry_name === recipientName)
  
  // Personalized message based on rank
  let personalMessage = ''
  if (recipientRank === 1) {
    personalMessage = `<p style="font-size: 18px; color: #16a34a; font-weight: 600; margin: 24px 0;">🎉 Congrats – you won! You finished <strong>#1</strong> with ${recipientEntry?.total_points || 0} points!</p>`
  } else if (recipientRank === 2) {
    personalMessage = `<p style="font-size: 16px; color: #333; margin: 24px 0;">🥈 Great job! You finished <strong>#2</strong> with ${recipientEntry?.total_points || 0} points – so close!</p>`
  } else if (recipientRank === 3) {
    personalMessage = `<p style="font-size: 16px; color: #333; margin: 24px 0;">🥉 Nice work! You finished <strong>#3</strong> with ${recipientEntry?.total_points || 0} points – on the podium!</p>`
  } else if (recipientRank) {
    personalMessage = `<p style="font-size: 16px; color: #333; margin: 24px 0;">You finished <strong>#${recipientRank}</strong> with ${recipientEntry?.total_points || 0} points. Thanks for playing!</p>`
  }

  return {
    subject: `🏆 ${poolName} – Final Results`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 8px;">
          👑 ${poolName}
        </h1>
        <p style="font-size: 14px; color: #666; margin: 0 0 24px;">
          ${eventName} – Final Results
        </p>
        
        ${personalMessage}
        
        <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <h2 style="font-size: 16px; color: #1a1a1a; margin: 0 0 16px;">🏆 Top 3</h2>
          
          <table style="width: 100%; border-collapse: collapse;">
            ${standingsHtml}
          </table>
        </div>
        
        <a href="${poolUrl}/standings" style="display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
          See Full Standings →
        </a>
        
        <p style="font-size: 15px; color: #666; margin-top: 32px; line-height: 1.6;">
          Thanks for being part of this pool! Until next time. 🙌
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
        
        <p style="font-size: 12px; color: #999;">
          You're receiving this because you participated in a PickCrown pool.
        </p>
      </div>
    `,
    text: `
${poolName} – Final Results
${eventName}

${recipientRank ? `You finished #${recipientRank} with ${recipientEntry?.total_points || 0} points.` : ''}

Top 3:
${topThree.map((e, i) => `${i + 1}. ${e.entry_name} - ${e.total_points} pts`).join('\n')}

See full standings: ${poolUrl}/standings

Thanks for being part of this pool! Until next time.
    `.trim()
  }
}

// NEW: Incomplete reminder email (for those who haven't finished their picks)
export function incompleteReminderEmail({ poolName, eventName, deadline, poolUrl, picksComplete, totalPicks }) {
  const remaining = totalPicks - picksComplete
  
  return {
    subject: `🎯 ${poolName} – ${remaining} pick${remaining !== 1 ? 's' : ''} left!`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">
          👑 Almost There!
        </h1>
        
        <p style="font-size: 16px; color: #333; line-height: 1.6;">
          You've made ${picksComplete} picks – just ${remaining} more to go for <strong>${poolName}</strong>.
        </p>
        
        <div style="background: #fef9c3; border-radius: 8px; padding: 16px; margin: 24px 0; border-left: 4px solid #eab308;">
          <p style="margin: 0 0 8px; font-size: 15px; color: #333;">
            <strong>${eventName}</strong>
          </p>
          <p style="margin: 0; font-size: 14px; color: #666;">
            ⏰ Picks lock: <strong>${deadline}</strong>
          </p>
        </div>
        
        <a href="${poolUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
          Finish Your Picks →
        </a>
        
        <p style="font-size: 14px; color: #666; margin-top: 32px;">
          See you at the finish line! 🏁
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
        
        <p style="font-size: 12px; color: #999;">
          You're receiving this because you have incomplete picks in a PickCrown pool.
        </p>
      </div>
    `,
    text: `
Almost There!

You've made ${picksComplete} picks – just ${remaining} more to go for ${poolName}.

Event: ${eventName}
Picks lock: ${deadline}

Finish your picks: ${poolUrl}

See you at the finish line!
    `.trim()
  }
}
