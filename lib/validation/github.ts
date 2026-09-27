/** A GitHub user name: letters, digits and single hyphens, 1–39 characters, not starting or ending with a hyphen. */
export const GITHUB_LOGIN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
