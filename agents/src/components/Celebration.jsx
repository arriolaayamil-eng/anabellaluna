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
    const interval = setInterval(checkNewRewards, 60000);
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
              backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'][Math.floor(Math.random() * 8)],
            }}
          />
        ))}
      </div>

      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleDismiss}
      />

      {/* Reward Card */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md mx-4 shadow-2xl transform animate-bounce-in">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">
            {currentReward.icon || '🏆'}
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            ¡Felicitaciones!
          </h2>
          <h3 
            className="text-xl font-semibold mb-2"
            style={{ color: currentReward.color }}
          >
            {currentReward.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {currentReward.description}
          </p>
          {rewards.length > 1 && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
              +{rewards.length - 1} logro(s) más
            </p>
          )}
          <button
            onClick={handleDismiss}
            className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
          >
            ¡Genial! 🎉
          </button>
        </div>
      </div>

      <style>{`
        .confetti-piece {
          position: absolute;
          width: 10px;
          height: 10px;
          top: -10px;
          animation: confetti-fall 4s linear infinite;
        }
        
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        @keyframes bounce-in {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Celebration;
