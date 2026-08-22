const routes = [
  ["/listen/data/total", "GET"],
  ["/listen/data/realtime/report?type=week", "GET"],
  ["/listen/data/report?type=year", "GET"],
  ["/listen/data/today/song", "GET"],
  ["/listen/data/year/report", "GET"],
  ["/summary/annual?year=2025", "GET"],
  ["/vip/timemachine", "GET"],
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
      if (response.status === 404)
        console.log(`${method} ${path}: 404 (upstream empty response)`);
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
  } else console.log("listen reports route smoke test passed");
})();
