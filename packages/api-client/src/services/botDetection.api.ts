import { BotRiskAssessment, BotDecision } from '@ticketshield/types';
import { delay } from './client';

export const botDetectionApi = {
  assessSession: async (options?: { simulateState?: BotDecision }): Promise<BotRiskAssessment> => {
    await delay(500);

    if (options?.simulateState === 'BLOCKED') {
      return {
        score: 0.94,
        factors: {
          requestVelocity: 420,
          mouseMovementEntropy: 0.05, // low entropy indicates scripted automated bot
          typingPatternEntropy: 0.02,
          sessionAgeSeconds: 4,
          ipReputation: 'DATACENTER',
          deviceFingerprintHash: 'fp-headless-bot-8890',
        },
        decision: 'BLOCKED',
        challengeRequired: false,
      };
    }

    if (options?.simulateState === 'THROTTLED') {
      return {
        score: 0.62,
        factors: {
          requestVelocity: 85,
          mouseMovementEntropy: 0.35,
          typingPatternEntropy: 0.40,
          sessionAgeSeconds: 15,
          ipReputation: 'HIGH_RISK_PROXY',
          deviceFingerprintHash: 'fp-suspicious-proxy-1209',
        },
        decision: 'THROTTLED',
        challengeRequired: true,
      };
    }

    // Default ALLOWED
    return {
      score: 0.14,
      factors: {
        requestVelocity: 12,
        mouseMovementEntropy: 0.92,
        typingPatternEntropy: 0.88,
        sessionAgeSeconds: 180,
        ipReputation: 'CLEAN',
        deviceFingerprintHash: 'fp-legit-user-5541',
      },
      decision: 'ALLOWED',
      challengeRequired: false,
    };
  },

  verifyChallenge: async (captchaToken: string): Promise<{ success: boolean }> => {
    await delay(600);
    return { success: captchaToken.length > 0 };
  },
};
