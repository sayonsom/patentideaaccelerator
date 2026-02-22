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
                  isCompleted ? "bg-blue-ribbon" : "bg-border"
                }`}
              />
            )}
            <button
              onClick={() => onStepClick?.(index)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-all
                ${
                  isActive
                    ? "bg-accent-light text-blue-ribbon border border-blue-ribbon/30"
                    : isCompleted
                    ? "text-success"
                    : "text-text-muted hover:text-ink"
                }
              `}
              type="button"
            >
              <span
                className={`
                  flex items-center justify-center w-6 h-6 rounded-full text-xs font-normal
                  ${
                    isActive
                      ? "bg-blue-ribbon text-white"
                      : isCompleted
                      ? "bg-green-50 text-success"
                      : "bg-neutral-off-white text-text-muted"
                  }
                `}
              >
                {isCompleted ? "\u2713" : index + 1}
              </span>
              <span className="hidden sm:inline">{step.label}</span>
              {step.optional && (
                <span className="text-[10px] text-neutral-light">(opt)</span>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
