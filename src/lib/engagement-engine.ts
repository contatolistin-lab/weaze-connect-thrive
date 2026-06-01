export interface UserActivity {
  id: string;
  name: string;
  avatar: string;
  likesReceived: number;
  commentsMade: number;
  sharesReceived: number;
  postsCount: number;
  weeklyGrowth: number;
  engagementRate: number;
}

export interface ScoreDetails {
  likesScore: number;
  commentsScore: number;
  sharesScore: number;
  postsScore: number;
  bonusPoints: number;
}

export interface RankedUser {
  id: string;
  name: string;
  avatar: string;
  score: number;
  badge: string;
  details: ScoreDetails;
}

const WEIGHTS = {
  LIKE: 1,
  COMMENT: 3,
  SHARE: 5,
  POST: 2,
} as const;

interface BonusRule {
  key: keyof UserActivity;
  threshold: number;
  points: number;
  label: string;
}

const BONUSES: BonusRule[] = [
  { key: "commentsMade", threshold: 100, points: 50, label: "Conversador" },
  { key: "weeklyGrowth", threshold: 20, points: 100, label: "Raio" },
  { key: "engagementRate", threshold: 10, points: 200, label: "Destaque" },
  { key: "postsCount", threshold: 50, points: 150, label: "Veterano" },
];

const BADGE_TIERS = [
  { minScore: 2500, badge: "🔥 Fogo" },
  { minScore: 2000, badge: "💜 Top" },
  { minScore: 1500, badge: "⭐ Destaque" },
  { minScore: 1100, badge: "👑 Rainha" },
  { minScore: 700, badge: "🏆 Campeão" },
  { minScore: 400, badge: "💬 Conversador" },
  { minScore: 200, badge: "⚡ Raio" },
  { minScore: 0, badge: "💚 Coração" },
] as const;

export function calculateScore(activity: UserActivity): {
  score: number;
  badge: string;
  details: ScoreDetails;
} {
  const likesScore = activity.likesReceived * WEIGHTS.LIKE;
  const commentsScore = activity.commentsMade * WEIGHTS.COMMENT;
  const sharesScore = activity.sharesReceived * WEIGHTS.SHARE;
  const postsScore = activity.postsCount * WEIGHTS.POST;

  let bonusPoints = 0;
  for (const bonus of BONUSES) {
    const value = activity[bonus.key];
    if (typeof value === "number" && value >= bonus.threshold) {
      bonusPoints += bonus.points;
    }
  }

  const score = likesScore + commentsScore + sharesScore + postsScore + bonusPoints;
  const badge = resolveBadge(score, activity);

  return {
    score,
    badge,
    details: { likesScore, commentsScore, sharesScore, postsScore, bonusPoints },
  };
}

export function resolveBadge(score: number, _activity: UserActivity): string {
  for (const tier of BADGE_TIERS) {
    if (score >= tier.minScore) return tier.badge;
  }
  return BADGE_TIERS[BADGE_TIERS.length - 1].badge;
}

export function computeRanking(users: UserActivity[]): RankedUser[] {
  return users
    .map((u) => {
      const { score, badge, details } = calculateScore(u);
      return { id: u.id, name: u.name, avatar: u.avatar, score, badge, details };
    })
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}
