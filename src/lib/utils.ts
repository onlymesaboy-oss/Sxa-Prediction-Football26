import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export function cleanTeamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(fc|cf|cfc|sc|rc|utd|united|city|town|hotspur|atletico|athletic|club|association|de|st|saint|germain|preah|khan|reach|ministry|of|interior|fa|f\s*.\s*c\s*)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function findBestMatch(query: string, items: { name: string; shortName: string }[]): any {
  if (!query) return null;
  const q = query.toLowerCase().trim();

  // Synonyms and abbreviation variations key dictionary
  const synonyms: Record<string, string> = {
    'man u': 'manchester united',
    'man utd': 'manchester united',
    'man united': 'manchester united',
    'mufc': 'manchester united',
    'man city': 'manchester city',
    'mancity': 'manchester city',
    'mcfc': 'manchester city',
    'barca': 'barcelona',
    'fcb': 'barcelona',
    'real': 'real madrid',
    'atletico': 'atletico madrid',
    'atleti': 'atletico madrid',
    'spurs': 'tottenham',
    'psg': 'psg',
    'dortmund': 'b. dortmund',
    'bvb': 'b. dortmund',
    'bayern': 'bayern munich',
    'juve': 'juventus',
    'svay rieng': 'pkr svay rieng',
    'crown': 'phnom penh crown',
    'phnom penh': 'phnom penh crown',
    'visakha': 'visakha fc',
    'naga': 'nagaworld',
    'tiffy': 'tiffy army',
    'isi': 'isi dangkor senchey',
  };

  const synonymTarget = synonyms[q];

  let bestMatch = null;
  let highestScore = 0;

  for (const item of items) {
    const name = item.name.toLowerCase();
    const short = item.shortName.toLowerCase();
    let score = 0;

    // 1. Exact Match on name or shortName (Score: 100)
    if (name === q || short === q) {
      score = 100;
    }
    // 2. Exact Synonym Match (Score: 95)
    else if (synonymTarget && name === synonymTarget) {
      score = 95;
    }
    // 3. Cleaned Match (Score: 88)
    else if (cleanTeamName(name) === cleanTeamName(q)) {
      score = 88;
    }
    // 4. Synonym is a substring or vice versa (Score: 85)
    else if (synonymTarget && (name.includes(synonymTarget) || synonymTarget.includes(name))) {
      score = 85;
    }
    // 5. Short name match (Score: 80)
    else if (short === q) {
      score = 80;
    }
    // 6. Direct Substring Containment (Score: 70 - 79 based on match ratio)
    else if (name.includes(q) && q.length >= 3) {
      const ratio = q.length / name.length;
      score = 70 + ratio * 9;
    } else if (q.includes(name) && name.length >= 3) {
      const ratio = name.length / q.length;
      score = 65 + ratio * 9;
    }
    // 7. Cleaned Substring Containment (Score: 60 - 64)
    else if (cleanTeamName(name).includes(cleanTeamName(q)) && cleanTeamName(q).length >= 3) {
      const ratio = cleanTeamName(q).length / cleanTeamName(name).length;
      score = 60 + ratio * 4;
    } else if (cleanTeamName(q).includes(cleanTeamName(name)) && cleanTeamName(name).length >= 3) {
      const ratio = cleanTeamName(name).length / cleanTeamName(q).length;
      score = 55 + ratio * 4;
    }
    // 8. Word-Initial Acronym Support (e.g., PPC for Phnom Penh Crown, PSG for Paris Saint Germain)
    else {
      const words = name.split(/\s+/).filter(w => w.length > 0);
      if (words.length >= 2) {
        const acronym = words.map(w => w[0]).join('');
        const cleanWords = cleanTeamName(name).split(/\s+/).filter(w => w.length > 0);
        const cleanAcronym = cleanWords.map(w => w[0]).join('');

        if (acronym === q || cleanAcronym === q) {
          score = 75;
        }
      }
    }

    // 9. Normalized Levenshtein distance as fallback (Score: up to 50)
    if (score === 0) {
      const dist = getLevenshteinDistance(q, name);
      const maxLength = Math.max(q.length, name.length);
      const similarity = maxLength > 0 ? (1 - dist / maxLength) : 0;
      if (similarity >= 0.6) {
        score = Math.floor(similarity * 50);
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  }

  // Set confidence threshold to filter out bad matches
  return highestScore >= 20 ? bestMatch : null;
}
