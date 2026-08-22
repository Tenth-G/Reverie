/**
 * Public API surface for the player and feature modules.
 *
 * `client` contains the shared transport and existing typed helpers,
 * `extended` contains normalized domain workflows, and `generated` exposes
 * every non-account-sensitive NeteaseCloudMusicApi route.
 */
export * from "./client";
export * from "./extended";
export * from "./generated";
export * from "./search";
