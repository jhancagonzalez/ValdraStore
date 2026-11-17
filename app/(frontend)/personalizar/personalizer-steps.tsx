import { STEPS } from "./personalization-config";

type PersonalizerStepsProps = {
  activeStep: number;
};

export const PersonalizerSteps = ({ activeStep }: PersonalizerStepsProps) => (
  <div className="personalizer-steps-wrap">
    <ol className="personalizer-steps" aria-label="Progreso de personalización">
      {STEPS.map((step, index) => (
        <li
          key={step}
          className="personalizer-step"
          data-state={index < activeStep ? "done" : index === activeStep ? "current" : "upcoming"}
          aria-current={index === activeStep ? "step" : undefined}
        >
          <span className="personalizer-step-index" aria-hidden="true">
            {index + 1}
          </span>
          <span className="personalizer-step-label">{step}</span>
        </li>
      ))}
    </ol>
  </div>
);
