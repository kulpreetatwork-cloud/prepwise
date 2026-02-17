import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineX, HiOutlineChevronRight, HiOutlineChevronLeft } from 'react-icons/hi';
import { TOUR_STEPS } from '../utils/tourSteps';

export default function OnboardingTour({ run, onFinish }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const [spotlightRect, setSpotlightRect] = useState(null);
  const tooltipRef = useRef(null);

  const step = TOUR_STEPS[currentStep];
  const isCenter = step?.placement === 'center';
  const total = TOUR_STEPS.length;

  const positionTooltip = useCallback(() => {
    if (!step) return;

    const tooltipW = Math.min(350, window.innerWidth * 0.9);
    const halfW = tooltipW / 2;

    if (isCenter) {
      setSpotlightRect(null);
      setTooltipPos({
        top: window.innerHeight / 2 - 120,
        left: window.innerWidth / 2 - halfW,
      });
      return;
    }

    const el = document.querySelector(step.target);
    if (!el) {
      setSpotlightRect(null);
      setTooltipPos({ top: 100, left: window.innerWidth / 2 - halfW });
      return;
    }

    const rect = el.getBoundingClientRect();
    setSpotlightRect({
      top: rect.top - 6,
      left: rect.left - 6,
      width: rect.width + 12,
      height: rect.height + 12,
    });

    el.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });

    const gap = 12;
    const tooltipH = 180;
    let top, left;

    if (step.placement === 'right') {
      top = rect.top + rect.height / 2 - tooltipH / 2;
      left = rect.right + gap;
      if (left + tooltipW > window.innerWidth - 20) {
        left = rect.left - tooltipW - gap;
      }
    } else if (step.placement === 'bottom') {
      top = rect.bottom + gap;
      left = rect.left + rect.width / 2 - tooltipW / 2;
    } else {
      top = rect.top - tooltipH - gap;
      left = rect.left + rect.width / 2 - tooltipW / 2;
    }

    top = Math.max(10, Math.min(top, window.innerHeight - tooltipH - 10));
    left = Math.max(10, Math.min(left, window.innerWidth - tooltipW - 10));

    setTooltipPos({ top, left });
  }, [step, isCenter]);

  useEffect(() => {
    if (!run) return;
    positionTooltip();
    const handleResize = () => positionTooltip();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [run, currentStep, positionTooltip]);

  const handleNext = () => {
    if (currentStep < total - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const handleFinish = () => {
    setCurrentStep(0);
    localStorage.setItem('prepwise_tour_completed', 'true');
    onFinish?.();
  };

  if (!run || !step) return null;

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Overlay */}
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={handleFinish} />

      {/* Spotlight cutout */}
      {spotlightRect && (
        <div
          className="absolute rounded-xl pointer-events-none"
          style={{
            top: spotlightRect.top,
            left: spotlightRect.left,
            width: spotlightRect.width,
            height: spotlightRect.height,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
            border: '2px solid rgba(139,92,246,0.5)',
            zIndex: 1,
          }}
        />
      )}

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          ref={tooltipRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute w-[90vw] max-w-[350px] rounded-2xl p-4 sm:p-5 border border-dark-border"
          style={{
            top: tooltipPos.top,
            left: tooltipPos.left,
            background: 'linear-gradient(135deg, rgba(19,19,43,0.97) 0%, rgba(17,17,24,0.99) 100%)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(139,92,246,0.1)',
            zIndex: 2,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close */}
          <button
            onClick={handleFinish}
            className="absolute top-3 right-3 p-1 rounded-lg text-text-muted hover:text-white hover:bg-dark-tertiary transition-colors"
          >
            <HiOutlineX className="w-4 h-4" />
          </button>

          {/* Step indicator */}
          <div className="flex items-center gap-1 mb-3">
            {Array.from({ length: total }, (_, i) => (
              <div
                key={i}
                className="h-1 rounded-full transition-all"
                style={{
                  width: i === currentStep ? '20px' : '8px',
                  background: i <= currentStep
                    ? 'linear-gradient(135deg, #8B5CF6, #3B82F6)'
                    : 'rgba(139,92,246,0.15)',
                }}
              />
            ))}
          </div>

          {/* Content */}
          <h3 className="text-base font-bold text-white mb-1.5">{step.title}</h3>
          <p className="text-sm text-text-secondary leading-relaxed mb-4">{step.content}</p>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleFinish}
              className="text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              Skip tour
            </button>
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-white rounded-lg hover:bg-dark-tertiary transition-colors"
                >
                  <HiOutlineChevronLeft className="w-3 h-3" />
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-4 py-1.5 text-xs font-medium text-white rounded-lg hover:opacity-90 transition-all"
                style={{ background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)' }}
              >
                {currentStep === total - 1 ? 'Finish' : 'Next'}
                {currentStep < total - 1 && <HiOutlineChevronRight className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
