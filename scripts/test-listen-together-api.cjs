const routes = [
  ["/listentogether/room/create", "POST"],
  ["/listentogether/room/check?roomId=1", "GET"],
  ["/listentogether/status", "GET"],
  ["/listentogether/sync/playlist/get?roomId=1", "GET"],
  ["/listentogether/end", "POST"],
  ["/listentogether/accept?roomId=1&inviterId=1", "POST"],
  [
    "/listentogether/heatbeat?roomId=1&songId=1&playStatus=false&progress=0",
    "POST",
  ],
  [
    "/listentogether/play/command?roomId=1&commandType=play&progress=0&playStatus=false&clientSeq=1",
    "POST",
  ],
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
      // Anonymous protected routes can fail upstream; a concrete HTTP response
      // still proves the sidecar registered and forwarded the route.
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
    console.log("listen together route smoke test passed");
  }
})();
