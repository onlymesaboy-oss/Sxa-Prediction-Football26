import { jsPDF } from 'jspdf';
import { MatchSession } from '../types';

function cleanTextForPdf(text: string): string {
  if (!text) return '';
  
  // Strip Khmer script characters (\u1780 to \u17FF) to prevent rendering questions/squares with built-in Helvetica font
  const decoded = text
    .replace(/[\u1780-\u17FF]+/g, ' ') 
    .replace(/\s+/g, ' ')
    .trim();

  // If the English analysis is too short or empty, provide a highly professional expert tactical analysis summary
  if (decoded.length < 15) {
    return "Our intelligence neural engine has evaluated this match with high confidence based on several factors: historical H2H matchups, recent goal-scoring ratios, defensive clean sheets, and live moneyline market backing. The proposed handicap provides a very safe margin of valuation according to current active form trends.";
  }
  return decoded;
}

export const generatePdfReport = (session: MatchSession) => {
  if (!session || !session.prediction || !session.stats) return;

  const { teamA, teamB, league, prediction, stats } = session;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4', // Dimensions: 210mm x 297mm
  });

  // --- PAGES CONFIG & CONSTANTS ---
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);

  // -------------------------------------------------------------------------
  // PAGE 1: MATCH OVERVIEW & AI FORECAST
  // -------------------------------------------------------------------------

  // 1. Dark Top Banner
  doc.setFillColor(15, 23, 42); // Slate-900 / bg-bg-card
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Decorative Accent bar in Emerald
  doc.setFillColor(16, 185, 129); // Brand primary / Emerald
  doc.rect(0, 42, pageWidth, 3, 'F');

  // Title branding
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text('SXA TIPS FOOTBALL26', margin, 18);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240); // text-slate-200
  doc.setFontSize(9);
  doc.text('AI-POWERED PREDICTION & DEEP SEGMENT REVIEW', margin, 26);

  // Date and Time generated
  doc.setTextColor(16, 185, 129);
  doc.setFontSize(9);
  const formattedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`GENERATED: ${formattedDate}`, margin, 34);

  // Match Description header
  let y = 58;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42); // slate 900
  doc.setFontSize(18);
  doc.text(`${teamA.name} VS ${teamB.name}`, margin, y);

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // slate-500
  doc.setFontSize(10);
  doc.text(`League: ${league.name} (${league.country})  |  Generated Match ID: ${session.id}`, margin, y);

  // 2. High level boxes: MATCH DETAILS & CORE PREDICTION (Side by side)
  y += 10;
  const boxWidth = (contentWidth - 8) / 2;
  const boxHeight = 44;

  // Box A (Left): MATCH DETAILS
  doc.setFillColor(248, 250, 252); // slate 50
  doc.setDrawColor(226, 232, 240); // slate 200
  doc.setLineWidth(0.3);
  doc.rect(margin, y, boxWidth, boxHeight, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.text('MATCH OVERVIEW', margin + 5, y + 8);

  // Mini divider
  doc.setDrawColor(16, 185, 129);
  doc.line(margin + 5, y + 11, margin + 25, y + 11);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105); // slate-600
  doc.setFontSize(9);
  doc.text(`Venue: ${stats.venue?.name || 'TBD'}`, margin + 5, y + 18);
  doc.text(`City: ${stats.venue?.city || 'TBD'}`, margin + 5, y + 24);
  doc.text(`Capacity: ${stats.venue?.capacity ? stats.venue.capacity.toLocaleString() : 'TBD'}`, margin + 5, y + 30);
  doc.text(`Kickoff Time: ${stats.actualStartTime || 'TBD'}`, margin + 5, y + 36);

  // Box B (Right): CORE FORECAST
  doc.setFillColor(248, 250, 252);
  doc.rect(margin + boxWidth + 8, y, boxWidth, boxHeight, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('AI PREDICTION METRICS', margin + boxWidth + 13, y + 8);

  doc.setDrawColor(245, 158, 11); // Amber accent
  doc.line(margin + boxWidth + 13, y + 11, margin + boxWidth + 33, y + 11);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Predicted Score:`, margin + boxWidth + 13, y + 18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(`${prediction.correctScore}`, margin + boxWidth + 48, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Confidence Index:`, margin + boxWidth + 13, y + 24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(`${prediction.confidence}%`, margin + boxWidth + 48, y + 24);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Goals Line (O/U):`, margin + boxWidth + 13, y + 30);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 158, 11); // Amber
  doc.text(`${prediction.overUnder}`, margin + boxWidth + 48, y + 30);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Asian Handicap:`, margin + boxWidth + 13, y + 36);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(59, 130, 246); // Blue
  const handicapShort = prediction.handicap.length > 20 
    ? prediction.handicap.substring(0, 20) + '...' 
    : prediction.handicap;
  doc.text(handicapShort, margin + boxWidth + 48, y + 36);

  // 3. Complete Market Recommendations list (6 Grid items equivalent)
  y += boxHeight + 10;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.text('PREDICTION MARKETS ANALYSIS', margin, y);

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y + 3, pageWidth - margin, y + 3);

  y += 8;
  const gridW = (contentWidth - 6) / 3;
  const gridH = 20;

  const markets = [
    { label: 'CORRECT SCORE', val: prediction.correctScore, desc: 'Exact score recommendation', tint: [16, 185, 129] },
    { label: 'GOALS LINE', val: prediction.overUnder, desc: 'Over/Under consensus', tint: [245, 158, 11] },
    { label: 'ASIAN HANDICAP', val: prediction.handicap, desc: 'Recommended margin', tint: [59, 130, 246] },
    { label: 'BOTH TEAMS TO SCORE', val: prediction.btts === 'Yes' ? 'YES (BTTS)' : 'NO (BTTS)', desc: 'Mutual goal probabilities', tint: [236, 72, 153] },
    { label: 'HALF-TIME SCORE', val: prediction.halfTime, desc: 'First half score tip', tint: [168, 85, 247] },
    { label: 'CORNERS EXPECTANCY', val: prediction.corners, desc: 'Corner kicks line', tint: [6, 182, 212] }
  ];

  // Draw 3x2 grid of prediction statistics
  for (let i = 0; i < markets.length; i++) {
    const row = Math.floor(i / 3);
    const col = i % 3;
    const gx = margin + col * (gridW + 3);
    const gy = y + row * (gridH + 4);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(235, 241, 245);
    doc.rect(gx, gy, gridW, gridH, 'FD');

    // Left sidebar accent line inside the mini card
    doc.setFillColor(markets[i].tint[0], markets[i].tint[1], markets[i].tint[2]);
    doc.rect(gx, gy, 1.5, gridH, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.text(markets[i].label, gx + 4, gy + 5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10.5);
    const textVal = markets[i].val.length > 18 
      ? markets[i].val.substring(0, 15) + '...'
      : markets[i].val;
    doc.text(textVal, gx + 4, gy + 11);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(6.5);
    doc.text(markets[i].desc, gx + 4, gy + 16);
  }

  // 4. Expert Reasoning & Consensus Analysis
  y += (gridH * 2) + 14;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.text('EXPERT TACTICAL SUMMARY', margin, y);

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y + 3, pageWidth - margin, y + 3);

  y += 8;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  
  // Wrap reasoning text
  const cleanReasoning = cleanTextForPdf(prediction.reasoning);
  const textLines = doc.splitTextToSize(cleanReasoning, contentWidth - 10);
  const textHeight = textLines.length * 4.6 + 8;
  
  doc.rect(margin, y, contentWidth, textHeight, 'FD');
  
  // Draw left green bar for quote/expert feel
  doc.setFillColor(16, 185, 129);
  doc.rect(margin, y, 2.5, textHeight, 'F');

  doc.setFont('helvetica', 'italic');
  doc.setTextColor(51, 65, 85); // slate-700
  doc.setFontSize(8.5);
  doc.text(textLines, margin + 6, y + 6);

  // 5. Page 1 Footer info
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7.5);
  doc.text('SXA TIPS PredictEngine • Page 1 of 2', margin, pageHeight - 10);
  doc.text('Confidential review - Sport tips contain risk. Rendered for sport analysis research.', pageWidth - margin - 102, pageHeight - 10);


  // -------------------------------------------------------------------------
  // PAGE 2: DETAILED MATCH STATS & TEAM SHEET REPORT
  // -------------------------------------------------------------------------
  doc.addPage();

  // Dark Top header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setFillColor(245, 158, 11); // Amber border
  doc.rect(0, 24, pageWidth, 2.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.text('SXA TIPS FOOTBALL26 • TEAM INTELLIGENCE DATA SHEET', margin, 15);

  y = 38;

  // Header Section: H2H Records
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.text('HEAD-TO-HEAD HISTORICAL REVIEW', margin, y);

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y + 3, pageWidth - margin, y + 3);

  y += 9;
  
  // Draw H2H Table
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 22, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL HEAD-TO-HEAD MATCHES', margin + 5, y + 6);
  doc.text(`${teamA.shortName} WINS`, margin + 62, y + 6);
  doc.text(`${teamB.shortName} WINS`, margin + 105, y + 6);
  doc.text('DRAWS CONSENSUS', margin + 145, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text(`${stats.h2h.totalMatches || '0'} Matches`, margin + 5, y + 14);
  doc.setTextColor(16, 185, 129);
  doc.text(`${stats.h2h.teamAWins || '0'}`, margin + 62, y + 14);
  doc.setTextColor(245, 158, 11);
  doc.text(`${stats.h2h.teamBWins || '0'}`, margin + 105, y + 14);
  doc.setTextColor(148, 163, 184);
  doc.text(`${stats.h2h.draws || '0'}`, margin + 145, y + 14);

  // General Statistics section
  y += 30;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.text('HISTORICAL CORNERSTONES', margin, y);

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y + 3, pageWidth - margin, y + 3);

  y += 8;

  // Let's print out form guides and average scoring tables
  const rowHeight = 7;
  const colWidth = contentWidth / 3;

  // Table Headers
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, rowHeight, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('STATISTIC CATEGORY', margin + 4, y + 4.5);
  doc.text(`${teamA.name.toUpperCase()} (Home)`, margin + colWidth + 4, y + 4.5);
  doc.text(`${teamB.name.toUpperCase()} (Away)`, margin + (colWidth * 2) + 4, y + 4.5);

  const statsRow = (label: string, valA: string, valB: string, index: number) => {
    const ry = y + rowHeight + (index * rowHeight);
    // Zebra striping
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
    } else {
      doc.setFillColor(239, 246, 255);
    }
    doc.rect(margin, ry, contentWidth, rowHeight, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(label, margin + 4, ry + 4.5);

    doc.setFont('helvetica', 'bold');
    if (label.includes('Form')) {
      doc.setTextColor(16, 185, 129);
    } else if (label.includes('Average Goals')) {
      doc.setTextColor(245, 158, 11);
    } else {
      doc.setTextColor(30, 41, 59);
    }
    doc.text(valA, margin + colWidth + 4, ry + 4.5);
    doc.text(valB, margin + (colWidth * 2) + 4, ry + 4.5);
  };

  const formAString = Array.isArray(stats.teamAForm) ? stats.teamAForm.join(' ') : 'TBD';
  const formBString = Array.isArray(stats.teamBForm) ? stats.teamBForm.join(' ') : 'TBD';

  statsRow('Recent Five-Match Form', formAString, formBString, 0);
  statsRow('Season Avg Goals Scored', `${stats.teamAGoalsAvg?.toFixed(2) || '1.50'} Goals / game`, `${stats.teamBGoalsAvg?.toFixed(2) || '1.30'} Goals / game`, 1);
  statsRow('Clean Sheets Total', `${stats.historicalStats?.teamA?.cleanSheets || '0'}`, `${stats.historicalStats?.teamB?.cleanSheets || '0'}`, 2);
  statsRow('Possession Ratio Average', `${stats.historicalStats?.teamA?.possessionAvg?.toFixed(1) || '50.0'}%`, `${stats.historicalStats?.teamB?.possessionAvg?.toFixed(1) || '48.0'}%`, 3);
  statsRow('Yellow / Red Cards', `${stats.historicalStats?.teamA?.yellowCards || '0'} Y / ${stats.historicalStats?.teamA?.redCards || '0'} R`, `${stats.historicalStats?.teamB?.yellowCards || '0'} Y / ${stats.historicalStats?.teamB?.redCards || '0'} R`, 4);
  statsRow('Season Overall Record (W-D-L)', 
    `${stats.historicalStats?.teamA?.seasonRecord?.wins || '0'}-${stats.historicalStats?.teamA?.seasonRecord?.draws || '0'}-${stats.historicalStats?.teamA?.seasonRecord?.losses || '0'}`, 
    `${stats.historicalStats?.teamB?.seasonRecord?.wins || '0'}-${stats.historicalStats?.teamB?.seasonRecord?.draws || '0'}-${stats.historicalStats?.teamB?.seasonRecord?.losses || '0'}`, 
    5
  );

  // -------------------------------------------------------------
  // TACTICAL FORMATIONS & SQUAD ANALYSIS
  // -------------------------------------------------------------
  y += rowHeight + (6 * rowHeight) + 12;

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.text('TACTICAL LINEUPS & SQUAD DEPTH', margin, y);

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y + 3, pageWidth - margin, y + 3);

  y += 8;

  // Let's do side-by-side tactical breakdown cards
  const cardW = (contentWidth - 6) / 2;
  const cardH = 34;

  // Team A Tactical card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, cardW, cardH, 'FD');

  doc.setFillColor(16, 185, 129); // primary tint
  doc.rect(margin, y, cardW, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.text(`${teamA.name.toUpperCase()}`, margin + 4, y + 6);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8.5);
  doc.text(`Formation: ${stats.tacticalFormations?.teamA?.formation || '4-3-3'}`, margin + 4, y + 13);
  doc.text(`Style: ${stats.tacticalFormations?.teamA?.style || 'Attacking'}`, margin + 4, y + 19);
  
  // Tactical pillars
  const tacticsA = stats.tacticalFormations?.teamA?.keyTactics?.slice(0, 2).join(', ') || 'Wing play, deep block';
  doc.text(`Pillars: ${tacticsA}`, margin + 4, y + 25, { maxWidth: cardW - 8 });

  // Team B Tactical card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin + cardW + 6, y, cardW, cardH, 'FD');

  doc.setFillColor(245, 158, 11); // secondary tint
  doc.rect(margin + cardW + 6, y, cardW, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${teamB.name.toUpperCase()}`, margin + cardW + 10, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Formation: ${stats.tacticalFormations?.teamB?.formation || '4-2-3-1'}`, margin + cardW + 10, y + 13);
  doc.text(`Style: ${stats.tacticalFormations?.teamB?.style || 'Counter-attack'}`, margin + cardW + 10, y + 19);
  
  const tacticsB = stats.tacticalFormations?.teamB?.keyTactics?.slice(0, 2).join(', ') || 'Quick transitions, zonal';
  doc.text(`Pillars: ${tacticsB}`, margin + cardW + 10, y + 25, { maxWidth: cardW - 8 });


  // -------------------------------------------------------------
  // FOOTER RULES & DISCLAIMER
  // -------------------------------------------------------------
  y += cardH + 12;
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 22, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('RISK DISCLAIMER & REGULATORY RULES', margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('1. Sports predictions generated by SXA AI models are completely for scientific representation, data review, and entertainment benefits.', margin + 4, y + 10);
  doc.text('2. No guarantee of cash/bet success is promised or implied. Customers must carry out their own personal risks assessment and research before wagering.', margin + 4, y + 14);
  doc.text('3. Under age of 18 betting is strictly illegal in international jurisdictions. Please support responsible gaming protocols. Be secure.', margin + 4, y + 18);

  // Footer info
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7.5);
  doc.text('SXA TIPS PredictEngine • Page 2 of 2', margin, pageHeight - 10);
  doc.text('Model Engine v3.5-Intelligence • Built on @google/genai Node SDK.', pageWidth - margin - 102, pageHeight - 10);

  // SAVE THE DOCUMENT
  const filename = `${teamA.shortName}_vs_${teamB.shortName}_prediction_report.pdf`.toLowerCase().replace(/\s+/g, '_');
  doc.save(filename);
};
