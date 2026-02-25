export const runtime = "nodejs";

import { NextResponse } from "next/server";
import https from "https";

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

export async function GET() {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 8000);

  try {
    const url =
      "https://192.168.64.4:55000/security/user/authenticate?raw=true";

    const res = await fetch(url, {
      method: "POST", // <-- change GET -> POST
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            `${process.env.WAZUH_USER}:${process.env.WAZUH_PASS}`
          ).toString("base64"),
      },
      // @ts-expect-error
      agent: httpsAgent,
      signal: controller.signal,
      cache: "no-store",
    });

    const tokenOrErrorText = await res.text();

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      tokenPreview: res.ok ? tokenOrErrorText.slice(0, 20) + "..." : null,
      body: res.ok ? "TOKEN_RETURNED" : tokenOrErrorText,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  } finally {
    clearTimeout(t);
  }
}