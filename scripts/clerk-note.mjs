const MAX_NOTE_LENGTH = 1200;

export function makeFallbackClerkNote(quest) {
  const category = String(quest.categoryId ?? "").toLowerCase();
  if (category === "combat") {
    return "The guild asks that you judge the danger before pressing on. Return to the desk with a clear account of the threat and any proof or recovered goods named in the posting.";
  }
  if (category === "gathering" || category === "foraging") {
    return "Please keep gathered goods clean and intact where you can. The quartermaster will inspect the delivery before the promised payment is entered in the ledger.";
  }
  if (category === "woodcutting") {
    return "Please take only the timber called for in the posting and leave the cut bundles fit for transport. The quartermaster will record the delivery when you return to the guild desk.";
  }
  if (category === "exploration") {
    return "A careful record of what you find will serve the guild as well as the work itself. Mark any hazards plainly in your report, and do not press farther than the commission requires.";
  }
  if (category === "travel" || category === "escort" || category === "delivery") {
    return "Keep the charge secure and ask your contact at the destination to confirm its arrival. Report any trouble on the road when you return to the guild desk.";
  }
  return "Please complete the work as entered and report back to the guild desk with any proof or recovered goods. If the circumstances differ from the posting, send word before taking risks on the guild's account.";
}

export async function requestClerkNote(quest, relayUrl) {
  const endpoint = validateRelayUrl(relayUrl);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  const hasReward = quest.rewardCopper !== null
    && quest.rewardCopper !== undefined
    && Number.isFinite(Number(quest.rewardCopper));

  try {
    const response = await fetch(endpoint.href, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: publicText(quest.title, 120),
        category: publicText(quest.categoryLabel, 80),
        urgency: publicText(quest.urgencyLabel, 40),
        objective: publicText(quest.description, 4000),
        reward: publicText(quest.rewardLabel ?? (hasReward ? formatCurrency(Number(quest.rewardCopper)) : ""), 100)
      }),
      signal: controller.signal
    });

    if (!response.ok) throw new Error("The Gemini relay returned HTTP " + response.status + ".");
    const result = await response.json();
    const note = cleanNote(result?.text);
    if (!note) throw new Error("The Gemini relay returned an empty clerk note.");
    return note;
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("The Gemini relay timed out.");
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function validateRelayUrl(value) {
  let endpoint;
  try {
    endpoint = new URL(String(value ?? "").trim());
  } catch {
    throw new Error("The Gemini relay URL is missing or invalid.");
  }

  const localHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
  if (!new Set(["https:", "http:"]).has(endpoint.protocol)
    || (endpoint.protocol === "http:" && !localHosts.has(endpoint.hostname))
    || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) {
    throw new Error("Use HTTPS for a remote Gemini relay. HTTP is allowed only for a local relay.");
  }
  return endpoint;
}

function publicText(value, maximum) {
  return String(value ?? "").trim().slice(0, maximum);
}

function cleanNote(value) {
  return String(value ?? "").trim().slice(0, MAX_NOTE_LENGTH);
}

function formatCurrency(copper) {
  const value = Math.max(0, Math.trunc(copper));
  const gold = Math.floor(value / 100);
  const silver = Math.floor((value % 100) / 10);
  const remainingCopper = value % 10;
  return [
    gold ? gold + " GP" : "",
    silver ? silver + " SP" : "",
    remainingCopper ? remainingCopper + " CP" : ""
  ].filter(Boolean).join(", ") || "0 CP";
}
