/**
 * Apply Nigeria Ajo terminology to en.ts and register new keys.
 * Run: node scripts/apply-ajo-terms.mjs && node scripts/sync-ajo-terms.mjs
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.join(import.meta.dirname, '..');
const enPath = path.join(ROOT, 'lib/i18n/en.ts');
const keysPath = path.join(ROOT, 'lib/i18n/keys.ts');

const REPLACEMENTS = [
  ["'nav.contributions': 'Contributions'", "'nav.contributions': 'Pay-ins'"],
  ["'nav.payouts': 'Payouts'", "'nav.payouts': 'Collections'"],
  ["'{count} cycle'", "'{count} round'"],
  ["'{count} cycles'", "'{count} rounds'"],
  ["'{paid} of {total} contribution paid'", "'{paid} of {total} pay-in paid'"],
  ["'{paid} of {total} contributions paid'", "'{paid} of {total} pay-ins paid'"],
  ["'Cycle {current} of {total}'", "'Round {current} of {total}'"],
  ["'Cycle 1 starts", "'Round 1 starts"],
  ["'cycle 1 starts", "'round 1 starts"],
  ["'group.cycleHistory': 'Cycle history'", "'group.cycleHistory': 'Round history'"],
  ["'group.cyclePayout': 'Payout'", "'group.cyclePayout': 'Collection'"],
  ["'group.cycleContributions': 'Contributions'", "'group.cycleContributions': 'Pay-ins'"],
  ["'group.contributionsPaid': 'contributions paid'", "'group.contributionsPaid': 'pay-ins received'"],
  ["'group.amountCollected': 'Collected'", "'group.amountCollected': 'Pay-ins received'"],
  ["'group.amountWaiting': 'Waiting to collect'", "'group.amountWaiting': 'Still owed'"],
  ["'group.historyAllInOne': 'Every round with member payments and payouts.'", "'group.historyAllInOne': 'Every round with pay-ins and collections.'"],
  ["'contributions.title': 'Contributions'", "'contributions.title': 'Pay-ins'"],
  ["'contributions.empty': 'No contributions yet'", "'contributions.empty': 'No pay-ins yet'"],
  ["'contributions.notInAppBody': 'Open Profile and tap Enter app to view your contributions.'", "'contributions.notInAppBody': 'Open Profile and tap Enter app to view your pay-ins.'"],
  ["'contributions.emptyMessage': 'When you join an active group and cycles begin, your payment history will show up here.'", "'contributions.emptyMessage': 'When you join an active group and rounds begin, your pay-in history will show up here.'"],
  ["'contributions.summary': 'Your contributions'", "'contributions.summary': 'Your pay-ins'"],
  ["'contributions.searchPlaceholder': 'Search by group or cycle'", "'contributions.searchPlaceholder': 'Search by group or round'"],
  ["'messages.roleAdminContributor': 'Admin · Contributor'", "'messages.roleAdminContributor': 'Admin · Member'"],
  ["'messages.collectingThisCycle': 'Collecting this cycle'", "'messages.collectingThisCycle': 'Collecting this round'"],
  ["'notifications.filterPayouts': 'Payouts'", "'notifications.filterPayouts': 'Collections'"],
  ["'notifications.emptyMessage':\n    \"You'll see updates here when members join, payments are recorded, or payouts are completed.\",", "'notifications.emptyMessage':\n    \"You'll see updates here when members join, pay-ins are recorded, or collections are completed.\","],
  ["'payoutOrder.subtitleAdmin':\n    'Each round, one person receives the full pot.", "'payoutOrder.subtitleAdmin':\n    'Each round, one person receives the full turn money."],
  ["'profile.bank': 'Bank / Payout Account'", "'profile.bank': 'Bank / Collection account'"],
  ["'profile.bankRequired': 'Required to receive cycle payouts'", "'profile.bankRequired': 'Required to receive your collection'"],
  ["'profile.contributionHistory': 'Contribution History'", "'profile.contributionHistory': 'Pay-in history'"],
  ["'profile.payoutHistory': 'Payout History'", "'profile.payoutHistory': 'Collection history'"],
  ["'profile.payoutLinked': 'Payout account linked'", "'profile.payoutLinked': 'Collection account linked'"],
  ["'profile.footer': 'RoundPay helps circles save together and receive payouts in turns.'", "'profile.footer': 'RoundPay helps Ajo circles save together and collect in turns.'"],
  ["'profileSetup.missingBank': 'Link a bank account for payouts'", "'profileSetup.missingBank': 'Link a bank account for collections'"],
  ["'payouts.notInAppBody': 'Open Profile and tap Enter app to view payouts you have received.'", "'payouts.notInAppBody': 'Open Profile and tap Enter app to view collections you have received.'"],
  ["'payouts.summary': 'Your payouts'", "'payouts.summary': 'Your collections'"],
  ["'payouts.empty': 'No payouts yet'", "'payouts.empty': 'No collections yet'"],
  ["'payouts.emptyMessage':\n    'When it is your turn to collect in an active group, completed payouts will appear here.'", "'payouts.emptyMessage':\n    'When it is your turn to collect in an active group, completed collections will appear here.'"],
  ["'reminders.masterHint': 'Turn off to stop all scheduled contribution and payout reminders.'", "'reminders.masterHint': 'Turn off to stop all scheduled pay-in and collection reminders.'"],
  ["'reminders.contributions': 'Due date reminders'", "'reminders.contributions': 'Pay-in due reminders'"],
  ["'reminders.contributionsHint': 'Notify when a contribution is due today or tomorrow.'", "'reminders.contributionsHint': 'Notify when a pay-in is due today or tomorrow.'"],
  ["'reminders.overdueHint': 'Notify when a contribution is past due.'", "'reminders.overdueHint': 'Notify when a pay-in is past due.'"],
  ["'reminders.payouts': 'Payout reminders'", "'reminders.payouts': 'Collection reminders'"],
  ["'reminders.payoutsHint': 'Notify when you are about to collect a cycle payout.'", "'reminders.payoutsHint': 'Notify when you are about to collect this round.'"],
  ["'help.faq1a':\n    'RoundPayAjo helps groups save together and receive payouts in turns", "'help.faq1a':\n    'RoundPayAjo helps groups run Ajo together and collect in turns"],
  ["'help.faq2q': 'How do I pay my contribution?'", "'help.faq2q': 'How do I pay my pay-in?'"],
  ["'help.faq2a':\n    'Open your group, go to the pay screen when a contribution is due,", "'help.faq2a':\n    'Open your group, go to the pay screen when a pay-in is due,"],
  ["'help.faq3q': 'When do I receive a payout?'", "'help.faq3q': 'When do I collect my turn?'"],
  ["'help.faq3a':\n    'Payout order follows the collection schedule your admin set in draft. When it is your cycle, a completed payout appears under Profile → Payout History and in your group.", "'help.faq3a':\n    'Collection order follows the schedule your admin set in draft. When it is your round, a completed collection appears under Profile → Collection history and in your group."],
  ["'terms.section1Body':\n    'You are responsible for contributions you agree to in a group. RoundPayAjo helps track cycles and payments", "'terms.section1Body':\n    'You are responsible for pay-ins you agree to in a group. RoundPayAjo helps track rounds and payments"],
  ["'terms.section2Body':\n    'Card and bank payments are processed by Paystack. Manual payments (cash, transfer, POS) are recorded by your group admin with a payment method. Payouts are sent to the bank account on your profile.", "'terms.section2Body':\n    'Card and bank payments are processed by Paystack. Manual payments (cash, transfer, POS) are recorded by your group admin with a payment method. Collections are sent to the bank account on your profile."],
  ["'about.tagline': 'Save together. Get paid in turns.'", "'about.tagline': 'Save together. Collect in turns.'"],
  ["'about.missionBody':\n    'RoundPay makes trusted savings circles easier — clear schedules, transparent contributions, and payouts members can track.'", "'about.missionBody':\n    'RoundPay makes trusted Ajo circles easier — clear schedules, transparent pay-ins, and collections members can track.'"],
  ["'admin.dashboardSubtitle': 'Run your savings groups with clarity — collections, payouts, and group health in one place.'", "'admin.dashboardSubtitle': 'Run your Ajo groups with clarity — pay-ins, collections, and group health in one place.'"],
  ["'admin.kpiPayouts': 'Upcoming payouts'", "'admin.kpiPayouts': 'Upcoming collections'"],
  ["'admin.viewLedger': 'Contribution ledger'", "'admin.viewLedger': 'Pay-in ledger'"],
  ["'admin.groupCycles_one': '{count} cycle'", "'admin.groupCycles_one': '{count} round'"],
  ["'admin.groupCycles_other': '{count} cycles'", "'admin.groupCycles_other': '{count} rounds'"],
  ["'admin.groupProgress': '{paid} of {total} paid this cycle'", "'admin.groupProgress': '{paid} of {total} paid this round'"],
  ["'admin.nextPayout': 'Next: {name} · {date}'", "'admin.nextPayout': 'Next collector: {name} · {date}'"],
  ["'admin.ledgerEmpty': 'No contributions match your filters.'", "'admin.ledgerEmpty': 'No pay-ins match your filters.'"],
  ["'admin.cycleLabel': 'Cycle {n}'", "'admin.cycleLabel': 'Round {n}'"],
  ["'admin.payoutsIntro': 'Upcoming payout queue across all your active groups.'", "'admin.payoutsIntro': 'Upcoming collection queue across all your active groups.'"],
  ["'admin.payoutsEmpty': 'No upcoming payouts right now.'", "'admin.payoutsEmpty': 'No upcoming collections right now.'"],
  ["'admin.readyPayout': 'Ready'", "'admin.readyPayout': 'Ready to collect'"],
  ["'admin.transparencySubtitle': 'See your contributions, group progress, and upcoming payouts.'", "'admin.transparencySubtitle': 'See your pay-ins, group progress, and upcoming collections.'"],
  ["'admin.transparencyEmpty': 'Join a group to see your contribution history and payout schedule.'", "'admin.transparencyEmpty': 'Join a group to see your pay-in history and collection schedule.'"],
  ["'admin.payContribution': 'Pay contribution'", "'admin.payContribution': 'Pay in'"],
  ["'admin.viewSchedule': 'View payout schedule'", "'admin.viewSchedule': 'View collection calendar'"],
  ["'admin.groupAdminSubtitle': 'Manage collections, invites, and payouts for this group.'", "'admin.groupAdminSubtitle': 'Manage pay-ins, invites, and collections for this group.'"],
  ["'home.startFirstCircleSubtitle':\n    'Create a group, invite members, and take turns receiving the pot — modern esusu for your phone.'", "'home.startFirstCircleSubtitle':\n    'Create a group, invite members, and take turns collecting the turn money — modern Ajo for your phone.'"],
  ["'home.featureScheduleDesc': 'Weekly or monthly rounds with a payout calendar.'", "'home.featureScheduleDesc': 'Weekly or monthly rounds with a collection calendar.'"],
  ["'home.featureTurnsDesc': 'Each member collects the pot once in rotation.'", "'home.featureTurnsDesc': 'Each member collects the turn money once in rotation.'"],
  ["'home.featureScheduleDetail':\n    'Pick weekly or monthly contribution rounds when you create a group. Every member sees due dates and the full payout calendar on the schedule screen.'", "'home.featureScheduleDetail':\n    'Pick weekly or monthly pay-in rounds when you create a group. Every member sees due dates and the full collection calendar on the schedule screen.'"],
  ["'home.featureTurnsDetail':\n    'When a group starts, members are placed in a rotation order. Each person receives the full pot once per cycle — fair, transparent, and easy to track.'", "'home.featureTurnsDetail':\n    'When a group starts, members are placed in a collection order. Each person receives the full turn money once per round — fair, transparent, and easy to track.'"],
  ["'home.stepContribute': 'Everyone contributes on schedule'", "'home.stepContribute': 'Everyone pays in on schedule'"],
  ["'home.stepPayouts': 'Members receive payouts in turns'", "'home.stepPayouts': 'Members collect in turns'"],
];

const NEW_KEYS = {
  'home.turnMoney': 'Turn money',
  'home.notStartedYet': 'Not started yet',
  'home.notAvailableYet': 'Not available yet',
  'home.thisRound': 'This round',
  'home.paidCount': '{paid}/{total} paid in',
  'home.collectionReady': 'Ready to collect',
  'home.sendCollection': 'Send collection',
  'home.recordCollection': 'Record collection',
  'home.collectionRecorded': 'Collection recorded',
  'home.collectionSent': 'Collection sent',
  'home.collectionSendFailed': 'Could not send collection',
  'cycle.currentRound': 'Current round',
  'cycle.finalTurn': 'Final turn',
  'cycle.noActiveRound': 'No active round yet',
  'cycle.collectorLine': 'Collector: {name}',
  'cycle.dueLine': 'Due {date}',
  'group.turnMoneyUpTo': 'up to {amount} turn money',
  'group.turnMoneyActive': 'Turn money {amount}',
  'group.collectorReceives': 'Collector receives {amount}',
  'create.payInPerMember': 'Pay-in per member (₦)',
  'create.monthlyTurnTarget': 'Monthly turn target (₦)',
  'create.perPayment': 'Per payment',
  'create.monthlyTarget': 'Monthly target',
  'create.turnMoneyLine': 'turn money {amount}',
  'create.monthlyTargetTip':
    'Tip: switch to Monthly target if you plan the total turn money first.',
  'create.applyPayInHint': 'Tap "Use ₦…" to apply the suggested pay-in first.',
  'create.applyPayInTitle': 'Apply pay-in',
  'create.applyPayInBody': 'Use the suggested amount from monthly target, then create.',
  'create.summaryHint': 'Enter a group name and pay-in amount (e.g. 50000) to see a summary.',
  'create.monthlyTurnTotal': '~{amount}/month total',
  'create.useAmount': 'Use {amount}',
  'schedule.title': 'Collection calendar',
  'schedule.draftSubtitle':
    'Each row is a collection round. Dates are added when the group starts.',
  'schedule.activeSubtitle':
    '{freq} rounds · {members} · recorded dates from your group, future rounds estimated from the same schedule',
  'schedule.empty': 'No members in the rotation yet.',
  'schedule.footnote':
    'Estimated dates follow your {freq} interval from the first recorded round. Actual dates may shift when the admin advances rounds.',
};

let en = fs.readFileSync(enPath, 'utf8');

for (const [from, to] of REPLACEMENTS) {
  if (!en.includes(from)) {
    console.warn('Missing replacement target:', from.slice(0, 60));
  } else {
    en = en.split(from).join(to);
  }
}

function formatEntry(key, value) {
  if (value.includes('\n')) {
    const body = value.replace(/'/g, "\\'");
    return `  '${key}':\n    '${body}',`;
  }
  return `  '${key}': '${value.replace(/'/g, "\\'")}',`;
}

const missingEntries = Object.entries(NEW_KEYS).filter(([key]) => !en.includes(`'${key}':`));
if (missingEntries.length) {
  const block = missingEntries.map(([k, v]) => formatEntry(k, v)).join('\n');
  en = en.replace(/\n};\s*$/, `\n${block}\n};\n`);
}

fs.writeFileSync(enPath, en);
console.log('Updated en.ts');

let keys = fs.readFileSync(keysPath, 'utf8');
const missingKeys = Object.keys(NEW_KEYS).filter((key) => !keys.includes(`'${key}'`));
if (missingKeys.length) {
  const typeBlock = missingKeys.map((k) => `  | '${k}'`).join('\n');
  const arrBlock = missingKeys.map((k) => `  '${k}',`).join('\n');
  keys = keys.replace("  | 'home.noInvitations'", `  | 'home.noInvitations'\n${typeBlock}`);
  keys = keys.replace("  'home.noInvitations',", `  'home.noInvitations',\n${arrBlock}`);
}

fs.writeFileSync(keysPath, keys);
console.log('Updated keys.ts');
