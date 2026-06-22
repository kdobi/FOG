import { spawn } from "node:child_process";
import { resolve } from "node:path";

const processes = [];

function start(label, executable, args) {
  const child = spawn(executable, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  });
  child.on("exit", (code) => {
    if (code && code !== 0) console.error(`[${label}] exited with code ${code}`);
  });
  processes.push(child);
}

start("api", process.execPath, [resolve("server.mjs")]);
start("web", process.execPath, [resolve("node_modules/vite/bin/vite.js"), "--host", "127.0.0.1"]);

function stop() {
  processes.forEach((child) => {
    if (!child.killed) child.kill("SIGTERM");
  });
}

process.on("SIGINT", () => {
  stop();
  process.exit(0);
});

process.on("SIGTERM", () => {
  stop();
  process.exit(0);
});

