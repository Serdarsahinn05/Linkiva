import { env } from "@/lib/env";
import { GITHUB_LOGIN } from "@/lib/validation/github";

/**
 * A GitHub user's repositories for the portfolio import (ROADMAP Faz 12). Plain fetch to GitHub's API on a fixed host
 * with a validated user name, so no user-supplied URL is fetched. With GITHUB_TOKEN the pinned repositories are read
 * (GraphQL needs a token); without it, the most recently pushed ones that are not forks or archived.
 */


export type GithubRepo = { name: string; description: string | null; url: string; homepage: string | null; stars: number; topics: string[]; language: string | null };
export type GithubProfile = { name: string | null; bio: string | null; repos: GithubRepo[]; pinned: boolean };

const MAX_REPOS = 8;
const headers = (): HeadersInit => ({
  accept: "application/vnd.github+json",
  "user-agent": "Linkiva",
  ...(env.GITHUB_TOKEN && { authorization: `Bearer ${env.GITHUB_TOKEN}` }),
});

const PINNED_QUERY = `query($login: String!) {
  user(login: $login) {
    name
    bio
    pinnedItems(first: 6, types: REPOSITORY) {
      nodes { ... on Repository { name description url homepageUrl stargazerCount primaryLanguage { name } repositoryTopics(first: 5) { nodes { topic { name } } } } }
    }
  }
}`;

type PinnedNode = { name: string; description: string | null; url: string; homepageUrl: string | null; stargazerCount: number; primaryLanguage: { name: string } | null; repositoryTopics: { nodes: { topic: { name: string } }[] } };
type RestRepo = { name: string; description: string | null; html_url: string; homepage: string | null; stargazers_count: number; topics?: string[]; language: string | null; fork: boolean; archived: boolean; pushed_at: string };

async function pinned(login: string): Promise<GithubProfile | null> {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { ...headers(), "content-type": "application/json" },
    body: JSON.stringify({ query: PINNED_QUERY, variables: { login } }),
    signal: AbortSignal.timeout(6000),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: { user: { name: string | null; bio: string | null; pinnedItems: { nodes: PinnedNode[] } } | null } };
  const user = json.data?.user;
  if (!user) return null;
  const repos = user.pinnedItems.nodes.map((n) => ({
    name: n.name,
    description: n.description,
    url: n.url,
    homepage: n.homepageUrl,
    stars: n.stargazerCount,
    topics: n.repositoryTopics.nodes.map((t) => t.topic.name),
    language: n.primaryLanguage?.name ?? null,
  }));
  return { name: user.name, bio: user.bio, repos, pinned: repos.length > 0 };
}

async function recent(login: string): Promise<GithubProfile | null> {
  const get = (path: string) => fetch(`https://api.github.com${path}`, { headers: headers(), signal: AbortSignal.timeout(6000), cache: "no-store" });
  const [userRes, reposRes] = await Promise.all([get(`/users/${login}`), get(`/users/${login}/repos?type=owner&sort=pushed&per_page=30`)]);
  if (!userRes.ok || !reposRes.ok) return null;
  const user = (await userRes.json()) as { name: string | null; bio: string | null };
  const repos = ((await reposRes.json()) as RestRepo[])
    // <login>/<login> is the profile README, not a project.
    .filter((r) => !r.fork && !r.archived && r.name.toLowerCase() !== login.toLowerCase())
    .slice(0, MAX_REPOS)
    .map((r) => ({ name: r.name, description: r.description, url: r.html_url, homepage: r.homepage || null, stars: r.stargazers_count, topics: r.topics ?? [], language: r.language }));
  return { name: user.name, bio: user.bio, repos, pinned: false };
}

/** null when the user does not exist or GitHub cannot be reached. */
export async function readGithub(login: string): Promise<GithubProfile | null> {
  if (!GITHUB_LOGIN.test(login)) return null;
  try {
    if (env.GITHUB_TOKEN) {
      const fromPins = await pinned(login);
      if (fromPins?.pinned) return fromPins;
    }
    return await recent(login);
  } catch {
    return null;
  }
}
