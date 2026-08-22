const routes = [
  ["/mv/detail/info?mvid=1", "GET"],
  ["/video/detail/info?vid=1", "GET"],
  ["/resource/like?type=1&id=1&t=1", "POST"],
  ["/mv/sub?mvid=1&t=1", "POST"],
  ["/video/sub?id=1&t=1", "POST"],
];

const base = process.env.NCM_API_BASE || "http://127.0.0.1:3939";
const failures = [];

(async () => {
  for (const [path, method] of routes) {
    try {
      const response = await fetch(`${base}${path}`, {
        method,
        redirect: "manual",
      });
      // Anonymous requests may fail upstream; 404 means the sidecar route is missing.
      if (response.status === 404) failures.push(`${method} ${path}: 404`);
      else console.log(`${method} ${path}: ${response.status}`);
    } catch (error) {
      failures.push(
        `${method} ${path}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  if (failures.length) {
    console.error(failures.join("\n"));
    process.exitCode = 1;
  } else {
    console.log("media route smoke test passed");
  }
})();
