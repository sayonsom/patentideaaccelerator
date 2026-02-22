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
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <div key={step.id} className="flex items-center gap-1">
            {index > 0 && (
              <div
                className={`w-6 h-px shrink-0 ${
                  isCompleted ? "bg-blue-ribbon" : "bg-border"
                }`}
              />
            )}
            <button
              onClick={() => onStepClick?.(index)}
              className={`
                flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs whitespace-nowrap transition-all min-w-0
                ${
                  isActive
                    ? "bg-accent-light text-blue-ribbon border border-blue-ribbon/30"
                    : isCompleted
                    ? "text-blue-ribbon"
                    : "text-text-muted hover:text-ink"
                }
              `}
              type="button"
            >
              <span
                className={`
                  flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-medium shrink-0
                  ${
                    isActive
                      ? "bg-blue-ribbon text-white"
                      : isCompleted
                      ? "bg-blue-ribbon/10 text-blue-ribbon"
                      : "bg-neutral-off-white text-text-muted"
                  }
                `}
              >
                {isCompleted ? "\u2713" : index + 1}
              </span>
              <span className="inline">{step.label}</span>
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
