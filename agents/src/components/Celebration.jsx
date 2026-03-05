import React, { useEffect, useState, useCallback } from 'react';
import { crmService } from '../services/crmService';

// Global trigger function for testing
let triggerCelebrationFn = null;

export const triggerTestCelebration = () => {
  if (triggerCelebrationFn) {
    triggerCelebrationFn();
  }
};

const Celebration = () => {
  const [rewards, setRewards] = useState([]);
  const [currentReward, setCurrentReward] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);

  const checkNewRewards = useCallback(async () => {
    try {
      const unseen = await crmService.rewards.getUnseen();
      if (Array.isArray(unseen) && unseen.length > 0) {
        setRewards(unseen);
        setCurrentReward(unseen[0]);
        setShowConfetti(true);
        setIsTestMode(false);
      }
    } catch (e) {
      console.error('Error checking rewards:', e);
    }
  }, []);

  const triggerTest = useCallback(() => {
    const testReward = {
      _id: 'test',
      icon: '🎉',
      title: '¡Prueba de Celebración!',
      description: 'Esta es una demostración de la animación de celebración con confeti. ¡Así se verá cuando ganes un logro real!',
      color: '#FFD700',
    };
    setRewards([testReward]);
    setCurrentReward(testReward);
    setShowConfetti(true);
    setIsTestMode(true);
  }, []);

  useEffect(() => {
    triggerCelebrationFn = triggerTest;
    return () => {
      triggerCelebrationFn = null;
    };
  }, [triggerTest]);

  useEffect(() => {
    checkNewRewards();
    const interval = setInterval(checkNewRewards, 10000);
    return () => clearInterval(interval);
  }, [checkNewRewards]);

  const handleDismiss = async () => {
    if (rewards.length > 0 && !isTestMode) {
      try {
        await crmService.rewards.markCelebrated(rewards.map(r => r._id));
      } catch (e) {
        console.error('Error marking rewards:', e);
      }
    }
    setShowConfetti(false);
    setCurrentReward(null);
    setRewards([]);
    setIsTestMode(false);
  };

  if (!showConfetti || !currentReward) return null;

  const isMilestone = currentReward.category === 'milestone';
  const rewardColor = currentReward.color || '#FFD700';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Confetti Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="confetti-piece"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 3}s`,
              backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', rewardColor][Math.floor(Math.random() * 9)],
              width: `${6 + Math.random() * 8}px`,
              height: `${6 + Math.random() * 8}px`,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            }}
          />
        ))}
      </div>

      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={handleDismiss}
      />

      {/* Reward Card */}
      <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md mx-4 shadow-2xl transform animate-bounce-in overflow-hidden">
        {/* Top accent bar */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{ background: `linear-gradient(90deg, ${rewardColor}, ${rewardColor}80)` }}
        />

        <div className="text-center">
          {/* Icon with glow */}
          <div className="relative inline-block mb-5">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mx-auto cel-icon-pulse"
              style={{ backgroundColor: `${rewardColor}15` }}
            >
              <span className="text-5xl cel-icon-bounce">{currentReward.icon || '🏆'}</span>
            </div>
          </div>

          <h2 className="text-2xl font-extrabold text-gray-800 dark:text-gray-100 mb-1 tracking-tight">
            ¡Felicitaciones!
          </h2>
          <h3 
            className="text-lg font-bold mb-3"
            style={{ color: rewardColor }}
          >
            {currentReward.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed text-sm">
            {currentReward.description}
          </p>

          {/* Encouragement message for milestones */}
          {isMilestone && currentReward.metadata?.encouragement && (
            <div
              className="mb-5 px-4 py-3 rounded-xl text-sm font-medium cel-encourage-in"
              style={{ backgroundColor: `${rewardColor}10`, color: rewardColor, border: `1px solid ${rewardColor}25` }}
            >
              {currentReward.metadata.encouragement}
            </div>
          )}

          {rewards.length > 1 && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
              +{rewards.length - 1} logro(s) más
            </p>
          )}

          <button
            onClick={handleDismiss}
            className="px-8 py-3 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all cel-btn-glow"
            style={{
              background: `linear-gradient(135deg, ${rewardColor}, ${rewardColor}cc)`,
              boxShadow: `0 8px 25px ${rewardColor}40`,
            }}
          >
            {isMilestone ? '¡Entendido!' : '¡Genial! 🎉'}
          </button>
        </div>
      </div>

      <style>{`
        .confetti-piece {
          position: absolute;
          top: -12px;
          animation: confetti-fall linear infinite;
        }
        
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg) scale(1);
            opacity: 1;
          }
          80% { opacity: 1; }
          100% {
            transform: translateY(100vh) rotate(720deg) scale(0.5);
            opacity: 0;
          }
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        @keyframes bounce-in {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }

        .cel-icon-pulse {
          animation: celIconPulse 2s ease-in-out infinite;
        }
        @keyframes celIconPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }

        .cel-icon-bounce {
          display: inline-block;
          animation: celIconBounce 1s ease-in-out infinite;
        }
        @keyframes celIconBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        .cel-encourage-in {
          animation: celEncourageIn 600ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
          animation-delay: 400ms;
          opacity: 0;
          transform: translateY(8px);
        }
        @keyframes celEncourageIn {
          to { opacity: 1; transform: translateY(0); }
        }

        .cel-btn-glow {
          animation: celBtnGlow 2s ease-in-out infinite;
        }
        @keyframes celBtnGlow {
          0%, 100% { box-shadow: 0 4px 14px rgba(0,0,0,0.15); }
          50% { box-shadow: 0 8px 30px rgba(0,0,0,0.25); }
        }
      `}</style>
    </div>
  );
};

export default Celebration;
