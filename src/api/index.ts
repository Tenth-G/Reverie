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
export * from "./profile";
export * from "./collection";
export * from "./notification";
export * from "./comment";
export * from "./cloud";
export * from "./playlist";
export * from "./media";
export * from "./yunbei";
export * from "./recent";
export * from "./recommendHistory";
export * from "./discovery";
export * from "./vip";
