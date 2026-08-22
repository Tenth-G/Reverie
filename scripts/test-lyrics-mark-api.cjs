const routes = [
  ["/song/lyrics/mark?id=1", "GET"],
  ["/song/lyrics/mark/add?id=1&markId=&data=%5B%5D", "POST"],
  ["/song/lyrics/mark/del?id=1", "POST"],
  ["/song/lyrics/mark/user/page?limit=1&offset=0", "GET"],
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
  } else console.log("lyrics mark route smoke test passed");
})();
