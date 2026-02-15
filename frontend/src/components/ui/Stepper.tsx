"use client";

interface Step {
  id: string;
  label: string;
  optional?: boolean;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (index: number) => void;
}

export function Stepper({ steps, currentStep, onStepClick }: StepperProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <div key={step.id} className="flex items-center gap-2">
            {index > 0 && (
              <div
                className={`w-8 h-px ${
                  isCompleted ? "bg-accent-gold" : "bg-border"
                }`}
              />
            )}
            <button
              onClick={() => onStepClick?.(index)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all
                ${
                  isActive
                    ? "bg-accent-gold/10 text-accent-gold border border-accent-gold/30"
                    : isCompleted
                    ? "text-accent-green"
                    : "text-text-muted hover:text-text-primary"
                }
              `}
              type="button"
            >
              <span
                className={`
                  flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                  ${
                    isActive
                      ? "bg-accent-gold text-surface-deep"
                      : isCompleted
                      ? "bg-accent-green/20 text-accent-green"
                      : "bg-surface-elevated text-text-dim"
                  }
                `}
              >
                {isCompleted ? "\u2713" : index + 1}
              </span>
              <span className="hidden sm:inline">{step.label}</span>
              {step.optional && (
                <span className="text-[10px] text-text-faint">(opt)</span>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
