import axios from "axios";

const LC_GRAPHQL = "https://leetcode.com/graphql";

// Unofficial endpoint — no auth needed for public profile stats, but the
// schema has drifted before. If this breaks, check the query against
// leetcode.com's network tab on any public profile page.
const QUERY = `
  query userStats($username: String!) {
    matchedUser(username: $username) {
      username
      submitStats {
        acSubmissionNum {
          difficulty
          count
        }
      }
      profile {
        ranking
      }
    }
  }
`;

export async function fetchLeetCodeStats(username) {
  const { data } = await axios.post(
    LC_GRAPHQL,
    { query: QUERY, variables: { username } },
    { headers: { "Content-Type": "application/json" } }
  );

  const user = data?.data?.matchedUser;
  if (!user) throw new Error(`LeetCode user not found: ${username}`);

  const totalEntry = user.submitStats.acSubmissionNum.find(
    (e) => e.difficulty === "All"
  );

  return {
    totalSolved: totalEntry?.count ?? 0,
    ranking: user.profile?.ranking ?? 0,
  };
}
