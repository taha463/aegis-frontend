/**
 * Aegis Alert & Safe Wording Service
 * Conforms to Aegis System Design v1 - Sections 4, 23, 24
 *
 * Owns:
 * - Alert lifecycle & expiration timestamp checks
 * - Safe deterministic fallback wording (Rule 9: AI DOWN != FLOOD ENGINE DOWN)
 */

export const SAFE_TEMPLATES = Object.freeze({
  HIGH: {
    details: 'Critical flood danger detected due to rapid rainfall accumulation and rising river discharge.',
    action: 'Evacuate now to nearest emergency relief camp or elevated safe zone immediately.',
  },
  MODERATE: {
    details: 'Elevated water levels detected. Localized urban inundation possible.',
    action: 'Monitor emergency channels and prepare emergency kit for possible relocation.',
  },
  LOW: {
    details: 'Normal hydrological conditions. No immediate flood threat.',
    action: 'Stay vigilant and check weather updates periodically.',
  },
});

/**
 * Generates safe citizen advisory wording.
 * If AI wording provider fails or is null, falls back safely to scientific deterministic templates.
 */
export function generateSafeWording(riskLevel, locationName, aiGeneratedText = null) {
  if (aiGeneratedText && typeof aiGeneratedText === 'object' && aiGeneratedText.details) {
    return {
      details: aiGeneratedText.details,
      action: aiGeneratedText.action || 'Follow local disaster management guidelines.',
      location: locationName,
      source: 'ai-enhanced',
    };
  }

  const normalizedLevel = String(riskLevel).toUpperCase().includes('HIGH') || String(riskLevel).toUpperCase().includes('CRITICAL')
    ? 'HIGH'
    : String(riskLevel).toUpperCase().includes('LOW')
    ? 'LOW'
    : 'MODERATE';

  const template = SAFE_TEMPLATES[normalizedLevel] || SAFE_TEMPLATES.MODERATE;

  return {
    location: `${locationName}:`,
    details: template.details,
    action: template.action,
    source: 'deterministic-template',
  };
}

/**
 * Filters out expired alerts based on their expiry timestamp.
 */
export function resolveActiveAlerts(alerts, currentTime = Date.now()) {
  if (!Array.isArray(alerts)) return [];
  return alerts.filter((alert) => {
    if (!alert.expiresAt) return true; // Keep alerts without explicit expiration
    const expiry = typeof alert.expiresAt === 'number' ? alert.expiresAt : new Date(alert.expiresAt).getTime();
    return expiry > currentTime;
  });
}

