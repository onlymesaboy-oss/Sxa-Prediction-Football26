import { GoogleGenAI, Type } from "@google/genai";
import { MatchSession, Prediction, MatchStats, LiveMatchData } from "../types";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please set it in your secrets.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export const getLiveMatchUpdate = async (match: MatchSession): Promise<LiveMatchData> => {
  try {
    const client = getAI();
    
    const response = await client.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Search for the current live score and match events for: ${match.teamA.name} vs ${match.teamB.name}.
      This match belongs to the ${match.league.name}.
      
      Look for:
      1. Current score (if currently playing or finished).
      2. Match status (scheduled, live, halftime, finished, delayed).
      3. Key events: Goals with scorers and minutes, cards, and substitutions.
      4. Current match minute.
      5. Official Match Start Time (Kickoff time) from live sources.
      
      Use Google Search to ensure the data is as real-time as possible.`,
      config: {
        tools: [{ googleSearch: {} }],
        toolConfig: { includeServerSideToolInvocations: true },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING, enum: ["scheduled", "live", "halftime", "finished", "delayed"] },
            currentMinute: { type: Type.NUMBER },
            actualStartTime: { type: Type.STRING },
            score: {
              type: Type.OBJECT,
              properties: {
                home: { type: Type.NUMBER },
                away: { type: Type.NUMBER }
              },
              required: ["home", "away"]
            },
            events: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  minute: { type: Type.NUMBER },
                  type: { type: Type.STRING, enum: ["goal", "card", "substitution", "var", "other"] },
                  team: { type: Type.STRING, enum: ["home", "away"] },
                  player: { type: Type.STRING },
                  detail: { type: Type.STRING }
                },
                required: ["minute", "type", "team", "player", "detail"]
              }
            }
          },
          required: ["status", "currentMinute", "score", "events"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response text from Gemini");
    return {
      ...JSON.parse(text),
      lastUpdated: new Date().toISOString()
    };
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    console.error("Gemini Live Update Error:", errorMsg);
    
    // Check for specific error types to pass to the UI
    if (errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("quota")) {
      throw new Error("QUOTA_EXCEEDED");
    }
    if (errorMsg.includes("500") || errorMsg.includes("INTERNAL")) {
      throw new Error("SERVER_ERROR");
    }

    return {
      status: "scheduled",
      currentMinute: 0,
      score: { home: 0, away: 0 },
      events: [],
      lastUpdated: new Date().toISOString()
    };
  }
};

// Helper function to ensure consistent and winning handicap based on the predicted score
function validateAndAdjustHandicap(
  prediction: Prediction,
  teamA: { name: string; shortName: string },
  teamB: { name: string; shortName: string }
): Prediction {
  try {
    const scoreStr = prediction.correctScore;
    if (!scoreStr) return prediction;

    const scoreMatch = scoreStr.match(/(\d+)\s*[-:]\s*(\d+)/);
    if (!scoreMatch) return prediction;

    const scoreH = parseInt(scoreMatch[1], 10);
    const scoreA = parseInt(scoreMatch[2], 10);

    if (isNaN(scoreH) || isNaN(scoreA)) return prediction;

    const currentHandicap = prediction.handicap || "";
    const hLower = currentHandicap.toLowerCase();
    const teamALower = teamA.name.toLowerCase();
    const teamBLower = teamB.name.toLowerCase();
    const shortALower = teamA.shortName.toLowerCase();
    const shortBLower = teamB.shortName.toLowerCase();

    let isHomeSelected = true;
    if (
      hLower.includes(teamBLower) ||
      hLower.includes(shortBLower) ||
      hLower.includes("away")
    ) {
      isHomeSelected = false;
    } else if (
      hLower.includes(teamALower) ||
      hLower.includes(shortALower) ||
      hLower.includes("home")
    ) {
      isHomeSelected = true;
    } else {
      isHomeSelected = scoreH >= scoreA;
    }

    let currentSpread = 0.0;
    const numMatch = currentHandicap.replace(/\s+/g, '').match(/[-+]?\d*\.?\d+/);
    if (numMatch) {
      currentSpread = parseFloat(numMatch[0]);
    } else {
      if (hLower.includes("draw") || hLower.includes("level") || hLower.includes("0")) {
        currentSpread = 0.0;
      }
    }

    // Determine the goal difference under predicted score
    const diff = isHomeSelected ? (scoreH - scoreA) : (scoreA - scoreH);
    const outcome = diff + currentSpread;

    // A bet wins if positive outcome >= 0.25
    const isWinning = outcome >= 0.25;

    if (!isWinning) {
      // Non-winning handicap, must adjust to a guaranteed winner!
      if (scoreH > scoreA) {
        // Home wins, recommend Home with safe winning margin of -0.5
        prediction.handicap = `${teamA.name} -0.5`;
      } else if (scoreH < scoreA) {
        // Away wins, recommend Away with safe winning margin of -0.5
        prediction.handicap = `${teamB.name} -0.5`;
      } else {
        // Draw, recommend +0.5 to ensure a win.
        const suggestedTeam = isHomeSelected ? teamA.name : teamB.name;
        prediction.handicap = `${suggestedTeam} +0.5`;
      }
    } else {
      // If the spread is winning, check if it fits the safety requirement or user's explicit request.
      // If we have Home -1.5 on 2-0 score, user considers it a loss/risk - we cap/adjust spread to -0.5
      if (Math.abs(currentSpread) > 0.5) {
        if (scoreH > scoreA) {
          prediction.handicap = `${teamA.name} -0.5`;
        } else if (scoreH < scoreA) {
          prediction.handicap = `${teamB.name} -0.5`;
        }
      }
    }

    // Format check to ensure no "+0" or "-0" endings
    if (prediction.handicap.endsWith(' 0') || prediction.handicap.endsWith(' -0') || prediction.handicap.endsWith(' +0') || prediction.handicap.endsWith(' 0.0')) {
      const isHome = prediction.handicap.includes(teamA.name);
      prediction.handicap = `${isHome ? teamA.name : teamB.name} 0.0`;
    }
  } catch (err) {
    console.error("Error in validateAndAdjustHandicap:", err);
  }
  return prediction;
}

export const generateMatchPrediction = async (match: MatchSession): Promise<{ prediction: Prediction; stats: MatchStats }> => {
  try {
    const client = getAI();
    
    const response = await client.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Act as a professional high-stakes football analyst and betting tipster. Analyze the upcoming match: ${match.teamA.name} vs ${match.teamB.name} in the ${match.league.name}.
      
      Generate a prediction that matches the standard of international professional betting sites (like 188Bet, M88, or Bet365).
      
      IMPORTANT: Use the integrated Google Search tool to find CURRENT real-time betting odds and market data for this specific match. Provide the actual market consensus from reputable bookmakers.
      
      Requirements for specific fields:
      - "correctScore": Predict the exact full-time score (e.g., "2-1", "3-0").
      - "overUnder": Provide a specific professional goal line recommendation (e.g., "Over 2.75", "Under 3.5"). 
        CRITICAL: This MUST be logically consistent with your "correctScore". If you predict 2-1 (3 goals total), an "Over 2.5" bet would win, while "Under 3.5" would also win. Choose the most confident side.
      - "handicap": Provide a clear Asian Handicap pick. You MUST specify the team name and the spread (e.g., "${match.teamA.name} -0.5" or "${match.teamB.name} +0.25"). Use exact professional notations. 
        CRITICAL: Your handicap pick MUST result in a WIN based on your predicted "correctScore". Choose the side (Home or Away) that has the best betting value based on your analysis and predicted score.
      - "btts": "Yes" or "No". Must match "correctScore".
      - "halfTime": Predicted score at half-time. Must match "correctScore" flow.
      - "corners": Specific corner line (e.g., "Over 9.5", "Under 10.5").
      - "reasoning": Provide a deep tactical analysis in Khmer (ភាសាខ្មែរ). Specifically compare your suggested Asian Handicap pick with the current market consensus. Explain why your predicted score makes the suggested handicap a value bet.
      - "marketOdds": Current real-time market data found via search. "handicap" should be the EXACT current live market baseline. For Asian leagues (UAE Pro League, Qatar Stars League, etc.), prioritize searching local sports news and betting sites for the most accurate regional lines.
      - "actualStartTime": The official kickoff time (e.g., "May 5, 8:00 PM").
      
      Consistency Rule:
      - Every prediction (Score, O/U, Handicap, BTTS) MUST be 100% logically aligned. If the score is 1-0, O/U cannot be "Over 2.5", and Handicap cannot be "Home -1.5".
      - Your "handicap" field is your RECOMMENDATION for the bet. Choose the side that wins based on your analysis.
      
      Team Correction Logic:
      - For "correctedTeams", search for the OFFICIAL full names and high-quality logo URLs for ${match.teamA.name} and ${match.teamB.name}. Use logos from reputable sports sources.
      
      Also provide detailed estimated team stats for context.`,
      config: {
        tools: [{ googleSearch: {} }],
        toolConfig: { includeServerSideToolInvocations: true },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prediction: {
              type: Type.OBJECT,
              properties: {
                correctScore: { type: Type.STRING },
                overUnder: { type: Type.STRING },
                handicap: { type: Type.STRING },
                btts: { type: Type.STRING, enum: ["Yes", "No"] },
                halfTime: { type: Type.STRING },
                corners: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                reasoning: { type: Type.STRING },
                marketOdds: {
                  type: Type.OBJECT,
                  properties: {
                    oneXTwo: {
                      type: Type.OBJECT,
                      properties: {
                        home: { type: Type.NUMBER },
                        draw: { type: Type.NUMBER },
                        away: { type: Type.NUMBER }
                      },
                      required: ["home", "draw", "away"]
                    },
                    overUnder: { type: Type.STRING },
                    handicap: { type: Type.STRING },
                    source: { type: Type.STRING }
                  },
                  required: ["oneXTwo", "overUnder", "handicap", "source"]
                }
              },
              required: ["correctScore", "overUnder", "handicap", "btts", "halfTime", "corners", "confidence", "reasoning", "marketOdds"]
            },
            stats: {
              type: Type.OBJECT,
              properties: {
                teamAForm: { type: Type.ARRAY, items: { type: Type.STRING } },
                teamBForm: { type: Type.ARRAY, items: { type: Type.STRING } },
                teamAGoalsAvg: { type: Type.NUMBER },
                teamBGoalsAvg: { type: Type.NUMBER },
                h2h: {
                  type: Type.OBJECT,
                  properties: {
                    teamAWins: { type: Type.NUMBER },
                    teamBWins: { type: Type.NUMBER },
                    draws: { type: Type.NUMBER },
                    totalMatches: { type: Type.NUMBER },
                    avgGoals: { type: Type.NUMBER },
                    lastResults: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["teamAWins", "teamBWins", "draws", "lastResults", "totalMatches", "avgGoals"]
                },
                venue: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    city: { type: Type.STRING },
                    capacity: { type: Type.NUMBER }
                  },
                  required: ["name", "city", "capacity"]
                },
                referee: { type: Type.STRING },
                expectedAttendance: { type: Type.NUMBER },
                actualStartTime: { type: Type.STRING },
                correctedTeams: {
                  type: Type.OBJECT,
                  properties: {
                    teamA: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        shortName: { type: Type.STRING },
                        logo: { type: Type.STRING }
                      },
                      required: ["name", "shortName", "logo"]
                    },
                    teamB: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        shortName: { type: Type.STRING },
                        logo: { type: Type.STRING }
                      },
                      required: ["name", "shortName", "logo"]
                    }
                  }
                },
                historicalStats: {
                  type: Type.OBJECT,
                  properties: {
                    teamA: {
                      type: Type.OBJECT,
                      properties: {
                        goalsScored: { type: Type.NUMBER },
                        goalsConceded: { type: Type.NUMBER },
                        possessionAvg: { type: Type.NUMBER },
                        cleanSheets: { type: Type.NUMBER },
                        yellowCards: { type: Type.NUMBER },
                        redCards: { type: Type.NUMBER },
                        seasonRecord: {
                          type: Type.OBJECT,
                          properties: {
                            wins: { type: Type.NUMBER },
                            draws: { type: Type.NUMBER },
                            losses: { type: Type.NUMBER }
                          },
                          required: ["wins", "draws", "losses"]
                        }
                      },
                      required: ["goalsScored", "goalsConceded", "possessionAvg", "cleanSheets", "yellowCards", "redCards", "seasonRecord"]
                    },
                    teamB: {
                      type: Type.OBJECT,
                      properties: {
                        goalsScored: { type: Type.NUMBER },
                        goalsConceded: { type: Type.NUMBER },
                        possessionAvg: { type: Type.NUMBER },
                        cleanSheets: { type: Type.NUMBER },
                        yellowCards: { type: Type.NUMBER },
                        redCards: { type: Type.NUMBER },
                        seasonRecord: {
                          type: Type.OBJECT,
                          properties: {
                            wins: { type: Type.NUMBER },
                            draws: { type: Type.NUMBER },
                            losses: { type: Type.NUMBER }
                          },
                          required: ["wins", "draws", "losses"]
                        }
                      },
                      required: ["goalsScored", "goalsConceded", "possessionAvg", "cleanSheets", "yellowCards", "redCards", "seasonRecord"]
                    }
                  },
                  required: ["teamA", "teamB"]
                },
                tacticalFormations: {
                  type: Type.OBJECT,
                  properties: {
                    teamA: {
                      type: Type.OBJECT,
                      properties: {
                        formation: { type: Type.STRING },
                        style: { type: Type.STRING },
                        keyTactics: { type: Type.ARRAY, items: { type: Type.STRING } }
                      },
                      required: ["formation", "style", "keyTactics"]
                    },
                    teamB: {
                      type: Type.OBJECT,
                      properties: {
                        formation: { type: Type.STRING },
                        style: { type: Type.STRING },
                        keyTactics: { type: Type.ARRAY, items: { type: Type.STRING } }
                      },
                      required: ["formation", "style", "keyTactics"]
                    }
                  },
                  required: ["teamA", "teamB"]
                },
                playerStats: {
                  type: Type.OBJECT,
                  properties: {
                    teamA: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          role: { type: Type.STRING },
                          rating: { type: Type.NUMBER },
                          goals: { type: Type.NUMBER },
                          assists: { type: Type.NUMBER },
                          status: { type: Type.STRING, enum: ["Healthy", "Injured", "Suspended"] }
                        },
                        required: ["name", "role", "rating", "status"]
                      }
                    },
                    teamB: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          role: { type: Type.STRING },
                          rating: { type: Type.NUMBER },
                          goals: { type: Type.NUMBER },
                          assists: { type: Type.NUMBER },
                          status: { type: Type.STRING, enum: ["Healthy", "Injured", "Suspended"] }
                        },
                        required: ["name", "role", "rating", "status"]
                      }
                    }
                  },
                  required: ["teamA", "teamB"]
                }
              },
              required: ["teamAForm", "teamBForm", "teamAGoalsAvg", "teamBGoalsAvg", "h2h", "venue", "referee", "expectedAttendance", "historicalStats", "tacticalFormations", "playerStats"]
            }
          },
          required: ["prediction", "stats"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response text from Gemini");
    
    const result = JSON.parse(text);
    if (result && result.prediction) {
      result.prediction = validateAndAdjustHandicap(result.prediction, match.teamA, match.teamB);
    }
    return result;
  } catch (error) {
    console.error("Gemini Prediction Error:", error);
    // Fallback data if API fails or is missing key
    const fallbackPrediction = {
      correctScore: "1-1",
      overUnder: "Under 2.5",
      handicap: `${match.teamA.name} +0.5`,
      btts: "Yes",
      halfTime: "0-0",
      corners: "Over 8.5",
      confidence: 50,
      reasoning: "ការវិភាគមិនទាន់អាចប្រើបានទេនៅពេលនេះ ដោយសារបញ្ហាបច្ចេកទេស។ សូមព្យាយាមម្តងទៀតនៅពេលក្រោយ។",
      marketOdds: {
        oneXTwo: { home: 2.10, draw: 3.40, away: 3.20 },
        overUnder: "2.5",
        handicap: "0.0",
        source: "Market Average"
      }
    };
    
    const adjustedFallbackPrediction = validateAndAdjustHandicap(fallbackPrediction as any, match.teamA, match.teamB);

    return {
      prediction: adjustedFallbackPrediction,
      stats: {
        teamAForm: ["D", "D", "D", "D", "D"],
        teamBForm: ["D", "D", "D", "D", "D"],
        teamAGoalsAvg: 1.0,
        teamBGoalsAvg: 1.0,
        h2h: {
          "teamAWins": 0,
          "teamBWins": 0,
          "draws": 0,
          "totalMatches": 0,
          "avgGoals": 0,
          "lastResults": ["1-1"]
        },
        venue: {
          name: "Main Stadium",
          city: "Neutral",
          capacity: 45000
        },
        referee: "TBD",
        expectedAttendance: 35000,
        actualStartTime: "TBD",
        historicalStats: {
          teamA: {
            goalsScored: 28,
            goalsConceded: 22,
            possessionAvg: 51.5,
            cleanSheets: 8,
            yellowCards: 42,
            redCards: 1,
            seasonRecord: { wins: 14, draws: 6, losses: 8 }
          },
          teamB: {
            goalsScored: 26,
            goalsConceded: 24,
            possessionAvg: 49.8,
            cleanSheets: 7,
            yellowCards: 45,
            redCards: 2,
            seasonRecord: { wins: 12, draws: 8, losses: 8 }
          }
        },
        tacticalFormations: {
          teamA: {
            formation: "4-3-3",
            style: "Balanced Attacking",
            keyTactics: ["High Pressing", "Wing Rotation"]
          },
          teamB: {
            formation: "4-2-3-1",
            style: "Counter Attacking",
            keyTactics: ["Low Block", "Quick Transitions"]
          }
        },
        playerStats: {
          teamA: [
            { name: "Top Scorer", role: "Forward", rating: 7.8, goals: 12, assists: 4, status: "Healthy" },
            { name: "Playmaker", role: "Midfielder", rating: 7.5, goals: 4, assists: 8, status: "Healthy" },
            { name: "Key Defender", role: "Defender", rating: 7.3, goals: 1, assists: 1, status: "Healthy" }
          ],
          teamB: [
            { name: "Star Striker", role: "Forward", rating: 7.7, goals: 10, assists: 2, status: "Healthy" },
            { name: "Creator", role: "Midfielder", rating: 7.4, goals: 3, assists: 7, status: "Healthy" },
            { name: "Captain CB", role: "Defender", rating: 7.2, goals: 0, assists: 0, status: "Healthy" }
          ]
        }
      }
    };
  }
};
