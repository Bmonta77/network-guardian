import os from "node:os";
import process from "node:process";
import fs from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createClient } from "@supabase/supabase-js";

if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile();
  } catch {
    // Environment variables may also be supplied by a service manager/container.
  }
} else if (fs.existsSync(".env")) {
  for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match || match[2] === "") continue;
    const value = match[2].replace(/^['"]|['"]$/g, "");
    process.env[match[1]] ??= value;
  }
}

const execFileAsync = promisify(execFile);
const version = "0.1.0";
const intervalMs = Number(process.env.SCAN_INTERVAL_SECONDS ?? 60) * 1000;
const commandPollMs = Number(process.env.COMMAND_POLL_SECONDS ?? 5) * 1000;
const timeoutSeconds = Number(process.env.PING_TIMEOUT_SECONDS ?? 2);
const concurrency = Number(process.env.SCAN_CONCURRENCY ?? 24);
const required = [
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "NETWORK_GUARDIAN_AGENT_TOKEN",
];

for (const name of required) {
  if (!process.env[name]) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
}

const token = process.env.NETWORK_GUARDIAN_AGENT_TOKEN;
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

function ipv4ToNumber(ip) {
  return ip
    .split(".")
    .map(Number)
    .reduce((value, part) => (value << 8) + part, 0) >>> 0;
}

function numberToIpv4(value) {
  return [24, 16, 8, 0].map((shift) => (value >>> shift) & 255).join(".");
}

function isPrivateIp(ip) {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

function expandPrivateCidr(cidr) {
  const [address, prefixText] = cidr.split("/");
  const prefix = Number(prefixText);
  if (!isPrivateIp(address)) {
    throw new Error(`Refusing non-private range: ${cidr}`);
  }
  if (!Number.isInteger(prefix) || prefix < 16 || prefix > 30) {
    throw new Error(`MVP agent supports private IPv4 prefixes /16 through /30: ${cidr}`);
  }

  const hostCount = 2 ** (32 - prefix);
  const mask = (0xffffffff << (32 - prefix)) >>> 0;
  const network = ipv4ToNumber(address) & mask;
  const addresses = [];
  for (let offset = 1; offset < hostCount - 1; offset += 1) {
    addresses.push(numberToIpv4((network + offset) >>> 0));
  }
  return addresses;
}

async function ping(ip) {
  const platform = process.platform;
  const args =
    platform === "win32"
      ? ["-n", "1", "-w", String(timeoutSeconds * 1000), ip]
      : platform === "darwin"
        ? ["-c", "1", "-W", String(timeoutSeconds * 1000), ip]
        : ["-c", "1", "-W", String(timeoutSeconds), ip];
  const started = performance.now();
  try {
    await execFileAsync("ping", args, { timeout: (timeoutSeconds + 1) * 1000 });
    return { status: "online", latency_ms: performance.now() - started };
  } catch {
    return { status: "offline", latency_ms: null };
  }
}

async function mapWithConcurrency(items, worker) {
  const queue = [...items];
  const runners = Array.from(
    { length: Math.min(concurrency, queue.length) },
    async () => {
      while (queue.length) {
        const item = queue.shift();
        if (item) await worker(item);
      }
    },
  );
  await Promise.all(runners);
}

async function getConfig() {
  const { data: config, error: configError } = await supabase.rpc(
    "agent_get_config",
    { raw_token: token },
  );
  if (configError) throw configError;
  return config;
}

async function heartbeat() {
  const { error } = await supabase.rpc("agent_heartbeat", {
    raw_token: token,
    heartbeat: {
      hostname: os.hostname(),
      version,
      metadata: { platform: process.platform, arch: process.arch },
    },
  });
  if (error) throw error;
}

async function scan(config) {
  if (!config.ranges?.length) {
    throw new Error("No enabled private scan ranges are configured.");
  }
  const knownIps = new Set(config.known_ips ?? []);
  for (const range of config.ranges ?? []) {
    const addresses = expandPrivateCidr(range.cidr);
    console.log(`Scanning ${range.cidr} (${addresses.length} hosts)`);
    await mapWithConcurrency(addresses, async (ip) => {
      const result = await ping(ip);
      if (result.status === "offline" && !knownIps.has(ip)) return;
      const { error } = await supabase.rpc("agent_report_scan", {
        raw_token: token,
        report: {
          vlan_id: range.vlan_id,
          ip_address: ip,
          name: ip,
          checked_at: new Date().toISOString(),
          ...result,
        },
      });
      if (error) console.error(`Failed to report ${ip}:`, error.message);
    });
  }
}

let scanRunning = false;

async function runScheduledScan() {
  if (scanRunning) return;
  scanRunning = true;
  try {
    const config = await getConfig();
    await heartbeat();
    await scan(config);
    console.log(`Scan completed at ${new Date().toISOString()}`);
  } catch (error) {
    console.error("Scan failed:", error);
  } finally {
    scanRunning = false;
  }
}

async function checkForManualScan() {
  if (scanRunning) return;

  try {
    const config = await getConfig();
    const requestedAt = config.scan_requested_at;
    const completedAt = config.scan_completed_at;
    if (
      !requestedAt ||
      (completedAt && new Date(completedAt) >= new Date(requestedAt))
    ) {
      return;
    }

    const { data: claimed, error: claimError } = await supabase.rpc(
      "agent_start_scan",
      { raw_token: token, requested_at: requestedAt },
    );
    if (claimError) throw claimError;
    if (!claimed) return;

    scanRunning = true;
    console.log(`Manual scan requested at ${requestedAt}`);
    try {
      await heartbeat();
      await scan(config);
      const { error } = await supabase.rpc("agent_complete_scan", {
        raw_token: token,
        requested_at: requestedAt,
        error_message: null,
      });
      if (error) throw error;
      console.log(`Manual scan completed at ${new Date().toISOString()}`);
    } catch (error) {
      await supabase.rpc("agent_complete_scan", {
        raw_token: token,
        requested_at: requestedAt,
        error_message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      scanRunning = false;
    }
  } catch (error) {
    console.error("Manual scan check failed:", error);
  }
}

await runScheduledScan();
if (!process.argv.includes("--once")) {
  setInterval(() => void runScheduledScan(), intervalMs);
  setInterval(() => void checkForManualScan(), commandPollMs);
  setInterval(
    () => void heartbeat().catch((error) => console.error("Heartbeat failed:", error)),
    Math.min(intervalMs, 30_000),
  );
}
