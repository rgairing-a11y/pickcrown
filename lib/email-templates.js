export function reminderEmail({ poolName, eventName, deadline, poolUrl }) {
  return {
    subject: `⏰ Reminder: Submit your ${eventName} picks!`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">
          👑 PickCrown Reminder
        </h1>
        
        <p style="font-size: 16px; color: #333; line-height: 1.5;">
          Don't forget to submit your picks for <strong>${poolName}</strong>!
        </p>
        
        <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #666;">
            <strong>Event:</strong> ${eventName}<br>
            <strong>Deadline:</strong> ${deadline}
          </p>
        </div>
        
        <a href="${poolUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 20px 0;">
          Submit Your Picks →
        </a>
        
        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          Good luck! 🍀
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #999;">
          You're receiving this because you're part of a PickCrown pool.
        </p>
      </div>
    `,
    text: `
PickCrown Reminder

Don't forget to submit your picks for ${poolName}!

Event: ${eventName}
Deadline: ${deadline}

Submit your picks: ${poolUrl}

Good luck!
    `.trim()
  }
}

export function resultsEmail({ poolName, eventName, standings, poolUrl, recipientRank, recipientName }) {
  const topThree = standings.slice(0, 3)
  const standingsHtml = topThree.map((entry, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'
    return `<tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${medal} ${entry.entry_name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${entry.total_points} pts</td>
    </tr>`
  }).join('')
  
  const recipientEntry = standings.find(s => s.entry_name === recipientName)
  const yourResult = recipientRank 
    ? `<p style="font-size: 16px; color: #333;">You finished <strong>#${recipientRank}</strong> with ${recipientEntry?.total_points || 0} points!</p>`
    : ''

  return {
    subject: `🏆 ${eventName} Results Are In!`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">
          👑 ${poolName} Results
        </h1>
        
        <p style="font-size: 16px; color: #333; line-height: 1.5;">
          The results are in for <strong>${eventName}</strong>!
        </p>
        
        ${yourResult}
        
        <h2 style="font-size: 18px; color: #1a1a1a; margin-top: 30px;">🏆 Final Standings</h2>
        
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          ${standingsHtml}
        </table>
        
        <a href="${poolUrl}/standings" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 20px 0;">
          View Full Standings →
        </a>
        
        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          Thanks for playing! 🎉
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #999;">
          You're receiving this because you participated in a PickCrown pool.
        </p>
      </div>
    `,
    text: `
${poolName} Results

The results are in for ${eventName}!

Top 3:
${topThree.map((e, i) => `${i + 1}. ${e.entry_name} - ${e.total_points} pts`).join('\n')}

View full standings: ${poolUrl}/standings

Thanks for playing!
    `.trim()
  }
}
