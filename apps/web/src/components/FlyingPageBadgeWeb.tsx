import React from 'react';
import { Star, Gem, Lock, CheckCircle } from 'lucide-react';
import './FlyingPageBadgeWeb.css';

export interface AchievementWeb {
  key: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  isUnlocked: boolean;
  unlockedAt: string | null;
  currentProgress: number;
  targetProgress: number;
}

interface FlyingPageBadgeWebProps {
  achievement: AchievementWeb;
}

const FlyingPageBadgeWeb: React.FC<FlyingPageBadgeWebProps> = ({ achievement }) => {
  const { key, category, isUnlocked, currentProgress, targetProgress } = achievement;

  const renderPaperContent = () => {
    switch (category) {
      case 'Streak':
        return (
          <div className="flying-badge-content">
            <div className="flying-badge-line">
              <div className={`flying-badge-checkbox ${isUnlocked ? 'checked' : ''}`} />
              <div className="flying-badge-doodle-line" style={{ width: '25px' }} />
            </div>
            <div className="flying-badge-line">
              <div className={`flying-badge-checkbox ${isUnlocked ? 'checked' : ''}`} />
              <div className="flying-badge-doodle-line" style={{ width: '35px' }} />
            </div>
            <div className="flying-badge-center-doodle" style={{ opacity: isUnlocked ? 1 : 0.3 }}>
              {key === 'streak_3' && (
                <span style={{ fontSize: '20px' }}>🔥</span>
              )}
              {key === 'streak_7' && (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: '15px' }}>🔥</span>
                  <span style={{ fontSize: '13px', color: '#fb923c', margin: '0 1px' }}>⚡</span>
                  <span style={{ fontSize: '15px' }}>🔥</span>
                </div>
              )}
              {key === 'streak_30' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', marginBottom: '-5px' }}>👑</span>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px' }}>✨</span>
                    <span style={{ fontSize: '18px', margin: '0 2px' }}>🔥</span>
                    <span style={{ fontSize: '10px' }}>✨</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'Lessons':
        return (
          <div className="flying-badge-content">
            <div className="flying-badge-line">
              <div className="flying-badge-doodle-line" style={{ width: '40px' }} />
            </div>
            <div className="flying-badge-line">
              <div className="flying-badge-doodle-line" style={{ width: '30px' }} />
            </div>
            <div 
              className="flying-badge-grade" 
              style={{ color: isUnlocked ? '#ef4444' : '#64748b', borderColor: isUnlocked ? 'rgba(239, 68, 68, 0.4)' : 'rgba(148, 163, 184, 0.2)' }}
            >
              {key === 'lessons_15' ? 'A++' : 'A+'}
            </div>
          </div>
        );

      case 'Minutes':
        return (
          <div className="flying-badge-content">
            <div className="flying-badge-math-grid">
              <div className="flying-badge-grid-row" />
              <div className="flying-badge-grid-row" />
              <div className="flying-badge-grid-row" />
            </div>
            
            <div className="flying-badge-center-doodle" style={{ marginTop: '2px' }}>
              {key === 'minutes_60' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: isUnlocked ? 1 : 0.3 }}>
                  <span style={{ fontSize: '20px', marginBottom: '2px' }}>⏳</span>
                  <span style={{ fontSize: '7px', fontFamily: 'monospace', color: isUnlocked ? '#3b82f6' : '#64748b' }}>60m</span>
                </div>
              )}
              {key === 'minutes_300' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: isUnlocked ? 1 : 0.3 }}>
                  <span style={{ fontSize: '20px', marginBottom: '2px' }}>⏰</span>
                  <span style={{ fontSize: '7px', fontFamily: 'monospace', color: isUnlocked ? '#3b82f6' : '#64748b' }}>300m</span>
                </div>
              )}
              {key === 'minutes_1200' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: isUnlocked ? 1 : 0.3 }}>
                  <span style={{ fontSize: '9px', marginBottom: '-2px', color: isUnlocked ? '#10b981' : '#64748b' }}>🌀</span>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '9px', color: isUnlocked ? '#10b981' : '#64748b' }}>✨</span>
                    <span style={{ fontSize: '20px', margin: '0 2px' }}>⏳</span>
                    <span style={{ fontSize: '9px', color: isUnlocked ? '#10b981' : '#64748b' }}>✨</span>
                  </div>
                  <span style={{ fontSize: '7px', fontFamily: 'monospace', color: isUnlocked ? '#10b981' : '#64748b', fontWeight: 'bold' }}>1200m</span>
                </div>
              )}
            </div>
          </div>
        );

      case 'Quiz':
        return (
          <div className="flying-badge-content">
            <div className="flying-badge-quiz-line">
              <span className="flying-badge-quiz-num">1.</span>
              <span className={`flying-badge-quiz-opt ${isUnlocked ? 'circled' : ''}`}>A</span>
              <span className="flying-badge-quiz-opt">B</span>
              <span className="flying-badge-quiz-opt">C</span>
            </div>
            <div className="flying-badge-quiz-line">
              <span className="flying-badge-quiz-num">2.</span>
              <span className="flying-badge-quiz-opt">A</span>
              <span className="flying-badge-quiz-opt">B</span>
              <span className={`flying-badge-quiz-opt ${isUnlocked ? 'circled' : ''}`}>C</span>
            </div>
            <div className="flying-badge-checkmark" style={{ color: isUnlocked ? '#10b981' : '#64748b' }}>
              ✓
            </div>
          </div>
        );

      case 'Level':
      case 'EXP':
      default:
        return (
          <div className="flying-badge-content">
            <div className="flying-badge-center-doodle" style={{ color: isUnlocked ? '#eab308' : '#64748b', marginTop: '10px' }}>
              {key.startsWith('level') ? <Star size={24} fill={isUnlocked ? '#eab308' : 'none'} /> : <Gem size={24} fill={isUnlocked ? '#3b82f6' : 'none'} />}
            </div>
            <div className="flying-badge-line" style={{ marginTop: '8px', justifyContent: 'center' }}>
              <div className="flying-badge-doodle-line" style={{ width: '40px' }} />
            </div>
          </div>
        );
    }
  };

  const progressPercent = Math.min(100, (currentProgress * 100) / targetProgress);

  return (
    <div className={`flying-badge-container ${isUnlocked ? 'unlocked' : 'locked'}`} title={`${achievement.name}: ${achievement.description}`}>
      {/* Soft blue radiating aura */}
      <div className="flying-badge-glow" />

      <div className="flying-badge-sheet">
        {/* Thematic Content */}
        {renderPaperContent()}

        {/* Card Footer */}
        <div className="flying-badge-footer">
          {!isUnlocked ? (
            <>
              <div className="flying-badge-progress-bar">
                <div className="flying-badge-progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="flying-badge-progress-text">
                {currentProgress}/{targetProgress}
              </div>
              <div className="flying-badge-lock-badge">
                <Lock size={9} />
              </div>
            </>
          ) : (
            <div className="flying-badge-unlocked-badge">
              <CheckCircle size={11} color="#10b981" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlyingPageBadgeWeb;
